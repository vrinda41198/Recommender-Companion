import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { WelcomeComponent } from './welcome.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockAuthState = {
    isLoggedIn: true,
    isAdmin: false,
    user: {
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'user',
      isNewUser: true,
      onboardingCompleted: false
    },
    isLoading: false
  };

  const mockOnboardingStatus = {
    onboardingCompleted: false,
    progress: {
      movies: 2,
      books: 1,
      required: {
        movies: 3,
        books: 3
      }
    }
  };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', 
      ['getOnboardingStatus', 'completeOnboarding', 'checkAuthStatus'], 
      {
        authState$: new BehaviorSubject(mockAuthState)
      }
    );
    apiServiceMock = jasmine.createSpyObj('ApiService', ['updateUserAge', 'submitReview']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    // Set up default mock returns
    authServiceMock.getOnboardingStatus.and.returnValue(of(mockOnboardingStatus));
    authServiceMock.completeOnboarding.and.returnValue(of(null));
    authServiceMock.checkAuthStatus.and.returnValue(of(mockAuthState));
    apiServiceMock.updateUserAge.and.returnValue(of(null));
    apiServiceMock.submitReview.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [FormsModule, WelcomeComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.userAge).toBeNull();
    expect(component.ageSubmitted).toBeFalse();
    expect(component.showModal).toBeFalse();
    expect(component.modalType).toBe('movie');
    expect(component.progress).toEqual({ movies: 2, books: 1 });
  });

  it('should validate age input', () => {
    component.userAge = null;
    expect(component.isValidAge).toBeFalse();

    component.userAge = 0;
    expect(component.isValidAge).toBeFalse();

    component.userAge = 121;
    expect(component.isValidAge).toBeFalse();

    component.userAge = 25;
    expect(component.isValidAge).toBeTrue();
  });

  it('should handle age submission', fakeAsync(() => {
    component.userAge = 25;
    component.submitAge();
    tick();

    expect(apiServiceMock.updateUserAge).toHaveBeenCalledWith(25);
    expect(component.ageSubmitted).toBeTrue();
  }));

  it('should handle age submission error', fakeAsync(() => {
    apiServiceMock.updateUserAge.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.userAge = 25;
    component.submitAge();
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(component.ageSubmitted).toBeFalse();
  }));

  it('should fetch progress on init', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(authServiceMock.getOnboardingStatus).toHaveBeenCalled();
    expect(component.progress).toEqual({ movies: 2, books: 1 });
  }));

  it('should handle progress fetch error', fakeAsync(() => {
    authServiceMock.getOnboardingStatus.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.fetchProgress();
    tick();

    expect(console.error).toHaveBeenCalled();
  }));

  it('should validate completion requirements', () => {
    component.progress = { movies: 2, books: 2 };
    expect(component.canComplete).toBeFalse();

    component.progress = { movies: 3, books: 2 };
    expect(component.canComplete).toBeFalse();

    component.progress = { movies: 3, books: 3 };
    expect(component.canComplete).toBeTrue();
  });

  it('should handle modal operations', () => {
    component.showAddModal('movie');
    expect(component.modalType).toBe('movie');
    expect(component.showModal).toBeTrue();

    component.handleModalClose();
    expect(component.showModal).toBeFalse();
  });

  it('should handle modal submission', fakeAsync(() => {
    const mockReview = {
      itemId: 1,
      itemType: 'movie' as const,
      rating: 5,
      review: 'Great!'
    };

    component.handleModalSubmit(mockReview);
    tick();

    expect(apiServiceMock.submitReview).toHaveBeenCalledWith(mockReview);
    expect(component.showModal).toBeFalse();
    expect(authServiceMock.getOnboardingStatus).toHaveBeenCalled();
  }));

  it('should handle modal submission error', fakeAsync(() => {
    apiServiceMock.submitReview.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    const mockReview = {
      itemId: 1,
      itemType: 'movie' as const,
      rating: 5,
      review: 'Great!'
    };

    component.handleModalSubmit(mockReview);
    tick();

    expect(console.error).toHaveBeenCalled();
  }));

  it('should complete onboarding', fakeAsync(() => {
    component.progress = { movies: 3, books: 3 };
    const updatedAuthState = {
      ...mockAuthState,
      user: { ...mockAuthState.user, onboardingCompleted: true }
    };

    // Update the auth state after completion
    setTimeout(() => {
      (authServiceMock.authState$ as BehaviorSubject<any>).next(updatedAuthState);
    }, 100);

    component.completeOnboarding();
    tick(100);

    expect(authServiceMock.completeOnboarding).toHaveBeenCalled();
    expect(authServiceMock.checkAuthStatus).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    flush();
  }));

  it('should not complete onboarding if requirements not met', () => {
    component.progress = { movies: 2, books: 2 };
    component.completeOnboarding();

    expect(authServiceMock.completeOnboarding).not.toHaveBeenCalled();
  });

  it('should handle onboarding completion error', fakeAsync(() => {
    component.progress = { movies: 3, books: 3 };
    authServiceMock.completeOnboarding.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.completeOnboarding();
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  }));
});