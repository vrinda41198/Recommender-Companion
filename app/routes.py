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

logging.basicConfig(level=logging.INFO) 

main = Blueprint('main', __name__)

@main.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200


@main.route('/api/listings', methods=['GET'])
@user_required
def get_listings():
    tab_type = request.args.get('type', '')
    
    global_search = request.args.get('search_global', '').lower() == 'true'

    search_query = request.args.get('query', '').lower()

    limit = 20
    data = []

    logging.info("global_search value %s",global_search)

    
    # if global_search is true we need to search from add movies to watch tab, and in the global database
    if global_search:
        data =  get_global_list(tab_type,search_query,limit)
    else:
        user_email = request.token_data.get('email')
        data = get_user_list(user_email, tab_type, search_query, limit)
    
    return jsonify({
        "status": "success",
        "data": data
    }), 200


def get_global_list(tab_type, search_query, limit):
    logging.info("global list called")

    movies = []
    books = []
    
    if tab_type == 'movie' or tab_type == '':
        if search_query:
            # Use full-text search for movies
            items = Movies.query.filter(
                text("MATCH(title) AGAINST (:search IN BOOLEAN MODE)")
            ).params(search=f'*{search_query}*').limit(limit).all()
        else:
            items = Movies.query.limit(limit).all()
        movies = [item.to_dict() for item in items]
        logging.info("Looking at movies %s", movies)

    if tab_type == 'book' or tab_type == '':
        if search_query:
            # Use full-text search for books
            items = Books.query.filter(
                text("MATCH(book_title) AGAINST (:search IN BOOLEAN MODE)")
            ).params(search=f'*{search_query}*').limit(limit).all()
        else:
            items = Books.query.limit(limit).all()
        books = [{**item.to_dict(), "id": item.to_dict().pop("isbn")} for item in items]
    
    logging.info("Looking at books %s", books)
    return movies + books



def get_user_list(email, tab_type, search_query, limit):
    movies = []
    books = []
    email = request.token_data.get('email')

    logging.info("user list called")
    logging.info("tab type %s", tab_type)

    if tab_type == 'movie' or tab_type == '':
        logging.info("entering movie tab type")
        logging.info("email is %s", email)
        
        # Base query for user's movies with full join to get rating
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

        # Include user_rating in the movie dictionary
        movies = [
            {**movie.to_dict(), "user_rating": user_movie.user_rating} 
            for user_movie, movie in moviesItem
        ]
    
    if tab_type == 'book' or tab_type == '':
        logging.info("entering book tab type")
        logging.info("email is %s", email)

        # Base query for user's books with full join to get rating
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

        # Include user_rating in the book dictionary
        books = [
            {**{**book.to_dict(), "id": book.to_dict().pop("isbn")}, "user_rating": user_book.user_rating} 
            for user_book, book in booksItem
        ]

    return movies + books


@main.route('/api/reviews', methods=['POST'])
@user_required
def add_item_to_user():
    data = request.get_json()
    required_fields = ['itemId', 'itemType', 'rating']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    user_email = request.token_data.get('email')

    if data['itemType'] == 'movie':
        # Check if movie already exists for this user
        existing_entry = UserMoviesWatched.query.filter_by(email=user_email, movie_id=data['itemId']).first()
        if existing_entry:
            return jsonify({'error': 'Movie is already present in the database for this user. Cannot enter again.'}), 400
        
        # Add new movie entry
        new_entry = UserMoviesWatched(
            email=user_email,
            movie_id=data['itemId'],
            user_rating=data['rating']
        )
        db.session.add(new_entry)

    elif data['itemType'] == 'book':
        # Check if book already exists for this user
        existing_entry = UserBooksRead.query.filter_by(email=user_email, isbn=data['itemId']).first()
        if existing_entry:
            return jsonify({'error': 'Book is already present in the database for this user. Cannot enter again.'}), 400
        
        logging.info("Adding item ", data['itemId'])
        # Add new book entry
        new_entry = UserBooksRead(
            email=user_email,
            isbn=data['itemId'],
            user_rating=data['rating']
        )
        db.session.add(new_entry)
    
    else:
        return jsonify({'error': 'Invalid item type specified'}), 400

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


@main.route('/api/<type>s/<id>', methods=['DELETE'])
@user_required
def delete_item(id,type):
    '''
    Delete a movie entry from the user's database
    '''
    user_email = request.token_data.get('email') 

    entry_to_delete = None
    if type == 'movie':
        entry_to_delete = UserMoviesWatched.query.filter_by(email=user_email, movie_id=id).first()
    elif type == 'book':
        entry_to_delete = UserBooksRead.query.filter_by(email=user_email, isbn=id).first()

    if not entry_to_delete:
        return jsonify({'error': 'No matching entry found for this user and item'}), 404

    # Delete the entry
    db.session.delete(entry_to_delete)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": f"Item with ID {id} has been deleted from the user's database."
    }), 200

def get_user_items(user_email, tab_type):
    """Get user's watched movies and/or read books with ratings, along with user age."""
    try:
        items = []
        
        # Get user age from the User table
        user = User.query.filter_by(email=user_email).first()
        user_age = user.age if user else None
        
        if tab_type in ['all', 'movie']:
            movies = db.session.query(
                UserMoviesWatched, Movies
            ).join(
                Movies, UserMoviesWatched.movie_id == Movies.id
            ).filter(
                UserMoviesWatched.email == user_email
            ).all()
            
            for user_movie, movie in movies:
                item = {
                    'type': 'movie',
                    'title': movie.title,
                    'rating': user_movie.user_rating,
                    'genres': movie.genres,
                    'director': movie.director,
                }
                items.append(item)

        if tab_type in ['all', 'book']:
            books = db.session.query(
                UserBooksRead, Books
            ).join(
                Books, UserBooksRead.isbn == Books.isbn
            ).filter(
                UserBooksRead.email == user_email
            ).all()
            
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


@main.route('/api/generate-recommendation', methods=['GET'])
@user_required
def generate_recommendations():
    try:
        api_key = os.getenv('OPENAI_API_KEY')
        client = OpenAI(api_key=api_key)
        
        tab_type = request.args.get('type', 'all').lower()
        if tab_type == 'movies':
            tab_type = 'movie'
        elif tab_type == 'books':
            tab_type = 'book'

        user_email = request.token_data.get('email')
        
        if not user_email:
            return jsonify({"status": "error", "message": "User email not found"}), 401

        # Get user's watched/read items with ratings and age
        user_items, user_age = get_user_items(user_email, tab_type)
        if not user_items:
            return jsonify({
                "status": "success",
                "data": []
            }), 200

        # Prepare age-specific content guidance
        age_guidance = ""
        if user_age:
            if user_age < 13:
                age_guidance = "Please ensure all recommendations are appropriate for children under 13. Focus on family-friendly content."
            elif user_age < 18:
                age_guidance = "Please ensure all recommendations are appropriate for teenagers. Avoid mature or explicit content."
            else:
                age_guidance = f"The user is {user_age} years old. Consider age-appropriate content and themes that might resonate with this age group."

        # Call OpenAI API with the client instance and include age guidance
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

        # Parse the response
        result = json.loads(response.choices[0].message.content)
        recommendations = result.get('recommendations', [])

        return jsonify({
            "status": "success",
            "data": recommendations[:10]  # Ensure we only return 10 items
        }), 200

    except Exception as e:
        logging.error(f"Error generating recommendations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to generate recommendations: {str(e)}"
        }), 500
    
# @main.route('/api/listings', methods=['GET'])
# @user_required
# def get_listings():
#     try:
#         tab_type = request.args.get('type', '')
#         search_query = request.args.get('search', '').lower()
#         page = int(request.args.get('page', 0))
#         per_page = 10  # Adjust as needed

#         # Query based on type with pagination
#         if tab_type == 'movie':
#             query = Movies.query
#         elif tab_type == 'book':
#             query = Books.query
#         else:
#             # If no type specified, combine movies and books
#             movies_query = Movies.query
#             books_query = Books.query

#             # Apply search to both if search query exists
#             if search_query:
#                 movies_query = movies_query.filter(Movies.title.ilike(f'%{search_query}%'))
#                 books_query = books_query.filter(Books.book_title.ilike(f'%{search_query}%'))

#             # Paginate combined results
#             movies_paginated = movies_query.paginate(page=page+1, per_page=per_page//2)
#             books_paginated = books_query.paginate(page=page+1, per_page=per_page//2)

#             # Combine and convert to dictionaries
#             movies_data = [item.to_dict() for item in movies_paginated.items]
#             books_data = [item.to_dict() for item in books_paginated.items]
            
#             # Combine data and calculate total pages
#             data = movies_data + books_data
#             total_pages = max(movies_paginated.pages, books_paginated.pages)

#             return jsonify({
#                 "status": "success",
#                 "data": data,
#                 "total_pages": total_pages,
#                 "current_page": page
#             }), 200

#         # If specific type is selected
#         if search_query:
#             query = query.filter(
#                 Movies.title.ilike(f'%{search_query}%') if tab_type == 'movie' 
#                 else Books.book_title.ilike(f'%{search_query}%')
#             )

#         # Paginate
#         paginated_items = query.paginate(page=page+1, per_page=per_page)
        
#         data = [item.to_dict() for item in paginated_items.items]

#         return jsonify({
#             "status": "success",
#             "data": data,
#             "total_pages": paginated_items.pages,
#             "current_page": page
#         }), 200

#     except Exception as e:
#         # Log the error
#         print(f"Error in get_listings: {str(e)}")
#         return jsonify({
#             "status": "error", 
#             "message": "Internal server error"
#         }), 500

@main.route('/api/movies', methods=['POST'])
@admin_required
def add_movie():
    data = request.get_json()
    
    # Validate required fields including id
    required_fields = ['id', 'title', 'director', 'cast', 'release_date', 'original_language', 'genres']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Check if movie with this ID already exists
        existing_movie = Movies.query.get(data['id'])
        if existing_movie:
            return jsonify({'error': 'Movie with this ID already exists'}), 400

        # Convert release_date string to Date object
        release_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date()
        
        # Create new movie with provided ID
        movie = Movies(
            id=data['id'],  # Use the provided TMDB ID
            title=data['title'],
            director=data['director'],
            cast=data['cast'],
            release_date=release_date,
            original_language=data['original_language'],
            genres=data['genres'],
            poster_path=data.get('poster_path')
        )
        
        db.session.add(movie)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "data": movie.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@main.route('/api/books', methods=['POST'])
@admin_required
def add_book():
    data = request.get_json()
    
    # Validate required fields including isbn
    required_fields = ['isbn', 'book_title', 'book_author', 'year_of_publication']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Check if book with this ISBN already exists
        existing_book = Books.query.get(data['isbn'])
        if existing_book:
            return jsonify({'error': 'Book with this ISBN already exists'}), 400

        # Create new book with provided ISBN
        book = Books(
            isbn=data['isbn'],
            book_title=data['book_title'],
            book_author=data['book_author'],
            year_of_publication=data['year_of_publication'],
            image_url_s=data.get('image_url_s')
        )
        
        db.session.add(book)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "data": book.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@main.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Not found"}), 404

@main.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500
