from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app.config import Config
from app.auth import auth

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)

    from app.routes import main
    app.register_blueprint(main)

    # Register blueprints
    app.register_blueprint(auth)

    with app.app_context():
        db.create_all()
        
    return app