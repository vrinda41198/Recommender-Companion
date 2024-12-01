import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Movie {
  id?: number;
  title: string;
  cast: string[];
  description: string;
  release_year: number;
  genre: string;
}

export interface Book {
  id?: number;
  title: string;
  author: string;
  description: string;
  publish_year: number;
  genre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly BASE_URL = '/api';

  constructor(private http: HttpClient) {}

  addMovie(movie: Movie): Observable<any> {
    return this.http.post(`${this.BASE_URL}/movies`, movie);
  }

  addBook(book: Book): Observable<any> {
    return this.http.post(`${this.BASE_URL}/books`, book);
  }

  getRecentMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${this.BASE_URL}/listings?tab_type=movie`);
  }

  getRecentBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.BASE_URL}/listings?tab_type=book`);
  }
}