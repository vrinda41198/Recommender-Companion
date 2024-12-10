import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  const mockAuthUrl = { auth_url: 'https://login.microsoft.com' };

  beforeEach(async () => {
    // Mock AuthService
    authServiceMock = jasmine.createSpyObj('AuthService', ['initiateLogin']);
    authServiceMock.initiateLogin.and.returnValue(of(mockAuthUrl));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' } // Mock platform for testing
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('loginWithMicrosoft', () => {

    it('should log an error if the login fails', () => {
      spyOn(console, 'error');
      authServiceMock.initiateLogin.and.returnValue(throwError(() => new Error('Login failed')));
      component.loginWithMicrosoft();
      expect(authServiceMock.initiateLogin).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Login failed:', jasmine.any(Error));
    });
  });

  describe('UI elements', () => {
    it('should display the app title and description', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.logo h1').textContent).toContain('Recommender Companion');
      expect(compiled.querySelector('.logo p').textContent).toContain('Your Personal Entertainment Guide');
    });

    it('should display a Microsoft login button', () => {
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.microsoft-login-btn');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Sign in with Microsoft');
    });

    it('should call loginWithMicrosoft when the login button is clicked', () => {
      spyOn(component, 'loginWithMicrosoft');
      const button = fixture.nativeElement.querySelector('.microsoft-login-btn');
      button.click();
      expect(component.loginWithMicrosoft).toHaveBeenCalled();
    });
  });
});
