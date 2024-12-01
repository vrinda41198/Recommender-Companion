from flask import Blueprint, jsonify, request
from app.models import User, Movie, Book
from app import db
from app.middleware import user_required, admin_required

main = Blueprint('main', __name__)

@main.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@main.route('/api/listings', methods=['GET'])
@user_required
def get_listings():
    tab_type = request.args.get('tab_type', '')
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

@main.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Not found"}), 404

@main.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500