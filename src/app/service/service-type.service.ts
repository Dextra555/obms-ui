import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ServiceType } from '../model/service-type.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {
  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getAllServiceTypes(): Observable<ServiceType[]> {
    return this.http.get<ServiceType[]>(`${this.apiUrl}servicetype`).pipe(
      catchError(this.handleError)
    );
  }

  getServiceTypeById(id: number): Observable<ServiceType> {
    return this.http.get<ServiceType>(`${this.apiUrl}servicetype/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createServiceType(serviceType: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}servicetype`, serviceType).pipe(
      catchError(this.handleError)
    );
  }

  updateServiceType(id: number, serviceType: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}servicetype/${id}`, serviceType).pipe(
      catchError(this.handleError)
    );
  }

  deleteServiceType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}servicetype/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 404) {
      errorMessage = 'Service type not found';
    } else if (error.status === 400) {
      errorMessage = 'Invalid service type data';
    } else if (error.status === 500) {
      errorMessage = 'Server error occurred';
    }

    return throwError(() => errorMessage);
  }
}
