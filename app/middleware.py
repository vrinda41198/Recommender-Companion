from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime

def validate_tokens():
    """Helper function to validate both tokens"""
    id_token = request.cookies.get('id_token')
    access_token = request.cookies.get('access_token')
    
    if not id_token or not access_token:
        return None, 'No tokens provided'
    
    try:
        # Verify the ID token
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        
        # Check if token is expired
        exp = datetime.fromtimestamp(decoded['exp'])
        if datetime.utcnow() > exp:
            return None, 'Token expired'
            
        # Store both tokens in request context
        request.token_data = decoded
        request.access_token = access_token
        return decoded, None
        
    except jwt.InvalidTokenError:
        return None, 'Invalid token'

def user_required(f):
    """Middleware to verify regular user access (non-admin)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        decoded, error = validate_tokens()
        if error:
            return jsonify({'error': error}), 401
        
        # Check if user has admin role
        roles = decoded.get('roles', [])
        if 'admin' in roles:
            return jsonify({'error': 'Access denied. Admin users cannot access user endpoints'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Middleware to verify admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        decoded, error = validate_tokens()
        if error:
            return jsonify({'error': error}), 401
        
        # Check for admin role
        roles = decoded.get('roles', [])
        if 'admin' not in roles:
            return jsonify({'error': 'Admin access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function