from flask import Blueprint, jsonify, request
from app.models import User, Movie, Book, MoviesWatched
from app import db
from app.middleware import user_required, admin_required
from uuid import uuid4
from sqlalchemy.sql import text


main = Blueprint('main', __name__)

@main.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@main.route('/api/listings', methods=['GET'])
@user_required
def get_listings():
    tab_type = request.args.get('type', '')
    search_query = request.args.get('search', '').lower()
    
    # Query based on type
    if tab_type == 'movie':
        items = Movie.query.all()
        data = [item.to_dict() for item in items]
    elif tab_type == 'book':
        items = Book.query.all()
        data = [item.to_dict() for item in items]
    else:
        # Get all items
        movies = Movie.query.all()
        books = Book.query.all()
        data = [item.to_dict() for item in movies + books]
    
    # Apply search filter if query exists
    if search_query:
        data = [item for item in data if search_query in item['title'].lower()]
    
    return jsonify({
        "status": "success",
        "data": data
    }), 200

@main.route('/api/movies', methods=['POST'])
@admin_required
def add_movie():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'cast', 'description', 'release_year', 'genre']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Get user email from token claims
    user_email = request.token_data.get('email') or request.token_data.get('preferred_username')
    
    # Create new movie
    movie = Movie(
        title=data['title'],
        cast=data['cast'],
        description=data['description'],
        release_year=data['release_year'],
        genre=data['genre'],
        created_by=user_email
    )
    
    db.session.add(movie)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "data": movie.to_dict()
    }), 201

@main.route('/api/books', methods=['POST'])
@admin_required
def add_book():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'author', 'description', 'publish_year', 'genre']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Get user email from token claims
    user_email = request.token_data.get('email') or request.token_data.get('preferred_username')
    
    # Create new book
    book = Book(
        title=data['title'],
        author=data['author'],
        description=data['description'],
        publish_year=data['publish_year'],
        genre=data['genre'],
        created_by=user_email
    )
    
    db.session.add(book)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "data": book.to_dict()
    }), 201

@main.route('/api/reviews', methods=['POST'])
@user_required
def add_movie_to_user():
    
    data = request.get_json()

    # if 'query' in data:  
    #     query = data['query'].strip().lower()
    #     if not query:
    #         return jsonify({'error': 'Search query cannot be empty'}), 400

    #     matching_movies = Movie.query.filter(Movie.title.ilike(f"%{query}%")).all()

    #     if not matching_movies:
    #         return jsonify({'error': 'This movie is not present in the global database.'}), 404

    #     results = [movie.to_dict() for movie in matching_movies]

    #     return jsonify({
    #         "status": "success",
    #         "data": results
    #     }), 200

    required_fields = ['itemId','itemType','rating','review']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400


    #user_email = request.token_data.get('email') 
    # or request.token_data.get('preferred_username')
    user_email = "ysh@gmail.com"

    existing_entry = MoviesWatched.query.filter_by(email=user_email, movie_id=data['itemId']).first()

    if existing_entry:
        return jsonify({'error': 'Movie is already present in the database for this user. Cannot enter again.'}), 400

    new_entry = MoviesWatched(
        uuid=str(uuid4()),
        email=user_email,
        movie_id=data['itemId'],
        user_rating=data['rating'],
        user_review=data['review']
    )

    db.session.add(new_entry)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": f"Movie has been added to the user's database.",
        "data": {
            "uuid": new_entry.uuid,
            "email": new_entry.email,
            "movie_id": new_entry.movie_id,
            "user_rating": new_entry.user_rating,
            "user_review": new_entry.user_review
        }
    }), 201


    

@main.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Not found"}), 404

@main.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500