import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { routes } from './app.routes';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginComponent } from './login/login.component';
import { AuthCallbackComponent } from './auth/auth-callback.component';
import { HomepageComponent } from './homepage/homepage.component';
import { AdminComponent } from './admin/admin.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { HomeGuard } from './guards/home.guard';
import { AdminGuard } from './guards/admin.guard';
import { WelcomeGuard } from './guards/welcome.guard';
import { AuthService } from './services/auth.service';
import { BehaviorSubject, of } from 'rxjs';

describe('App Routes', () => {
  let router: Router;
  let location: Location;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let fixture: ComponentFixture<any>;

  // Create a BehaviorSubject to control the auth state
  const authState$ = new BehaviorSubject({
    isLoggedIn: true,
    isAdmin: false,
    user: {
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'user',
      isNewUser: false,
      onboardingCompleted: true
    },
    isLoading: false
  });

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', 
      ['isAuthenticated', 'isAdmin', 'getCurrentUser'], 
      { authState$: authState$.asObservable() }
    );

    // Set default mock returns
    authServiceMock.isAuthenticated.and.returnValue(true);
    authServiceMock.isAdmin.and.returnValue(false);
    authServiceMock.getCurrentUser.and.returnValue(authState$.value.user);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule,
        LoginComponent,
        AuthCallbackComponent,
        HomepageComponent,
        AdminComponent,
        WelcomeComponent
      ],
      providers: [
        HomeGuard,
        AdminGuard,
        WelcomeGuard,
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    await router.initialNavigation();
  });

  it('should redirect to "login" for the root path', fakeAsync(async () => {
    await router.navigate(['']);
    tick();
    expect(location.path()).toBe('/login');
    flush();
  }));

  it('should navigate to LoginComponent for "login" route', fakeAsync(async () => {
    await router.navigate(['/login']);
    tick();
    expect(location.path()).toBe('/login');
    flush();
  }));

  it('should navigate to HomepageComponent for "home" route and activate HomeGuard', fakeAsync(async () => {
    // Update auth state for a regular user
    authState$.next({
      isLoggedIn: true,
      isAdmin: false,
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isNewUser: false,
        onboardingCompleted: true
      },
      isLoading: false
    });
    
    await router.navigate(['/home']);
    tick();
    expect(location.path()).toBe('/home');
    flush();
  }));

  it('should navigate to AdminComponent for "admin" route and activate AdminGuard', fakeAsync(async () => {
    // Update auth state for admin user
    authState$.next({
      isLoggedIn: true,
      isAdmin: true,
      user: {
        displayName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        isNewUser: false,
        onboardingCompleted: true
      },
      isLoading: false
    });
    authServiceMock.isAdmin.and.returnValue(true);
    
    await router.navigate(['/admin']);
    tick();
    expect(location.path()).toBe('/admin');
    flush();
  }));

  it('should navigate to WelcomeComponent for "welcome" route and activate WelcomeGuard', fakeAsync(async () => {
    // Update auth state for new user
    authState$.next({
      isLoggedIn: true,
      isAdmin: false,
      user: {
        displayName: 'New User',
        email: 'new@example.com',
        role: 'user',
        isNewUser: true,
        onboardingCompleted: false
      },
      isLoading: false
    });
    
    await router.navigate(['/welcome']);
    tick();
    expect(location.path()).toBe('/welcome');
    flush();
  }));

  it('should navigate to AuthCallbackComponent for "auth-success" route', fakeAsync(async () => {
    await router.navigate(['/auth-success']);
    tick();
    expect(location.path()).toBe('/auth-success');
    flush();
  }));

  it('should redirect to "login" for an undefined route', fakeAsync(async () => {
    await router.navigate(['/non-existent']);
    tick();
    expect(location.path()).toBe('/login');
    flush();
  }));
});