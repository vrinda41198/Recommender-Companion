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
export class AdminGuard implements CanActivate {
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
        if (!authState.isLoggedIn) {
          this.router.navigate(['/login']);
          return false;
        }
        
        // Redirect non-admin users to home page
        if (!authState.isAdmin) {
          this.router.navigate(['/home']);
          return false;
        }

        return true;
      })
    );
  }
}