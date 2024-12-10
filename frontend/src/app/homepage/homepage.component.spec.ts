import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomepageComponent } from './homepage.component';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Movie, Book } from '../models';

describe('HomepageComponent', () => {
  let component: HomepageComponent;
  let fixture: ComponentFixture<HomepageComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockUser = {
    displayName: 'Test User',
    email: 'test@example.com',
    role: 'user',
    isNewUser: false,
    onboardingCompleted: true
  };

  const mockAuthState = {
    isLoggedIn: true,
    isAdmin: false,
    user: mockUser,
    isLoading: false
  };

  // Make sure all required properties are defined
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
    user_rating: 4
  };

  const mockBook: Book = {
    id: 1,
    type: 'book',
    book_author: 'Test Author',
    book_title: 'Test Book',
    image_url_s: '/test.jpg',
    isbn: 1234567890,
    year_of_publication: 2024,
    title: '',
    user_rating: 3
  };

  const mockApiResponse = {
    data: [mockMovie, mockBook],
    total: 2,
    page: 1
  };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['logout', 'deleteAccount'], {
      authState$: new BehaviorSubject(mockAuthState)
    });
    apiServiceMock = jasmine.createSpyObj('ApiService', [
      'getListings',
      'deleteItem',
      'updateItem',
      'submitReview'
    ]);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    // Setup default mock returns
    authServiceMock.logout.and.returnValue(of(null));
    authServiceMock.deleteAccount.and.returnValue(of(null));
    apiServiceMock.getListings.and.returnValue(of(mockApiResponse));
    apiServiceMock.deleteItem.and.returnValue(of(null));
    apiServiceMock.updateItem.and.returnValue(of(null));
    apiServiceMock.submitReview.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        HomepageComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.activeTab).toBe('all');
    expect(component.searchQuery).toBe('');
    expect(component.showOptions).toBeNull();
    expect(component.showModal).toBeFalse();
    expect(component.showRecommendationModal).toBeFalse();
    expect(component.showDeleteModal).toBeFalse();
    expect(component.isDeleting).toBeFalse();
    expect(component.editingIndex).toBeNull();
    expect(component.newRating).toBe(0);
  });

  it('should fetch results on init', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(apiServiceMock.getListings).toHaveBeenCalledWith('', false, '');
    expect(component.results.length).toBe(2);
    expect(component.filteredResults.length).toBe(2);
  }));

  it('should handle tab changes', fakeAsync(() => {
    component.setTab('movies');
    tick();

    expect(component.activeTab).toBe('movies');
    expect(apiServiceMock.getListings).toHaveBeenCalledWith('movie', false, '');
  }));

  it('should filter results based on search query', () => {
    component.results = [mockMovie, mockBook];
    component.searchQuery = 'test';
    
    component.applySearchFilter();
    expect(component.filteredResults.length).toBe(2);

    component.searchQuery = 'movie';
    component.applySearchFilter();
    expect(component.filteredResults.length).toBe(1);
  });

  it('should handle logout', fakeAsync(() => {
    component.logout();
    tick();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle account deletion', fakeAsync(() => {
    component.handleDeleteAccount();
    tick();

    expect(authServiceMock.deleteAccount).toHaveBeenCalled();
    expect(component.showDeleteModal).toBeFalse();
    expect(component.isDeleting).toBeFalse();
  }));

  it('should handle item deletion', fakeAsync(() => {
    // Ensure the item has an id
    const itemToDelete = { ...mockMovie, id: 1 };
    component.deleteItem(itemToDelete);
    tick();

    expect(apiServiceMock.deleteItem).toHaveBeenCalledWith(1, itemToDelete.type);
    expect(apiServiceMock.getListings).toHaveBeenCalled();
  }));

  it('should update item rating', fakeAsync(() => {
    // Ensure the item has an id
    const itemToUpdate = { ...mockMovie, id: 1 };
    component.editingIndex = 0;
    component.newRating = 5;
    component.submitUpdatedRating(itemToUpdate);
    tick();

    expect(apiServiceMock.updateItem).toHaveBeenCalledWith(
      1,
      itemToUpdate.type,
      { user_rating: 5, type: itemToUpdate.type }
    );
  }));

  it('should handle modal operations', () => {
    component.showAddModal('movie');
    expect(component.modalType).toBe('movie');
    expect(component.showModal).toBeTrue();

    component.handleModalClose();
    expect(component.showModal).toBeFalse();

    component.showRecommendations();
    expect(component.showRecommendationModal).toBeTrue();

    component.handleRecommendationModalClose();
    expect(component.showRecommendationModal).toBeFalse();

    component.showDeleteAccount();
    expect(component.showDeleteModal).toBeTrue();
  });

  it('should handle options menu', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    component.toggleOptions(1, event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.showOptions).toBe(1);

    component.toggleOptions(1, event);
    expect(component.showOptions).toBeNull();
  });

  it('should handle rating updates', () => {
    component.filteredResults = [{ ...mockMovie, user_rating: 3 }];
    component.startUpdatingItem(0);
    expect(component.editingIndex).toBe(0);
    expect(component.newRating).toBe(3);
    expect(component.showOptions).toBeNull();

    component.setNewRating(5);
    expect(component.newRating).toBe(5);

    component.cancelUpdatingItem();
    expect(component.editingIndex).toBeNull();
  });

  it('should navigate to admin dashboard', () => {
    component.navigateToAdmin();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin']);
  });
});