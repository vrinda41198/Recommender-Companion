import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddItemModalComponent } from './add-item-modal.component';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { of, throwError } from 'rxjs';
import { Movie, Book } from '../models';

describe('AddItemModalComponent', () => {
  let component: AddItemModalComponent;
  let fixture: ComponentFixture<AddItemModalComponent>;
  let apiServiceMock: jasmine.SpyObj<ApiService>;

  // Mock data
  const mockMovie: Movie = {
    id: 1,
    type: 'movie',
    title: 'Test Movie',
    director: 'Test Director',
    genres: ['Action'],
    original_language: 'en',
    poster_path: '/test.jpg',
    release_date: '2024-01-01',
    cast: ['Actor 1'],
    release_year: 2024,
    book_title: '',
    user_rating: 0
  };

  const mockBook: Book = {
    id: 2,
    type: 'book',
    book_author: 'Test Author',
    book_title: 'Test Book',
    image_url_s: '/test.jpg',
    isbn: 1234567890,
    year_of_publication: 2024,
    title: '',
    user_rating: 0
  };

  const mockApiResponse = {
    data: [mockMovie],
    total: 1,
    page: 1
  };

  beforeEach(async () => {
    apiServiceMock = jasmine.createSpyObj('ApiService', ['getListings']);
    apiServiceMock.getListings.and.returnValue(of(mockApiResponse));

    await TestBed.configureTestingModule({
      imports: [FormsModule, AddItemModalComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddItemModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.itemType).toBe('movie');
    expect(component.searchQuery).toBe('');
    expect(component.searchResults).toEqual([]);
    expect(component.selectedItem).toBeNull();
    expect(component.rating).toBe(0);
    expect(component.review).toBe('');
  });

  it('should handle search input', fakeAsync(() => {
    // Empty search
    component.searchQuery = '';
    component.onSearch();
    expect(component.searchResults).toEqual([]);
    expect(apiServiceMock.getListings).not.toHaveBeenCalled();

    // Valid search
    component.searchQuery = 'test';
    component.onSearch();
    tick();

    expect(apiServiceMock.getListings).toHaveBeenCalledWith('movie', true, 'test');
    expect(component.searchResults).toEqual(mockApiResponse.data);
  }));

  it('should handle search errors', fakeAsync(() => {
    apiServiceMock.getListings.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.searchQuery = 'test';
    component.onSearch();
    tick();

    expect(console.error).toHaveBeenCalled();
  }));

  it('should select item', () => {
    component.selectItem(mockMovie);
    expect(component.selectedItem).toBe(mockMovie);
  });

  it('should validate submit conditions', () => {
    expect(component.canSubmit).toBeFalse();

    component.selectedItem = mockMovie;
    expect(component.canSubmit).toBeFalse();

    component.rating = 4;
    expect(component.canSubmit).toBeTrue();
  });

  it('should emit close event when clicking overlay', () => {
    spyOn(component.close, 'emit');
    
    const event = new MouseEvent('click');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    Object.defineProperty(event, 'target', { value: overlay });

    component.onOverlayClick(event);
    expect(component.close.emit).toHaveBeenCalled();

    // Test clicking non-overlay element
    const content = document.createElement('div');
    content.className = 'modal-content';
    Object.defineProperty(event, 'target', { value: content });

    component.onOverlayClick(event);
    expect(component.close.emit).toHaveBeenCalledTimes(1);
  });

  it('should submit review', () => {
    spyOn(component.submit, 'emit');
    
    // Should not submit without valid data
    component.submitReview();
    expect(component.submit.emit).not.toHaveBeenCalled();

    // Should submit with valid data
    component.selectedItem = mockMovie;
    component.rating = 4;
    component.review = 'Great movie';

    component.submitReview();
    expect(component.submit.emit).toHaveBeenCalledWith({
      itemId: mockMovie.id!,
      itemType: 'movie',
      rating: 4,
      review: 'Great movie'
    });
  });

  it('should correctly identify movies and books', () => {
    expect(component.isMovie(mockMovie)).toBeTrue();
    expect(component.isMovie(mockBook)).toBeFalse();
    expect(component.isBook(mockBook)).toBeTrue();
    expect(component.isBook(mockMovie)).toBeFalse();
  });

  it('should switch item type', () => {
    component.itemType = 'book';
    fixture.detectChanges();

    component.searchQuery = 'test';
    component.onSearch();

    expect(apiServiceMock.getListings).toHaveBeenCalledWith('book', true, 'test');
  });

  it('should handle empty API response', fakeAsync(() => {
    apiServiceMock.getListings.and.returnValue(of({ data: [], total: 0, page: 1 }));
    
    component.searchQuery = 'test';
    component.onSearch();
    tick();

    expect(component.searchResults).toEqual([]);
  }));

  it('should update search results display', () => {
    component.searchResults = [mockMovie];
    fixture.detectChanges();

    const resultItem = fixture.nativeElement.querySelector('.result-item');
    expect(resultItem).toBeTruthy();
    expect(resultItem.textContent).toContain('Test Movie');
  });

  it('should show correct button text based on item type', () => {
    const submitButton = fixture.nativeElement.querySelector('.submit-button');
    expect(submitButton.textContent.trim()).toContain('Add to Watched');

    component.itemType = 'book';
    fixture.detectChanges();
    expect(submitButton.textContent.trim()).toContain('Add to Read');
  });

  it('should disable submit button when conditions not met', () => {
    const submitButton = fixture.nativeElement.querySelector('.submit-button');
    expect(submitButton.disabled).toBeTrue();

    component.selectedItem = mockMovie;
    component.rating = 4;
    fixture.detectChanges();
    expect(submitButton.disabled).toBeFalse();
  });
});