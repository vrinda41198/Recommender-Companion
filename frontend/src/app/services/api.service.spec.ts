import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Movie, Book, ApiResponse, Review, Recommendation } from '../models';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getListings', () => {
    it('should fetch listings with correct query params', () => {
      const mockResponse: ApiResponse<Movie | Book> = {
        data: [],
        total: 0,
        page: 1,
      };

      service.getListings('movies', true, 'action').subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((req) =>
        req.url === '/api/listings' &&
        req.params.get('type') === 'movies' &&
        req.params.get('search_global') === 'true' &&
        req.params.get('query') === 'action'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('submitReview', () => {
    it('should submit a review', () => {
      const review: Review = { itemId: 1, itemType: 'movie', rating: 5, review: 'Great!' };
      const mockResponse = { success: true };

      service.submitReview(review).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/reviews');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(review);
      req.flush(mockResponse);
    });
  });

  describe('addMovie', () => {
    it('should add a new movie', () => {
      const movie: Movie = {
        id: 1,
        title: 'Inception',
        type: 'movie',
        book_title: '',
        user_rating: 5,
        release_year: 2010,
        cast: ['Leonardo DiCaprio'],
        director: 'Christopher Nolan',
        genres: ['Sci-Fi', 'Thriller'],
        original_language: 'English',
        poster_path: 'path/to/poster',
        release_date: '2010-07-16',
      };

      service.addMovie(movie).subscribe((response) => {
        expect(response).toEqual(movie);
      });

      const req = httpMock.expectOne('/api/movies');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(movie);
      req.flush(movie);
    });
  });

  describe('addBook', () => {
    it('should add a new book', () => {
      const book: Book = {
        id: 1,
        title: '1984',
        type: 'book',
        book_title: '1984',
        user_rating: 4,
        book_author: 'George Orwell',
        image_url_s: 'path/to/image',
        isbn: 1234567890,
        year_of_publication: 1949,
      };

      service.addBook(book).subscribe((response) => {
        expect(response).toEqual(book);
      });

      const req = httpMock.expectOne('/api/books');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(book);
      req.flush(book);
    });
  });

  describe('deleteItem', () => {
    it('should delete an item', () => {
      service.deleteItem(1, 'movie').subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/movies/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('updateItem', () => {
    it('should update an item', () => {
      const updateData = { title: 'Updated Title' };

      service.updateItem(1, 'movie', updateData).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/movies/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush({});
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for all types', () => {
      const mockResponse: ApiResponse<Recommendation> = {
        data: [],
        total: 0,
        page: 1,
      };

      service.generateRecommendations().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((req) =>
        req.url === '/api/generate-recommendation' && req.params.get('type') === 'all'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('updateUserAge', () => {
    it('should update user age', () => {
      const mockResponse = { success: true };

      service.updateUserAge(25).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/user/age');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ age: 25 });
      req.flush(mockResponse);
    });
  });
});
