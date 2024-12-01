from flask import Blueprint, jsonify, request, current_app, make_response
import requests
from urllib.parse import urlencode
import secrets
import jwt
from datetime import datetime
from .middleware import validate_tokens

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
    
    # Check admin status directly from token claims
    decoded = jwt.decode(token_response['id_token'], options={"verify_signature": False})
    roles = decoded.get('roles', [])
    is_admin = 'admin' in roles
    
    # Create response with user info
    response = make_response(jsonify({
        'user': {
            'displayName': user_info.get('displayName'),
            'email': user_info.get('mail') or user_info.get('userPrincipalName'),
            'role': 'admin' if is_admin else 'user'
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
    
    # Check admin status directly from decoded token
    roles = decoded.get('roles', [])
    is_admin = 'admin' in roles
    
    return jsonify({
        'user': {
            'displayName': user_info.get('displayName'),
            'email': user_info.get('mail') or user_info.get('userPrincipalName'),
            'role': 'admin' if is_admin else 'user'
        }
    })

@auth.route('/api/auth/logout')
def logout():
    """Logout user"""
    response = make_response(jsonify({'message': 'Logged out successfully'}))
    response.delete_cookie('id_token')
    response.delete_cookie('access_token')
    return response