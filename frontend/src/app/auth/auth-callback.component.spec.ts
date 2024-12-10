import { ComponentFixture, TestBed, fakeAsync, tick, flush} from '@angular/core/testing';
import { AuthCallbackComponent } from './auth-callback.component';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockAuthCallbackResponse = {
    user: {
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'user',
      onboardingCompleted: true,
      isNewUser: false,
    },
  };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['handleCallback']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ code: 'test-code', state: 'test-state' }) }
        },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    authServiceMock.handleCallback.and.returnValue(of(mockAuthCallbackResponse));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call handleAuthCallback with query params if in browser', fakeAsync(() => {
      authServiceMock.handleCallback.and.returnValue(of(mockAuthCallbackResponse));
      fixture.detectChanges();
      tick();
      expect(authServiceMock.handleCallback).toHaveBeenCalledWith('test-code', 'test-state');
    }));

    it('should navigate to login if code or state is missing', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AuthCallbackComponent],
        providers: [
          { provide: AuthService, useValue: authServiceMock },
          { provide: Router, useValue: routerMock },
          {
            provide: ActivatedRoute,
            useValue: { queryParams: of({}) }
          },
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      fixture = TestBed.createComponent(AuthCallbackComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });

  it('should not call handleAuthCallback if not in browser', fakeAsync(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ code: 'test', state: 'test' }) }
        },
        { provide: PLATFORM_ID, useValue: 'server' } // Force server platform
      ]
    });
    
    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  
    expect(authServiceMock.handleCallback).not.toHaveBeenCalled();
    flush();
  }));
  
  it('should navigate to login if no code/state in browser', fakeAsync(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) }
        }
      ]
    });
  
    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    flush();
  }));
  

  describe('handleAuthCallback', () => {
    it('should navigate to "/welcome" for new users or incomplete onboarding', fakeAsync(() => {
      authServiceMock.handleCallback.and.returnValue(of({
        user: {
          ...mockAuthCallbackResponse.user,
          isNewUser: true,
          onboardingCompleted: false
        }
      }));

      component['handleAuthCallback']('test-code', 'test-state');
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/welcome']);
    }));

    it('should navigate to "/admin" for admin users', fakeAsync(() => {
      authServiceMock.handleCallback.and.returnValue(of({
        user: {
          ...mockAuthCallbackResponse.user,
          role: 'admin'
        }
      }));

      component['handleAuthCallback']('test-code', 'test-state');
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin']);
    }));

    it('should navigate to "/home" for regular users', fakeAsync(() => {
      authServiceMock.handleCallback.and.returnValue(of(mockAuthCallbackResponse));
      
      component['handleAuthCallback']('test-code', 'test-state');
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should navigate to "/login" on error', fakeAsync(() => {
      authServiceMock.handleCallback.and.returnValue(throwError(() => new Error('Auth error')));
      spyOn(console, 'error');

      component['handleAuthCallback']('test-code', 'test-state');
      tick();

      expect(console.error).toHaveBeenCalledWith('Auth callback error:', jasmine.any(Error));
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });

  describe('Platform handling', () => {
    it('should handle server-side rendering', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AuthCallbackComponent],
        providers: [
          { provide: AuthService, useValue: authServiceMock },
          { provide: Router, useValue: routerMock },
          {
            provide: ActivatedRoute,
            useValue: { queryParams: of({ code: 'test-code', state: 'test-state' }) }
          },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      fixture = TestBed.createComponent(AuthCallbackComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(authServiceMock.handleCallback).not.toHaveBeenCalled();
    }));
  });
});