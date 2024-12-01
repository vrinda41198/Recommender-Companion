INSERT INTO movie (title, cast, description, release_year, genre, created_by) VALUES
('Inception', JSON_ARRAY('Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'), 'A thief who enters the subconscious to steal secrets.', 2010, 'Science Fiction', 'admin'),
('The Godfather', JSON_ARRAY('Marlon Brando', 'Al Pacino', 'James Caan'), 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', 1972, 'Crime', 'admin'),
('Titanic', JSON_ARRAY('Leonardo DiCaprio', 'Kate Winslet', 'Billy Zane'), 'A romance doomed by the sinking of the Titanic.', 1997, 'Romance', 'admin'),
('The Matrix', JSON_ARRAY('Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'), 'A hacker discovers the shocking truth about reality.', 1999, 'Science Fiction', 'admin'),
('Forrest Gump', JSON_ARRAY('Tom Hanks', 'Robin Wright', 'Gary Sinise'), 'The story of an extraordinary life of an ordinary man.', 1994, 'Drama', 'admin'),
('The Dark Knight', JSON_ARRAY('Christian Bale', 'Heath Ledger', 'Aaron Eckhart'), 'Batman faces his greatest foe, the Joker.', 2008, 'Action', 'admin'),
('Avengers: Endgame', JSON_ARRAY('Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo'), 'The Avengers assemble to reverse Thanos\'s actions.', 2019, 'Superhero', 'admin');

INSERT INTO book (title, author, description, publish_year, genre, created_by) VALUES
('To Kill a Mockingbird', 'Harper Lee', 'A young girl learns about the injustices of the world.', 1960, 'Fiction', 'admin'),
('1984', 'George Orwell', 'A dystopian novel about a totalitarian regime.', 1949, 'Science Fiction', 'admin'),
('Pride and Prejudice', 'Jane Austen', 'A classic romance novel about social class and love.', 1813, 'Romance', 'admin'),
('Moby-Dick', 'Herman Melville', 'The quest for vengeance against a white whale.', 1851, 'Adventure', 'admin'),
('The Great Gatsby', 'F. Scott Fitzgerald', 'A mysterious millionaire and the American Dream.', 1925, 'Fiction', 'admin'),
('War and Peace', 'Leo Tolstoy', 'A novel that chronicles the French invasion of Russia.', 1869, 'Historical Fiction', 'admin'),
('The Catcher in the Rye', 'J.D. Salinger', 'The story of teenage rebellion and alienation.', 1951, 'Fiction', 'admin'),
('The Hobbit', 'J.R.R. Tolkien', 'A hobbit embarks on a quest to win a share of treasure.', 1937, 'Fantasy', 'admin'),
('Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', 'A young wizard discovers his destiny.', 1997, 'Fantasy', 'admin');
