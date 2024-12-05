from flask import Blueprint, jsonify, request

from app.models import User, Movies, Books, UserBooksRead, UserMoviesWatched
from app import db
from app.middleware import user_required, admin_required
# from uuid import uuid4
import logging

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

    movies=[]
    books=[]
    
    if tab_type == 'movie' or tab_type == '':
        items = Movies.query.limit(limit).all()
        movies = [item.to_dict() for item in items]
        logging.info("Looking at movies ", movies)

    elif tab_type == 'book' or tab_type == '':
        items = Books.query.limit(limit).all()
        books = [{**item.to_dict(), "id": item.to_dict().pop("isbn")} for item in items]
    logging.info("Looking at books", books)
    return movies + books


def get_user_list(email,tab_type, search_query, limit):
    movies=[]
    books=[]
    email= request.token_data.get('email')

    logging.info("user list called")
    logging.info("tab type %s",tab_type)


    if tab_type == 'movie' or tab_type == '':
        logging.info("entering movie tab type")
        logging.info("emai is %s",email)
        moviesItem = db.session.query(UserMoviesWatched, Movies).filter(
            UserMoviesWatched.movie_id == Movies.id,
            UserMoviesWatched.email == email
        ).all()

        logging.info("Query executed, moviesItem: %s", moviesItem)

        movies = [movie.to_dict() for _, movie in moviesItem]
    
    if tab_type == 'book' or tab_type == '':
        logging.info("entering book tab type")
        logging.info("emai is %s",email)

        booksItem = db.session.query(UserBooksRead, Books).filter(
            UserBooksRead.isbn == Books.isbn,
            UserBooksRead.email == email
        ).all()

        logging.info("Query executed, booksItem: %s", booksItem)

        books = [{**book.to_dict(), "id": book.to_dict().pop("isbn")} for _,book in booksItem]
    else:
        logging.info("function is throwing error")


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



@main.route('/api/generate-recommendation', methods=['GET'])
@user_required
def generate_recommendations():
    user_email = request.token_data.get('email')

    # Fetch user's watched movies and read books
    watched_movies = UserMoviesWatched.query.filter_by(email=user_email).all()
    read_books = UserBooksRead.query.filter_by(email=user_email).all()

    # Construct a mock prompt for an LLM
    prompt = "Based on the following user interests:\n"
    for movie in watched_movies:
        movie_data = Movies.query.get(movie.movie_id)
        prompt += f"Movie: {movie_data.title}, Rating: {movie.user_rating}\n"
    for book in read_books:
        book_data = Books.query.get(book.isbn)
        prompt += f"Book: {book_data.book_title}, Rating: {book.user_rating}\n"

    # Mock response generation (as if received from an LLM)
    recommendations = mock_llm_response(watched_movies, read_books)

    return jsonify({
        "status": "success",
        "data": recommendations,
        "prompt": prompt  # Optionally include the prompt in the response for debugging
    }), 200

def mock_llm_response(watched_movies, read_books):
    # Simulate a response from an LLM based on the user's history
    # This is a very basic example and should be expanded based on actual recommendation logic
    recommendations = []
    if watched_movies:
        recommendations.append({"type": "movie", "title": "Recommended Movie"})
    if read_books:
        recommendations.append({"type": "book", "title": "Recommended Book"})
    return recommendations



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
    
    # Validate required fields
    required_fields = ['title', 'cast', 'description', 'release_year', 'genre']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Get user email from token claims
    user_email = request.token_data.get('email') or request.token_data.get('preferred_username')
    
    # Create new movie
    movie = Movies(
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
    book = Books(
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
