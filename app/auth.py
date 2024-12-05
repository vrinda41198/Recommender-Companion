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

auth = Blueprint('auth', __name__)

def get_auth_url():
    """Generate Microsoft OAuth authorization URL"""
    state = secrets.token_urlsafe(32)
    
    params = {
        'client_id': current_app.config['MICROSOFT_CLIENT_ID'],
        'response_type': 'code',
        'redirect_uri': current_app.config['MICROSOFT_REDIRECT_URI'],
        'scope': ' '.join(current_app.config['MICROSOFT_SCOPES']),
        'state': state,
        'response_mode': 'query'
    }
    
    return f"{current_app.config['MICROSOFT_AUTH_ENDPOINT']}?{urlencode(params)}", state

def is_admin_user(id_token):
    """Check if user is an admin based on app role in ID token"""
    try:
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        roles = decoded.get('roles', [])
        return 'admin' in roles
    except jwt.InvalidTokenError:
        return False

def get_token_from_code(code):
    """Exchange authorization code for tokens"""
    data = {
        'client_id': current_app.config['MICROSOFT_CLIENT_ID'],
        'client_secret': current_app.config['MICROSOFT_CLIENT_SECRET'],
        'code': code,
        'redirect_uri': current_app.config['MICROSOFT_REDIRECT_URI'],
        'grant_type': 'authorization_code'
    }
    
    response = requests.post(current_app.config['MICROSOFT_TOKEN_ENDPOINT'], data=data)
    return response.json()

def get_user_info(access_token):
    """Get user information from Microsoft Graph API"""
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get('https://graph.microsoft.com/v1.0/me', headers=headers)
    return response.json()

def get_token_expiry(id_token):
    """Get token expiration time from id_token"""
    decoded = jwt.decode(id_token, options={"verify_signature": False})
    return datetime.fromtimestamp(decoded['exp'])

@auth.route('/api/auth/login', methods=['GET'])
def login():
    """Initiate Microsoft OAuth flow"""
    auth_url, state = get_auth_url()
    response = make_response(jsonify({'auth_url': auth_url}))
    response.set_cookie('oauth_state', state, httponly=True, secure=True, samesite='Lax')
    
    return response

@auth.route('/api/auth/callback', methods=['POST'])
def callback():
    """Handle Microsoft OAuth callback"""
    # Verify state
    stored_state = request.cookies.get('oauth_state')
    received_state = request.json.get('state')
    
    if not stored_state or stored_state != received_state:
        return jsonify({'error': 'Invalid state parameter'}), 400

    code = request.json.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    # Exchange code for tokens
    token_response = get_token_from_code(code)
    if 'error' in token_response:
        return jsonify({'error': token_response['error']}), 400

    # Get user info from Graph API
    user_info = get_user_info(token_response['access_token'])
    
    # Check if user exists in database
    email = user_info.get('mail') or user_info.get('userPrincipalName')
    user = User.query.filter_by(email=email).first()
    is_new_user = False

    if not user:
        # Create new user
        user = User(
            display_name=user_info.get('displayName'),
            email=email,
            onboarding_completed=False
        )
        db.session.add(user)
        db.session.commit()
        is_new_user = True
    
    # Check if token has admin role
    decoded = jwt.decode(token_response['id_token'], options={"verify_signature": False})
    roles = decoded.get('roles', [])
    is_admin = 'admin' in roles
    
    # Create response with user info and onboarding status
    response = make_response(jsonify({
        'user': {
            'displayName': user_info.get('displayName'),
            'email': email,
            'role': 'admin' if is_admin else 'user',
            'onboardingCompleted': user.onboarding_completed,
            'isNewUser': is_new_user
        }
    }))

    # Set tokens as HTTP-only cookies
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
    decoded, error = validate_tokens()
    if error:
        return jsonify({'error': error}), 401
    
    # Get user info from Graph API
    user_info = get_user_info(request.access_token)
    email = user_info.get('mail') or user_info.get('userPrincipalName')
    
    # Get user from database to check onboarding status
    user = User.query.filter_by(email=email).first()
    is_new_user = user is None
    onboarding_completed = False if user is None else user.onboarding_completed
    
    # Check admin status directly from decoded token
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
    response = make_response(jsonify({'message': 'Logged out successfully'}))
    response.delete_cookie('id_token')
    response.delete_cookie('access_token')
    return response


@auth.route('/api/auth/onboarding-status', methods=['GET'])
@user_required
def get_onboarding_status():
    """Get user's onboarding status and progress"""
    email = request.token_data.get('email') or request.token_data.get('preferred_username')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get count of movies and books rated
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
    email = request.token_data.get('email') or request.token_data.get('preferred_username')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Verify that user has rated required number of items
    movies_count = UserMoviesWatched.query.filter_by(email=email).count()
    books_count = UserBooksRead.query.filter_by(email=email).count()
    
    if movies_count < 3 or books_count < 3:
        return jsonify({
            'error': 'Must rate at least 3 movies and 3 books before completing onboarding'
        }), 400

    user.onboarding_completed = True
    db.session.commit()
    
    return jsonify({
        'message': 'Onboarding completed successfully',
        'onboardingCompleted': True
    })