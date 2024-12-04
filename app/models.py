from app import db
from datetime import datetime, timezone

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    age = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    def __repr__(self):
        return f'<User {self.username}>'

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    release_date = db.Column(db.Date)
    original_language = db.Column(db.String(2))
    genres = db.Column(db.Text)
    cast = db.Column(db.Text)
    director = db.Column(db.String(700))
    poster_path = db.Column(db.String(255))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'release_date': self.release_date,
            'original_language': self.original_language,
            'genres': self.genres,
            'cast': self.cast,
            'director': self.director,
            'poster_path': self.poster_path,
            'type': 'movie'
        }

class Book(db.Model):
    isbn = db.Column(db.BigInteger, primary_key=True)
    title = db.Column(db.String(260), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    publish_year = db.Column(db.Integer)
    image_url_s = db.Column(db.Text)

    def to_dict(self):
        return {
            'isbn': self.isbn,
            'title': self.title,
            'author': self.author,
            'publish_year': self.publish_year,
            'image_url_s': self.image_url_s,
            'type': 'book'
        }

class UserBooksRead(db.Model):
    uuid = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), db.ForeignKey('user.email'), nullable=False)
    isbn = db.Column(db.BigInteger, db.ForeignKey('book.isbn'), nullable=False)
    user_rating = db.Column(db.Integer)

class UserMoviesWatched(db.Model):
    uuid = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), db.ForeignKey('user.email'), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    user_rating = db.Column(db.Integer)
