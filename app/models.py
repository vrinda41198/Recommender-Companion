from app import db
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'rc_user'
    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    age = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    def __repr__(self):
        return f'<User {self.username}>'

class Movie(db.Model):
    __tablename__ = 'movie'

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

class Books(db.Model):
    __tablename__ = 'books'
    isbn = db.Column(db.BigInteger, primary_key=True)
    book_title = db.Column(db.String(260), nullable=False)  # Corrected to 'book_title'
    book_author = db.Column(db.String(255), nullable=False)  # Matches SQL schema
    year_of_publication = db.Column(db.Integer)  # Matches SQL schema
    image_url_s = db.Column(db.Text)  # Matches SQL schema

    def to_dict(self):
        return {
            'isbn': self.isbn,
            'book_title': self.book_title,  # Corrected to 'book_title'
            'book_author': self.book_author,
            'year_of_publication': self.year_of_publication,
            'image_url_s': self.image_url_s,
            'type': 'book'
        }

class UserBooksRead(db.Model):
    __tablename__ = 'user_books_read'

    uuid = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), db.ForeignKey('user.email'), nullable=False)
    isbn = db.Column(db.BigInteger, db.ForeignKey('books.isbn'), nullable=False)
    user_rating = db.Column(db.Integer)

class UserMoviesWatched(db.Model):
    __tablename__ = 'user_movies_watched'

    uuid = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), db.ForeignKey('user.email'), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    user_rating = db.Column(db.Integer)