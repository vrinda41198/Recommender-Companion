import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie, Book, ApiResponse, Review, Recommendation } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getListings(type: string,  searchGlobal: boolean, query: string): Observable<ApiResponse<Movie | Book>> {
    let params = new HttpParams()
      .set('type', type)
      .set('search_global', searchGlobal)
    
    
    if (searchGlobal) {
      params = params.set('search_global', 'true');
    }
    
    if (query) {
      params = params.set('query', query);
    }
  
    return this.http.get<ApiResponse<Movie | Book>>(`${this.baseUrl}/listings`, { params });
  }

  submitReview(review: Review): Observable<any> {
    return this.http.post(`${this.baseUrl}/reviews`, review);
  }

  // If you have these endpoints
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

  generateRecommendations(): Observable<Recommendation[]> {
    return this.http.get<Recommendation[]>(`${this.baseUrl}/generate-recommendation`);
  }

  updateUserAge(age: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/age`, { age });
  }
}