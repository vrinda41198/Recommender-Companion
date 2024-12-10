import { Component, OnInit, HostListener } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthState } from '../services/auth.service';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AddItemModalComponent } from './add-item-modal.component';
import { RecommendationModalComponent } from './recommendation-modal.component';
import { Movie, Book, Review, isMovie, isBook } from '../models';
import { DeleteAccountModalComponent } from './delete-account-modal.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule, 
    AddItemModalComponent, 
    RecommendationModalComponent, 
    DeleteAccountModalComponent
  ],
  template: `
    <div class="container">
      <header class="header" style="background-color: black; color: white;">
        <div class="header-content">
          <h1 class="app-title" style="color: white;">Recommender Companion</h1>

          <div class="user-section" *ngIf="authState$ | async as authState">
            <div class="user-info">
              <span class="user-name" style="color: white;">Welcome, {{authState.user?.displayName}}</span>
            </div>
            
            <a *ngIf="authState.isAdmin" 
              (click)="navigateToAdmin()"
              class="admin-link" style="color: white;">
              Admin Dashboard
            </a>
            
            <button (click)="logout()" class="logout-button">
              Logout
            </button>
            <button 
              (click)="showDeleteAccount()" 
              class="delete-account-button">
              Delete Account
            </button>
          </div>
        </div>
      </header>

      <main class="main-content">
        <div class="action-buttons">
          <button (click)="showAddModal('movie')" class="action-button movie">
            <span class="icon">📽</span>
            Add Watched Movie
          </button>
          <button (click)="showRecommendations()" class="action-button recommend">
            <span class="icon">✨</span>
            Generate Recommendations
          </button>
          <button (click)="showAddModal('book')" class="action-button book">
            <span class="icon">📚</span>
            Add Read Book
          </button>
        </div>

        <div class="tabs-container">
          <button *ngFor="let tab of ['all', 'movies', 'books']"
                  (click)="setTab(tab)"
                  [class]="'tab-button ' + (tab === activeTab ? 'active' : '')">
            {{tab | titlecase}}
          </button>
        </div>

        <div class="search-container">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search for movies and books..."
            class="search-input"
          >
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading results...</p>
        </div>

        <!-- Results Grid -->
        <div class="results-grid" *ngIf="!isLoading">
          <div *ngFor="let item of filteredResults; let i = index" 
              class="item-card" 
              [class.expanded]="editingIndex === i">
            <img *ngIf="isBook(item)" [src]="item.image_url_s" alt="Book Cover" class="card-image">
            <img *ngIf="isMovie(item)" [src]="'https://image.tmdb.org/t/p/w500' + item.poster_path" alt="Movie Poster" class="card-image">
            
            <div class="card-content">
              <div class="card-header">
                <h3 class="item-title">{{ isBook(item) ? item.book_title : item.title }}</h3>
                
                <div class="options-menu">
                  <button (click)="toggleOptions(i, $event)" class="options-button">⋮</button>
                  <div *ngIf="showOptions === i" class="options-dropdown">
                    <button (click)="startUpdatingItem(i)" class="dropdown-item">Update</button>
                    <button (click)="deleteItem(item)" class="dropdown-item delete">Delete</button>
                  </div>
                </div>
              </div>

              <!-- Item Details -->
              <div class="item-details">
                <!-- Common Details -->
                <p class="detail-row">
                  <span class="detail-label"><strong>Type: </strong></span> 
                  {{item.type | titlecase}}
                </p>

                <!-- Book-specific Details -->
                <ng-container *ngIf="isBook(item)">
                  <p class="detail-row">
                    <span class="detail-label"><strong>Author: </strong></span>
                    {{item.book_author}}
                  </p>
                  <p class="detail-row">
                    <span class="detail-label"><strong>Year of publication: </strong></span>
                    {{item.year_of_publication}}
                  </p>
                </ng-container>

                <!-- Movie-specific Details -->
                <ng-container *ngIf="isMovie(item)">
                  <p class="detail-row"><strong>Director: </strong>{{item.director}}</p>
                  <p class="detail-row"><strong>Language: </strong>{{item.original_language}}</p>
                  <p class="detail-row"><strong>Release Date: </strong>{{getYearFromDateString(item.release_date)}}</p>
                  <p class="detail-row"><strong>Genres: </strong>{{item.genres}}</p>
                </ng-container>

                <!-- Rating -->
                <p class="detail-row">
                  <strong>Your Rating: </strong>
                  <span class="star-rating">
                    <ng-container *ngFor="let star of [1,2,3,4,5]">
                      <i class="star" [class.filled]="star <= item.user_rating">★</i>
                    </ng-container>
                  </span>
                </p>

                <!-- Update Rating Section -->
                <div *ngIf="editingIndex === i" class="update-rating-section">
                  <h4>Update Your Rating</h4>
                  <div class="star-rating">
                    <ng-container *ngFor="let star of [1,2,3,4,5]">
                      <i class="star"
                         [class.filled]="star <= newRating"
                         (click)="setNewRating(star)">★</i>
                    </ng-container>
                  </div>
                  <div class="rating-actions">
                    <button (click)="submitUpdatedRating(item)" class="submit-rating-button">Submit</button>
                    <button (click)="cancelUpdatingItem()" class="cancel-button">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-controls" *ngIf="totalPages > 1 && !isLoading">
          <button 
            class="pagination-button" 
            [disabled]="currentPage === 1"
            (click)="changePage(currentPage - 1)">
            Previous
          </button>
          
          <div class="pagination-numbers">
            <button 
              *ngFor="let page of getPageNumbers()"
              class="page-number"
              [class.active]="page === currentPage"
              (click)="changePage(page)">
              {{page}}
            </button>
          </div>
          
          <button 
            class="pagination-button" 
            [disabled]="currentPage === totalPages"
            (click)="changePage(currentPage + 1)">
            Next
          </button>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && filteredResults.length === 0" class="empty-state">
          <h3>No results found</h3>
          <p>Try adjusting your search term.</p>
        </div>

        <!-- Modals -->
        <app-add-item-modal
          *ngIf="showModal"
          [itemType]="modalType"
          (close)="handleModalClose()"
          (submit)="handleModalSubmit($event)"
        ></app-add-item-modal>

        <app-recommendation-modal
          *ngIf="showRecommendationModal"
          (close)="handleRecommendationModalClose()"
        ></app-recommendation-modal>

        <app-delete-account-modal
          *ngIf="showDeleteModal"
          [isOpen]="showDeleteModal"
          [isLoading]="isDeleting"
          (close)="showDeleteModal = false"
          (confirm)="handleDeleteAccount()"
        ></app-delete-account-modal>
      </main>
    </div>
  `,
  styles: [`
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin: 2rem 0;
      padding: 0 1rem;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 200px;
      justify-content: center;
    }

    .action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .action-button.movie {
      background-color: #3b82f6;
      color: white;
    }

    .action-button.movie:hover {
      background-color: #2563eb;
    }

    .action-button.recommend {
      background-color: #8b5cf6;
      color: white;
    }

    .action-button.recommend:hover {
      background-color: #7c3aed;
    }

    .action-button.book {
      background-color: #10b981;
      color: white;
    }

    .action-button.book:hover {
      background-color: #059669;
    }

    .icon {
      font-size: 1.25rem;
      margin-right: 0.5rem;
    }

    .item-card {
      background: rgba(255, 255, 255, 0.7);
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s;
    }

    .item-card:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .card-image {
        width: 100%;
        height: 200px;
        object-fit: contain;
        margin: 1rem auto;
        display: block;
        border-radius: 4px;
        background-color: #f3f4f6;
        padding: 0.5rem;
    }
    .container {
      min-height: 100vh;
      background-image: 
        linear-gradient(rgba(0, 0, 0, 0.7), rgba(255, 255, 255, 0.7)),
        url('../../assets/home-background.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat; 
    }

    .header {
      background-color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1rem 0;
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

    .admin-link {
      color: #2563eb;
      cursor: pointer;
      text-decoration: none;
    }

    .admin-link:hover {
      text-decoration: underline;
    }

    .main-content {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .loading-state {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .tabs-container {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .tab-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background-color: #e5e7eb;
      color: #4b5563;
      transition: all 0.2s;
    }

    .tab-button.active {
      background-color: #2563eb;
      color: white;
    }

    .search-container {
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 1rem;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .item-card {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin: 2rem 0;
    }

    .pagination-button {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-button:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    .pagination-numbers {
      display: flex;
      gap: 0.5rem;
    }

    .page-number {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      min-width: 2.5rem;
      transition: all 0.2s;
    }

    .page-number.active {
      background-color: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    .card-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .card-content {
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }

    .options-menu {
      position: relative;
    }

    .options-dropdown {
      position: absolute;
      right: 0;
      top: 100%;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      text-align: left;
      border: none;
      background: none;
      cursor: pointer;
    }

    .dropdown-item:hover {
      background-color: #f3f4f6;
    }

    .dropdown-item.delete {
      color: #dc2626;
    }

    .star-rating {
      display: inline-flex;
      gap: 0.25rem;
    }

    .star {
      color: #d1d5db;
      cursor: pointer;
      font-size: 1.25rem;
    }

    .star.filled {
      color: #fbbf24;
    }

    .update-rating-section {
      margin-top: 1rem;
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 4px;
    }

    .rating-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .logout-button, .delete-account-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .logout-button {
      background-color: #dc2626;
    }

    .logout-button:hover {
      background-color: #b91c1c;
    }

    .delete-account-button {
      background-color: #dc2626;
    }

    .delete-account-button:hover {
      background-color: #b91c1c;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .results-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .user-section {
        flex-direction: column;
      }

      .pagination-numbers {
        display: none;
      }
    }
  `]
})
export class HomepageComponent implements OnInit {
  authState$: Observable<AuthState>;
  activeTab: string = 'all';
  searchQuery: string = '';
  filteredResults: (Movie | Book)[] = [];
  showOptions: number | null = null;
  showModal = false;
  modalType: 'movie' | 'book' = 'movie';
  showRecommendationModal = false;
  showDeleteModal = false;
  isDeleting = false;
  editingIndex: number | null = null;
  newRating: number = 0;
  isLoading = false;

  // Pagination state
  currentPage = 1;
  totalPages = 1;
  readonly perPage = 3;
  private searchSubject = new Subject<string>();

  // Type guards
  isMovie = isMovie;
  isBook = isBook;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.authState$ = this.authService.authState$;
    
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.currentPage = 1; // Reset to first page on new search
      this.fetchResults();
    });
  }

  ngOnInit() {
    this.fetchResults();
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  fetchResults() {
    this.isLoading = true;
    let tabType = '';
    if (this.activeTab === 'books') {
      tabType = 'book';
    } else if (this.activeTab === 'movies') {
      tabType = 'movie';
    }

    this.apiService.getListings(
      tabType, 
      false, 
      this.searchQuery,
      this.currentPage,
      this.perPage
    ).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          if (this.activeTab === 'books') {
            this.filteredResults = response.data['books'] || [];
            this.totalPages = response.pagination['books']?.total_pages || 1;
          } else if (this.activeTab === 'movies') {
            this.filteredResults = response.data['movies'] || [];
            this.totalPages = response.pagination['movies']?.total_pages || 1;
          } else {
            // For 'all' tab, combine both movies and books
            const movies = response.data['movies'] || [];
            const books = response.data['books'] || [];
            this.filteredResults = [...movies, ...books];
            
            // Calculate total pages for combined results
            const moviePages = response.pagination['movies']?.total_pages || 0;
            const bookPages = response.pagination['books']?.total_pages || 0;
            this.totalPages = Math.max(moviePages, bookPages);
          }
        } else {
          this.filteredResults = [];
          this.totalPages = 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching results:', error);
        this.filteredResults = [];
        this.totalPages = 1;
        this.isLoading = false;
      }
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages); // Show max 5 page numbers
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxPages - 1);
    
    // Adjust start if we're near the end
    start = Math.max(1, end - maxPages + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number) {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchResults();
      // Scroll to top when changing page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1; // Reset to first page when changing tabs
    this.searchQuery = '';
    this.fetchResults();
  }

  getYearFromDateString(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.getFullYear().toString();
  }

  toggleOptions(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.showOptions = this.showOptions === index ? null : index;
  }

  startUpdatingItem(index: number) {
    this.editingIndex = index;
    this.newRating = this.filteredResults[index]?.user_rating || 0;
    this.showOptions = null;
  }

  setNewRating(rating: number) {
    this.newRating = rating;
  }

  submitUpdatedRating(item: Movie | Book) {
    if (item.id) {
      const updatedData = {
        user_rating: this.newRating,
        type: item.type,
      };

      this.apiService.updateItem(item.id, item.type, updatedData).subscribe({
        next: () => {
          item.user_rating = this.newRating;
          this.editingIndex = null;
          this.fetchResults(); // Refresh the data after update
        },
        error: (error) => {
          console.error('Error updating rating:', error);
          alert('Failed to update the rating. Please try again.');
        },
      });
    }
  }

  cancelUpdatingItem() {
    this.editingIndex = null;
  }

  getBookImageUrl(item: Book): string {
    if (!item?.image_url_s) {
        return 'assets/placeholder-book.jpg';  // Note: removed leading slash
    }
    
    try {
        const url = new URL(item.image_url_s);
        return url.protocol === 'http:' ? item.image_url_s.replace('http:', 'https:') : item.image_url_s;
    } catch {
        return 'assets/placeholder-book.jpg';
    }
}

handleImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder-book.jpg';  // Note: removed leading slash
}

  deleteItem(item: Movie | Book) {
    if (item.id) {
      this.apiService.deleteItem(item.id, item.type).subscribe({
        next: () => {
          // If we're on the last page and it's now empty, go to previous page
          if (this.filteredResults.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.fetchResults();
        },
        error: (error) => {
          console.error('Error deleting item:', error);
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.showOptions = null;
  }

  showDeleteAccount() {
    this.showDeleteModal = true;
  }

  handleDeleteAccount() {
    this.isDeleting = true;
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.isDeleting = false;
      },
      error: (error) => {
        console.error('Error deleting account:', error);
        this.isDeleting = false;
        this.showDeleteModal = false;
      }
    });
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
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
        this.fetchResults();
      },
      error: (error) => {
        this.showModal = false;
        console.error('Error submitting review:', error);
        alert('Item already added.');
      }
    });
  }

  showRecommendations() {
    this.showRecommendationModal = true;
  }
  
  handleRecommendationModalClose() {
    this.showRecommendationModal = false;
  }
}