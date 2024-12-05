import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <h1 style="color: white;">Recommender Companion</h1>
          <p style="color: white;">Your Personal Entertainment Guide</p>
        </div>
        <button class="microsoft-login-btn" (click)="loginWithMicrosoft()">
          <svg class="ms-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
            <path fill="#f35325" d="M0 0h11v11H0z"/>
            <path fill="#81bc06" d="M12 0h11v11H12z"/>
            <path fill="#05a6f0" d="M0 12h11v11H0z"/>
            <path fill="#ffba08" d="M12 12h11v11H12z"/>
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
    
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image: url('../../assets/login-background.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .login-card {
      background: rgba(0, 0, 0, 0.9);
      padding: 3rem;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      min-width: 320px;
    }

    .logo {
      margin-bottom: 2rem;
    }

    .logo h1 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }

    .logo p {
      color: #666;
      font-size: 1rem;
    }

    .microsoft-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background: white;
      color: #333;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .microsoft-login-btn:hover {
      background-color: #f5f5f5;
    }

    .ms-logo {
      width: 24px;
      height: 24px;
    }
  `]
})
export class LoginComponent {
  private platformId = inject(PLATFORM_ID);
  
  constructor(private authService: AuthService) {}

  loginWithMicrosoft() {
    this.authService.initiateLogin().subscribe({
      next: (response) => {
        if (isPlatformBrowser(this.platformId)) {
          location.href = response.auth_url;
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
      }
    });
  }
}