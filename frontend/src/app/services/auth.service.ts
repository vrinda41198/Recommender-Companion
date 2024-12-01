import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap, of, finalize } from 'rxjs';

export interface User {
  displayName: string;
  email: string;
  role: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly BASE_URL = '/api/auth';
  private checkingAuth = false;
  private processingCallback = false;
  
  private authState = new BehaviorSubject<AuthState>({
    isLoggedIn: false,
    isAdmin: false,
    user: null,
    isLoading: true // Start with loading true
  });

  authState$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Only check auth status if we're not on the callback page
    if (!window.location.pathname.includes('auth-success')) {
      this.checkAuthStatus().subscribe();
    } else {
      this.processingCallback = true;
    }
  }

  initiateLogin(): Observable<{auth_url: string}> {
    return this.http.get<{auth_url: string}>(`${this.BASE_URL}/login`);
  }

  handleCallback(code: string, state: string): Observable<any> {
    this.processingCallback = true;
    this.setLoading(true);
    
    return this.http.post(`${this.BASE_URL}/callback`, { code, state }).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        console.error('Auth callback error:', error);
        this.updateAuthState({
          isLoggedIn: false,
          isAdmin: false,
          user: null,
          isLoading: false
        });
        this.router.navigate(['/login']);
        return of(null);
      }),
      finalize(() => {
        this.processingCallback = false;
        this.setLoading(false);
      })
    );
  }

  checkAuthStatus(): Observable<any> {
    if (this.checkingAuth || this.processingCallback) {
      return of(null);
    }

    this.checkingAuth = true;
    this.setLoading(true);

    return this.http.get<{user: User}>(`${this.BASE_URL}/user`).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(() => {
        // Only navigate to login if we're not processing a callback
        if (!this.processingCallback) {
          this.updateAuthState({
            isLoggedIn: false,
            isAdmin: false,
            user: null,
            isLoading: false
          });
          this.router.navigate(['/login']);
        }
        return of(null);
      }),
      finalize(() => {
        this.checkingAuth = false;
        this.setLoading(false);
      })
    );
  }

  logout(): Observable<any> {
    this.setLoading(true);
    return this.http.get(`${this.BASE_URL}/logout`).pipe(
      tap(() => {
        this.updateAuthState({
          isLoggedIn: false,
          isAdmin: false,
          user: null,
          isLoading: false
        });
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        console.error('Logout error:', error);
        // Even if the API call fails, we still want to clear the local state
        this.updateAuthState({
          isLoggedIn: false,
          isAdmin: false,
          user: null,
          isLoading: false
        });
        this.router.navigate(['/login']);
        return of(null);
      }),
      finalize(() => this.setLoading(false))
    );
  }

  private handleAuthSuccess(response: any): void {
    if (response?.user) {
      this.updateAuthState({
        isLoggedIn: true,
        isAdmin: response.user.role === 'admin',
        user: response.user,
        isLoading: false
      });
    }
  }

  private updateAuthState(state: AuthState): void {
    this.authState.next(state);
  }

  private setLoading(isLoading: boolean): void {
    const currentState = this.authState.value;
    this.updateAuthState({ ...currentState, isLoading });
  }

  isAuthenticated(): boolean {
    return this.authState.value.isLoggedIn;
  }

  isAdmin(): boolean {
    return this.authState.value.isAdmin;
  }

  getCurrentUser(): User | null {
    return this.authState.value.user;
  }
}