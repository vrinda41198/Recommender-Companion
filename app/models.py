from app import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    cast = db.Column(db.JSON, nullable=False)  # Store cast as JSON array
    description = db.Column(db.Text)
    release_year = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(120))  # Store email of creator

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'cast': self.cast,
            'description': self.description,
            'release_year': self.release_year,
            'genre': self.genre,
            'type': 'movie'
        }

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    publish_year = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(120))  # Store email of creator

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'description': self.description,
            'publish_year': self.publish_year,
            'genre': self.genre,
            'type': 'book'
        }

class MoviesWatched(db.Model):
    __tablename__ = 'movies_watched_yukti'
    
    uuid = db.Column(db.String(36), primary_key=True)  
    email = db.Column(db.String(255), nullable=False)  
    movie_id = db.Column(db.Integer, nullable=False)  
    user_rating = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'uuid': self.uuid,
            'email': self.email,
            'movie_id': self.movie_id,
            'user_rating': self.user_rating
               }
