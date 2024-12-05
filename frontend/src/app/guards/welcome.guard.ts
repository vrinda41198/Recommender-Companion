import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, map, take, skipWhile } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WelcomeGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.authState$.pipe(
      skipWhile(state => state.isLoading),
      take(1),
      map(authState => {
        // Check if user is logged in
        if (!authState.isLoggedIn || !authState.user) {
          this.router.navigate(['/login']);
          return false;
        }
        
        // Check if user is admin
        if (authState.isAdmin) {
          this.router.navigate(['/admin']);
          return false;
        }

        // If onboarding is completed and user is not new, redirect to home
        if (authState.user.onboardingCompleted && !authState.user.isNewUser) {
          this.router.navigate(['/home']);
          return false;
        }

        return true;
      })
    );
  }
}