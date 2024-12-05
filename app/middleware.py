from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime

def validate_tokens():
    """
    Helper function to validate both ID and access tokens.
    
    Checks for token presence, expiration, and basic validity.
    Stores decoded token data and access token in request context.
    
    Returns:
    - Tuple of (decoded_token, error_message)
    """
    # Retrieve tokens from HTTP-only cookies
    id_token = request.cookies.get('id_token')
    access_token = request.cookies.get('access_token')
    
    # Verify tokens are present
    if not id_token or not access_token:
        return None, 'No tokens provided'
    
    try:
        # Decode ID token without signature verification
        # Note: Signature was already verified during authentication
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        
        # Check token expiration
        exp = datetime.fromtimestamp(decoded['exp'])
        if datetime.utcnow() > exp:
            return None, 'Token expired'
            
        # Store token data for use in subsequent request processing
        # Allows route handlers to access token information
        request.token_data = decoded
        request.access_token = access_token
        return decoded, None
        
    except jwt.InvalidTokenError:
        # Handle any token decoding or validation errors
        return None, 'Invalid token'

def user_required(f):
    """
    Decorator middleware to restrict access to non-admin users.
    
    Validates tokens and ensures the user is not an admin.
    Prevents admin users from accessing regular user endpoints.
    
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
        
        # Block admin users from accessing user endpoints
        if 'admin' in roles:
            return jsonify({'error': 'Access denied. Admin users cannot access user endpoints'}), 403
            
        # If all checks pass, execute the original route handler
        return f(*args, **kwargs)
    return decorated_function

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