import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Movie, Book, ApiResponse, Review, Recommendation } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getListings(
    type: string, 
    searchGlobal: boolean, 
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<{
    status: string;
    data: { [key: string]: (Movie | Book)[] };
    pagination: {
      [key: string]: {
        current_page: number;
        per_page: number;
        total_items: number;
        total_pages: number;
      };
    };
  }> {
    let params = new HttpParams()
      .set('type', type)
      .set('search_global', searchGlobal)
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    
    if (searchGlobal) {
      params = params.set('search_global', 'true');
    }
    
    if (query) {
      params = params.set('query', query);
    }
  
    return this.http.get<{
      status: string;
      data: { [key: string]: (Movie | Book)[] };
      pagination: {
        [key: string]: {
          current_page: number;
          per_page: number;
          total_items: number;
          total_pages: number;
        };
      };
    }>(`${this.baseUrl}/listings`, { params });
  }

  submitReview(review: Review): Observable<any> {
    return this.http.post(`${this.baseUrl}/reviews`, review);
  }

  addMovie(movie: Movie): Observable<Movie> {
    return this.http.post<Movie>(`${this.baseUrl}/movies`, movie);
  }

  addBook(book: Book): Observable<Book> {
    return this.http.post<Book>(`${this.baseUrl}/books`, book);
  }

  deleteItem(id: number, type: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${type}s/${id}`);
  }

  updateItem(id: number, type: string, data: Partial<Movie | Book>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${type}s/${id}`, data);
  }

  generateRecommendations(type: 'all' | 'movies' | 'books' = 'all'): Observable<ApiResponse<Recommendation>> {
    const backendType = type === 'all' ? 'all' : type.slice(0, -1);
    const params = new HttpParams().set('type', backendType);
    
    return this.http.get<ApiResponse<Recommendation>>(
      `${this.baseUrl}/generate-recommendation`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error generating recommendations:', error);
        return throwError(() => new Error('Failed to generate recommendations'));
      })
    );
  }

  updateUserAge(age: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/age`, { age });
  }
}