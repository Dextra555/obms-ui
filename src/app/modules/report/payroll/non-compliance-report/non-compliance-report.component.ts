import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { ClientModel } from 'src/app/model/clientModel';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-non-compliance-report',
  templateUrl: './non-compliance-report.component.html',
  styleUrls: ['./non-compliance-report.component.css']
})
export class NonComplianceReportComponent implements OnInit {
  nonComplianceForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  clientModel!: ClientModel[];
  currentUser: string = '';
  errorMessage: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  selectedReportType: string = 'form-xxvi';
  
  currentReportHtml: SafeHtml | null = null;
  currentReportHtmlRaw: string = '';
  reportTemplates: { [key: string]: string } = {};

  constructor(
    public sanitizer: DomSanitizer, 
    private fb: FormBuilder, 
    private http: HttpClient,
    private _dataService: DatasharingService, 
    private _masterService: MastermoduleService,
    private router: Router
  ) {
    this.nonComplianceForm = this.fb.group({
      BranchCode: ['', Validators.required],
      ClientCode: [''],
      Month: [new Date().getMonth() + 1, Validators.required],
      Year: [new Date().getFullYear(), Validators.required]
    });
    // ClientCode is already in the form – kept for clarity

    this.userAccessModel = {
      readAccess: false, updateAccess: false,
      deleteAccess: false, createAccess: false,
    }
  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop();
      }
    });

    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }

    this.loadComplianceReportTemplates();
    this.getUserAccessRights(this.currentUser, 'Non-Compliance Report');
  }

  loadComplianceReportTemplates() {
    const reportTypes = ['form-xxvi-compliance', 'form-xxvii-compliance', 'form-xxviii-compliance'];
    reportTypes.forEach(type => {
      const path = `assets/report-templates/non-compliance/${type}.html`;
      this.http.get(path, { responseType: 'text' }).subscribe(
        (htmlTemplate: string) => { this.reportTemplates[type] = htmlTemplate; },
        (error) => { console.warn(`Could not load template for ${type}`, error); }
      );
    });
  }

  getBranchName(): string {
    const branchCode = this.nonComplianceForm.get('BranchCode')?.value;
    return this.branchModel?.find(b => b.Code === branchCode)?.Name || branchCode || '';
  }

  getClientName(): string {
    const clientCode = this.nonComplianceForm.get('ClientCode')?.value;
    return this.clientModel?.find(c => c.Code === clientCode)?.Name || clientCode || 'All Clients';
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data: any) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin' || this.currentUser == 'admin') {
            this.warningMessage = '';
            this.getBranchMasterListByUser(this.currentUser);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
          }
        }
        this.hideSpinner();
      },
      (error: any) => {
        this.handleErrors(error);
      }
    );
  }

  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data: BranchModel[]) => {
        this.branchModel = data;
        this.showLoadingSpinner = false;
      },
      (error: any) => {
        this.handleErrors(error);
      }
    );
  }

  onBranchSelectionChange(event: any) {
    const branchCode = this.nonComplianceForm.get('BranchCode')?.value;
    if (branchCode) {
      this.getClientListByBranch(branchCode);
    }
  }

  getClientListByBranch(branchCode: string) {
    this._masterService.getClientMsterListByBranch(branchCode).subscribe(
      (data: ClientModel[]) => {
        this.clientModel = data;
      },
      (error: any) => {
        this.handleErrors(error);
      }
    );
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  }

  private mapReportName(reportType: string): string {
    const nameMap: { [key: string]: string } = {
      'form-xxvi': 'FormXXVICompliance',
      'form-xxvii': 'FormXXVIICompliance',
      'form-xxviii': 'FormXXVIIICompliance'
    };
    return nameMap[reportType] || reportType;
  }

  showForm(formType: string) {
    if (this.nonComplianceForm.invalid) {
      this.errorMessage = 'Please select Branch, Month and Year first.';
      return;
    }
    
    this.selectedReportType = formType;
    this.errorMessage = '';
    const formValues = this.nonComplianceForm.value;
    const month = (formValues.Month as number).toString().padStart(2, '0');
    const period = `${formValues.Year}-${month}`;
    const branchName = this.branchModel?.find(b => b.Code === formValues.BranchCode)?.Name || '';
    const clientName = this.clientModel?.find(c => c.Code === formValues.ClientCode)?.Name || '';
    const monthName = this.getMonthName(formValues.Month);
    const year = formValues.Year;

    const templateKey = `${formType}-compliance`;
    const baseTemplate = this.reportTemplates[templateKey];
    if (!baseTemplate) {
      this.errorMessage = `Template for ${templateKey} not loaded yet. (Maybe still loading?)`;
      return;
    }

    const payload = {
      branch: formValues.BranchCode,
      client: formValues.ClientCode || '',
      period
    };

    this.showLoadingSpinner = true;
    const backendReportName = this.mapReportName(formType);

    this._masterService.getComplianceReportData(backendReportName, payload).subscribe(
      (reportData: any) => {
        this.showLoadingSpinner = false;
        
        const apiMeta = reportData?.metadata || {};
        const metaData = {
          Establishment: this.getBranchName(),
          Branch: branchName,
          BranchName: branchName,
          Client: clientName,
          ClientName: clientName,
          Period: `${monthName} ${year}`,
          DateRange: period,
          GeneratedDate: new Date().toLocaleDateString('en-IN'),
          CompanyName: apiMeta['CompanyName'] || 'FreightWatch G Security Services India Pvt. Ltd.',
          CompanyAddress: apiMeta['CompanyAddress'] || 'No.397 (old no.281), Anna Salai, Precision Plaza, 1st Floor, Teynampet, Chennai - 600018',
          CompanyPhone: apiMeta['CompanyPhone'] || '+91 4440050684',
          CompanyEmail: apiMeta['CompanyEmail'] || 'info@fwgindia.com',
          CompanyCIN: apiMeta['CompanyCIN'] || 'U74920TN2005PTC057775',
          ReportId: `NC-${year}${String(formValues.Month).padStart(2, '0')}-${formValues.BranchCode}`
        };

        const html = this.renderReportHtml(formType, baseTemplate, reportData, metaData);
        this.currentReportHtmlRaw = html;
        this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
      },
      (error: any) => {
        this.showLoadingSpinner = false;
        this.errorMessage = `Failed to load non-compliance data. ${error?.message || error || 'Please ensure the backend is running.'}`;
        console.error('Non-Compliance Report API error:', error);
      }
    );
  }

  generateExcelFileClick() {
    if (!this.currentReportHtmlRaw) {
      this.errorMessage = 'Please generate a report first before exporting.';
      return;
    }
    try {
      this.errorMessage = '';
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.currentReportHtmlRaw, 'text/html');
      const tables = Array.from(doc.querySelectorAll('table'));
      if (!tables.length) {
        this.errorMessage = 'No table found in report to export.';
        return;
      }
      const workbook = XLSX.utils.book_new();
      tables.forEach((table, index) => {
        const worksheet = XLSX.utils.table_to_sheet(table as HTMLTableElement);
        const sheetName = `Report${index + 1}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      const reportTypeLabel = this.selectedReportType.replace('-', '_');
      const month = this.nonComplianceForm.value.Month || new Date().getMonth() + 1;
      const year = this.nonComplianceForm.value.Year || new Date().getFullYear();
      const fileName = `Compliance_${reportTypeLabel}_${year}_${String(month).padStart(2, '0')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Excel export failed', error);
      this.errorMessage = 'Failed to generate Excel. Please try again.';
    }
  }

  printReport() {
    if (!this.currentReportHtmlRaw) {
      this.errorMessage = 'Please generate a report to preview before printing.';
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.errorMessage = 'Unable to open print preview window. Please check your popup settings.';
      return;
    }
    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Report Preview</title><style>
      body { font-family: Arial, sans-serif; margin: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #333; padding: 4px; }
      th { background: #4CAF50; color: #fff; }
      .violation-yes { color: red; font-weight: bold; }
      .severity-low { background: #28a745; color: white; }
      .severity-medium { background: #ffc107; color: black; }
      .severity-high { background: #fd7e14; color: white; }
      .severity-critical { background: #dc3545; color: white; }
    </style></head><body>${this.currentReportHtmlRaw}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  private generateSampleData(reportType: string): any {
    if (reportType === 'form-xxvi') {
      return {
        rows: [
          {
            sno: 1, employeeCode: 'EMP001', employeeName: 'John Doe', branch: 'MAIN', client: 'CLIENT_A',
            totalDays: 28, daysWorked: 15, attendanceIssue: 'Excessive Absenteeism', severity: 'High',
            description: 'Employee attendance below minimum required days (46.67% attendance rate)',
            dueDate: '2024-03-10', status: 'Pending', assignedTo: 'HR Manager', reportedDate: '2024-02-28', penaltyAmount: 2000
          },
          {
            sno: 2, employeeCode: 'EMP002', employeeName: 'Jane Smith', branch: 'BRANCH1', client: 'CLIENT_B',
            totalDays: 28, daysWorked: 0, attendanceIssue: 'No Attendance Records', severity: 'Critical',
            description: 'Complete absence of attendance records for the month',
            dueDate: '2024-03-05', status: 'Overdue', assignedTo: 'Site Manager', reportedDate: '2024-02-25', penaltyAmount: 5000
          }
        ],
        totals: { totalPenalties: 7000 }
      };
    } else if (reportType === 'form-xxviii') {
      return {
        rows: [
          {
            sno: 1, employeeCode: 'EMP001', employeeName: 'John Doe', branch: 'MAIN', client: 'CLIENT_A',
            basicWages: 8000, minimumWageViolation: true, pfDeductionIssue: false, esiDeductionIssue: true,
            ptDeductionIssue: false, salaryDelay: false, severity: 'High',
            description: 'Basic wages below minimum wage requirement (₹8,000 vs required ₹10,000). ESI contribution not deducted.',
            dueDate: '2024-03-12', status: 'Pending', assignedTo: 'Payroll Manager', reportedDate: '2024-02-28', penaltyAmount: 3000
          },
          {
            sno: 2, employeeCode: 'EMP002', employeeName: 'Jane Smith', branch: 'BRANCH1', client: 'CLIENT_B',
            basicWages: 12000, minimumWageViolation: false, pfDeductionIssue: true, esiDeductionIssue: false,
            ptDeductionIssue: true, salaryDelay: true, severity: 'Critical',
            description: 'PF contribution not deducted. Professional tax not paid. Salary delayed by 15 days.',
            dueDate: '2024-03-05', status: 'Overdue', assignedTo: 'Finance Manager', reportedDate: '2024-02-25', penaltyAmount: 8000
          }
        ],
        totals: { totalPenalties: 11000 }
      };
    } else if (reportType === 'form-xxvii') {
      return {
        rows: [
          {
            sno: 1, employeeCode: 'EMP001', employeeName: 'John Doe', branch: 'MAIN', client: 'CLIENT_A',
            basicWages: 8000, minimumWageViolation: true, pfDeductionIssue: false, esiDeductionIssue: true,
            ptDeductionIssue: false, salaryDelay: false, severity: 'High',
            description: 'Basic wages below minimum wage requirement (₹8,000 vs required ₹10,000). ESI contribution not deducted.',
            dueDate: '2024-03-12', status: 'Pending', assignedTo: 'Payroll Manager', reportedDate: '2024-02-28', penaltyAmount: 3000
          }
        ],
        totals: { totalPenalties: 3000 }
      };
    }
    return { rows: [], totals: {} };
  }

  private renderReportHtml(reportType: string, template: string, apiData: any, meta: any): string {
    let filled = template;
    Object.keys(meta).forEach(key => {
      const re = new RegExp(`{{${key}}}`, 'g');
      filled = filled.replace(re, meta[key] || '');
    });
    let rowHtml = '<tr><td colspan="99">No records found</td></tr>';
    if (apiData?.rows && apiData.rows.length > 0) {
      rowHtml = apiData.rows.map((row: any, index: number) => this.buildRowHtml(reportType, row, index)).join('');
    }
    filled = filled.replace(/{{DataRows}}/g, rowHtml);
    if (apiData?.totals) {
      Object.keys(apiData.totals).forEach(k => {
        const token = `{{${k}}}`;
        const value = apiData.totals[k];
        filled = filled.replace(new RegExp(token, 'g'), String(value || 0));
      });
    }

    // Replace placeholders matching {{Key}} or {{Key || Default}}
    filled = filled.replace(/{{\s*([\w]+)(?:\s*\|\|\s*['"]?([^'"}]+)['"]?)?\s*}}/g, (match, key, defaultValue) => {
      return defaultValue !== undefined ? defaultValue : 'N/A';
    });

    return filled;
  }

  private buildRowHtml(reportType: string, row: any, index: number): string {
    // Safe accessors to prevent runtime errors when API returns incomplete rows
    const severity = (row.severity || 'Low') as string;
    const status   = (row.status   || 'Pending') as string;
    switch (reportType) {
      case 'form-xxvi': {
        const totalDays = row.totalDays || 1;
        const daysWorked = row.daysWorked || 0;
        const attendancePercentage = parseFloat(((daysWorked / totalDays) * 100).toFixed(1));
        const severityClass  = `severity-${severity.toLowerCase()}`;
        const statusClass    = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
        const attendanceClass = attendancePercentage < 75 ? 'attendance-low' : 'attendance-good';
        return `
          <tr>
            <td class="text-center">${row.sno || index + 1}</td>
            <td>${row.employeeCode ?? ''}</td>
            <td>${row.employeeName ?? ''}</td>
            <td>${row.branch ?? ''}</td>
            <td>${row.client ?? ''}</td>
            <td class="text-center">${totalDays}</td>
            <td class="text-center">${daysWorked}</td>
            <td class="text-center ${attendanceClass}">${attendancePercentage}%</td>
            <td>${row.attendanceIssue ?? ''}</td>
            <td>${row.description ?? ''}</td>
            <td class="text-center ${severityClass}">${severity}</td>
            <td class="text-center ${statusClass}">${status}</td>
            <td>${row.assignedTo ?? ''}</td>
            <td class="text-center">${row.dueDate ?? ''}</td>
            <td class="text-right">₹${(row.penaltyAmount ?? 0).toLocaleString()}</td>
          </tr>
        `;
      }
      case 'form-xxvii':
      case 'form-xxviii': {
        const severityClass2 = `severity-${severity.toLowerCase()}`;
        const statusClass2   = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
        const basicWages = row.basicWages ?? 0;
        return `
          <tr>
            <td class="text-center">${row.sno || index + 1}</td>
            <td>${row.employeeCode ?? ''}</td>
            <td>${row.employeeName ?? ''}</td>
            <td>${row.branch ?? ''}</td>
            <td>${row.client ?? ''}</td>
            <td class="text-right">₹${basicWages.toLocaleString()}</td>
            <td class="text-center ${row.minimumWageViolation ? 'violation-yes' : 'violation-no'}">${row.minimumWageViolation ? 'YES' : 'NO'}</td>
            <td class="text-center ${row.pfDeductionIssue ? 'violation-yes' : 'violation-no'}">${row.pfDeductionIssue ? 'YES' : 'NO'}</td>
            <td class="text-center ${row.esiDeductionIssue ? 'violation-yes' : 'violation-no'}">${row.esiDeductionIssue ? 'YES' : 'NO'}</td>
            <td class="text-center ${row.ptDeductionIssue ? 'violation-yes' : 'violation-no'}">${row.ptDeductionIssue ? 'YES' : 'NO'}</td>
            <td class="text-center ${row.salaryDelay ? 'violation-yes' : 'violation-no'}">${row.salaryDelay ? 'YES' : 'NO'}</td>
            <td>${row.description ?? ''}</td>
            <td class="text-center ${severityClass2}">${severity}</td>
            <td class="text-center ${statusClass2}">${status}</td>
            <td>${row.assignedTo ?? ''}</td>
            <td class="text-center">${row.dueDate ?? ''}</td>
            <td class="text-right">₹${(row.penaltyAmount ?? 0).toLocaleString()}</td>
          </tr>
        `;
      }
      default:
        return '';
    }
  }

  handleErrors(error: any) {
    this.errorMessage = 'An error occurred while processing your request. Please try again.';
    this.hideSpinner();
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
