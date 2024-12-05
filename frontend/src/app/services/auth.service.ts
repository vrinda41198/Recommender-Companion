import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap, of, finalize } from 'rxjs';

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  progress: {
    movies: number;
    books: number;
    required: {
      movies: number;
      books: number;
    };
  };
}

export interface AuthCallbackResponse {
  user: User;
}

export interface User {
  displayName: string;
  email: string;
  role: string;
  isNewUser: boolean;
  onboardingCompleted: boolean;
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

  getOnboardingStatus(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(`${this.BASE_URL}/onboarding-status`);
  }

  completeOnboarding(): Observable<any> {
    return this.http.post(`${this.BASE_URL}/complete-onboarding`, {}).pipe(
      tap((response) => {
        const currentState = this.authState.value;
        
        if (currentState.user) {
          const newState = {
            ...currentState,
            user: {
              ...currentState.user,
              onboardingCompleted: true,
              isNewUser: false
            }
          };
          this.updateAuthState(newState);
        }
      }),
      catchError(error => {
        console.error('Error in completeOnboarding:', error);
        throw error;
      })
    );
  }

  handleCallback(code: string, state: string): Observable<AuthCallbackResponse> {
    this.processingCallback = true;
    this.setLoading(true);
    
    return this.http.post<AuthCallbackResponse>(`${this.BASE_URL}/callback`, { code, state }).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        
        // Check onboarding status
        if (response.user.role !== 'admin' && 
            (!response.user.onboardingCompleted || response.user.isNewUser)) {
          this.router.navigate(['/welcome']);
        } else if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
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
        // Return an empty/default response instead of null
        return of({
          user: {
            displayName: '',
            email: '',
            role: '',
            onboardingCompleted: false,
            isNewUser: false
          }
        });
      }),
      finalize(() => {
        this.processingCallback = false;
        this.setLoading(false);
      })
    );
  }

  checkAuthStatus(): Observable<AuthCallbackResponse> {
    if (this.checkingAuth || this.processingCallback) {
      return of({
        user: {
          displayName: '',
          email: '',
          role: '',
          onboardingCompleted: false,
          isNewUser: false
        }
      });
    }

    this.checkingAuth = true;
    this.setLoading(true);

    return this.http.get<AuthCallbackResponse>(`${this.BASE_URL}/user`).pipe(
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
        return of({
          user: {
            displayName: '',
            email: '',
            role: '',
            onboardingCompleted: false,
            isNewUser: false
          }
        });
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

  private handleAuthSuccess(response: AuthCallbackResponse): void {
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

  // Add this method to the AuthService class
  deleteAccount(): Observable<any> {
    this.setLoading(true);
    return this.http.delete(`${this.BASE_URL}/account`).pipe(
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
            console.error('Account deletion error:', error);
            throw error;
        }),
        finalize(() => this.setLoading(false))
    );
  }
}