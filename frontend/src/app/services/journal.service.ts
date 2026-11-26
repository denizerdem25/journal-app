import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  JournalEntry, JournalEntryRequest, MediaFile, MediaFileType,
} from '../models/journal-entry.model';

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private http = inject(HttpClient);
  private entriesUrl = `${environment.apiUrl}/entries`;
  private mediaUrlBase = `${environment.apiUrl}/media`;

  // ---------- Günlükler ----------

  getAll(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(this.entriesUrl);
  }

  getById(id: number): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.entriesUrl}/${id}`);
  }

  create(entry: JournalEntryRequest): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(this.entriesUrl, entry);
  }

  update(id: number, entry: JournalEntryRequest): Observable<JournalEntry> {
    return this.http.put<JournalEntry>(`${this.entriesUrl}/${id}`, entry);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.entriesUrl}/${id}`);
  }

  // ---------- Medya ----------

  uploadMedia(entryId: number, file: Blob, fileName: string, type: MediaFileType): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('type', type);
    return this.http.post<MediaFile>(`${this.entriesUrl}/${entryId}/media`, formData);
  }

  deleteMedia(mediaId: number): Observable<void> {
    return this.http.delete<void>(`${this.mediaUrlBase}/${mediaId}`);
  }

  /** <img src="..."> içinde kullanılacak dosya adresi */
  mediaUrl(mediaId: number): string {
    return `${this.mediaUrlBase}/${mediaId}/file`;
  }
}