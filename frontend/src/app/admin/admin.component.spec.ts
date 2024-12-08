import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let adminServiceMock: jasmine.SpyObj<AdminService>;
  let router: jasmine.SpyObj<Router>;

  // Mock user data
  const mockUser = {
    displayName: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    isNewUser: false,
    onboardingCompleted: true
  };

  const authStateBehaviorSubject = new BehaviorSubject({
    isLoggedIn: true,
    isAdmin: true,
    user: mockUser,
    isLoading: false
  });

  beforeEach(async () => {
    // Create mock services including Router
    router = jasmine.createSpyObj('Router', ['navigate']);
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'getCurrentUser',
      'logout',
    ], {
      authState$: authStateBehaviorSubject.asObservable()
    });
    adminServiceMock = jasmine.createSpyObj('AdminService', ['addMovie', 'addBook']);

    // Setup mock return values
    authServiceMock.getCurrentUser.and.returnValue(mockUser);
    authServiceMock.logout.and.returnValue(of(null));
    adminServiceMock.addMovie.and.returnValue(of({}));
    adminServiceMock.addBook.and.returnValue(of({}));
    router.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterTestingModule,
        AdminComponent // Move to imports since it's a standalone component
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock },
        { provide: AdminService, useValue: adminServiceMock },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms', () => {
    expect(component.movieForm).toBeTruthy();
    expect(component.bookForm).toBeTruthy();
  });

  it('should handle movie form submission', fakeAsync(() => {
    const mockMovie = {
      id: 123,
      title: 'Test Movie',
      director: 'Test Director',
      cast: 'Actor 1, Actor 2',
      release_date: '2024-01-01',
      original_language: 'en',
      genres: 'Action, Drama',
      poster_path: 'test.jpg'
    };

    component.movieForm.patchValue(mockMovie);
    component.onMovieSubmit();
    tick();

    expect(adminServiceMock.addMovie).toHaveBeenCalledWith(mockMovie);
    expect(component.submitSuccess).toBeTrue();
    expect(component.submitMessage).toContain('success');

    tick(3000);
    expect(component.submitMessage).toBe('');
    flush();
  }));

  it('should handle book form submission', fakeAsync(() => {
    const mockBook = {
      isbn: 1234567890,
      book_title: 'Test Book',
      book_author: 'Test Author',
      year_of_publication: 2024,
      image_url_s: 'test.jpg'
    };

    component.bookForm.patchValue(mockBook);
    component.onBookSubmit();
    tick();

    expect(adminServiceMock.addBook).toHaveBeenCalledWith(mockBook);
    expect(component.submitSuccess).toBeTrue();
    expect(component.submitMessage).toContain('success');

    tick(3000);
    expect(component.submitMessage).toBe('');
    flush();
  }));

  it('should handle auth state changes', fakeAsync(() => {
    // Change auth state to non-admin
    authStateBehaviorSubject.next({
      isLoggedIn: true,
      isAdmin: false,
      user: mockUser,
      isLoading: false
    });
    
    tick(); // Process any pending asynchronous operations
    
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    flush();
  }));

  it('should handle form validation errors', () => {
    // Test movie form validation
    component.movieForm.controls['title'].setErrors({ required: true });
    component.onMovieSubmit();
    expect(component.movieForm.controls['title'].touched).toBeTrue();
    
    // Test book form validation
    component.bookForm.controls['book_title'].setErrors({ required: true });
    component.onBookSubmit();
    expect(component.bookForm.controls['book_title'].touched).toBeTrue();
  });

  it('should clear messages after timeout', fakeAsync(() => {
    component.showSuccess('Test message');
    expect(component.submitMessage).toBe('Test message');
    tick(3000);
    expect(component.submitMessage).toBe('');
    flush();
  }));

  it('should handle failed submissions', fakeAsync(() => {
    const mockError = new HttpErrorResponse({
      error: 'Test error',
      status: 400,
      statusText: 'Bad Request'
    });

    adminServiceMock.addMovie.and.returnValue(throwError(() => mockError));
    component.movieForm.patchValue({
      id: 123,
      title: 'Test Movie',
      director: 'Director',
      cast: 'Cast',
      release_date: '2024-01-01',
      original_language: 'en',
      genres: 'Action'
    });

    component.onMovieSubmit();
    tick();
    
    expect(component.submitSuccess).toBeFalse();
    expect(component.submitMessage).toBeTruthy();
    expect(component.isSubmitting).toBeFalse();

    tick(5000);
    expect(component.submitMessage).toBe('');
    flush();
  }));

  it('should handle logout', fakeAsync(() => {
    component.logout();
    tick();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    flush();
  }));



  it('should create with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.isSubmitting).toBeFalse();
    expect(component.submitMessage).toBe('');
    expect(component.submitSuccess).toBeFalse();
    expect(component.activeTab).toBe('movies');
    expect(component.user).toBeDefined();
  });

  // Form Initialization Tests
  describe('Form Initialization', () => {
    it('should initialize movie form with all required fields', () => {
      const form = component.movieForm;
      expect(form.get('id')).toBeTruthy();
      expect(form.get('title')).toBeTruthy();
      expect(form.get('director')).toBeTruthy();
      expect(form.get('cast')).toBeTruthy();
      expect(form.get('release_date')).toBeTruthy();
      expect(form.get('original_language')).toBeTruthy();
      expect(form.get('genres')).toBeTruthy();
      expect(form.get('poster_path')).toBeTruthy();
    });

    it('should initialize book form with all required fields', () => {
      const form = component.bookForm;
      expect(form.get('isbn')).toBeTruthy();
      expect(form.get('book_title')).toBeTruthy();
      expect(form.get('book_author')).toBeTruthy();
      expect(form.get('year_of_publication')).toBeTruthy();
      expect(form.get('image_url_s')).toBeTruthy();
    });
  });

  // Form Validation Tests
  describe('Form Validation', () => {
    describe('Movie Form', () => {
      it('should validate required fields', () => {
        const form = component.movieForm;
        expect(form.valid).toBeFalse();
        
        form.patchValue({
          id: 123,
          title: 'Test Movie',
          director: 'Test Director',
          cast: 'Test Cast',
          release_date: '2024-01-01',
          original_language: 'en',
          genres: 'Action'
        });
        
        expect(form.valid).toBeTrue();
      });

      it('should validate language code length', () => {
        const langControl = component.movieForm.get('original_language');
        langControl?.setValue('eng');
        expect(langControl?.hasError('maxlength')).toBeTrue();
        
        langControl?.setValue('e');
        expect(langControl?.hasError('minlength')).toBeTrue();
        
        langControl?.setValue('en');
        expect(langControl?.valid).toBeTrue();
      });

      it('should allow optional poster path', () => {
        const form = component.movieForm;
        form.patchValue({
          id: 123,
          title: 'Test Movie',
          director: 'Test Director',
          cast: 'Test Cast',
          release_date: '2024-01-01',
          original_language: 'en',
          genres: 'Action'
        });
        
        expect(form.valid).toBeTrue();
      });
    });

    describe('Book Form', () => {
      it('should validate ISBN minimum value', () => {
        const isbnControl = component.bookForm.get('isbn');
        isbnControl?.setValue(999999999);
        expect(isbnControl?.hasError('min')).toBeTrue();
        
        isbnControl?.setValue(1000000000);
        expect(isbnControl?.valid).toBeTrue();
      });

      it('should validate publication year range', () => {
        const yearControl = component.bookForm.get('year_of_publication');
        yearControl?.setValue(999);
        expect(yearControl?.hasError('min')).toBeTrue();
        
        yearControl?.setValue(new Date().getFullYear() + 2);
        expect(yearControl?.hasError('max')).toBeTrue();
        
        yearControl?.setValue(2024);
        expect(yearControl?.valid).toBeTrue();
      });
    });
  });

  // UI Interaction Tests
  describe('UI Interactions', () => {
    it('should switch tabs', () => {
      expect(component.activeTab).toBe('movies');
      
      component.activeTab = 'books';
      fixture.detectChanges();
      expect(component.activeTab).toBe('books');
    });

    it('should handle form reset after successful submission', fakeAsync(() => {
      const mockMovie = {
        id: 123,
        title: 'Test Movie',
        director: 'Director',
        cast: 'Cast',
        release_date: '2024-01-01',
        original_language: 'en',
        genres: 'Action'
      };

      component.movieForm.patchValue(mockMovie);
      component.onMovieSubmit();
      tick();
      
      expect(component.movieForm.pristine).toBeTrue();
      expect(component.movieForm.value).toEqual({
        id: null,
        title: null,
        director: null,
        cast: null,
        release_date: null,
        original_language: null,
        genres: null,
        poster_path: null
      });
      flush();
    }));
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should show error message with timeout', fakeAsync(() => {
      component.showError('Test error');
      expect(component.submitMessage).toBe('Test error');
      expect(component.submitSuccess).toBeFalse();
      
      tick(5000);
      expect(component.submitMessage).toBe('');
      flush();
    }));
  });

  // Navigation Tests
  describe('Navigation', () => {
    it('should handle home navigation', () => {
      component.navigateToHome();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should handle logout error', fakeAsync(() => {
      authServiceMock.logout.and.returnValue(throwError(() => new Error('Logout failed')));
      
      component.logout();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      flush();
    }));
  });

  // Updated Error Handling Test
  it('should handle network error during movie submission', fakeAsync(() => {
    const mockError = new HttpErrorResponse({
      error: { message: 'Failed to add movie' },  // Changed to match expected message
      status: 500,
      statusText: 'Internal Server Error'
    });

    adminServiceMock.addMovie.and.returnValue(throwError(() => mockError));
    
    component.movieForm.patchValue({
      id: 123,
      title: 'Test Movie',
      director: 'Director',
      cast: 'Cast',
      release_date: '2024-01-01',
      original_language: 'en',
      genres: 'Action'
    });

    component.onMovieSubmit();
    tick();
    
    expect(component.submitMessage).toBe('Failed to add movie'); // Changed to exact match
    expect(component.submitSuccess).toBeFalse();
    expect(component.isSubmitting).toBeFalse();
    
    tick(5000);
    expect(component.submitMessage).toBe('');
    flush();
  }));
});