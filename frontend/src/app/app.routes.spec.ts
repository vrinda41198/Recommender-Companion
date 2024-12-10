import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, Routes } from '@angular/router';
import { Location } from '@angular/common';
import { routes } from './app.routes';
import { LoginComponent } from './login/login.component';
import { AuthCallbackComponent } from './auth/auth-callback.component';
import { HomepageComponent } from './homepage/homepage.component';
import { AdminComponent } from './admin/admin.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { HomeGuard } from './guards/home.guard';
import { AdminGuard } from './guards/admin.guard';
import { WelcomeGuard } from './guards/welcome.guard';
import { of } from 'rxjs';

describe('App Routes', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes)],
      declarations: [
        LoginComponent,
        AuthCallbackComponent,
        HomepageComponent,
        AdminComponent,
        WelcomeComponent,
      ],
      providers: [HomeGuard, AdminGuard, WelcomeGuard],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    router.initialNavigation();
  });

  it('should navigate to LoginComponent for "login" route', async () => {
    await router.navigate(['login']);
    expect(location.path()).toBe('/login');
  });

  it('should navigate to AuthCallbackComponent for "auth-success" route', async () => {
    await router.navigate(['auth-success']);
    expect(location.path()).toBe('/auth-success');
  });

  it('should navigate to WelcomeComponent for "welcome" route and activate WelcomeGuard', async () => {
    const guard = TestBed.inject(WelcomeGuard);
    spyOn(guard, 'canActivate').and.returnValue(of(true)); // Return Observable<boolean>

    await router.navigate(['welcome']);
    expect(location.path()).toBe('/welcome');
    expect(guard.canActivate).toHaveBeenCalled();
  });

  it('should navigate to HomepageComponent for "home" route and activate HomeGuard', async () => {
    const guard = TestBed.inject(HomeGuard);
    spyOn(guard, 'canActivate').and.returnValue(of(true)); // Return Observable<boolean>

    await router.navigate(['home']);
    expect(location.path()).toBe('/home');
    expect(guard.canActivate).toHaveBeenCalled();
  });

  it('should navigate to AdminComponent for "admin" route and activate AdminGuard', async () => {
    const guard = TestBed.inject(AdminGuard);
    spyOn(guard, 'canActivate').and.returnValue(of(true)); // Return Observable<boolean>

    await router.navigate(['admin']);
    expect(location.path()).toBe('/admin');
    expect(guard.canActivate).toHaveBeenCalled();
  });

  it('should redirect to "login" for the root path', async () => {
    await router.navigate(['']);
    expect(location.path()).toBe('/login');
  });

  it('should redirect to "login" for an undefined route', async () => {
    await router.navigate(['undefined-route']);
    expect(location.path()).toBe('/login');
  });
});
