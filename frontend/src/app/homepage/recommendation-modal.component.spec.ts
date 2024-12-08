import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { RecommendationModalComponent } from './recommendation-modal.component';
import { ApiService } from '../services/api.service';
import { of, throwError } from 'rxjs';
import { Recommendation, MovieRecommendation, BookRecommendation, ApiResponse } from '../models';

describe('RecommendationModalComponent', () => {
  let component: RecommendationModalComponent;
  let fixture: ComponentFixture<RecommendationModalComponent>;
  let apiServiceMock: jasmine.SpyObj<ApiService>;

  const mockRecommendations: (MovieRecommendation | BookRecommendation)[] = [
    {
      id: 1,
      type: 'movie',
      title: 'Test Movie',
      description: 'A test movie',
      confidence: 0.85,
      cast: ['Actor 1', 'Actor 2'],
      genre: 'Action'
    },
    {
      id: 2,
      type: 'book',
      title: 'Test Book',
      description: 'A test book',
      confidence: 0.75,
      author: 'Test Author',
      genre: 'Fiction'
    }
  ];

  const mockApiResponse: ApiResponse<MovieRecommendation | BookRecommendation> = {
    data: mockRecommendations,
    total: mockRecommendations.length,
    page: 1
  };

  beforeEach(async () => {
    apiServiceMock = jasmine.createSpyObj('ApiService', ['generateRecommendations']);
    apiServiceMock.generateRecommendations.and.returnValue(of(mockApiResponse));

    await TestBed.configureTestingModule({
      imports: [RecommendationModalComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    component.recommendations = [];
    expect(component.activeTab).toBe('all');
    expect(component.isLoading).toBeFalse();
    expect(component.recommendations).toEqual([]);
  });

  it('should load recommendations on init', fakeAsync(() => {
    apiServiceMock.generateRecommendations.and.returnValue(of(mockApiResponse));
    
    component.ngOnInit();
    tick();
    
    expect(apiServiceMock.generateRecommendations).toHaveBeenCalledWith('all');
    expect(component.recommendations).toEqual(mockRecommendations);
    flush();
  }));

  it('should handle tab changes', fakeAsync(() => {
    component.setTab('movies');
    tick();

    expect(component.activeTab).toBe('movies');
    expect(apiServiceMock.generateRecommendations).toHaveBeenCalledWith('movies');
    flush();
  }));

  it('should filter recommendations based on active tab', () => {
    component.recommendations = mockRecommendations;

    component.activeTab = 'all';
    expect(component.filteredRecommendations.length).toBe(2);

    component.activeTab = 'movies';
    expect(component.filteredRecommendations.length).toBe(1);
    expect(component.filteredRecommendations[0].type).toBe('movie');

    component.activeTab = 'books';
    expect(component.filteredRecommendations.length).toBe(1);
    expect(component.filteredRecommendations[0].type).toBe('book');
  });

  it('should handle API errors', fakeAsync(() => {
    apiServiceMock.generateRecommendations.and.returnValue(throwError(() => new Error('API Error')));
    component.generateRecommendations();
    tick();
    expect(component.recommendations).toEqual([]);
    expect(component.isLoading).toBeFalse();
    flush();
  }));

  it('should return correct confidence colors', () => {
    expect(component.getConfidenceColor(0.85)).toBe('#059669');
    expect(component.getConfidenceColor(0.65)).toBe('#0284c7');
    expect(component.getConfidenceColor(0.45)).toBe('#9333ea');
    expect(component.getConfidenceColor(0.35)).toBe('#6b7280');
  });

  it('should emit close event when clicking overlay', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    
    const event = new MouseEvent('click');
    const overlayElement = fixture.nativeElement.querySelector('.modal-overlay');
    Object.defineProperty(event, 'target', { value: overlayElement });
    
    component.onOverlayClick(event);
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not emit close event when clicking modal content', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    
    const event = new MouseEvent('click');
    const modalContent = fixture.nativeElement.querySelector('.modal-content');
    Object.defineProperty(event, 'target', { value: modalContent });
    
    component.onOverlayClick(event);
    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it('should disable refresh button while loading', fakeAsync(() => {
    fixture.detectChanges();
    component.isLoading = true;
    fixture.detectChanges();

    const refreshButton = fixture.nativeElement.querySelector('.refresh-button');
    expect(refreshButton.disabled).toBeTrue();
    flush();
  }));

  it('should show and hide loading state', fakeAsync(() => {
    fixture.detectChanges();
    component.isLoading = true;
    fixture.detectChanges();
    
    let loadingElement = fixture.nativeElement.querySelector('.loading-state');
    expect(loadingElement).toBeTruthy();

    component.isLoading = false;
    fixture.detectChanges();
    
    loadingElement = fixture.nativeElement.querySelector('.loading-state');
    expect(loadingElement).toBeFalsy();
    flush();
  }));

  it('should correctly identify movie and book recommendations', () => {
    const movieRec = mockRecommendations[0];
    const bookRec = mockRecommendations[1];

    expect(component.isMovieRecommendation(movieRec)).toBeTrue();
    expect(component.isMovieRecommendation(bookRec)).toBeFalse();
    expect(component.isBookRecommendation(bookRec)).toBeTrue();
    expect(component.isBookRecommendation(movieRec)).toBeFalse();
  });

  it('should update recommendations on refresh click', fakeAsync(() => {
    fixture.detectChanges();
    const refreshButton = fixture.nativeElement.querySelector('.refresh-button');
    refreshButton.click();
    tick();
    expect(apiServiceMock.generateRecommendations).toHaveBeenCalled();
    flush();
  }));

  it('should emit close on button clicks', fakeAsync(() => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    
    const closeButton = fixture.nativeElement.querySelector('.close-button');
    closeButton.click();
    tick();
    expect(component.close.emit).toHaveBeenCalled();

    const secondaryCloseButton = fixture.nativeElement.querySelector('.close-button-secondary');
    secondaryCloseButton.click();
    tick();
    expect(component.close.emit).toHaveBeenCalledTimes(2);
    flush();
  }));
});