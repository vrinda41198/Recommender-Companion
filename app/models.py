from datetime import datetime
from .extensions import db

class User(db.Model):
    """
    Represents user account information in the database.
    
    Stores core user profile details and tracks onboarding status.
    Uses SQLAlchemy ORM for database interaction.
    """
    # Specify the database table name
    __tablename__ = 'rc_user'
    
    # Primary key for user record
    id = db.Column(db.Integer, primary_key=True)
    
    # User's display name, required field
    display_name = db.Column(db.String(80), nullable=False)
    
    # Unique email address, used for authentication and identification
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    # Optional user age
    age = db.Column(db.Integer)
    
    # Automatic timestamp of user account creation
    # Defaults to current UTC time when record is created
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Flag to track user onboarding completion
    # Defaults to False for new users
    onboarding_completed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        """
        String representation of the User object.
        Useful for debugging and logging.
        """
        return f'<User {self.email}>'
    
    def to_dict(self):
        """
        Convert user object to a dictionary.
        Useful for JSON serialization and API responses.
        
        Returns:
        - Dictionary of user's core information
        """
        return {
            'id': self.id,
            'display_name': self.display_name,
            'email': self.email,
            'onboarding_completed': self.onboarding_completed
        }

class Movies(db.Model):
    """
    Represents movie information in the database.
    
    Stores detailed metadata about movies for recommendation and display.
    """
    # Specify the database table name
    __tablename__ = 'movies'

    # Primary key for movie record
    id = db.Column(db.Integer, primary_key=True)
    
    # Movie title, required field
    title = db.Column(db.String(255), nullable=False)
    
    # Release date of the movie
    release_date = db.Column(db.Date)
    
    # Two-letter language code for the original language
    original_language = db.Column(db.String(2))
    
    # Comma-separated list of movie genres
    genres = db.Column(db.Text)
    
    # Comma-separated list of main cast members
    cast = db.Column(db.Text)
    
    # Movie director name
    director = db.Column(db.String(700))
    
    # Path or URL to movie poster image
    poster_path = db.Column(db.String(255))

    def to_dict(self):
        """
        Convert movie object to a dictionary.
        Adds a 'type' field for easy identification.
        
        Returns:
        - Dictionary of movie's detailed information
        """
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
    """
    Represents book information in the database.
    
    Stores detailed metadata about books for recommendation and display.
    Uses ISBN as primary key for unique book identification.
    """
    # Specify the database table name
    __tablename__ = 'books'
    
    # ISBN (International Standard Book Number) as primary key
    isbn = db.Column(db.BigInteger, primary_key=True)
    
    # Book title, required field
    book_title = db.Column(db.String(260), nullable=False)
    
    # Book author name, required field
    book_author = db.Column(db.String(255), nullable=False)
    
    # Year the book was published
    year_of_publication = db.Column(db.Integer)
    
    # URL to a small book cover image
    image_url_s = db.Column(db.Text)

    def to_dict(self):
        """
        Convert book object to a dictionary.
        Adds a 'type' field for easy identification.
        
        Returns:
        - Dictionary of book's detailed information
        """
        return {
            'isbn': self.isbn,
            'book_title': self.book_title,
            'book_author': self.book_author,
            'year_of_publication': self.year_of_publication,
            'image_url_s': self.image_url_s,
            'type': 'book'
        }

class UserBooksRead(db.Model):
    """
    Represents the relationship between users and books they've read.
    
    Tracks which books a user has read and their personal rating.
    Uses foreign keys to link with User and Books tables.
    """
    # Specify the database table name
    __tablename__ = 'user_books_read'

    # Unique identifier for each user-book relationship
    uuid = db.Column(db.Integer, primary_key=True)
    
    # User's email, foreign key linked to User table
    email = db.Column(db.String(120), db.ForeignKey('rc_user.email'), nullable=False)
    
    # Book's ISBN, foreign key linked to Books table
    isbn = db.Column(db.BigInteger, db.ForeignKey('books.isbn'), nullable=False)
    
    # User's personal rating for the book
    user_rating = db.Column(db.Integer)

class UserMoviesWatched(db.Model):
    """
    Represents the relationship between users and movies they've watched.
    
    Tracks which movies a user has watched and their personal rating.
    Uses foreign keys to link with User and Movies tables.
    """
    # Specify the database table name
    __tablename__ = 'user_movies_watched'

    # Unique identifier for each user-movie relationship
    uuid = db.Column(db.Integer, primary_key=True)
    
    # User's email, foreign key linked to User table
    email = db.Column(db.String(120), db.ForeignKey('rc_user.email'), nullable=False)
    
    # Movie's ID, foreign key linked to Movies table
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    
    # User's personal rating for the movie
    user_rating = db.Column(db.Integer)