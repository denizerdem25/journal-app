import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { JournalEntry, JournalEntryRequest } from '../models/journal-entry.model';

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/entries`;

  getAll(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(this.baseUrl);
  }

  getById(id: number): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.baseUrl}/${id}`);
  }

  create(entry: JournalEntryRequest): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(this.baseUrl, entry);
  }

  update(id: number, entry: JournalEntryRequest): Observable<JournalEntry> {
    return this.http.put<JournalEntry>(`${this.baseUrl}/${id}`, entry);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}