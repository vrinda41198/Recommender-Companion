import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    // Handle initial auth check request
    const authCheckReq = httpMock.expectOne('/api/auth/user');
    authCheckReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should delete account and navigate to login', fakeAsync(() => {
    spyOn(router, 'navigate');
    
    service.deleteAccount().subscribe();
    
    const req = httpMock.expectOne('/api/auth/account');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should mark onboarding as complete', fakeAsync(() => {
    const initialState = {
      isLoggedIn: true,
      isAdmin: false,
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: false,
        isNewUser: true
      },
      isLoading: false
    };

    // Set initial state
    service['authState'].next(initialState);

    service.completeOnboarding().subscribe();

    const req = httpMock.expectOne('/api/auth/complete-onboarding');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
    tick();

    const currentState = service['authState'].value;
    expect(currentState.user?.onboardingCompleted).toBeTrue();
    expect(currentState.user?.isNewUser).toBeFalse();
}));

  it('should handle a successful callback and navigate based on user role', fakeAsync(() => {
    spyOn(router, 'navigate');
    const mockResponse = {
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    };

    service.handleCallback('test-code', 'test-state').subscribe();

    const req = httpMock.expectOne('/api/auth/callback');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'test-code', state: 'test-state' });
    req.flush(mockResponse);
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  }));

  it('should handle a callback error and navigate to login', fakeAsync(() => {
    spyOn(router, 'navigate');
    spyOn(console, 'error');

    service.handleCallback('test-code', 'test-state').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/auth/callback');
    req.error(new ErrorEvent('API Error'));
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(console.error).toHaveBeenCalled();
  }));

  it('should fetch login URL', fakeAsync(() => {
    const mockResponse = { auth_url: 'https://example.com/login' };
    
    service.initiateLogin().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
    tick();
  }));

  it('should clear auth state and navigate to login on logout', fakeAsync(() => {
    spyOn(router, 'navigate');

    service.logout().subscribe();

    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('GET');
    req.flush({});
    tick();

    const state = service['authState'].value;
    expect(state.isLoggedIn).toBeFalse();
    expect(state.isAdmin).toBeFalse();
    expect(state.user).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  describe('Helper methods', () => {
    it('should check if user is authenticated', () => {
      service['authState'].next({
        isLoggedIn: true,
        isAdmin: false,
        user: null,
        isLoading: false
      });
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should check if user is admin', () => {
      service['authState'].next({
        isLoggedIn: true,
        isAdmin: true,
        user: null,
        isLoading: false
      });
      expect(service.isAdmin()).toBeTrue();
    });

    it('should get current user', () => {
      const mockUser = {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      };
      
      service['authState'].next({
        isLoggedIn: true,
        isAdmin: false,
        user: mockUser,
        isLoading: false
      });
      
      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });
});