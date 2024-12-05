import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Movie, Book, Review, isMovie, isBook } from '../models';

@Component({
  selector: 'app-add-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add {{itemType === 'movie' ? 'Watched Movie' : 'Read Book'}}</h2>
          <button class="close-button" (click)="close.emit()">×</button>
        </div>

        <div class="modal-body">
          <!-- Search Section -->
          <div class="search-section">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch()"
              [placeholder]="'Search for ' + itemType + 's...'"
              class="search-input"
            >
          </div>


          <!-- Search Results -->
          <div class="search-results" *ngIf="searchResults.length > 0">
            <div 
              *ngFor="let item of searchResults"
              class="result-item"
              [class.selected]="selectedItem?.id === item.id"
              (click)="selectItem(item)"
            >
          <h3>{{ isBook(item) ? item.book_title : item.title }}</h3>
          <p *ngIf="isBook(item)">by {{ item.book_author }}</p>
          <p *ngIf="isMovie(item)">Cast: {{ item.cast }}</p>

            </div>
          </div>

          <!-- Review Section -->
          <div class="review-section" *ngIf="selectedItem">
            <h3>Your Review</h3>
            
            <div class="rating-input">
              <label>Rating:</label>
              <div class="star-rating">
                <button 
                  *ngFor="let star of [1,2,3,4,5]"
                  (click)="rating = star"
                  [class.active]="star <= rating"
                  class="star-button"
                >★</button>
              </div>
            </div>

        <div class="modal-footer">
          <button 
            class="cancel-button"
            (click)="close.emit()"
          >Cancel</button>
          <button 
            class="submit-button"
            [disabled]="!canSubmit"
            (click)="submitReview()"
          >Add to {{itemType === 'movie' ? 'Watched' : 'Read'}}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #111;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .search-section {
      margin-bottom: 1.5rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 1rem;
    }

    .search-results {
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 1.5rem;
    }

    .result-item {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .result-item:hover {
      background-color: #f3f4f6;
    }

    .result-item.selected {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    .result-item h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }

    .result-item p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .review-section {
      border-top: 1px solid #e5e7eb;
      padding-top: 1.5rem;
    }

    .rating-input {
      margin-bottom: 1rem;
    }

    .star-rating {
      display: flex;
      gap: 0.25rem;
    }

    .star-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #d1d5db;
      cursor: pointer;
      padding: 0.25rem;
    }

    .star-button.active {
      color: #fbbf24;
    }

    .review-input {
      margin-bottom: 1rem;
    }

    .review-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      resize: vertical;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .cancel-button {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }

    .submit-button {
      padding: 0.5rem 1rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class AddItemModalComponent {
  @Input() itemType: 'movie' | 'book' = 'movie';
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<Review>();

  searchQuery = '';
  searchResults: (Movie | Book)[] = [];
  selectedItem: (Movie | Book) | null = null;
  rating = 0;
  review = '';

  // Make type guards available in template
  isMovie = isMovie;
  isBook = isBook;

  constructor(private apiService: ApiService) {}

  get canSubmit(): boolean {
    return this.selectedItem != null && this.rating > 0;
  }

  onSearch() {
    if (this.searchQuery.trim().length < 1) {
      this.searchResults = [];
      return;
    }

    this.apiService.getListings(this.itemType, true, this.searchQuery).subscribe({
      next: (response) => {
        
        this.searchResults = response.data || [];
  
      },
      error: (error) => {
        console.error('Search error:', error);
      }
    });
  }

  selectItem(item: Movie | Book) {
    this.selectedItem = item;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  submitReview() {
    if (!this.canSubmit || !this.selectedItem) return;

    const review: Review = {
      itemId: this.selectedItem.id!,
      itemType: this.itemType,
      rating: this.rating,
      review: this.review.trim()
    };

    this.submit.emit(review);
  }
}