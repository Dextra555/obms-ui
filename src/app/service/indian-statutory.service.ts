import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PFCalculationRequest {
  basicSalary: number;
  da: number;
  calculationDate: string;
}

export interface PFCalculationResponse {
  basicSalary: number;
  dearnessAllowance: number;
  totalWages: number;
  isPFApplicable: boolean;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  employeeContributionRate: number;
  employerContributionRate: number;
  calculationDate: string;
}

export interface ESICalculationRequest {
  grossSalary: number;
  calculationDate: string;
}

export interface ESICalculationResponse {
  grossSalary: number;
  isESIApplicable: boolean;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  employeeContributionRate: number;
  employerContributionRate: number;
  calculationDate: string;
}

export interface ProfessionalTaxRequest {
  grossSalary: number;
  state: string;
  calculationDate: string;
}

export interface ProfessionalTaxResponse {
  grossSalary: number;
  state: string;
  taxAmount: number;
  isApplicable: boolean;
  calculationDate: string;
  taxSlab: string;
}

export interface TDSCalculationRequest {
  annualIncome: number;
  financialYear: string;
  ageGroup: number;
}

export interface TDSCalculationResponse {
  annualIncome: number;
  financialYear: string;
  ageGroup: number;
  taxableIncome: number;
  taxAmount: number;
  surcharge: number;
  educationCess: number;
  totalTax: number;
  monthlyTDS: number;
  isApplicable: boolean;
  slabDetails: TDSSlabDetail[];
}

export interface TDSSlabDetail {
  minIncome: number;
  maxIncome: number | null;
  taxRate: number;
  taxAmount: number;
  taxableAmount: number;
}

export interface GSTCalculationRequest {
  amount: number;
  hsnCode: string;
  supplierState: string;
  recipientState: string;
  invoiceDate: string;
}

export interface GSTCalculationResponse {
  amount: number;
  hsnCode: string;
  supplierState: string;
  recipientState: string;
  gstRate: number;
  isIntraState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  totalAmount: number;
  invoiceDate: string;
  gstDescription: string;
}

@Injectable({
  providedIn: 'root'
})
export class IndianStatutoryService {
  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // PF Calculation
  calculatePF(request: PFCalculationRequest): Observable<PFCalculationResponse> {
    return this.http.post<PFCalculationResponse>(`${this.apiUrl}statutory/calculate-pf`, request, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // ESI Calculation
  calculateESI(request: ESICalculationRequest): Observable<ESICalculationResponse> {
    return this.http.post<ESICalculationResponse>(`${this.apiUrl}statutory/calculate-esi`, request, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Professional Tax Calculation
  calculateProfessionalTax(request: ProfessionalTaxRequest): Observable<ProfessionalTaxResponse> {
    return this.http.post<ProfessionalTaxResponse>(`${this.apiUrl}statutory/calculate-pt`, request, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // TDS Calculation
  calculateTDS(request: TDSCalculationRequest): Observable<TDSCalculationResponse> {
    return this.http.post<TDSCalculationResponse>(`${this.apiUrl}statutory/calculate-tds`, request, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // GST Calculation
  calculateGST(request: GSTCalculationRequest): Observable<GSTCalculationResponse> {
    return this.http.post<GSTCalculationResponse>(`${this.apiUrl}statutory/calculate-gst`, request, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Get PF Configuration
  getPFConfiguration(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}statutory/pf-configuration`);
  }

  // Get ESI Configuration
  getESIConfiguration(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}statutory/esi-configuration`);
  }

  // Get Professional Tax Configuration
  getPTConfiguration(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}statutory/pt-configuration`);
  }

  // Save Professional Tax Configuration
  savePTConfiguration(config: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}statutory/pt-configuration`, config, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Update Professional Tax Configuration
  updatePTConfiguration(id: number, config: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}statutory/pt-configuration/${id}`, config, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Delete Professional Tax Configuration
  deletePTConfiguration(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}statutory/pt-configuration/${id}`);
  }

  // Calculate Professional Tax (using GET endpoint)
  calculateProfessionalTaxByQuery(grossSalary: number, state: string, calculationDate?: string): Observable<ProfessionalTaxResponse> {
    let url = `${this.apiUrl}statutory/pt-calculate?grossSalary=${grossSalary}&state=${state}`;
    if (calculationDate) {
      url += `&calculationDate=${calculationDate}`;
    }
    return this.http.get<ProfessionalTaxResponse>(url);
  }

  // Get TDS Configuration
  getTDSConfiguration(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}statutory/tds-configuration`);
  }

  // Get GST Configuration
  getGSTConfiguration(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}statutory/gst-configuration`);
  }
}
