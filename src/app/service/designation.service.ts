import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Designation {
  DesignationId: number;
  DesignationCode: string;
  DesignationName: string;
  Description?: string;
  IsActive: boolean;
  CreatedDate: string;
  CreatedBy?: string;
  UpdatedDate?: string;
  UpdatedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesignationService {
  private baseUrl = '/api/Designation';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Designation[]> {
    return this.http.get<Designation[]>(this.baseUrl);
  }

  getById(id: number): Observable<Designation> {
    return this.http.get<Designation>(`${this.baseUrl}/${id}`);
  }

  getByCode(code: string): Observable<Designation> {
    return this.http.get<Designation>(`${this.baseUrl}/code/${code}`);
  }

  create(designation: Designation): Observable<Designation> {
    return this.http.post<Designation>(this.baseUrl, designation);
  }

  update(id: number, designation: Designation): Observable<Designation> {
    return this.http.put<Designation>(`${this.baseUrl}/${id}`, designation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
