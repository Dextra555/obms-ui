import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { IndianEmployeeModel } from '../model/indian-employee.model';

export interface PayrollDeduction {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  basicSalary: number;
  da: number;
  hra: number;
  otherAllowances: number;
  grossSalary: number;
  
  // Indian Deductions
  pfEmployeeContribution: number;
  pfEmployerContribution: number;
  esiEmployeeContribution: number;
  esiEmployerContribution: number;
  professionalTax: number;
  tdsDeduction: number;
  
  // Net Salary
  totalDeductions: number;
  netSalary: number;
  
  // Compliance Details
  pfAccountNumber: string;
  esiNumber: string;
  panNumber: string;
  salaryGroup: string;
}

export interface PayslipData {
  employeeId: number;
  payPeriod: string;
  basicSalary: number;
  earnings: any[];
  deductions: any[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  complianceStatus: {
    pfCompliant: boolean;
    esiCompliant: boolean;
    tdsCompliant: boolean;
    ptCompliant: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IndianPayrollService {
  private apiUrl = 'http://localhost:5000/api/';

  constructor(private http: HttpClient) { }

  // Calculate Indian Payroll Deductions
  calculatePayrollDeductions(employee: IndianEmployeeModel, basicSalary: number, da: number, hra: number, otherAllowances: number): Observable<PayrollDeduction> {
    const requestBody = {
      employeeId: employee.EMP_ID,
      basicSalary: basicSalary,
      da: da,
      hra: hra,
      otherAllowances: otherAllowances,
      pfAccountNumber: employee.PFAccountNumber,
      esiNumber: employee.ESINumber,
      panNumber: employee.PANNumber,
      salaryGroup: employee.SalaryGroup
    };

    return this.http.post<PayrollDeduction>(`${this.apiUrl}indian-payroll/calculate-deductions`, requestBody)
      .pipe(this.handleError);
  }

  // Generate Indian Payslip
  generatePayslip(employeeId: number, payPeriod: string): Observable<PayslipData> {
    return this.http.get<PayslipData>(`${this.apiUrl}indian-payroll/generate-payslip/${employeeId}/${payPeriod}`)
      .pipe(this.handleError);
  }

  // Process Payroll for Multiple Employees
  processBulkPayroll(employeeIds: number[], payPeriod: string): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-payroll/bulk-process`, {
      employeeIds: employeeIds,
      payPeriod: payPeriod
    }).pipe(this.handleError);
  }

  // Get PF Contribution Details
  getPFContributionDetails(employeeId: number, fromDate: string, toDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-payroll/pf-contribution/${employeeId}/${fromDate}/${toDate}`)
      .pipe(this.handleError);
  }

  // Get ESI Contribution Details
  getESIContributionDetails(employeeId: number, fromDate: string, toDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-payroll/esi-contribution/${employeeId}/${fromDate}/${toDate}`)
      .pipe(this.handleError);
  }

  // Get TDS Details
  getTDSDetails(employeeId: number, financialYear: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-payroll/tds-details/${employeeId}/${financialYear}`)
      .pipe(this.handleError);
  }

  // Get Professional Tax Details
  getProfessionalTaxDetails(employeeId: number, month: string, year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-payroll/professional-tax/${employeeId}/${month}/${year}`)
      .pipe(this.handleError);
  }

  // Compliance Status Dashboard
  getComplianceDashboard(branchCode?: string): Observable<any> {
    const url = branchCode 
      ? `${this.apiUrl}indian-payroll/compliance-dashboard/${branchCode}`
      : `${this.apiUrl}indian-payroll/compliance-dashboard`;
    
    return this.http.get(url).pipe(this.handleError);
  }

  // Generate PF Statement
  generatePFStatement(employeeId: number, financialYear: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-payroll/pf-statement/${employeeId}/${financialYear}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  // Generate ESI Statement
  generateESIStatement(employeeId: number, financialYear: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-payroll/esi-statement/${employeeId}/${financialYear}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  // Generate Form 16 (TDS Certificate)
  generateForm16(employeeId: number, financialYear: string): Observable<any> {
    return this.http.get(`${this.apiUrl}indian-payroll/form16/${employeeId}/${financialYear}`, {
      responseType: 'blob'
    }).pipe(this.handleError);
  }

  // Validate Compliance
  validateCompliance(employeeId: number, payPeriod: string): Observable<any> {
    return this.http.post(`${this.apiUrl}indian-payroll/validate-compliance`, {
      employeeId: employeeId,
      payPeriod: payPeriod
    }).pipe(this.handleError);
  }

  // Helper Methods
  calculatePF(basicSalary: number, employeeRate: number = 0.12, employerRate: number = 0.12): { employee: number, employer: number } {
    const pfAmount = Math.min(basicSalary, 15000); // PF capped at 15000
    return {
      employee: pfAmount * employeeRate,
      employer: pfAmount * employerRate
    };
  }

  calculateESI(grossSalary: number, employeeRate: number = 0.0075, employerRate: number = 0.0325): { employee: number, employer: number } {
    const esiAmount = Math.min(grossSalary, 21000); // ESI capped at 21000
    return {
      employee: esiAmount * employeeRate,
      employer: esiAmount * employerRate
    };
  }

  calculateProfessionalTax(grossSalary: number, state: string): number {
    // Professional Tax rates vary by state
    const ptRates: { [key: string]: number } = {
      'Maharashtra': 200,
      'Karnataka': 200,
      'Tamil Nadu': 125,
      'Delhi': 0,
      'Gujarat': 200,
      'West Bengal': 100,
      'Uttar Pradesh': 0,
      'Rajasthan': 100,
      'Punjab': 200,
      'Haryana': 0
    };

    // Simplified PT calculation
    if (grossSalary <= 10000) return 0;
    if (grossSalary <= 15000) return ptRates[state] || 150;
    if (grossSalary <= 20000) return ptRates[state] || 200;
    return ptRates[state] || 250;
  }

  calculateTDS(annualIncome: number, panNumber: string): number {
    // Simplified TDS calculation (actual calculation requires more complexity)
    const slabs = [
      { min: 0, max: 250000, rate: 0 },
      { min: 250001, max: 500000, rate: 0.05 },
      { min: 500001, max: 1000000, rate: 0.20 },
      { min: 1000001, max: Infinity, rate: 0.30 }
    ];

    let tax = 0;
    let remainingIncome = annualIncome;

    for (const slab of slabs) {
      if (remainingIncome <= 0) break;
      
      const taxableAmount = Math.min(remainingIncome, slab.max - slab.min + 1);
      tax += taxableAmount * slab.rate;
      remainingIncome -= taxableAmount;
    }

    // Add 4% health and education cess
    tax *= 1.04;

    return Math.round(tax / 12); // Monthly TDS
  }

  formatIndianCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  private handleError(error: any): Observable<never> {
    console.error('Indian Payroll Service Error:', error);
    return throwError(() => 'An error occurred. Please try again later.');
  }
}
