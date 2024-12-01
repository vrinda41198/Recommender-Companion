import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthState } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [FormsModule, CommonModule],
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
              <span class="user-name">{{authState.user?.displayName}}</span>
            </div>
            
            <a *ngIf="authState.isAdmin" 
               (click)="navigateToAdmin()"
               class="admin-link">
              Admin Dashboard
            </a>
            
            <button (click)="logout()" class="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
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
          <div *ngFor="let item of filteredResults; let i = index" class="item-card">
            <div class="card-content">
              <div class="card-header">
                <h3 class="item-title">{{item.title}}</h3>
                <!-- Options Menu -->
                <div class="options-menu">
                  <button (click)="toggleOptions(i)" class="options-button">⋮</button>
                  
                  <div *ngIf="showOptions === i" class="options-dropdown">
                    <button (click)="updateItem(item)" class="dropdown-item">Updtae</button>
                    <button (click)="deleteItem(item)" class="dropdown-item delete">Delete</button>
                  </div>
                </div>
              </div>
              
              <div class="item-details">
                <p *ngIf="item.author" class="detail-row">
                  <span class="label">Author:</span> {{item.author}}
                </p>
                <p *ngIf="item.cast" class="detail-row">
                  <span class="label">Cast:</span> {{item.cast.join(', ')}}
                </p>
                <p class="detail-row">
                  <span class="label">Type:</span> {{item.type | titlecase}}
                </p>
                <p class="detail-row">
                  <span class="label">Genre:</span> {{item.genre}}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredResults.length === 0" class="empty-state">
          <h3>No results found</h3>
          <p>Try adjusting your search term.</p>
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

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .item-card {
      background-color: white;
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
  // Component logic remains the same
  authState$: Observable<AuthState>;
  activeTab: string = 'all';
  results: any[] = [];
  searchQuery: string = '';
  filteredResults: any[] = [];
  showOptions: number | null = null;

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

    this.apiService.getListings(tabType, 0).subscribe({
      next: (data) => {
        this.results = data.data || [];
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
    this.filteredResults = this.results.filter((item) =>
      item.title.toLowerCase().includes(lowerCaseQuery)
    );
  }

  toggleOptions(index: number) {
    this.showOptions = this.showOptions === index ? null : index;
  }

  updateItem(item: any) {
    console.log('Update item:', item);
    // Implement update logic
  }

  deleteItem(item: any) {
    console.log('Delete item:', item);
    // Implement delete logic
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.authService.logout().subscribe();
  }

}