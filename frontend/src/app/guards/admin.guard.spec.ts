import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { of, BehaviorSubject } from 'rxjs';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let authState$: BehaviorSubject<any>;

  beforeEach(() => {
    // Mock AuthService and Router
    authState$ = new BehaviorSubject({
      isLoggedIn: false,
      isAdmin: false,
      isLoading: true, // Initial loading state
    });

    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      authState$: authState$.asObservable(),
    });

    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    guard = TestBed.inject(AdminGuard);
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
      });

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
        expect(result).toBeFalse();
        done();
      });
    });

    it('should navigate to "/home" if the user is logged in but not an admin', (done) => {
      authState$.next({
        isLoggedIn: true,
        isAdmin: false,
        isLoading: false,
      });

      guard.canActivate(null as any, null as any).subscribe((result) => {
        expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
        expect(result).toBeFalse();
        done();
      });
    });

    it('should allow access if the user is an admin', (done) => {
      authState$.next({
        isLoggedIn: true,
        isAdmin: true,
        isLoading: false,
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
        isAdmin: true,
        isLoading: true,
      });

      // Delay emitting the final state
      setTimeout(() => {
        authState$.next({
          isLoggedIn: true,
          isAdmin: true,
          isLoading: false,
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
