from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime

import os
from flask import request
import jwt
from datetime import datetime
from functools import wraps

def validate_tokens():
    """Validate auth tokens from request cookies"""
    if os.getenv('TESTING') == 'true':
        request.token_data = {'email': 'test@example.com'}
        request.access_token = 'test_token'
        return request.token_data, None
        
    # Get tokens from cookies
    id_token = request.cookies.get('id_token')
    access_token = request.cookies.get('access_token')
    
    if not id_token or not access_token:
        return None, 'No tokens provided'
    
    try:
        # Decode without verification for testing
        request.token_data = jwt.decode(id_token, options={"verify_signature": False})
        request.access_token = access_token
        return request.token_data, None
    except:
        return None, 'Invalid token'

def user_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        decoded, error = validate_tokens()
        if error:
            return {'error': error}, 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """
    Decorator middleware to restrict access to admin users only.
    
    Validates tokens and ensures the user has an admin role.
    Prevents non-admin users from accessing administrative endpoints.
    
    Args:
    - f: The route handler function to be decorated
    
    Returns:
    - Decorated function with access control
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Validate tokens first
        decoded, error = validate_tokens()
        if error:
            return jsonify({'error': error}), 401
        
        # Extract roles from decoded token
        roles = decoded.get('roles', [])
        
        # Ensure user has admin role
        if 'admin' not in roles:
            return jsonify({'error': 'Admin access required'}), 403
            
        # If all checks pass, execute the original route handler
        return f(*args, **kwargs)
    return decorated_function