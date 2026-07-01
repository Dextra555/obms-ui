import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IndianBank {
  id: number;
  bankCode: string;
  bankName: string;
  ifscCode: string;
  micrCode: string | null;
  branchName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string | null;
  lastUpdatedBy: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // Get all active banks
  getActiveBanks(): Observable<IndianBank[]> {
    return this.http.get<IndianBank[]>(`${this.apiUrl}bank/active`);
  }

  // Get bank names
  getBankNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}bank/names`);
  }

  // Get bank by code
  getBankByCode(bankCode: string): Observable<IndianBank> {
    return this.http.get<IndianBank>(`${this.apiUrl}bank/by-code/${bankCode}`);
  }

  // Get bank by IFSC
  getBankByIFSC(ifscCode: string): Observable<IndianBank> {
    return this.http.get<IndianBank>(`${this.apiUrl}bank/by-ifsc/${ifscCode}`);
  }

  // Validate IFSC code
  validateIFSC(ifscCode: string): Observable<{ isValid: boolean; ifscCode: string }> {
    return this.http.get<{ isValid: boolean; ifscCode: string }>(`${this.apiUrl}bank/validate-ifsc/${ifscCode}`);
  }
}
