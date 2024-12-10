import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService, Movie, Book } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('addMovie', () => {
    it('should add a movie', () => {
      const movie: Movie = {
        title: 'Inception',
        release_date: '2010-07-16',
        original_language: 'English',
        genres: 'Sci-Fi',
        cast: 'Leonardo DiCaprio',
        director: 'Christopher Nolan',
        poster_path: '/path/to/poster',
      };

      service.addMovie(movie).subscribe((response) => {
        expect(response).toEqual({ success: true });
      });

      const req = httpMock.expectOne('/api/movies');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(movie);
      req.flush({ success: true });
    });
  });

  describe('addBook', () => {
    it('should add a book', () => {
      const book: Book = {
        book_title: '1984',
        book_author: 'George Orwell',
        year_of_publication: 1949,
        image_url_s: '/path/to/image',
        isbn: 1234567890,
      };

      service.addBook(book).subscribe((response) => {
        expect(response).toEqual({ success: true });
      });

      const req = httpMock.expectOne('/api/books');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(book);
      req.flush({ success: true });
    });
  });

  describe('getRecentMovies', () => {
    it('should fetch recent movies', () => {
      const mockMovies: Movie[] = [
        {
          id: 1,
          title: 'Inception',
          release_date: '2010-07-16',
          original_language: 'English',
          genres: 'Sci-Fi',
          cast: 'Leonardo DiCaprio',
          director: 'Christopher Nolan',
          poster_path: '/path/to/poster',
        },
        {
          id: 2,
          title: 'The Matrix',
          release_date: '1999-03-31',
          original_language: 'English',
          genres: 'Action, Sci-Fi',
          cast: 'Keanu Reeves',
          director: 'The Wachowskis',
        },
      ];

      service.getRecentMovies().subscribe((movies) => {
        expect(movies).toEqual(mockMovies);
      });

      const req = httpMock.expectOne('/api/listings?type=movie');
      expect(req.request.method).toBe('GET');
      req.flush(mockMovies);
    });
  });

  describe('getRecentBooks', () => {
    it('should fetch recent books', () => {
      const mockBooks: Book[] = [
        {
          isbn: 1234567890,
          book_title: '1984',
          book_author: 'George Orwell',
          year_of_publication: 1949,
          image_url_s: '/path/to/image',
        },
        {
          isbn: 9876543210,
          book_title: 'Brave New World',
          book_author: 'Aldous Huxley',
          year_of_publication: 1932,
          image_url_s: '/path/to/image2',
        },
      ];

      service.getRecentBooks().subscribe((books) => {
        expect(books).toEqual(mockBooks);
      });

      const req = httpMock.expectOne('/api/listings?type=book');
      expect(req.request.method).toBe('GET');
      req.flush(mockBooks);
    });
  });
});
