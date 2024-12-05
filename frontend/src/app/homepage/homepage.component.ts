import { Component, OnInit, HostListener } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthState } from '../services/auth.service';
import { Observable } from 'rxjs';
import { AddItemModalComponent } from './add-item-modal.component';
import { RecommendationModalComponent } from './recommendation-modal.component';
import { Movie, Book, Review, isMovie, isBook } from '../models';
import { DeleteAccountModalComponent } from './delete-account-modal.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [FormsModule, CommonModule, AddItemModalComponent, RecommendationModalComponent, DeleteAccountModalComponent],
  template: `
    <div class="container">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <!-- Logo -->
          <h1 class="app-title">Recommendation Companion</h1>

          <!-- User Info & Controls -->
          <div class="user-section" *ngIf="authState$ | async as authState">
            <div class="user-info">
              <span class="user-name">Welcome, {{authState.user?.displayName}}</span>
            </div>
            
            <a *ngIf="authState.isAdmin" 
               (click)="navigateToAdmin()"
               class="admin-link">
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

      <!-- Main Content -->
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

        <!-- Tabs -->
        <div class="tabs-container">
          <button *ngFor="let tab of ['all', 'movies', 'books']"
                  (click)="setTab(tab)"
                  [class]="'tab-button ' + (tab === activeTab ? 'active' : '')">
            {{tab | titlecase}}
          </button>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="applySearchFilter()"
            placeholder="Search for movies and books..."
            class="search-input"
          >
        </div>

        <!-- Results Grid -->
        <div class="results-grid">
          <div *ngFor="let item of filteredResults; let i = index" 
              class="item-card" 
              [class.expanded]="editingIndex === i">
           <!-- Card Image -->
              <img *ngIf="isBook(item)" [src]="item.image_url_s" alt="Book Cover" class="card-image">
              <img *ngIf="isMovie(item)" [src]="'https://image.tmdb.org/t/p/w500' + item.poster_path" alt="Movie Poster" class="card-image">
            <div class="card-content">
              <div class="card-header">
                 <h3 class="item-title">{{ isBook(item) ? item.book_title : item.title }}</h3>
                
                <!-- Options Menu -->
                      <div class="options-menu">
                        <button (click)="toggleOptions(i, $event)" class="options-button">⋮</button>

                        <div *ngIf="showOptions === i" class="options-dropdown">
                          <button (click)="startUpdatingItem(i)" class="dropdown-item">Update</button>
                          <button (click)="deleteItem(item)" class="dropdown-item delete">Delete</button>
                        </div>
                      </div>
                    </div>
                                
              </div>
              
              <div class="item-details">

                <p class="detail-row">
                  <span class="detail-row"><strong>Type: </strong></span> {{item.type | titlecase}}
                </p>


                <p *ngIf="isBook(item)" class="detail-row">
                  <span class="detail-row"><strong>Author: </strong></span> {{item.book_author}}
                </p>

                 <p *ngIf="isBook(item)" class="detail-row">
                  <span class="detail-row"><strong>Year of publication: </strong></span> {{item.year_of_publication}}
                </p>

              
                
                <p *ngIf="isMovie(item)" class="detail-row"><strong>Director: </strong>{{ item.director }}</p>
                <p *ngIf="isMovie(item)" class="detail-row"><strong>Language: </strong>{{ item.original_language }}</p>
                <p *ngIf="isMovie(item)" class="detail-row"><strong>Release Date: </strong>{{ getYearFromDateString(item.release_date) }}</p>
                <p *ngIf="isMovie(item)" class="detail-row"><strong>Genres: </strong> {{ item.genres }}</p>

              <p class="detail-row">
                <strong>Your Rating: </strong>
                <span class="star-rating">
                  <ng-container *ngFor="let star of [1, 2, 3, 4, 5]">
                    <i
                      class="star"
                      [class.filled]="star <= item.user_rating"
                      aria-hidden="true"
                    >★</i>
                  </ng-container>
                </span>
              </p>
               
                 <!-- Update Rating Section -->
      <div *ngIf="editingIndex === i" class="update-rating-section">
        <h4>Update Your Rating</h4>
        <div class="star-rating">
          <ng-container *ngFor="let star of [1, 2, 3, 4, 5]">
            <i
              class="star"
              [class.filled]="star <= newRating"
              (click)="setNewRating(star)"
              aria-hidden="true"
            >★</i>
          </ng-container>
        </div>
        <button (click)="submitUpdatedRating(item)" class="submit-rating-button">Submit</button>
        <button (click)="cancelUpdatingItem()" class="cancel-button">Cancel</button>

              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredResults.length === 0" class="empty-state">
          <h3>No results found</h3>
          <p>Try adjusting your search term.</p>
        </div>

        <!-- Modal -->
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
    .container {
      min-height: 100vh;
      background-color: #f5f5f5;
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
      margin: 2rem auto;
      padding: 0 1rem;
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
    }

    .tab-button.active {
      background-color: #2563eb;
      color: white;
    }

    .star-rating {
        display: inline-block;
        font-size: 1.5rem; /* Adjust the size of the stars */
        color: #d1d5db; /* Default color for unselected stars */
    }

      .star {
        cursor: default; /* Make stars non-clickable in display mode */
      }

      .star.filled {
        color: #fbbf24; /* Color for filled stars (e.g., gold) */
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

    .search-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }

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
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .item-card {
      background-color: white;
      padding: 1rem; 
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s;
    }

    .item-card:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .card-content {
      padding: 1.5rem;
    }
    
    .card-image {
        width: 50%; /* Increase the width to make the image occupy more space */
        max-height: 140px; /* Increase the maximum height for larger images */
        align: centre;
        margin-bottom: 1rem; /* Keep spacing below the image */
        margin-top: 2rem; /* Add spacing above to shift the image downward */
        margin: 0 auto; /* Center horizontally */
        display: block; /* Necessary to center inline elements like <img> with margin auto */
        border-radius: 4px; /* Optional: Rounds the image corners */
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }

    .item-title {
      font-size: 1.125rem;
      color: #111;
      margin: 0;
    }

    .options-menu {
      position: relative;
    }

    .options-button {
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      font-size: 1.25rem;
      padding: 0.25rem;
    }

    .options-dropdown {
      position: absolute;
      right: 0;
      top: 100%;
      background-color: white;
      border: 1px solid #e5e7eb;
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

    .item-details {
      color: #4b5563;
      font-size: 0.875rem;
    }

    .detail-row {
      margin: 0.5rem 0;
    }

    .label {
      font-weight: 500;
      color: #374151;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 0;
      color: #6b7280;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      color: #111;
      margin-bottom: 0.5rem;
    }

    .recommendation-button-container {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .recommendation-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background-color: #8b5cf6;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .recommendation-button:hover {
      background-color: #7c3aed;
    }

  .item-card.expanded {
    background-color: #f9fafb;
    border: 2px solid #2563eb;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
   }

  .update-rating-section {
    margin-top: 1rem;
    text-align: center;
  }

  .star-rating {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.5rem;
  }

  .star {
    cursor: pointer;
    color: #d1d5db;
  }

  .star.filled {
    color: #fbbf24;
  }

  .submit-rating-button {
    background-color: #10b981;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 0.5rem;
  }

  .submit-rating-button:hover {
    background-color: #059669;
  }

  .cancel-button {
    background-color: #dc2626;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .cancel-button:hover {
    background-color: #b91c1c;
  }


    .delete-account-button {
        padding: 0.5rem 1rem;
        background-color: #dc2626;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .delete-account-button:hover {
        background-color: #b91c1c;
    }

    @media (max-width: 768px) {
      .results-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .user-section {
        flex-direction: column;
      }
    }
  `]
})
export class HomepageComponent implements OnInit {
  authState$: Observable<AuthState>;
  activeTab: string = 'all';
  results: (Movie | Book)[] = [];
  searchQuery: string = '';
  filteredResults: (Movie | Book)[] = [];
  showOptions: number | null = null;
  showModal = false;
  modalType: 'movie' | 'book' = 'movie';
  showRecommendationModal = false;
  showDeleteModal = false;
  isDeleting = false;
  editingIndex: number | null = null; // Index of the card being edited
  newRating: number = 0; // New rating being set

  // Make type guards available in template
  isMovie = isMovie;
  isBook = isBook;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.authState$ = this.authService.authState$;
  }

  ngOnInit() {
    this.fetchResults();
  }

  fetchResults() {
    let tabType = '';
    if (this.activeTab === 'books') {
      tabType = 'book';
    } else if (this.activeTab === 'movies') {
      tabType = 'movie';
    }

    this.apiService.getListings(tabType, false, this.searchQuery).subscribe({
      next: (response) => {
        this.results = response.data || [];
        this.applySearchFilter();
      },
      error: (error) => {
        console.error('Error fetching results:', error);
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.searchQuery = '';
    this.fetchResults();
  }

  applySearchFilter() {
    const lowerCaseQuery = this.searchQuery.toLowerCase();
  
    this.filteredResults = this.results.filter((item) => {
      const itemTitle = item.title?.toLowerCase() || item.book_title?.toLowerCase() || '';
      return itemTitle.includes(lowerCaseQuery);
    });
  }

  getYearFromDateString(dateString: string): string {
    if (!dateString) return ''; // Handle empty or invalid date
    const date = new Date(dateString); // Parse the date string
    return isNaN(date.getTime()) ? '' : date.getFullYear().toString(); // Extract the year
  }
  
  toggleOptions(index: number, event: MouseEvent) {
    event.stopPropagation(); // Prevent the click from propagating to the document
    this.showOptions = this.showOptions === index ? null : index;
  }


  startUpdatingItem(index: number) {
    this.editingIndex = index; // Mark the current card as being edited
    this.newRating = this.filteredResults[index]?.user_rating || 0; // Initialize with the current rating
    this.showOptions = null; // Close the options menu
  }


  setNewRating(rating: number) {
    this.newRating = rating; // Update the new rating
  }


  submitUpdatedRating(item: Movie | Book) {
    if (item.id) {
     
      const updatedData = {
        user_rating: this.newRating, // Send the new rating
        type: item.type, // Include the type (movie or book)
      };

      this.apiService.updateItem(item.id, item.type, updatedData).subscribe({
        next: () => {
          item.user_rating = this.newRating; // Update the UI with the new rating
          this.editingIndex = null; // Exit editing mode
        },
        error: (error) => {
          console.error('Error updating rating:', error);
          alert('Failed to update the rating. Please try again.'); // Optional error handling
        },
      });
    }
  }

  cancelUpdatingItem() {
    this.editingIndex = null; // Exit editing mode without making changes
  }

// updateItem(item: Movie | Book) {
  //   console.log('Update item:', item);
  //   // Implement update logic
  // }


  deleteItem(item: Movie | Book) {
    console.log(item)
    if (item.id) {
      this.apiService.deleteItem(item.id, item.type).subscribe({
        next: () => {
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
    this.showOptions = null; // Close the options dropdown when clicking anywhere else
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
            // Router navigation is handled in the service
        },
        error: (error) => {
            console.error('Error deleting account:', error);
            this.isDeleting = false;
            this.showDeleteModal = false;
            // Handle error (you might want to show an error message)
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
        alert('Movie already added.'); // Show a popup alert
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