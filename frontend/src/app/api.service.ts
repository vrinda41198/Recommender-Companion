import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'https://8572a24a-f846-4e6f-8068-033e5af97936.mock.pstmn.io/listing_api';

  constructor(private http: HttpClient) {}

  /**
   * Fetch listings based on the provided tab type and global search parameter.
   * @param tabType The type of tab (e.g., 'book', 'movie', etc.)
   * @param globalSearch A numeric flag for global search (0 or 1)
   * @returns An observable containing the API response
   */
  getListings(tabType: string, globalSearch: number): Observable<any> {
    // Construct query parameters manually to ensure the order
    const queryParams = [
      tabType ? `tab_type=${tabType}` : '',
      `globalsearch=${globalSearch}`,
    ]
      .filter(Boolean) // Remove empty strings
      .join('&'); // Join parameters with '&'

    // Return the GET request observable with constructed query string
    const url = `${this.baseUrl}?${queryParams}`;
    return this.http.get<any>(url);
  }
}
