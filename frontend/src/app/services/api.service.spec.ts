import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Movie, Book, Review, Recommendation } from '../models';

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
      const mockResponse = {
        status: 'success',
        data: {
          movies: [{
            id: 1,
            title: 'Test Movie',
            type: 'movie',
            director: 'Test Director',
            cast: ['Actor 1'],
            genres: ['Action'],
            original_language: 'en',
            release_date: '2024-01-01',
            poster_path: '/test.jpg',
            release_year: 2024,
            book_title: '',
            user_rating: 0
          }],
          books: []
        },
        pagination: {
          movies: {
            current_page: 1,
            per_page: 10,
            total_items: 1,
            total_pages: 1
          },
          books: {
            current_page: 1,
            per_page: 10,
            total_items: 0,
            total_pages: 0
          }
        }
      };

      service.getListings('movie', true, 'action', 1, 10).subscribe((response) => {
        // Use jasmine.objectContaining to match the structure without strict type checking
        expect(response).toEqual(jasmine.objectContaining({
          status: 'success',
          data: {
            movies: jasmine.arrayContaining([
              jasmine.objectContaining({
                id: 1,
                title: 'Test Movie',
                type: 'movie'
              })
            ]),
            books: []
          },
          pagination: jasmine.any(Object)
        }));
      });

      const req = httpMock.expectOne((req) =>
        req.url === '/api/listings' &&
        req.params.get('type') === 'movie' &&
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
        release_date: '2010-07-16'
      };

      service.addMovie(movie).subscribe((response) => {
        expect(response).toEqual(jasmine.objectContaining(movie));
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
        title: '',
        type: 'book',
        book_title: '1984',
        user_rating: 4,
        book_author: 'George Orwell',
        image_url_s: 'path/to/image',
        isbn: 1234567890,
        year_of_publication: 1949
      };

      service.addBook(book).subscribe((response) => {
        expect(response).toEqual(jasmine.objectContaining(book));
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
      const mockRecommendation: Recommendation = {
        id: 1,
        title: 'Test Movie',
        confidence: 0.9,
        description: 'Test description',
        genre: 'Action',
        type: 'movie',
        cast: ['Actor 1']
      };

      const mockResponse = {
        data: [mockRecommendation],
        total: 1,
        page: 1
      };

      service.generateRecommendations().subscribe((response) => {
        expect(response).toEqual(jasmine.objectContaining(mockResponse));
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

describe('ApiService Additional Coverage Tests', () => {
  let apiService: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should update user age successfully', () => {
    apiService.updateUserAge(30).subscribe(response => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne('/api/user/age');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ age: 30 });
    req.flush({ success: true });
  });
});