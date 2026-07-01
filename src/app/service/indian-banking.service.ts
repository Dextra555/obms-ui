import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface IndianBank {
  id: number;
  bankCode: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
  website: string;
  micrCode: string;
  swiftCode: string;
  rtgsEnabled: boolean;
  neftEnabled: boolean;
  impsEnabled: boolean;
  upiEnabled: boolean;
  isActive: boolean;
  createdDate: Date;
  createdBy: string;
  lastUpdatedBy: string;
  lastUpdatedDate: Date;
}

export interface IndianPaymentMode {
  id: number;
  modeName: string;
  modeCode: string;
  description: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  charges: number;
  createdDate: Date;
  createdBy: string;
  lastUpdatedBy: string;
  lastUpdatedDate: Date;
}

export interface BankAccount {
  id: number;
  accountNumber: string;
  accountType: string;
  accountHolderName: string;
  bankId: number;
  bankName: string;
  ifscCode: string;
  branchName: string;
  balance: number;
  isActive: boolean;
  createdDate: Date;
  createdBy: string;
  lastUpdatedBy: string;
  lastUpdatedDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class IndianBankingService {
  private apiUrl = 'http://localhost:5000/api/';

  constructor(private http: HttpClient) { }

  // Indian Banks Management
  getIndianBanks(): Observable<IndianBank[]> {
    return this.http.get<IndianBank[]>(`${this.apiUrl}indian-banking/banks`)
      .pipe(this.handleError);
  }

  getIndianBank(id: number): Observable<IndianBank> {
    return this.http.get<IndianBank>(`${this.apiUrl}indian-banking/bank/${id}`)
      .pipe(this.handleError);
  }

  createIndianBank(bank: IndianBank): Observable<IndianBank> {
    return this.http.post<IndianBank>(`${this.apiUrl}indian-banking/bank`, bank)
      .pipe(this.handleError);
  }

  updateIndianBank(id: number, bank: IndianBank): Observable<IndianBank> {
    return this.http.put<IndianBank>(`${this.apiUrl}indian-banking/bank/${id}`, bank)
      .pipe(this.handleError);
  }

  deleteIndianBank(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}indian-banking/bank/${id}`)
      .pipe(this.handleError);
  }

  // Payment Modes Management
  getPaymentModes(): Observable<IndianPaymentMode[]> {
    return this.http.get<IndianPaymentMode[]>(`${this.apiUrl}indian-banking/payment-modes`)
      .pipe(this.handleError);
  }

  getPaymentMode(id: number): Observable<IndianPaymentMode> {
    return this.http.get<IndianPaymentMode>(`${this.apiUrl}indian-banking/payment-mode/${id}`)
      .pipe(this.handleError);
  }

  createPaymentMode(mode: IndianPaymentMode): Observable<IndianPaymentMode> {
    return this.http.post<IndianPaymentMode>(`${this.apiUrl}indian-banking/payment-mode`, mode)
      .pipe(this.handleError);
  }

  updatePaymentMode(id: number, mode: IndianPaymentMode): Observable<IndianPaymentMode> {
    return this.http.put<IndianPaymentMode>(`${this.apiUrl}indian-banking/payment-mode/${id}`, mode)
      .pipe(this.handleError);
  }

  deletePaymentMode(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}indian-banking/payment-mode/${id}`)
      .pipe(this.handleError);
  }

  // Bank Account Management
  getBankAccounts(employeeId?: number): Observable<BankAccount[]> {
    const url = employeeId 
      ? `${this.apiUrl}indian-banking/accounts/${employeeId}`
      : `${this.apiUrl}indian-banking/accounts`;
    
    return this.http.get<BankAccount[]>(url)
      .pipe(this.handleError);
  }

  getBankAccount(id: number): Observable<BankAccount> {
    return this.http.get<BankAccount>(`${this.apiUrl}indian-banking/account/${id}`)
      .pipe(this.handleError);
  }

  createBankAccount(account: BankAccount): Observable<BankAccount> {
    return this.http.post<BankAccount>(`${this.apiUrl}indian-banking/account`, account)
      .pipe(this.handleError);
  }

  updateBankAccount(id: number, account: BankAccount): Observable<BankAccount> {
    return this.http.put<BankAccount>(`${this.apiUrl}indian-banking/account/${id}`, account)
      .pipe(this.handleError);
  }

  deleteBankAccount(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}indian-banking/account/${id}`)
      .pipe(this.handleError);
  }

  // Payment Processing
  processPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-banking/payment`, paymentData)
      .pipe(this.handleError);
  }

  getPaymentStatus(transactionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-banking/payment-status/${transactionId}`)
      .pipe(this.handleError);
  }

  // Bank Verification
  verifyBankAccount(accountNumber: string, ifscCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-banking/verify-account`, {
      accountNumber,
      ifscCode
    }).pipe(this.handleError);
  }

  verifyIFSC(ifscCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-banking/verify-ifsc`, { ifscCode })
      .pipe(this.handleError);
  }

  // Reports
  generateBankStatement(accountId: number, fromDate: string, toDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-banking/statement/${accountId}/${fromDate}/${toDate}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  generateTransactionReport(fromDate: string, toDate: string, bankId?: number): Observable<any> {
    const url = bankId 
      ? `${this.apiUrl}indian-banking/transactions/${fromDate}/${toDate}/${bankId}`
      : `${this.apiUrl}indian-banking/transactions/${fromDate}/${toDate}`;
    
    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  // Helper Methods
  formatBankAccountNumber(accountNumber: string): string {
    // Format as XXXX-XXXX-XXXX-XXXX
    return accountNumber.replace(/(\d{4})(?=\d)/g, '$1-');
  }

  maskBankAccountNumber(accountNumber: string): string {
    // Show only last 4 digits
    return 'XXXX-XXXX-XXXX-' + accountNumber.slice(-4);
  }

  validateIFSC(ifscCode: string): boolean {
    // IFSC format: 4 letters + 0 + 6 alphanumeric characters
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscPattern.test(ifscCode.toUpperCase());
  }

  validateBankAccount(accountNumber: string): boolean {
    // Bank account should be 9-18 digits
    const accountPattern = /^\d{9,18}$/;
    return accountPattern.test(accountNumber);
  }

  validateUPI(upiId: string): boolean {
    // UPI format: mobile@upi or username@upi
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiPattern.test(upiId);
  }

  getPaymentModeIcon(modeName: string): string {
    switch (modeName.toLowerCase()) {
      case 'neft': return 'fa-exchange-alt';
      case 'rtgs': return 'fa-money-check-alt';
      case 'imps': return 'fa-mobile-alt';
      case 'upi': return 'fa-qrcode';
      case 'cash': return 'fa-money-bill-wave';
      case 'cheque': return 'fa-money-check';
      case 'dd': return 'fa-file-invoice-dollar';
      default: return 'fa-credit-card';
    }
  }

  getPaymentModeColor(modeName: string): string {
    switch (modeName.toLowerCase()) {
      case 'neft': return '#007bff';
      case 'rtgs': return '#28a745';
      case 'imps': return '#17a2b8';
      case 'upi': return '#6f42c1';
      case 'cash': return '#fd7e14';
      case 'cheque': return '#20c997';
      case 'dd': return '#6610f2';
      default: return '#6c757d';
    }
  }

  // Predefined Indian Banks
  getPredefinedBanks(): IndianBank[] {
    return [
      {
        id: 0,
        bankCode: 'SBI',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0000000',
        branchName: 'Main Branch',
        address: 'Corporate Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        phone: '+91-22-22822222',
        email: 'contact@sbi.co.in',
        website: 'https://www.sbi.co.in',
        micrCode: '400000001',
        swiftCode: 'SBININBB',
        rtgsEnabled: true,
        neftEnabled: true,
        impsEnabled: true,
        upiEnabled: true,
        isActive: true,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        bankCode: 'HDFC',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0000000',
        branchName: 'Main Branch',
        address: 'Corporate Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        phone: '+91-22-61616000',
        email: 'support@hdfcbank.com',
        website: 'https://www.hdfcbank.com',
        micrCode: '400000002',
        swiftCode: 'HDFCINBB',
        rtgsEnabled: true,
        neftEnabled: true,
        impsEnabled: true,
        upiEnabled: true,
        isActive: true,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        bankCode: 'ICICI',
        bankName: 'ICICI Bank',
        ifscCode: 'ICIC0000000',
        branchName: 'Main Branch',
        address: 'Corporate Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        phone: '+91-22-26532653',
        email: 'customer.care@icicibank.com',
        website: 'https://www.icicibank.com',
        micrCode: '400000003',
        swiftCode: 'ICICINBB',
        rtgsEnabled: true,
        neftEnabled: true,
        impsEnabled: true,
        upiEnabled: true,
        isActive: true,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        bankCode: 'AXIS',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000000',
        branchName: 'Main Branch',
        address: 'Corporate Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        phone: '+91-22-27648000',
        email: 'service@axisbank.com',
        website: 'https://www.axisbank.com',
        micrCode: '400000004',
        swiftCode: 'AXISINBB',
        rtgsEnabled: true,
        neftEnabled: true,
        impsEnabled: true,
        upiEnabled: true,
        isActive: true,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      }
    ];
  }

  // Predefined Payment Modes
  getPredefinedPaymentModes(): IndianPaymentMode[] {
    return [
      {
        id: 0,
        modeName: 'NEFT',
        modeCode: 'NEFT',
        description: 'National Electronic Funds Transfer',
        isActive: true,
        minAmount: 1,
        maxAmount: 10000000,
        processingTime: '2-4 hours',
        charges: 0,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        modeName: 'RTGS',
        modeCode: 'RTGS',
        description: 'Real Time Gross Settlement',
        isActive: true,
        minAmount: 200000,
        maxAmount: 10000000,
        processingTime: 'Real-time',
        charges: 0,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        modeName: 'IMPS',
        modeCode: 'IMPS',
        description: 'Immediate Payment Service',
        isActive: true,
        minAmount: 1,
        maxAmount: 5000000,
        processingTime: 'Instant',
        charges: 0,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        modeName: 'UPI',
        modeCode: 'UPI',
        description: 'Unified Payments Interface',
        isActive: true,
        minAmount: 1,
        maxAmount: 1000000,
        processingTime: 'Instant',
        charges: 0,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        modeName: 'Cash',
        modeCode: 'CASH',
        description: 'Cash Payment',
        isActive: true,
        minAmount: 1,
        maxAmount: 1000000,
        processingTime: 'Immediate',
        charges: 0,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      },
      {
        id: 0,
        modeName: 'Cheque',
        modeCode: 'CHEQUE',
        description: 'Cheque Payment',
        isActive: true,
        minAmount: 1000,
        maxAmount: 10000000,
        processingTime: '2-3 days',
        charges: 0,
        createdDate: new Date(),
        createdBy: 'System',
        lastUpdatedBy: 'System',
        lastUpdatedDate: new Date()
      }
    ];
  }

  private handleError(error: any): Observable<never> {
    console.error('Indian Banking Service Error:', error);
    return throwError(() => 'An error occurred. Please try again later.');
  }
}
