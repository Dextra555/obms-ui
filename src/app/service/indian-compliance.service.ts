import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { IndianClientModel, INDIAN_STATES, GSTIN_PATTERN, PAN_PATTERN, PIN_CODE_PATTERN } from '../model/indian-client.model';
import { IndianEmployeeModel, SALARY_GROUPS, INDIAN_BANKS, AADHAAR_PATTERN, PHONE_PATTERN, MOBILE_PATTERN } from '../model/indian-employee.model';

@Injectable({
  providedIn: 'root'
})
export class IndianComplianceService {
  private apiUrl = 'http://localhost:5000/api/';

  constructor(private http: HttpClient) { }

  // Client Master Indian Compliance Methods
  validateGSTIN(gstin: string): boolean {
    return GSTIN_PATTERN.test(gstin);
  }

  validatePAN(pan: string): boolean {
    return PAN_PATTERN.test(pan);
  }

  validatePINCode(pin: string): boolean {
    return PIN_CODE_PATTERN.test(pin);
  }

  validateAadhaar(aadhaar: string): boolean {
    return AADHAAR_PATTERN.test(aadhaar);
  }

  validateIndianPhone(phone: string): boolean {
    return PHONE_PATTERN.test(phone);
  }

  validateIndianMobile(mobile: string): boolean {
    return MOBILE_PATTERN.test(mobile);
  }

  getIndianStates(): string[] {
    return INDIAN_STATES;
  }

  getIndianStatesFromAPI(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + 'statutory/indian-states');
  }

  getSalaryGroups(): any[] {
    return SALARY_GROUPS;
  }

  getIndianBanks(): any[] {
    return INDIAN_BANKS;
  }

  // Client CRUD with Indian Compliance
  getClientWithIndianCompliance(id: number): Observable<IndianClientModel> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<IndianClientModel>(`${this.apiUrl}indian-compliance/client`, { params })
      .pipe(this.handleError);
  }

  updateClientIndianCompliance(client: IndianClientModel): Observable<any> {
    return this.http.put(`${this.apiUrl}indian-compliance/client/${client.Id}`, client)
      .pipe(this.handleError);
  }

  // Employee CRUD with Indian Compliance
  getEmployeeWithIndianCompliance(id: number): Observable<IndianEmployeeModel> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<IndianEmployeeModel>(`${this.apiUrl}indian-compliance/employee`, { params })
      .pipe(this.handleError);
  }

  updateEmployeeIndianCompliance(employee: IndianEmployeeModel): Observable<any> {
    return this.http.put(`${this.apiUrl}indian-compliance/employee/${employee.EMP_ID}`, employee)
      .pipe(this.handleError);
  }

  // Bulk Migration Methods
  migrateClientsToIndian(): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-compliance/migrate/clients`, {})
      .pipe(this.handleError);
  }

  migrateEmployeesToIndian(): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-compliance/migrate/employees`, {})
      .pipe(this.handleError);
  }

  // Validation Methods
  validateClientData(client: IndianClientModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (client.GSTIN && !this.validateGSTIN(client.GSTIN)) {
      errors.push('Invalid GSTIN format');
    }

    if (client.PANNumber && !this.validatePAN(client.PANNumber)) {
      errors.push('Invalid PAN format');
    }

    if (client.PINCode && !this.validatePINCode(client.PINCode)) {
      errors.push('PIN code must be 6 digits');
    }

    if (client.Phone && !this.validateIndianPhone(client.Phone)) {
      errors.push('Phone must start with +91');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  validateEmployeeData(employee: IndianEmployeeModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (employee.AadhaarNumber && !this.validateAadhaar(employee.AadhaarNumber)) {
      errors.push('Aadhaar must be 12 digits');
    }

    if (employee.PANNumber && !this.validatePAN(employee.PANNumber)) {
      errors.push('Invalid PAN format');
    }

    if (employee.EMP_PHONE && !this.validateIndianPhone(employee.EMP_PHONE)) {
      errors.push('Phone must start with +91');
    }

    if (employee.EMP_MOBILEPHONE && !this.validateIndianMobile(employee.EMP_MOBILEPHONE)) {
      errors.push('Mobile must start with +91');
    }

    if (!SALARY_GROUPS.find(group => group.value === employee.SalaryGroup)) {
      errors.push('Invalid salary group');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Currency Conversion
  convertMYRToINR(amount: number): number {
    return amount * 18; // 1 MYR = 18 INR
  }

  formatIndianCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Phone Number Formatting
  formatIndianPhoneNumber(phone: string): string {
    if (phone.startsWith('0') && phone.length >= 10) {
      return '+91' + phone.substring(1);
    }
    return phone;
  }

  private handleError(error: any): Observable<never> {
    console.error('Indian Compliance Service Error:', error);
    return throwError(() => 'An error occurred. Please try again later.');
  }
}
