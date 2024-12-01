import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-md">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700">Processing login...</h2>
          <p class="text-gray-500 mt-2">Please wait while we complete your authentication.</p>
        </div>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe(params => {
        const code = params['code'];
        const state = params['state'];
        
        if (code && state) {
          this.handleAuthCallback(code, state);
        } else {
          this.router.navigate(['/login']);
        }
      });
    }
  }

  private handleAuthCallback(code: string, state: string) {
    this.authService.handleCallback(code, state).subscribe({
      next: (response) => {
        if (response?.user?.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        console.error('Auth callback error:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}