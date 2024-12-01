import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../services/auth.service';
import { AdminService, Movie, Book } from '../services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <!-- Navigation -->
      <nav class="header">
        <div class="header-content">
          <div class="header-title">
            <h1 class="app-title">Admin Dashboard</h1>
          </div>
          
          <div class="user-section">
            <span class="user-name">
              Welcome, {{user?.displayName}}
            </span>
            <button 
              (click)="navigateToHome()" 
              class="home-button">
              Home
            </button>
            <button 
              (click)="logout()" 
              class="logout-button">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Content Tabs -->
        <div class="content-card">
          <div class="tabs-container">
            <button 
              *ngFor="let tab of ['movies', 'books']"
              (click)="activeTab = tab"
              [class]="'tab-button ' + (activeTab === tab ? 'active' : '')">
              {{tab | titlecase}}
            </button>
          </div>

          <!-- Movie Form -->
          <div *ngIf="activeTab === 'movies'" class="form-container">
            <form [formGroup]="movieForm" (ngSubmit)="onMovieSubmit()" class="form">
              <div class="form-group">
                <label>Title</label>
                <input
                  type="text"
                  formControlName="title"
                  [class.error]="movieForm.get('title')?.invalid && movieForm.get('title')?.touched"
                >
                <div *ngIf="movieForm.get('title')?.invalid && movieForm.get('title')?.touched" 
                     class="error-message">
                  Title is required
                </div>
              </div>

              <div class="form-group">
                <label>Cast (comma separated)</label>
                <input
                  type="text"
                  formControlName="cast"
                  [class.error]="movieForm.get('cast')?.invalid && movieForm.get('cast')?.touched"
                >
                <div *ngIf="movieForm.get('cast')?.invalid && movieForm.get('cast')?.touched" 
                     class="error-message">
                  Cast is required
                </div>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea
                  formControlName="description"
                  rows="3"
                  [class.error]="movieForm.get('description')?.invalid && movieForm.get('description')?.touched"
                ></textarea>
                <div *ngIf="movieForm.get('description')?.invalid && movieForm.get('description')?.touched" 
                     class="error-message">
                  Description is required
                </div>
              </div>

              <div class="form-group">
                <label>Release Year</label>
                <input
                  type="number"
                  formControlName="release_year"
                  [class.error]="movieForm.get('release_year')?.invalid && movieForm.get('release_year')?.touched"
                >
                <div *ngIf="movieForm.get('release_year')?.invalid && movieForm.get('release_year')?.touched" 
                     class="error-message">
                  Valid release year is required
                </div>
              </div>

              <div class="form-group">
                <label>Genre</label>
                <select
                  formControlName="genre"
                  [class.error]="movieForm.get('genre')?.invalid && movieForm.get('genre')?.touched"
                >
                  <option value="">Select Genre</option>
                  <option value="Action">Action</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Drama">Drama</option>
                  <option value="Horror">Horror</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Thriller">Thriller</option>
                </select>
                <div *ngIf="movieForm.get('genre')?.invalid && movieForm.get('genre')?.touched" 
                     class="error-message">
                  Genre is required
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="submit"
                  [disabled]="movieForm.invalid || isSubmitting"
                  class="submit-button">
                  {{ isSubmitting ? 'Adding...' : 'Add Movie' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Book Form -->
          <div *ngIf="activeTab === 'books'" class="form-container">
            <form [formGroup]="bookForm" (ngSubmit)="onBookSubmit()" class="form">
              <div class="form-group">
                <label>Title</label>
                <input
                  type="text"
                  formControlName="title"
                  [class.error]="bookForm.get('title')?.invalid && bookForm.get('title')?.touched"
                >
                <div *ngIf="bookForm.get('title')?.invalid && bookForm.get('title')?.touched" 
                     class="error-message">
                  Title is required
                </div>
              </div>

              <div class="form-group">
                <label>Author</label>
                <input
                  type="text"
                  formControlName="author"
                  [class.error]="bookForm.get('author')?.invalid && bookForm.get('author')?.touched"
                >
                <div *ngIf="bookForm.get('author')?.invalid && bookForm.get('author')?.touched" 
                     class="error-message">
                  Author is required
                </div>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea
                  formControlName="description"
                  rows="3"
                  [class.error]="bookForm.get('description')?.invalid && bookForm.get('description')?.touched"
                ></textarea>
                <div *ngIf="bookForm.get('description')?.invalid && bookForm.get('description')?.touched" 
                     class="error-message">
                  Description is required
                </div>
              </div>

              <div class="form-group">
                <label>Publish Year</label>
                <input
                  type="number"
                  formControlName="publish_year"
                  [class.error]="bookForm.get('publish_year')?.invalid && bookForm.get('publish_year')?.touched"
                >
                <div *ngIf="bookForm.get('publish_year')?.invalid && bookForm.get('publish_year')?.touched" 
                     class="error-message">
                  Valid publish year is required
                </div>
              </div>

              <div class="form-group">
                <label>Genre</label>
                <select
                  formControlName="genre"
                  [class.error]="bookForm.get('genre')?.invalid && bookForm.get('genre')?.touched"
                >
                  <option value="">Select Genre</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Biography">Biography</option>
                </select>
                <div *ngIf="bookForm.get('genre')?.invalid && bookForm.get('genre')?.touched" 
                     class="error-message">
                  Genre is required
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="submit"
                  [disabled]="bookForm.invalid || isSubmitting"
                  class="submit-button">
                  {{ isSubmitting ? 'Adding...' : 'Add Book' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div *ngIf="submitMessage" 
             [class]="'message-box ' + (submitSuccess ? 'success' : 'error')">
          <p class="message-text">{{submitMessage}}</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .header {
      background-color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1rem 0;
      position: fixed;
      width: 100%;
      top: 0;
      z-index: 50;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .app-title {
      font-size: 1.5rem;
      color: #333;
      margin: 0;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-name {
      color: #666;
      font-weight: 500;
    }

    .home-button {
      background-color: #2563eb;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .home-button:hover {
      background-color: #1d4ed8;
    }

    .logout-button {
      background-color: #dc2626;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .logout-button:hover {
      background-color: #b91c1c;
    }

    .main-content {
      max-width: 1200px;
      margin: 4rem auto 2rem;
      padding: 0 1rem;
    }

    .content-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-top: 1rem;
    }

    .tabs-container {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }

    .tab-button {
      padding: 0.5rem 1rem;
      border: none;
      background: none;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      margin-right: 1rem;
      border-bottom: 2px solid transparent;
    }

    .tab-button.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }

    .form-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }

    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
      border-color: #dc2626;
    }

    .error-message {
      color: #dc2626;
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .submit-button {
      background-color: #2563eb;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    }

    .submit-button:hover {
      background-color: #1d4ed8;
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .message-box {
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .message-box.success {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
    }

    .message-box.error {
      background-color: #fef2f2;
      border: 1px solid #fca5a5;
    }

    .message-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .message-box.success .message-text {
      color: #166534;
    }

    .message-box.error .message-text {
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .user-section {
        flex-direction: column;
      }

      .form-actions {
        justify-content: stretch;
      }

      .submit-button {
        width: 100%;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  user: User | null;
  movieForm: FormGroup;
  bookForm: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;
  activeTab = 'movies';

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.user = this.authService.getCurrentUser();
    
    // Initialize Movie Form
    this.movieForm = this.fb.group({
      title: ['', Validators.required],
      cast: ['', Validators.required],
      description: ['', Validators.required],
      release_year: ['', [
        Validators.required, 
        Validators.min(1888), 
        Validators.max(new Date().getFullYear() + 5)
      ]],
      genre: ['', Validators.required]
    });

    // Initialize Book Form
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      description: ['', Validators.required],
      publish_year: ['', [
        Validators.required, 
        Validators.min(1000), 
        Validators.max(new Date().getFullYear() + 5)
      ]],
      genre: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Check admin status and redirect if not admin
    this.authService.authState$.subscribe(state => {
      if (!state.isAdmin) {
        this.router.navigate(['/home']);
      }
      this.user = state.user;
    });
  }

  onMovieSubmit() {
    if (this.movieForm.valid) {
      this.isSubmitting = true;
      this.clearMessage();

      const formValue = this.movieForm.value;
      const movie: Movie = {
        ...formValue,
        cast: formValue.cast.split(',').map((name: string) => name.trim())
          .filter((name: string) => name)
      };

      this.adminService.addMovie(movie).subscribe({
        next: () => {
          this.showSuccess('Movie added successfully!');
          this.movieForm.reset();
        },
        error: (error) => {
          console.error('Error adding movie:', error);
          this.showError('Failed to add movie');
        }
      });
    } else {
      this.markFormAsTouched(this.movieForm);
    }
  }

  onBookSubmit() {
    if (this.bookForm.valid) {
      this.isSubmitting = true;
      this.clearMessage();

      const book: Book = this.bookForm.value;

      this.adminService.addBook(book).subscribe({
        next: () => {
          this.showSuccess('Book added successfully!');
          this.bookForm.reset();
        },
        error: (error) => {
          console.error('Error adding book:', error);
          this.showError('Failed to add book');
        }
      });
    } else {
      this.markFormAsTouched(this.bookForm);
    }
  }

  markFormAsTouched(form: FormGroup) {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  showSuccess(message: string) {
    this.isSubmitting = false;
    this.submitSuccess = true;
    this.submitMessage = message;
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      this.clearMessage();
    }, 3000);
  }

  showError(message: string) {
    this.isSubmitting = false;
    this.submitSuccess = false;
    this.submitMessage = message;
    
    // Clear error message after 5 seconds
    setTimeout(() => {
      this.clearMessage();
    }, 5000);
  }

  clearMessage() {
    this.submitMessage = '';
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}