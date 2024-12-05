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
                <label>TMDB ID</label>
                <input
                  type="number"
                  formControlName="id"
                  [class.error]="movieForm.get('id')?.invalid && movieForm.get('id')?.touched"
                >
                <div *ngIf="movieForm.get('id')?.invalid && movieForm.get('id')?.touched" 
                    class="error-message">
                  Valid TMDB ID is required
                </div>
              </div>
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
                <label>Director</label>
                <input
                  type="text"
                  formControlName="director"
                  [class.error]="movieForm.get('director')?.invalid && movieForm.get('director')?.touched"
                >
                <div *ngIf="movieForm.get('director')?.invalid && movieForm.get('director')?.touched" 
                     class="error-message">
                  Director is required
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
                <label>Release Date</label>
                <input
                  type="date"
                  formControlName="release_date"
                  [class.error]="movieForm.get('release_date')?.invalid && movieForm.get('release_date')?.touched"
                >
                <div *ngIf="movieForm.get('release_date')?.invalid && movieForm.get('release_date')?.touched" 
                     class="error-message">
                  Valid release date is required
                </div>
              </div>

              <div class="form-group">
                <label>Original Language (2-letter code)</label>
                <input
                  type="text"
                  formControlName="original_language"
                  maxlength="2"
                  [class.error]="movieForm.get('original_language')?.invalid && movieForm.get('original_language')?.touched"
                >
                <div *ngIf="movieForm.get('original_language')?.invalid && movieForm.get('original_language')?.touched" 
                     class="error-message">
                  Valid 2-letter language code is required
                </div>
              </div>

              <div class="form-group">
                <label>Genres (comma separated)</label>
                <input
                  type="text"
                  formControlName="genres"
                  [class.error]="movieForm.get('genres')?.invalid && movieForm.get('genres')?.touched"
                >
                <div *ngIf="movieForm.get('genres')?.invalid && movieForm.get('genres')?.touched" 
                     class="error-message">
                  At least one genre is required
                </div>
              </div>

              <div class="form-group">
                <label>Poster Path (optional)</label>
                <input
                  type="text"
                  formControlName="poster_path"
                >
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
                <label>ISBN</label>
                <input
                  type="number"
                  formControlName="isbn"
                  [class.error]="bookForm.get('isbn')?.invalid && bookForm.get('isbn')?.touched"
                >
                <div *ngIf="bookForm.get('isbn')?.invalid && bookForm.get('isbn')?.touched" 
                     class="error-message">
                  Valid ISBN is required
                </div>
              </div>

              <div class="form-group">
                <label>Book Title</label>
                <input
                  type="text"
                  formControlName="book_title"
                  [class.error]="bookForm.get('book_title')?.invalid && bookForm.get('book_title')?.touched"
                >
                <div *ngIf="bookForm.get('book_title')?.invalid && bookForm.get('book_title')?.touched" 
                     class="error-message">
                  Book title is required
                </div>
              </div>

              <div class="form-group">
                <label>Author</label>
                <input
                  type="text"
                  formControlName="book_author"
                  [class.error]="bookForm.get('book_author')?.invalid && bookForm.get('book_author')?.touched"
                >
                <div *ngIf="bookForm.get('book_author')?.invalid && bookForm.get('book_author')?.touched" 
                     class="error-message">
                  Author is required
                </div>
              </div>

              <div class="form-group">
                <label>Year of Publication</label>
                <input
                  type="number"
                  formControlName="year_of_publication"
                  [class.error]="bookForm.get('year_of_publication')?.invalid && bookForm.get('year_of_publication')?.touched"
                >
                <div *ngIf="bookForm.get('year_of_publication')?.invalid && bookForm.get('year_of_publication')?.touched" 
                     class="error-message">
                  Valid publication year is required
                </div>
              </div>

              <div class="form-group">
                <label>Image URL (optional)</label>
                <input
                  type="text"
                  formControlName="image_url_s"
                >
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
      id: ['', [Validators.required, Validators.min(1)]],  // Add TMDB ID field
      title: ['', Validators.required],
      director: ['', Validators.required],
      cast: ['', Validators.required],
      release_date: ['', Validators.required],
      original_language: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
      genres: ['', Validators.required],
      poster_path: ['']
    });

    // Initialize Book Form
    this.bookForm = this.fb.group({
      isbn: ['', [Validators.required, Validators.min(1000000000)]],
      book_title: ['', Validators.required],
      book_author: ['', Validators.required],
      year_of_publication: ['', [
        Validators.required, 
        Validators.min(1000), 
        Validators.max(new Date().getFullYear() + 1)
      ]],
      image_url_s: ['']
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
    if (this.movieForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.clearMessage();

      const formValue = this.movieForm.value;
      const movie: Movie = {
        id: formValue.id,
        title: formValue.title,
        director: formValue.director,
        cast: formValue.cast, // Backend will handle string
        release_date: formValue.release_date,
        original_language: formValue.original_language,
        genres: formValue.genres, // Backend will handle string
        poster_path: formValue.poster_path || null
      };

      this.adminService.addMovie(movie).subscribe({
        next: () => {
          this.showSuccess('Movie added successfully!');
          this.movieForm.reset();
        },
        error: (error) => {
          console.error('Error adding movie:', error);
          this.showError(error.error?.message || 'Failed to add movie');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormAsTouched(this.movieForm);
    }
  }

  onBookSubmit() {
    if (this.bookForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.clearMessage();

      const formValue = this.bookForm.value;
      const book: Book = {
        isbn: Number(formValue.isbn),
        book_title: formValue.book_title,
        book_author: formValue.book_author,
        year_of_publication: formValue.year_of_publication,
        image_url_s: formValue.image_url_s || null
      };

      this.adminService.addBook(book).subscribe({
        next: () => {
          this.showSuccess('Book added successfully!');
          this.bookForm.reset();
        },
        error: (error) => {
          console.error('Error adding book:', error);
          this.showError(error.error?.message || 'Failed to add book');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormAsTouched(this.bookForm);
    }
  }

  markFormAsTouched(form: FormGroup) {
    Object.values(form.controls).forEach(control => {
      if (control.invalid) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          this.markFormAsTouched(control);
        }
      }
    });
  }

  showSuccess(message: string) {
    this.isSubmitting = false;
    this.submitSuccess = true;
    this.submitMessage = message;
    
    setTimeout(() => this.clearMessage(), 3000);
  }

  showError(message: string) {
    this.isSubmitting = false;
    this.submitSuccess = false;
    this.submitMessage = message;
    
    setTimeout(() => this.clearMessage(), 5000);
  }

  clearMessage() {
    this.submitMessage = '';
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}