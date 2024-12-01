import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {AuthService, AuthState } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Navigation Bar -->
      <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <h1 class="text-xl font-bold">Recommendation Companion</h1>
              </div>
            </div>
            
            <div class="flex items-center">
              <ng-container *ngIf="authState$ | async as authState">
                <!-- Admin Dashboard Link -->
                <a *ngIf="authState.isAdmin" 
                   (click)="navigateToAdmin()"
                   class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer mr-4">
                  Admin Dashboard
                </a>
                
                <!-- User Info -->
                <span class="text-gray-700 mr-4">
                  Welcome, {{authState.user?.displayName}}
                </span>
                
                <!-- Logout Button -->
                <button (click)="logout()" 
                        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Logout
                </button>
              </ng-container>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Tabs -->
        <div class="flex space-x-4 mb-6">
          <button 
            *ngFor="let tab of ['all', 'books', 'movies']"
            (click)="setTab(tab)"
            [class.bg-blue-500]="activeTab === tab"
            [class.text-white]="activeTab === tab"
            [class.bg-gray-200]="activeTab !== tab"
            class="px-4 py-2 rounded-md font-medium">
            {{tab | titlecase}}
          </button>
        </div>

        <!-- Search Bar -->
        <div class="mb-6">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (ngModelChange)="applySearchFilter()"
            placeholder="Search..."
            class="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <!-- Results Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let item of filteredResults; let i = index" 
               class="bg-white p-4 rounded-lg shadow relative">
            <h3 class="text-lg font-semibold mb-2">{{item.title}}</h3>
            <p *ngIf="item.author" class="text-gray-600">Author: {{item.author}}</p>
            <p *ngIf="item.cast" class="text-gray-600">Cast: {{item.cast.join(', ')}}</p>
            
            <!-- Three Dot Menu -->
            <div class="absolute top-4 right-4">
              <button (click)="toggleOptions(i)" 
                      class="text-gray-500 hover:text-gray-700">
                ⋮
              </button>
              
              <div *ngIf="showOptions === i" 
                   class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                <button (click)="updateItem(item)" 
                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Edit
                </button>
                <button (click)="deleteItem(item)" 
                        class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomepageComponent implements OnInit {
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