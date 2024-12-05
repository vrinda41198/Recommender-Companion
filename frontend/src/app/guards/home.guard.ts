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
export class HomeGuard implements CanActivate {
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

        // Check if onboarding is not completed or if user is new
        if (!authState.user.onboardingCompleted || authState.user.isNewUser) {
          this.router.navigate(['/welcome']);
          return false;
        }

        return true;
      })
    );
  }
}