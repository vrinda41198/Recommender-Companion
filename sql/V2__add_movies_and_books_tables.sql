CREATE TABLE movie (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    cast JSON NOT NULL,
    description TEXT,
    release_year INTEGER,
    genre VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120)
);

CREATE TABLE book (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(200) NOT NULL,
    description TEXT,
    publish_year INTEGER,
    genre VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120)
);

-- Add indexes for common queries
CREATE INDEX idx_movie_title ON movie(title);
CREATE INDEX idx_book_title ON book(title);
CREATE INDEX idx_book_author ON book(author);
CREATE INDEX idx_movie_genre ON movie(genre);
CREATE INDEX idx_book_genre ON book(genre);