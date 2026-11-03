import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department } from '../models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/departments';

  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl);
  }

  create(dept: Omit<Department, 'id'>): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, dept);
  }

  update(id: string, dept: Omit<Department, 'id'>): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${id}`, { id, ...dept });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
