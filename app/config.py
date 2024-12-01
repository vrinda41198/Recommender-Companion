import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Microsoft OAuth settings
    MICROSOFT_CLIENT_ID = os.getenv('MICROSOFT_CLIENT_ID')
    MICROSOFT_CLIENT_SECRET = os.getenv('MICROSOFT_CLIENT_SECRET')
    MICROSOFT_TENANT_ID = os.getenv('MICROSOFT_TENANT_ID')
    MICROSOFT_REDIRECT_URI = 'http://localhost:4200/auth-success'
    MICROSOFT_AUTHORITY = f'https://login.microsoftonline.com/common'
    MICROSOFT_AUTH_ENDPOINT = f'{MICROSOFT_AUTHORITY}/oauth2/v2.0/authorize'
    MICROSOFT_TOKEN_ENDPOINT = f'{MICROSOFT_AUTHORITY}/oauth2/v2.0/token'
    MICROSOFT_SCOPES = ['openid', 'profile', 'email', 'User.Read']