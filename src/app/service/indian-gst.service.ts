import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { IndianInvoice, IndianInvoiceItem, GSTTaxCalculation, GSTConfiguration } from '../model/indian-invoice.model';

@Injectable({
  providedIn: 'root'
})
export class IndianGSTService {
  private apiUrl = 'http://localhost:5000/api/';

  constructor(private http: HttpClient) { }

  // GST Configuration
  getGSTConfigurations(): Observable<GSTConfiguration[]> {
    return this.http.get<GSTConfiguration[]>(`${this.apiUrl}indian-gst/configurations`)
      .pipe(this.handleError);
  }

  saveGSTConfiguration(config: GSTConfiguration): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-gst/configuration`, config)
      .pipe(this.handleError);
  }

  updateGSTConfiguration(id: number, config: GSTConfiguration): Observable<any> {
    return this.http.put(`${this.apiUrl}indian-gst/configuration/${id}`, config)
      .pipe(this.handleError);
  }

  deleteGSTConfiguration(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}indian-gst/configuration/${id}`)
      .pipe(this.handleError);
  }

  // Invoice Management
  createIndianInvoice(invoice: IndianInvoice): Observable<IndianInvoice> {
    return this.http.post<IndianInvoice>(`${this.apiUrl}indian-gst/invoice`, invoice)
      .pipe(this.handleError);
  }

  updateIndianInvoice(id: number, invoice: IndianInvoice): Observable<IndianInvoice> {
    return this.http.put<IndianInvoice>(`${this.apiUrl}indian-gst/invoice/${id}`, invoice)
      .pipe(this.handleError);
  }

  getIndianInvoice(id: number): Observable<IndianInvoice> {
    return this.http.get<IndianInvoice>(`${this.apiUrl}indian-gst/invoice/${id}`)
      .pipe(this.handleError);
  }

  getIndianInvoices(clientId?: number, fromDate?: string, toDate?: string): Observable<IndianInvoice[]> {
    let params = '';
    if (clientId) params += `?clientId=${clientId}`;
    if (fromDate) params += params ? `&fromDate=${fromDate}` : `?fromDate=${fromDate}`;
    if (toDate) params += params ? `&toDate=${toDate}` : `?toDate=${toDate}`;
    
    return this.http.get<IndianInvoice[]>(`${this.apiUrl}indian-gst/invoices${params}`)
      .pipe(this.handleError);
  }

  // GST Calculations
  calculateGSTForItem(item: IndianInvoiceItem, clientState: string, supplyState: string): Observable<GSTTaxCalculation> {
    const requestBody = {
      item: item,
      clientState: clientState,
      supplyState: supplyState
    };
    
    return this.http.post<GSTTaxCalculation>(`${this.apiUrl}indian-gst/calculate-item-gst`, requestBody)
      .pipe(this.handleError);
  }

  calculateGSTForInvoice(invoice: IndianInvoice): Observable<IndianInvoice> {
    return this.http.post<IndianInvoice>(`${this.apiUrl}indian-gst/calculate-invoice-gst`, invoice)
      .pipe(this.handleError);
  }

  // GST Reports
  generateGSTReport(fromDate: string, toDate: string, reportType: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-gst/report/${fromDate}/${toDate}/${reportType}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  generateGSTSummary(financialYear: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-gst/summary/${financialYear}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  // GST Validation
  validateGSTIN(gstin: string): Observable<{ isValid: boolean; state?: string }> {
    return this.http.post<{ isValid: boolean; state?: string }>(`${this.apiUrl}indian-gst/validate-gstin`, { gstin })
      .pipe(this.handleError);
  }

  validateHSNCode(hsnCode: string): Observable<{ isValid: boolean; description?: string }> {
    return this.http.post<{ isValid: boolean; description?: string }>(`${this.apiUrl}indian-gst/validate-hsn`, { hsnCode })
      .pipe(this.handleError);
  }

  // GST Returns
  generateGSTR1(fromDate: string, toDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-gst/gstr1/${fromDate}/${toDate}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  generateGSTR3B(fromDate: string, toDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-gst/gstr3b/${fromDate}/${toDate}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  // Helper Methods
  formatGSTIN(gstin: string): string {
    return gstin.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  formatHSNCode(hsn: string): string {
    return hsn.replace(/[^0-9]/g, '').padStart(8, '0').slice(0, 8);
  }

  formatSACCode(sac: string): string {
    return sac.replace(/[^0-9]/g, '').padStart(9, '0').slice(0, 9);
  }

  calculateGSTAmount(taxableValue: number, rate: number): number {
    return Math.round((taxableValue * rate / 100) * 100) / 100; // Round to 2 decimal places
  }

  determineTaxType(clientState: string, supplyState: string): 'CGST' | 'SGST' | 'IGST' {
    return clientState === supplyState ? 'CGST' : 'IGST';
  }

  getTaxDescription(rate: number): string {
    switch (rate) {
      case 0: return 'Nil Rated';
      case 0.1: return '0.1%';
      case 0.25: return '0.25%';
      case 1: return '1%';
      case 1.5: return '1.5%';
      case 3: return '3%';
      case 5: return '5%';
      case 6: return '6%';
      case 7.5: return '7.5%';
      case 12: return '12%';
      case 15: return '15%';
      case 18: return '18%';
      case 21: return '21%';
      case 24: return '24%';
      case 28: return '28%';
      default: return `${rate}%`;
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Indian GST Service Error:', error);
    return throwError(() => 'An error occurred. Please try again later.');
  }
}
