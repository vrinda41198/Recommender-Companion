import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthCallbackComponent } from './auth-callback.component';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;

  const mockActivatedRoute = {
    queryParams: of({ code: 'test-code', state: 'test-state' }),
  };

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
    // Mock AuthService, Router, and ActivatedRoute
    authServiceMock = jasmine.createSpyObj('AuthService', ['handleCallback']);
    authServiceMock.handleCallback.and.returnValue(of(mockAuthCallbackResponse));

    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    activatedRouteMock = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: of({ code: 'test-code', state: 'test-state' }),
    });

    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: PLATFORM_ID, useValue: 'browser' }, // Mock platform for testing
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call handleAuthCallback with query params if in the browser', () => {
      const handleAuthCallbackSpy = spyOn(
        component as any,
        'handleAuthCallback'
      ).and.callThrough();
      component.ngOnInit();
      expect(handleAuthCallbackSpy).toHaveBeenCalledWith('test-code', 'test-state');
    });
  });

  describe('handleAuthCallback', () => {
    it('should navigate to "/home" for non-admin users', () => {
      component['handleAuthCallback']('test-code', 'test-state');
      expect(authServiceMock.handleCallback).toHaveBeenCalledWith('test-code', 'test-state');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to "/admin" for admin users', () => {
      authServiceMock.handleCallback.and.returnValue(
        of({
          user: {
            displayName: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            onboardingCompleted: true,
            isNewUser: false,
          },
        })
      );
      component['handleAuthCallback']('test-code', 'test-state');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should navigate to "/login" on error', () => {
      authServiceMock.handleCallback.and.returnValue(
        throwError(() => new Error('Callback error'))
      );
      spyOn(console, 'error');
      component['handleAuthCallback']('test-code', 'test-state');
      expect(console.error).toHaveBeenCalledWith('Auth callback error:', jasmine.any(Error));
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

});
