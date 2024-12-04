-- Create the User table with an index on the email field
CREATE TABLE rc_user (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    display_name VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    age INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Create the Movies table with a full-text index on the title field
CREATE TABLE movies (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_date DATE,
    original_language CHAR(2),
    genres TEXT,
    cast TEXT,
    director VARCHAR(700),
    poster_path VARCHAR(255),
    FULLTEXT (title)
);

-- Create the Books table with a full-text index on the Book_Title field
CREATE TABLE books (
    isbn BIGINT UNSIGNED PRIMARY KEY,
    book_title VARCHAR(260) NOT NULL,
    book_author VARCHAR(255),
    year_of_publication INT,
    image_url_s TEXT,
    FULLTEXT (book_title)
);

-- Create the user_books_read table with foreign keys and indexes on email and ISBN
CREATE TABLE user_books_read (
    uuid INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(120) NOT NULL,
    isbn BIGINT UNSIGNED NOT NULL,
    user_rating TINYINT NOT NULL CHECK (user_rating >= 1 AND user_rating <= 5),
    FOREIGN KEY (email) REFERENCES rc_user(email) ON DELETE CASCADE,
    FOREIGN KEY (isbn) REFERENCES books(isbn) ON DELETE CASCADE,
    INDEX idx_user_books_email (email),
    INDEX idx_user_books_isbn (isbn)
);

-- Create the user_movies_watched table with foreign keys and indexes on email and movie_id
CREATE TABLE user_movies_watched (
    uuid INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(120) NOT NULL,
    movie_id INT NOT NULL,
    user_rating TINYINT NOT NULL CHECK (user_rating >= 1 AND user_rating <= 5),
    FOREIGN KEY (email) REFERENCES rc_user(email) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    INDEX idx_user_movies_email (email),
    INDEX idx_user_movies_movie_id (movie_id)
);
