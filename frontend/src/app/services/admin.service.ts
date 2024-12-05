import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// admin.service.ts
export interface Movie {
  id?: number;
  title: string;
  release_date: string;
  original_language: string;
  genres: string;
  cast: string;
  director: string;
  poster_path?: string;
}

export interface Book {
  isbn?: number;
  book_title: string;
  book_author: string;
  year_of_publication: number;
  image_url_s?: string;
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
    return this.http.get<Movie[]>(`${this.BASE_URL}/listings?type=movie`);
  }

  getRecentBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.BASE_URL}/listings?type=book`);
  }
}