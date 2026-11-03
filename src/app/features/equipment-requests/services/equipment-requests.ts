import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EquipmentRequest } from '../models/equipment-request.model';

@Injectable({
  providedIn: 'root'
})
export class EquipmentRequestsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/equipmentRequests';

  getAll(): Observable<EquipmentRequest[]> {
    return this.http.get<EquipmentRequest[]>(this.apiUrl);
  }

  getById(id: string): Observable<EquipmentRequest> {
    return this.http.get<EquipmentRequest>(`${this.apiUrl}/${id}`);
  }

  create(request: Omit<EquipmentRequest, 'id'>): Observable<EquipmentRequest> {
    return this.http.post<EquipmentRequest>(this.apiUrl, request);
  }

  update(id: string, request: Omit<EquipmentRequest, 'id'>): Observable<EquipmentRequest> {
    return this.http.put<EquipmentRequest>(`${this.apiUrl}/${id}`, { id, ...request });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
