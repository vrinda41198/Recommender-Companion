from flask import Blueprint, jsonify, request, current_app, make_response
import requests
from urllib.parse import urlencode
import secrets
import jwt
from datetime import datetime
from .middleware import validate_tokens
from .extensions import db
from app.models import User, UserMoviesWatched, UserBooksRead
from app.middleware import user_required
from jwt.algorithms import RSAAlgorithm

# Create a Flask blueprint for authentication routes
auth = Blueprint('auth', __name__)

def get_microsoft_signing_keys():
    """
    Fetch Microsoft's signing keys from their OpenID Connect configuration.
    Results are cached to avoid repeated requests.
    """
    # Retrieve the JWKS (JSON Web Key Set) URI from Microsoft's OpenID configuration
    openid_config_url = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
    jwks_uri = requests.get(openid_config_url).json()['jwks_uri']
    
    # Fetch and parse the JWKS
    jwks = requests.get(jwks_uri).json()
    
    # Convert JWKS keys to RSA algorithms for token verification
    return {jwk['kid']: RSAAlgorithm.from_jwk(jwk) for jwk in jwks['keys']}

def verify_token_signature(id_token):
    """
    Verify the signature of a Microsoft ID token.
    Returns (decoded_token, error_message)
    """
    try:
        # Extract the unverified header to find the key ID used for signing
        header = jwt.get_unverified_header(id_token)
        kid = header['kid']
        
        # Retrieve cached signing keys
        signing_keys = get_microsoft_signing_keys()
        
        # Validate the key ID exists in the keys
        if kid not in signing_keys:
            return None, "Invalid key ID in token"
            
        # Decode and verify the token's signature using the correct RSA key
        # Note: Only signature verification is enabled, other validations are skipped
        decoded = jwt.decode(
            id_token,
            key=signing_keys[kid],
            algorithms=['RS256'],
            options={
                "verify_signature": True,
                "verify_exp": False,  # We're only verifying signature
                "verify_aud": False,
                "verify_iss": False
            }
        )
        
        return decoded, None
        
    except jwt.InvalidTokenError as e:
        # Handle invalid token errors
        return None, str(e)
    except requests.RequestException as e:
        # Handle network-related errors when fetching signing keys
        return None, f"Failed to fetch signing keys: {str(e)}"

def get_auth_url():
    """Generate Microsoft OAuth authorization URL"""
    # Create a secure random state token to prevent CSRF attacks
    state = secrets.token_urlsafe(32)
    
    # Prepare OAuth authorization parameters
    params = {
        'client_id': current_app.config['MICROSOFT_CLIENT_ID'],
        'response_type': 'code',
        'redirect_uri': current_app.config['MICROSOFT_REDIRECT_URI'],
        'scope': ' '.join(current_app.config['MICROSOFT_SCOPES']),
        'state': state,
        'response_mode': 'query'
    }
    
    # Construct the full authorization URL
    return f"{current_app.config['MICROSOFT_AUTH_ENDPOINT']}?{urlencode(params)}", state

def is_admin_user(id_token):
    """Check if user is an admin based on app role in ID token"""
    try:
        # Decode token without signature verification
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        
        # Check if 'admin' role is present
        roles = decoded.get('roles', [])
        return 'admin' in roles
    except jwt.InvalidTokenError:
        return False

def get_token_from_code(code):
    """Exchange authorization code for tokens"""
    # Prepare token request parameters
    data = {
        'client_id': current_app.config['MICROSOFT_CLIENT_ID'],
        'client_secret': current_app.config['MICROSOFT_CLIENT_SECRET'],
        'code': code,
        'redirect_uri': current_app.config['MICROSOFT_REDIRECT_URI'],
        'grant_type': 'authorization_code'
    }
    
    # Send token request to Microsoft
    response = requests.post(current_app.config['MICROSOFT_TOKEN_ENDPOINT'], data=data)
    return response.json()

def get_user_info(access_token):
    """Get user information from Microsoft Graph API"""
    # Prepare Authorization header
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Fetch user profile information
    response = requests.get('https://graph.microsoft.com/v1.0/me', headers=headers)
    return response.json()

def get_token_expiry(id_token):
    """Get token expiration time from id_token"""
    # Decode token without signature verification to get expiration timestamp
    decoded = jwt.decode(id_token, options={"verify_signature": False})
    return datetime.fromtimestamp(decoded['exp'])

@auth.route('/api/auth/login', methods=['GET'])
def login():
    """Initiate Microsoft OAuth flow"""
    # Generate authorization URL and state
    auth_url, state = get_auth_url()
    
    # Create response with authorization URL
    response = make_response(jsonify({'auth_url': auth_url}))
    
    # Set state as a secure, httponly cookie for CSRF protection
    response.set_cookie('oauth_state', state, httponly=True, secure=True, samesite='Lax')
    
    return response

@auth.route('/api/auth/callback', methods=['POST'])
def callback():
    """Handle Microsoft OAuth callback"""
    # Verify OAuth state to prevent CSRF attacks
    stored_state = request.cookies.get('oauth_state')
    received_state = request.json.get('state')
    
    if not stored_state or stored_state != received_state:
        return jsonify({'error': 'Invalid state parameter'}), 400

    # Validate authorization code
    code = request.json.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    # Exchange authorization code for tokens
    token_response = get_token_from_code(code)
    if 'error' in token_response:
        return jsonify({'error': token_response['error']}), 400
    
    # Verify token signature
    decoded, error = verify_token_signature(token_response['id_token'])
    if error:
        return jsonify({'error': f'Invalid token: {error}'}), 400

    # Fetch user information from Microsoft Graph
    user_info = get_user_info(token_response['access_token'])
    
    # Determine user's email (use mail or userPrincipalName)
    email = user_info.get('mail') or user_info.get('userPrincipalName')
    
    # Check if user exists in database
    user = User.query.filter_by(email=email).first()
    is_new_user = False

    # Create new user if not exists
    if not user:
    
        user = User(
            display_name=user_info.get('displayName'),
            email=email,
            onboarding_completed=False
        )
        db.session.add(user)
        db.session.commit()
        is_new_user = True
    
    # Decode ID token to check roles
    decoded = jwt.decode(token_response['id_token'], options={"verify_signature": False})
    roles = decoded.get('roles', [])
    is_admin = 'admin' in roles
    
    # Prepare user response
    response = make_response(jsonify({
        'user': {
            'displayName': user_info.get('displayName'),
            'email': email,
            'role': 'admin' if is_admin else 'user',
            'onboardingCompleted': user.onboarding_completed,
            'isNewUser': is_new_user
        }
    }))

    # Set tokens as HTTP-only, secure cookies
    token_expiry = get_token_expiry(token_response['id_token'])
    response.set_cookie(
        'id_token',
        token_response['id_token'],
        httponly=True,
        secure=True,
        samesite='Lax',
        expires=token_expiry
    )
    response.set_cookie(
        'access_token',
        token_response['access_token'],
        httponly=True,
        secure=True,
        samesite='Lax',
        expires=token_expiry
    )
    
    # Clear the oauth state cookie
    response.delete_cookie('oauth_state')
    
    return response

@auth.route('/api/auth/user')
def get_user():
    """Get current user information"""
    # Validate authentication tokens
    decoded, error = validate_tokens()
    if error:
        return jsonify({'error': error}), 401
    
    # Fetch user info from Microsoft Graph
    user_info = get_user_info(request.access_token)
    email = user_info.get('mail') or user_info.get('userPrincipalName')
    
    # Retrieve user from database
    user = User.query.filter_by(email=email).first()
    is_new_user = user is None
    onboarding_completed = False if user is None else user.onboarding_completed
    
    # Check admin status from token
    roles = decoded.get('roles', [])
    is_admin = 'admin' in roles
    
    return jsonify({
        'user': {
            'displayName': user_info.get('displayName'),
            'email': email,
            'role': 'admin' if is_admin else 'user',
            'onboardingCompleted': onboarding_completed,
            'isNewUser': is_new_user
        }
    })

@auth.route('/api/auth/logout')
def logout():
    """Logout user"""
    # Create response and delete authentication cookies
    response = make_response(jsonify({'message': 'Logged out successfully'}))
    response.delete_cookie('id_token')
    response.delete_cookie('access_token')
    return response


@auth.route('/api/auth/onboarding-status', methods=['GET'])
@user_required
def get_onboarding_status():
    """Get user's onboarding status and progress"""
    # Extract user email from token
    email = request.token_data.get('email') or request.token_data.get('preferred_username')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Count movies and books rated by the user
    movies_count = UserMoviesWatched.query.filter_by(email=email).count()
    books_count = UserBooksRead.query.filter_by(email=email).count()
    
    return jsonify({
        'onboardingCompleted': user.onboarding_completed,
        'progress': {
            'movies': movies_count,
            'books': books_count,
            'required': {
                'movies': 3,
                'books': 3
            }
        }
    })

@auth.route('/api/auth/complete-onboarding', methods=['POST'])
@user_required
def complete_onboarding():
    """Mark onboarding as completed"""
    # Extract user email from token
    email = request.token_data.get('email') or request.token_data.get('preferred_username')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Verify user has rated required number of items
    movies_count = UserMoviesWatched.query.filter_by(email=email).count()
    books_count = UserBooksRead.query.filter_by(email=email).count()
    
    if movies_count < 3 or books_count < 3:
        return jsonify({
            'error': 'Must rate at least 3 movies and 3 books before completing onboarding'
        }), 400

    # Mark onboarding as completed
    user.onboarding_completed = True
    db.session.commit()
    
    return jsonify({
        'message': 'Onboarding completed successfully',
        'onboardingCompleted': True
    })


@auth.route('/api/user/age', methods=['POST'])
@user_required
def update_user_age():
    """Update user's age"""
    # Parse request JSON
    data = request.get_json()
    if not data or 'age' not in data:
        return jsonify({'error': 'Age is required'}), 400
        
    # Validate age
    age = data['age']
    if not isinstance(age, int) or age < 1 or age > 120:
        return jsonify({'error': 'Invalid age'}), 400

    # Extract user email from token
    email = request.token_data.get('email') or request.token_data.get('preferred_username')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Update user's age
    user.age = age
    db.session.commit()
    
    return jsonify({
        'message': 'Age updated successfully',
        'age': age
    })

@auth.route('/api/auth/account', methods=['DELETE'])
@user_required
def delete_account():
    """Delete user account and all associated data"""
    try:
        # Extract user email from token
        email = request.token_data.get('email') or request.token_data.get('preferred_username')
        
        # Find user in database
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete associated data (ON DELETE CASCADE will handle most deletions)
        # Explicitly delete for clarity
        UserMoviesWatched.query.filter_by(email=email).delete()
        UserBooksRead.query.filter_by(email=email).delete()
        
        # Delete user record
        db.session.delete(user)
        db.session.commit()
        
        # Create response and clear authentication cookies
        response = make_response(jsonify({
            'message': 'Account deleted successfully'
        }))
        response.delete_cookie('id_token')
        response.delete_cookie('access_token')
        
        return response
        
    except Exception as e:
        # Rollback database session on any errors
        db.session.rollback()
        return jsonify({'error': str(e)}), 500