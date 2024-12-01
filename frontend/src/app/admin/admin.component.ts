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
    <div class="min-h-screen bg-gray-100">
      <!-- Navigation -->
      <nav class="bg-white shadow-lg fixed w-full top-0 z-50">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-blue-600">Admin Dashboard</h1>
            </div>
            
            <div class="flex items-center space-x-4">
              <span class="text-gray-600">
                Welcome, {{user?.displayName}}
              </span>
              <button 
                (click)="navigateToHome()" 
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
                Home
              </button>
              <button 
                (click)="logout()" 
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="pt-20 max-w-7xl mx-auto px-4">
        <!-- Content Tabs -->
        <div class="bg-white rounded-xl shadow-md p-6 mb-8">
          <div class="flex border-b">
            <button 
              *ngFor="let tab of ['movies', 'books']"
              (click)="activeTab = tab"
              [class.border-blue-500]="activeTab === tab"
              [class.border-transparent]="activeTab !== tab"
              class="py-2 px-4 -mb-px border-b-2 text-sm font-medium transition duration-200"
              [class.text-blue-600]="activeTab === tab"
              [class.text-gray-500]="activeTab !== tab">
              {{tab | titlecase}}
            </button>
          </div>

          <!-- Movie Form -->
          <div *ngIf="activeTab === 'movies'" class="mt-6">
            <form [formGroup]="movieForm" (ngSubmit)="onMovieSubmit()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  formControlName="title"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="movieForm.get('title')?.invalid && movieForm.get('title')?.touched"
                >
                <div *ngIf="movieForm.get('title')?.invalid && movieForm.get('title')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Title is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Cast (comma separated)</label>
                <input
                  type="text"
                  formControlName="cast"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="movieForm.get('cast')?.invalid && movieForm.get('cast')?.touched"
                >
                <div *ngIf="movieForm.get('cast')?.invalid && movieForm.get('cast')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Cast is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  formControlName="description"
                  rows="3"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="movieForm.get('description')?.invalid && movieForm.get('description')?.touched"
                ></textarea>
                <div *ngIf="movieForm.get('description')?.invalid && movieForm.get('description')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Description is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Release Year</label>
                <input
                  type="number"
                  formControlName="release_year"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="movieForm.get('release_year')?.invalid && movieForm.get('release_year')?.touched"
                >
                <div *ngIf="movieForm.get('release_year')?.invalid && movieForm.get('release_year')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Valid release year is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Genre</label>
                <select
                  formControlName="genre"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="movieForm.get('genre')?.invalid && movieForm.get('genre')?.touched"
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
                     class="text-red-500 text-sm mt-1">
                  Genre is required
                </div>
              </div>

              <div class="flex justify-end">
                <button 
                  type="submit"
                  [disabled]="movieForm.invalid || isSubmitting"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Adding...' : 'Add Movie' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Book Form -->
          <div *ngIf="activeTab === 'books'" class="mt-6">
            <form [formGroup]="bookForm" (ngSubmit)="onBookSubmit()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  formControlName="title"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="bookForm.get('title')?.invalid && bookForm.get('title')?.touched"
                >
                <div *ngIf="bookForm.get('title')?.invalid && bookForm.get('title')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Title is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Author</label>
                <input
                  type="text"
                  formControlName="author"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="bookForm.get('author')?.invalid && bookForm.get('author')?.touched"
                >
                <div *ngIf="bookForm.get('author')?.invalid && bookForm.get('author')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Author is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  formControlName="description"
                  rows="3"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="bookForm.get('description')?.invalid && bookForm.get('description')?.touched"
                ></textarea>
                <div *ngIf="bookForm.get('description')?.invalid && bookForm.get('description')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Description is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Publish Year</label>
                <input
                  type="number"
                  formControlName="publish_year"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="bookForm.get('publish_year')?.invalid && bookForm.get('publish_year')?.touched"
                >
                <div *ngIf="bookForm.get('publish_year')?.invalid && bookForm.get('publish_year')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  Valid publish year is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Genre</label>
                <select
                  formControlName="genre"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  [class.border-red-500]="bookForm.get('genre')?.invalid && bookForm.get('genre')?.touched"
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
                     class="text-red-500 text-sm mt-1">
                  Genre is required
                </div>
              </div>

              <div class="flex justify-end">
                <button 
                  type="submit"
                  [disabled]="bookForm.invalid || isSubmitting"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Adding...' : 'Add Book' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div *ngIf="submitMessage" 
             [class.bg-green-50]="submitSuccess"
             [class.bg-red-50]="!submitSuccess"
             class="p-4 rounded-lg mb-8">
          <p [class.text-green-700]="submitSuccess"
             [class.text-red-700]="!submitSuccess"
             class="text-sm font-medium">
            {{submitMessage}}
          </p>
        </div>

        <!-- Recent Items -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Recently Added {{activeTab | titlecase}}
          </h2>
          
          <!-- Movies Table -->
          <div *ngIf="activeTab === 'movies'" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cast</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let movie of recentMovies">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{movie.title}}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{movie.cast.join(', ')}}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{movie.release_year}}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{movie.genre}}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Books Table -->
          <div *ngIf="activeTab === 'books'" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th class="px-6<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let book of recentBooks">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{book.title}}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{book.author}}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{book.publish_year}}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{book.genre}}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  user: User | null;
  movieForm: FormGroup;
  bookForm: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;
  activeTab = 'movies';
  recentMovies: Movie[] = [];
  recentBooks: Book[] = [];

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
      release_year: ['', [Validators.required, Validators.min(1888), Validators.max(new Date().getFullYear() + 5)]],
      genre: ['', Validators.required]
    });

    // Initialize Book Form
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      description: ['', Validators.required],
      publish_year: ['', [Validators.required, Validators.min(1000), Validators.max(new Date().getFullYear() + 5)]],
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

    this.loadRecentItems();
  }

  loadRecentItems() {
    if (this.activeTab === 'movies') {
      this.loadRecentMovies();
    } else {
      this.loadRecentBooks();
    }
  }

  loadRecentMovies() {
    this.adminService.getRecentMovies().subscribe({
      next: (movies) => {
        this.recentMovies = movies;
      },
      error: (error) => {
        console.error('Error loading recent movies:', error);
        this.showError('Failed to load recent movies');
      }
    });
  }

  loadRecentBooks() {
    this.adminService.getRecentBooks().subscribe({
      next: (books) => {
        this.recentBooks = books;
      },
      error: (error) => {
        console.error('Error loading recent books:', error);
        this.showError('Failed to load recent books');
      }
    });
  }

  onMovieSubmit() {
    if (this.movieForm.valid) {
      this.isSubmitting = true;
      this.clearMessage();

      const formValue = this.movieForm.value;
      const movie: Movie = {
        ...formValue,
        cast: formValue.cast.split(',').map((name: string) => name.trim()).filter((name: string) => name)
      };

      this.adminService.addMovie(movie).subscribe({
        next: () => {
          this.showSuccess('Movie added successfully!');
          this.movieForm.reset();
          this.loadRecentMovies();
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
          this.loadRecentBooks();
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
  }

  showError(message: string) {
    this.isSubmitting = false;
    this.submitSuccess = false;
    this.submitMessage = message;
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