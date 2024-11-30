import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { CommonModule } from '@angular/common'; // Import CommonModule

import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [FormsModule, CommonModule], // Import FormsModule directly here
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
})
export class HomepageComponent {
  activeTab: string = 'all'; // Default tab is 'all'
  results: any[] = []; // Raw results from API
  searchQuery: string = ''; // Search input
  filteredResults: any[] = []; // Filtered results based on search query
  showOptions: number | null = null; // Card index for showing three-dot options

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchResults(); // Fetch results for the default 'all' tab
  }

  // Fetch results from API based on the current tab
  fetchResults() {
    let tabType = '';
    if (this.activeTab === 'books') {
      tabType = 'book';
    } else if (this.activeTab === 'movies') {
      tabType = 'movie';
    }

    // globalsearch = 0 for fetching user-added data
    this.apiService.getListings(tabType, 0).subscribe((data) => {
      this.results = data.data || [];
      this.applySearchFilter();
      // console.log(data.data)
    });
  }

  // Set the active tab and fetch corresponding results
  setTab(tab: string) {
    this.activeTab = tab;
    this.searchQuery = ''; // Reset search query on tab switch
    this.fetchResults();
  }

  // Filter results based on the search query
  applySearchFilter() {
    const lowerCaseQuery = this.searchQuery.toLowerCase();
    this.filteredResults = this.results.filter((item) =>
      item.title.toLowerCase().includes(lowerCaseQuery)
    );
  }

  // Toggle the options menu for a specific card
  toggleOptions(index: number) {
    this.showOptions = this.showOptions === index ? null : index;
  }

  // Placeholder functions for Update and Delete actions
  updateItem(item: any) {
    alert(`Update item: ${JSON.stringify(item)}`);
  }

  deleteItem(item: any) {
    alert(`Delete item: ${JSON.stringify(item)}`);
  }
}
