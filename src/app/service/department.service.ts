import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
<<<<<<< HEAD
import { environment } from 'src/environments/environment';
=======
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87

export interface Department {
  DepartmentId: number;
  DepartmentCode: string;
  DepartmentName: string;
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
export class DepartmentService {
<<<<<<< HEAD
  private baseUrl = environment.baseUrl + 'Department';
=======
  private baseUrl = '/api/Department';
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87

  constructor(private http: HttpClient) { }

  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>(this.baseUrl);
  }

  getById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.baseUrl}/${id}`);
  }

  getByCode(code: string): Observable<Department> {
    return this.http.get<Department>(`${this.baseUrl}/code/${code}`);
  }

  create(department: Department): Observable<Department> {
    return this.http.post<Department>(this.baseUrl, department);
  }

  update(id: number, department: Department): Observable<Department> {
    return this.http.put<Department>(`${this.baseUrl}/${id}`, department);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
