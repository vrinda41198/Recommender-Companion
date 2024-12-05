import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Recommendation, isMovieRecommendation, isBookRecommendation } from '../models';

@Component({
  selector: 'app-recommendation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Your Recommendations</h2>
          <button class="close-button" (click)="close.emit()">×</button>
        </div>

        <div class="modal-body">
          <!-- Tabs -->
          <div class="tabs-container">
            <button 
              *ngFor="let tab of tabs"
              (click)="setTab(tab)"
              [class]="'tab-button ' + (activeTab === tab ? 'active' : '')">
              {{tab | titlecase}}
            </button>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="loading-state">
            <p>Generating recommendations...</p>
          </div>

          <!-- Results -->
          <div *ngIf="!isLoading" class="recommendations-grid">
            <div *ngFor="let item of filteredRecommendations" class="recommendation-card">
              <div class="card-content">
                <div class="confidence-badge" [style.background-color]="getConfidenceColor(item.confidence)">
                  {{(item.confidence * 100).toFixed(0)}}% Match
                </div>
                <div *ngIf="activeTab === 'all'" class="type-badge" [class.movie]="isMovieRecommendation(item)" [class.book]="isBookRecommendation(item)">
                  {{item.type | titlecase}}
                </div>
                <h3 class="item-title">{{item.title}}</h3>
                <p *ngIf="isBookRecommendation(item) && item.author" class="detail">
                  <span class="label">Author:</span> {{item.author}}
                </p>
                <p *ngIf="isMovieRecommendation(item) && item.cast?.length" class="detail">
                  <span class="label">Cast:</span> {{item.cast.join(', ')}}
                </p>
                <p *ngIf="item.genre" class="detail">
                  <span class="label">Genre:</span> {{item.genre}}
                </p>
                <p class="description">{{item.description}}</p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && filteredRecommendations.length === 0" class="empty-state">
            <h3>No recommendations found</h3>
            <p>Try switching to a different category.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="refresh-button" (click)="generateRecommendations()" [disabled]="isLoading">
            Refresh Recommendations
          </button>
          <button class="close-button-secondary" (click)="close.emit()">Close</button>
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
      max-width: 900px;
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

    .tabs-container {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .tab-button {
      padding: 0.5rem 1rem;
      border: none;
      background: none;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }

    .tab-button.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .recommendation-card {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .recommendation-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .card-content {
      padding: 1.5rem;
      position: relative;
    }

    .confidence-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .type-badge.movie {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .type-badge.book {
      background-color: #dcfce7;
      color: #166534;
    }

    .item-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111;
      margin: 0 0 1rem 0;
      padding-right: 4rem;
    }

    .detail {
      font-size: 0.875rem;
      color: #4b5563;
      margin: 0.5rem 0;
    }

    .label {
      font-weight: 500;
      color: #374151;
    }

    .description {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .loading-state {
      text-align: center;
      padding: 3rem 0;
      color: #6b7280;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 0;
      color: #6b7280;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .refresh-button {
      padding: 0.5rem 1rem;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .refresh-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .close-button-secondary {
      padding: 0.5rem 1rem;
      background-color: white;
      color: #4b5563;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class RecommendationModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  readonly tabs = ['all', 'movies', 'books'] as const;
  activeTab: typeof this.tabs[number] = 'all';
  isLoading = false;
  recommendations: Recommendation[] = [];
  isMovieRecommendation = isMovieRecommendation;
  isBookRecommendation = isBookRecommendation;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.generateRecommendations();
  }

  setTab(tab: typeof this.tabs[number]) {
    this.activeTab = tab;
    this.generateRecommendations();
  }

  get filteredRecommendations(): Recommendation[] {
    if (this.activeTab === 'all') return this.recommendations;
    return this.recommendations.filter(item => 
      item.type === this.activeTab.slice(0, -1) as 'movie' | 'book'
    );
  }

  generateRecommendations() {
    this.isLoading = true;
    this.apiService.generateRecommendations(this.activeTab).subscribe({
      next: (response) => {
        if (response && response.data) {
          console.log('Recommendations received:', response.data);
          this.recommendations = response.data;
        } else {
          this.recommendations = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating recommendations:', error);
        this.recommendations = [];
        this.isLoading = false;
      }
    });
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#059669';
    if (confidence >= 0.6) return '#0284c7';
    if (confidence >= 0.4) return '#9333ea';
    return '#6b7280';
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}