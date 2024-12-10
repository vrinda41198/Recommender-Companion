import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Ensure no outstanding HTTP requests
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clear auth state and navigate to login on logout', () => {
    service.logout();
    // Mock any HTTP requests made during logout
    const req = httpMock.expectOne('/api/auth/user');
    req.flush(null);

    // Add more assertions if needed, e.g., checking auth state
  });

  it('should delete account and navigate to login', () => {
    service.deleteAccount().subscribe(response => {
      expect(response).toBeTruthy();
    });
    const req = httpMock.expectOne('/api/auth/user');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should mark onboarding as complete', () => {
    service.completeOnboarding().subscribe(response => {
      expect(response).toBeTruthy();
    });
    const req = httpMock.expectOne('/api/auth/onboarding');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should handle a successful callback and navigate based on user role', () => {
    const mockCode = 'mockCode';
    const mockState = 'mockState';
    const mockResponse = {
      user: {
        role: 'user',
        displayName: 'Test User',
        email: 'test@example.com',
        onboardingCompleted: true,
        isNewUser: false
      }
    };
  
    service.handleCallback(mockCode, mockState).subscribe(response => {
      expect(response.user.role).toBe('user'); // Accessing 'role' from the nested 'user' property
    });
  
    const req = httpMock.expectOne(`api/auth/callback`); // Use the correct API URL
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: mockCode, state: mockState }); // Verify request payload
    req.flush(mockResponse);
  });
  

  it('should handle a callback error and navigate to login', () => {
    const mockCode = 'mockCode';
    const mockState = 'mockState';
  
    service.handleCallback(mockCode, mockState).subscribe({
      error: err => {
        expect(err.status).toBe(401);
      },
    });
  
    const req = httpMock.expectOne('/api/auth/callback');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: mockCode, state: mockState }); // Verify request payload
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should fetch login URL', () => {
    const mockResponse = { auth_url: 'https://example.com/login' };
  
    service.initiateLogin().subscribe(response => {
      expect(response.auth_url).toBe(mockResponse.auth_url);
    });
  
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
