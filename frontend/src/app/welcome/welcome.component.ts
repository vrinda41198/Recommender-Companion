import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AddItemModalComponent } from '../homepage/add-item-modal.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Review } from '../models';
import { tap } from 'rxjs/operators';
import { switchMap, take } from 'rxjs/operators';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, AddItemModalComponent],
  template: `
    <div class="welcome-container">
      <div class="welcome-content">
        <h1 class="welcome-title">Welcome to Recommendation Companion!</h1>
        
        <!-- Age Input Section -->
        <div class="age-section" *ngIf="!ageSubmitted">
          <p class="welcome-text">Please tell us your age to help us provide better recommendations.</p>
          <div class="age-input-container">
            <input 
              type="number" 
              [(ngModel)]="userAge" 
              min="1" 
              max="120"
              placeholder="Enter your age"
              class="age-input"
            >
            <button 
              class="submit-button" 
              [disabled]="!isValidAge"
              (click)="submitAge()"
            >
              Continue
            </button>
          </div>
        </div>

        <!-- Ratings Section -->
        <div class="ratings-section" *ngIf="ageSubmitted">
          <p class="welcome-text">
            Great! Now please rate at least 3 movies and 3 books you've already watched/read.
            This will help us provide better recommendations for you.
          </p>

          <div class="progress-section">
            <h2 class="section-title">Your Progress</h2>
            
            <div class="progress-cards">
              <div class="progress-card">
                <div class="progress-header">
                  <h3>Movies</h3>
                  <span class="progress-count">{{progress.movies}}/3</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    [style.width]="(progress.movies / 3 * 100) + '%'"
                  ></div>
                </div>
                <button 
                  class="add-button"
                  (click)="showAddModal('movie')"
                  [disabled]="progress.movies >= 3"
                >
                  Add Movie
                </button>
              </div>

              <div class="progress-card">
                <div class="progress-header">
                  <h3>Books</h3>
                  <span class="progress-count">{{progress.books}}/3</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    [style.width]="(progress.books / 3 * 100) + '%'"
                  ></div>
                </div>
                <button 
                  class="add-button"
                  (click)="showAddModal('book')"
                  [disabled]="progress.books >= 3"
                >
                  Add Book
                </button>
              </div>
            </div>
          </div>

          <button 
            class="complete-button"
            [disabled]="!canComplete"
            (click)="completeOnboarding()"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>

      <app-add-item-modal
        *ngIf="showModal"
        [itemType]="modalType"
        (close)="handleModalClose()"
        (submit)="handleModalSubmit($event)"
      ></app-add-item-modal>
    </div>
  `,
  styles: [`
    .welcome-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .welcome-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .welcome-title {
      color: #1a202c;
      font-size: 2rem;
      margin-bottom: 1rem;
      text-align: center;
    }

    .welcome-text {
      color: #4a5568;
      text-align: center;
      margin-bottom: 2rem;
    }

    .age-section {
      text-align: center;
      margin: 2rem 0;
    }

    .age-input-container {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1rem;
    }

    .age-input {
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      width: 120px;
      text-align: center;
      font-size: 1.1rem;
    }

    .submit-button {
      padding: 0.75rem 1.5rem;
      background: #4c51bf;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .submit-button:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }

    .progress-section {
      margin: 2rem 0;
    }

    .section-title {
      color: #2d3748;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .progress-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .progress-card {
      background: #f7fafc;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .progress-count {
      color: #4a5568;
      font-weight: 500;
    }

    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #4c51bf;
      transition: width 0.3s ease;
    }

    .add-button {
      width: 100%;
      padding: 0.75rem;
      background: #4c51bf;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .add-button:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }

    .complete-button {
      width: 100%;
      padding: 1rem;
      background: #48bb78;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 2rem;
    }

    .complete-button:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }
  `]
})
export class WelcomeComponent implements OnInit {
  userAge: number | null = null;
  ageSubmitted = false;
  progress = {
    movies: 0,
    books: 0
  };
  showModal = false;
  modalType: 'movie' | 'book' = 'movie';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchProgress();
  }

  get isValidAge(): boolean {
    return this.userAge != null && this.userAge >= 1 && this.userAge <= 120;
  }

  get canComplete(): boolean {
    return this.progress.movies >= 3 && this.progress.books >= 3;
  }

  submitAge() {
    if (!this.isValidAge) return;

    this.apiService.updateUserAge(this.userAge!).subscribe({
      next: () => {
        this.ageSubmitted = true;
      },
      error: (error) => {
        console.error('Error updating age:', error);
      }
    });
  }

  fetchProgress() {
    this.authService.getOnboardingStatus().subscribe({
      next: (response) => {
        this.progress = {
          movies: response.progress.movies,
          books: response.progress.books
        };
      },
      error: (error) => {
        console.error('Error fetching progress:', error);
      }
    });
  }

  showAddModal(type: 'movie' | 'book') {
    this.modalType = type;
    this.showModal = true;
  }

  handleModalClose() {
    this.showModal = false;
  }

  handleModalSubmit(review: Review) {
    this.apiService.submitReview(review).subscribe({
      next: () => {
        this.showModal = false;
        this.fetchProgress();
      },
      error: (error) => {
        console.error('Error submitting review:', error);
      }
    });
  }

  completeOnboarding() {
    if (!this.canComplete) return;
    
    this.authService.completeOnboarding().pipe(
      // Force a refresh of the auth state
      switchMap(() => this.authService.checkAuthStatus()),
      tap(() => console.log('Auth status checked')),
      // Wait for the state to be updated
      switchMap(() => this.authService.authState$.pipe(
        filter(state => state.user?.onboardingCompleted === true),
        take(1)
      ))
    ).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Error in onboarding completion flow:', error);
      }
    });
  }
}