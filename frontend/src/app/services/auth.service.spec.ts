import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Routes } from '@angular/router';

describe('AuthService Additional Coverage Tests', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  // Define mock routes
  const routes: Routes = [
    { path: 'home', component: {} as any },
    { path: 'login', component: {} as any },
    { path: 'admin', component: {} as any },
    { path: 'welcome', component: {} as any }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes(routes)
      ],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });
    expect(service).toBeTruthy();
  });

  it('should delete account and navigate to login', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    spyOn(router, 'navigate');
    
    service.deleteAccount().subscribe();
    
    const req = httpMock.expectOne('/api/auth/account');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should mark onboarding as complete', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

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
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

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
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

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
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

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
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

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

  it('should not make multiple simultaneous auth checks', fakeAsync(() => {
    // First handle the initial auth check from constructor
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    // Now make multiple auth status checks
    service.checkAuthStatus().subscribe();
    service.checkAuthStatus().subscribe();

    // Only one additional request should be made
    const requests = httpMock.match('/api/auth/user');
    expect(requests.length).toBe(1);
    
    // Flush the pending request
    requests[0].flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });
    
    tick();
  }));

  it('should manage loading state correctly', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    let loadingStates: boolean[] = [];
    
    service.authState$.subscribe(state => {
      loadingStates.push(state.isLoading);
    });

    service.handleCallback('test-code', 'test-state').subscribe();
    
    const req = httpMock.expectOne('/api/auth/callback');
    req.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });
    tick();

    // Should have at least one true and one false state
    expect(loadingStates).toContain(true);
    expect(loadingStates).toContain(false);
  }));

  it('should navigate to admin page for admin users', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    spyOn(router, 'navigate');
    
    const mockResponse = {
      user: {
        displayName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        onboardingCompleted: true,
        isNewUser: false
      }
    };

    service.handleCallback('admin-code', 'test-state').subscribe();

    const req = httpMock.expectOne('/api/auth/callback');
    req.flush(mockResponse);
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  }));

  it('should navigate to welcome page for new users', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    spyOn(router, 'navigate');
    
    const mockResponse = {
      user: {
        displayName: 'New User',
        email: 'new@example.com',
        role: 'user',
        onboardingCompleted: false,
        isNewUser: true
      }
    };

    service.handleCallback('new-code', 'test-state').subscribe();

    const req = httpMock.expectOne('/api/auth/callback');
    req.flush(mockResponse);
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/welcome']);
  }));

  it('should handle logout API failure', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    spyOn(router, 'navigate');
    spyOn(console, 'error');

    service.logout().subscribe();

    const req = httpMock.expectOne('/api/auth/logout');
    req.error(new ErrorEvent('API Error'));
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle account deletion failure', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    spyOn(console, 'error');

    service.deleteAccount().subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/auth/account');
    req.error(new ErrorEvent('API Error'));
    tick();

    expect(console.error).toHaveBeenCalled();
  }));

  it('should handle onboarding completion error', fakeAsync(() => {
    // Handle initial auth check
    const initialReq = httpMock.expectOne('/api/auth/user');
    initialReq.flush({
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        onboardingCompleted: true,
        isNewUser: false
      }
    });

    spyOn(console, 'error');

    service.completeOnboarding().subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/auth/complete-onboarding');
    req.error(new ErrorEvent('API Error'));
    tick();

    expect(console.error).toHaveBeenCalled();
  }));

  describe('Helper methods', () => {
    beforeEach(() => {
      // Handle initial auth check
      const initialReq = httpMock.expectOne('/api/auth/user');
      initialReq.flush({
        user: {
          displayName: 'Test User',
          email: 'test@example.com',
          role: 'user',
          onboardingCompleted: true,
          isNewUser: false
        }
      });
    });

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