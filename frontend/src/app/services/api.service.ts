import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  login(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, {});
  }

  getListings(tabType: string, globalSearch: number): Observable<any> {
    const queryParams = [
      tabType ? `tab_type=${tabType}` : '',
      `globalsearch=${globalSearch}`,
    ]
      .filter(Boolean)
      .join('&');

    const url = `${this.baseUrl}/listings?${queryParams}`;
    return this.http.get<any>(url);
  }
}