import os  # Add this import at the top with other imports
from openai import OpenAI
import logging
from flask import Blueprint, jsonify, request
import json
from sqlalchemy import text
from app.models import User, Movies, Books, UserBooksRead, UserMoviesWatched
from app import db
from app.middleware import user_required, admin_required
from datetime import datetime

# Configure logging for tracking application events and debugging
logging.basicConfig(level=logging.INFO) 

# Create a Flask blueprint for organizing routes
main = Blueprint('main', __name__)

# Health check endpoint to verify the application is running
@main.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200


# Endpoint to retrieve listings of movies and books
@main.route('/api/listings', methods=['GET'])
@user_required
def get_listings():
    # Determine the type of listing (movie, book, or both)
    tab_type = request.args.get('type', '')
    
    # Check if global search is requested
    global_search = request.args.get('search_global', '').lower() == 'true'

    # Get search query for filtering results
    search_query = request.args.get('query', '').lower()

    # Set default limit for number of results
    limit = 20
    data = []

    logging.info("global_search value %s",global_search)

    
    # Choose between global database search or user-specific list
    if global_search:
        data =  get_global_list(tab_type,search_query,limit)
    else:
        user_email = request.token_data.get('email')
        data = get_user_list(user_email, tab_type, search_query, limit)
    
    return jsonify({
        "status": "success",
        "data": data
    }), 200


# Function to retrieve items from the global database
def get_global_list(tab_type, search_query, limit):
    logging.info("global list called")

    movies = []
    books = []
    
    # Retrieve movies based on tab type and search query
    if tab_type == 'movie' or tab_type == '':
        if search_query:
            # Use full-text search for movies with boolean mode
            items = Movies.query.filter(
                text("MATCH(title) AGAINST (:search IN BOOLEAN MODE)")
            ).params(search=f'*{search_query}*').limit(limit).all()
        else:
            items = Movies.query.limit(limit).all()
        movies = [item.to_dict() for item in items]
        logging.info("Looking at movies %s", movies)

    # Retrieve books based on tab type and search query
    if tab_type == 'book' or tab_type == '':
        if search_query:
            # Use full-text search for books with boolean mode
            items = Books.query.filter(
                text("MATCH(book_title) AGAINST (:search IN BOOLEAN MODE)")
            ).params(search=f'*{search_query}*').limit(limit).all()
        else:
            items = Books.query.limit(limit).all()
        books = [{**item.to_dict(), "id": item.to_dict().pop("isbn")} for item in items]
    
    logging.info("Looking at books %s", books)
    return movies + books


# Function to retrieve user-specific lists of movies and books
def get_user_list(email, tab_type, search_query, limit):
    movies = []
    books = []
    email = request.token_data.get('email')

    logging.info("user list called")
    logging.info("tab type %s", tab_type)

    # Retrieve user's movies with their ratings
    if tab_type == 'movie' or tab_type == '':
        logging.info("entering movie tab type")
        logging.info("email is %s", email)
        
        # Base query joining UserMoviesWatched with Movies
        query = db.session.query(UserMoviesWatched, Movies).filter(
            UserMoviesWatched.movie_id == Movies.id,
            UserMoviesWatched.email == email
        )
        
        # Apply full-text search if query exists
        if search_query:
            query = query.filter(
                text("MATCH(Movies.title) AGAINST (:search IN BOOLEAN MODE)")
            ).params(search=f'*{search_query}*')
        
        moviesItem = query.limit(limit).all()

        logging.info("Query executed, moviesItem: %s", moviesItem)

        # Include user rating in movie dictionary
        movies = [
            {**movie.to_dict(), "user_rating": user_movie.user_rating} 
            for user_movie, movie in moviesItem
        ]
    
    # Retrieve user's books with their ratings
    if tab_type == 'book' or tab_type == '':
        logging.info("entering book tab type")
        logging.info("email is %s", email)

        # Base query joining UserBooksRead with Books
        query = db.session.query(UserBooksRead, Books).filter(
            UserBooksRead.isbn == Books.isbn,
            UserBooksRead.email == email
        )
        
        # Apply full-text search if query exists
        if search_query:
            query = query.filter(
                text("MATCH(Books.book_title) AGAINST (:search IN BOOLEAN MODE)")
            ).params(search=f'*{search_query}*')
        
        booksItem = query.limit(limit).all()

        logging.info("Query executed, booksItem: %s", booksItem)

        # Include user rating in book dictionary
        books = [
            {**{**book.to_dict(), "id": book.to_dict().pop("isbn")}, "user_rating": user_book.user_rating} 
            for user_book, book in booksItem
        ]

    return movies + books


# Endpoint to add a movie or book to user's watched/read list with a rating
@main.route('/api/reviews', methods=['POST'])
@user_required
def add_item_to_user():
    # Parse JSON request data
    data = request.get_json()
    required_fields = ['itemId', 'itemType', 'rating']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    # Get user email from token
    user_email = request.token_data.get('email')

    # Add movie to user's watched list
    if data['itemType'] == 'movie':
        # Check for existing entry to prevent duplicates
        existing_entry = UserMoviesWatched.query.filter_by(email=user_email, movie_id=data['itemId']).first()
        if existing_entry:
            return jsonify({'error': 'Movie is already present in the database for this user. Cannot enter again.'}), 400
        
        # Create new movie entry
        new_entry = UserMoviesWatched(
            email=user_email,
            movie_id=data['itemId'],
            user_rating=data['rating']
        )
        db.session.add(new_entry)

    # Add book to user's read list
    elif data['itemType'] == 'book':
        # Check for existing entry to prevent duplicates
        existing_entry = UserBooksRead.query.filter_by(email=user_email, isbn=data['itemId']).first()
        if existing_entry:
            return jsonify({'error': 'Book is already present in the database for this user. Cannot enter again.'}), 400
        
        logging.info("Adding item ", data['itemId'])
        # Create new book entry
        new_entry = UserBooksRead(
            email=user_email,
            isbn=data['itemId'],
            user_rating=data['rating']
        )
        db.session.add(new_entry)
    
    else:
        return jsonify({'error': 'Invalid item type specified'}), 400

    # Commit the new entry to the database
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": f"{data['itemType'].capitalize()} has been added to the user's database.",
        "data": {
            "uuid": new_entry.uuid,
            "email": new_entry.email,
            "item_id": data['itemId'],
            "user_rating": new_entry.user_rating
        }
    }), 200


# Endpoint to delete a movie or book from user's watched/read list
@main.route('/api/<type>s/<id>', methods=['DELETE'])
@user_required
def delete_item(id,type):
    '''
    Delete a movie or book entry from the user's database
    '''
    # Get user email from token
    user_email = request.token_data.get('email') 

    # Find the entry to delete based on item type
    entry_to_delete = None
    if type == 'movie':
        entry_to_delete = UserMoviesWatched.query.filter_by(email=user_email, movie_id=id).first()
    elif type == 'book':
        entry_to_delete = UserBooksRead.query.filter_by(email=user_email, isbn=id).first()

    # Return error if no matching entry found
    if not entry_to_delete:
        return jsonify({'error': 'No matching entry found for this user and item'}), 404

    # Delete the entry and commit changes
    db.session.delete(entry_to_delete)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": f"Item with ID {id} has been deleted from the user's database."
    }), 200

# Helper function to retrieve user's watched movies and read books with ratings
def get_user_items(user_email, tab_type):
    """Get user's watched movies and/or read books with ratings, along with user age."""
    try:
        items = []
        
        # Get user age from the User table
        user = User.query.filter_by(email=user_email).first()
        user_age = user.age if user else None
        
        # Retrieve movies if tab type is 'all' or 'movie'
        if tab_type in ['all', 'movie']:
            movies = db.session.query(
                UserMoviesWatched, Movies
            ).join(
                Movies, UserMoviesWatched.movie_id == Movies.id
            ).filter(
                UserMoviesWatched.email == user_email
            ).all()
            
            # Prepare movie items with relevant details
            for user_movie, movie in movies:
                item = {
                    'type': 'movie',
                    'title': movie.title,
                    'rating': user_movie.user_rating,
                    'genres': movie.genres,
                    'director': movie.director,
                }
                items.append(item)

        # Retrieve books if tab type is 'all' or 'book'
        if tab_type in ['all', 'book']:
            books = db.session.query(
                UserBooksRead, Books
            ).join(
                Books, UserBooksRead.isbn == Books.isbn
            ).filter(
                UserBooksRead.email == user_email
            ).all()
            
            # Prepare book items with relevant details
            for user_book, book in books:
                item = {
                    'type': 'book',
                    'title': book.book_title,
                    'rating': user_book.user_rating,
                    'author': book.book_author,
                }
                items.append(item)
        
        return items, user_age

    except Exception as e:
        logging.error(f"Error getting user items: {str(e)}")
        return [], None

# Endpoint to update user's rating for a movie or book
@main.route('/api/<type>s/<id>', methods=['PUT'])
@user_required
def update_item_rating(id, type):
    """
    Update the user's rating for a movie or book
    """
    # Get the current user's email from the token
    user_email = request.token_data.get('email')
    # Get the data from the request
    data = request.get_json()
    
    # Validate that rating is provided
    if 'user_rating' not in data:
        return jsonify({'error': 'Rating is required'}), 400
    
    try:
        # Validate rating is between 1 and 5
        user_rating = int(data['user_rating'])
        if user_rating < 1 or user_rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Determine which table to update based on type
        if type == 'movie':
            # Find the specific user's movie entry
            entry_to_update = UserMoviesWatched.query.filter_by(
                email=user_email, 
                movie_id=id
            ).first()
            
            # Check if entry exists
            if not entry_to_update:
                return jsonify({'error': 'No matching movie entry found for this user'}), 404
            
            # Update the rating
            entry_to_update.user_rating = user_rating
            
        elif type == 'book':
            # Find the specific user's book entry
            entry_to_update = UserBooksRead.query.filter_by(
                email=user_email, 
                isbn=id
            ).first()
            
            # Check if entry exists
            if not entry_to_update:
                return jsonify({'error': 'No matching book entry found for this user'}), 404
            
            # Update the rating
            entry_to_update.user_rating = user_rating
        
        else:
            return jsonify({'error': 'Invalid item type'}), 400
        
        # Commit the changes
        db.session.commit()
        
        # Return success response
        return jsonify({
            "status": "success",
            "message": f"{type.capitalize()} rating updated successfully",
            "data": {
                "id": id,
                "user_rating": user_rating
            }
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid rating format'}), 400
    except Exception as e:
        # Rollback in case of any database error
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Endpoint to generate personalized recommendations using OpenAI's GPT
@main.route('/api/generate-recommendation', methods=['GET'])
@user_required
def generate_recommendations():
    try:
        # Retrieve OpenAI API key from environment
        api_key = os.getenv('OPENAI_API_KEY')
        client = OpenAI(api_key=api_key)
        
        # Determine recommendation type (movies, books, or all)
        tab_type = request.args.get('type', 'all').lower()
        if tab_type == 'movies':
            tab_type = 'movie'
        elif tab_type == 'books':
            tab_type = 'book'

        # Get user email from token
        user_email = request.token_data.get('email')
        
        # Validate user email
        if not user_email:
            return jsonify({"status": "error", "message": "User email not found"}), 401

        # Retrieve user's watched/read items and age
        user_items, user_age = get_user_items(user_email, tab_type)
        # Return empty list if no items found
        if not user_items:
            return jsonify({
                "status": "success",
                "data": []
            }), 200

        # Prepare age-specific content guidance for recommendations
        age_guidance = ""
        if user_age:
            if user_age < 13:
                # Guidance for children
                age_guidance = "Please ensure all recommendations are appropriate for children under 13. Focus on family-friendly content."
            elif user_age < 18:
                # Guidance for teenagers
                age_guidance = "Please ensure all recommendations are appropriate for teenagers. Avoid mature or explicit content."
            else:
                # Guidance for adult users
                age_guidance = f"The user is {user_age} years old. Consider age-appropriate content and themes that might resonate with this age group."

        # Call OpenAI API to generate personalized recommendations
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a recommendation system expert."},
                {"role": "user", "content": f"""Based on the user's ratings, preferences, and age shown below, generate personalized recommendations.
                Focus on {tab_type} recommendations. Sort the recommendations based on confidence.
                
                User's age context: {age_guidance}
                
                User's history:
                {json.dumps(user_items, indent=2)}
                
                Return exactly 10 recommendations in the below JSON format. Please be very careful with this JSON format. I am reading this JSON format
                programmatically, so if format is not correct, everything will fail. Your response should be just like a JSON response of an API call. Assume
                you are an API returning JSON.
                {{"recommendations": [
                    {{
                        "type": "movie"|"book",
                        "title": string,
                        "confidence": float (0-1),
                        "description": string,
                        "genre": string,
                        "cast": [string] (for movies),
                        "author": string (for books)
                    }}
                ]}}"""}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        # Parse the OpenAI API response
        result = json.loads(response.choices[0].message.content)
        recommendations = result.get('recommendations', [])

        # Return recommendations
        return jsonify({
            "status": "success",
            "data": recommendations[:10]  # Ensure we only return 10 items
        }), 200

    except Exception as e:
        # Log and handle any errors during recommendation generation
        logging.error(f"Error generating recommendations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to generate recommendations: {str(e)}"
        }), 500
    

# Endpoint to add a new movie to the database (admin-only)
@main.route('/api/movies', methods=['POST'])
@admin_required
def add_movie():
    # Get JSON data from the request
    data = request.get_json()
    
    # Validate that all required fields are present
    required_fields = ['id', 'title', 'director', 'cast', 'release_date', 'original_language', 'genres']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Check if movie with this ID already exists in the database
        existing_movie = Movies.query.get(data['id'])
        if existing_movie:
            return jsonify({'error': 'Movie with this ID already exists'}), 400

        # Convert release date string to Date object
        release_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date()
        
        # Create new movie object with provided data
        movie = Movies(
            id=data['id'],  # Use the provided TMDB ID
            title=data['title'],
            director=data['director'],
            cast=data['cast'],
            release_date=release_date,
            original_language=data['original_language'],
            genres=data['genres'],
            poster_path=data.get('poster_path')  # Optional poster path
        )
        
        # Add and commit the new movie to the database
        db.session.add(movie)
        db.session.commit()
        
        # Return success response with movie data
        return jsonify({
            "status": "success",
            "data": movie.to_dict()
        }), 201
        
    except ValueError as e:
        # Handle invalid date format
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        # Rollback database session on error and return error response
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Endpoint to add a new book to the database (admin-only)
@main.route('/api/books', methods=['POST'])
@admin_required
def add_book():
    # Get JSON data from the request
    data = request.get_json()
    
    # Validate that all required fields are present
    required_fields = ['isbn', 'book_title', 'book_author', 'year_of_publication']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Check if book with this ISBN already exists in the database
        existing_book = Books.query.get(data['isbn'])
        if existing_book:
            return jsonify({'error': 'Book with this ISBN already exists'}), 400

        # Create new book object with provided data
        book = Books(
            isbn=data['isbn'],
            book_title=data['book_title'],
            book_author=data['book_author'],
            year_of_publication=data['year_of_publication'],
            image_url_s=data.get('image_url_s')  # Optional small image URL
        )
        
        # Add and commit the new book to the database
        db.session.add(book)
        db.session.commit()
        
        # Return success response with book data
        return jsonify({
            "status": "success",
            "data": book.to_dict()
        }), 201
        
    except Exception as e:
        # Rollback database session on error and return error response
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Error handler for 404 Not Found errors
@main.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Not found"}), 404

# Error handler for 500 Internal Server errors
@main.errorhandler(500)
def internal_error(error):
    # Rollback any pending database transactions
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500
