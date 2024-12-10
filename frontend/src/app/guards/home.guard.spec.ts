import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeGuard } from './home.guard';
import { AuthService } from '../services/auth.service';
import { of, BehaviorSubject } from 'rxjs';

describe('HomeGuard', () => {
  let guard: HomeGuard;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let authState$: BehaviorSubject<any>;

  beforeEach(() => {
    // Mock AuthService and Router
    authState$ = new BehaviorSubject({
      isLoggedIn: false,
      isAdmin: false,
      isLoading: true, // Initial loading state
      user: null,
    });

    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      authState$: authState$.asObservable(),
    });

    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        HomeGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    guard = TestBed.inject(HomeGuard);
  });

  it('should create the guard', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should navigate to "/login" if the user is not logged in', (done) => {
      authState$.next({
        isLoggedIn: false,
        isAdmin: false,
        isLoading: false,
        user: null,
      });

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
        expect(result).toBeFalse();
        done();
      });
    });

    it('should navigate to "/admin" if the user is an admin', (done) => {
      authState$.next({
        isLoggedIn: true,
        isAdmin: true,
        isLoading: false,
        user: {
          displayName: 'Admin User',
          email: 'admin@example.com',
          onboardingCompleted: true,
          isNewUser: false,
        },
      });

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).toHaveBeenCalledWith(['/admin']);
        expect(result).toBeFalse();
        done();
      });
    });

    it('should navigate to "/welcome" if onboarding is not completed', (done) => {
      authState$.next({
        isLoggedIn: true,
        isAdmin: false,
        isLoading: false,
        user: {
          displayName: 'Regular User',
          email: 'user@example.com',
          onboardingCompleted: false,
          isNewUser: false,
        },
      });

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).toHaveBeenCalledWith(['/welcome']);
        expect(result).toBeFalse();
        done();
      });
    });

    it('should navigate to "/welcome" if the user is new', (done) => {
      authState$.next({
        isLoggedIn: true,
        isAdmin: false,
        isLoading: false,
        user: {
          displayName: 'New User',
          email: 'newuser@example.com',
          onboardingCompleted: true,
          isNewUser: true,
        },
      });

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).toHaveBeenCalledWith(['/welcome']);
        expect(result).toBeFalse();
        done();
      });
    });

    it('should allow access for a regular user with completed onboarding', (done) => {
      authState$.next({
        isLoggedIn: true,
        isAdmin: false,
        isLoading: false,
        user: {
          displayName: 'Regular User',
          email: 'user@example.com',
          onboardingCompleted: true,
          isNewUser: false,
        },
      });

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).not.toHaveBeenCalled();
        expect(result).toBeTrue();
        done();
      });
    });

    it('should skip emitting until loading is complete', (done) => {
      authState$.next({
        isLoggedIn: true,
        isAdmin: false,
        isLoading: true,
        user: {
          displayName: 'Loading User',
          email: 'loadinguser@example.com',
          onboardingCompleted: true,
          isNewUser: false,
        },
      });

      // Delay emitting the final state
      setTimeout(() => {
        authState$.next({
          isLoggedIn: true,
          isAdmin: false,
          isLoading: false,
          user: {
            displayName: 'Regular User',
            email: 'user@example.com',
            onboardingCompleted: true,
            isNewUser: false,
          },
        });
      }, 50);

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).not.toHaveBeenCalled();
        expect(result).toBeTrue();
        done();
      });
    });
  });
});
