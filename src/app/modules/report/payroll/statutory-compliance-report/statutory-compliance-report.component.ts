import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { ClientModel } from 'src/app/model/clientModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { IndianStatutoryService } from 'src/app/service/indian-statutory.service';
import { environment } from 'src/environments/environment';

export interface StatutoryComplianceData {
  complianceType: string;
  totalEmployees: number;
  compliantEmployees: number;
  nonCompliantEmployees: number;
  complianceRate: number;
  lastFiledDate?: string;
  dueDate?: string;
  status: 'Compliant' | 'Non-Compliant' | 'Pending' | 'Overdue';
  penalties?: number;
  remarks?: string;
}

export interface ComplianceDashboard {
  overallComplianceRate: number;
  totalStatutoryDeductions: number;
  totalPenalties: number;
  criticalIssues: number;
  upcomingDueDates: Array<{
    complianceType: string;
    dueDate: string;
    daysRemaining: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    pfRate: number;
    esiRate: number;
    ptRate: number;
    tdsRate: number;
  }>;
}

@Component({
  selector: 'app-statutory-compliance-report',
  templateUrl: './statutory-compliance-report.component.html',
  styleUrls: ['./statutory-compliance-report.component.css']
})
export class StatutoryComplianceReportComponent implements OnInit {
  statutoryComplianceForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  clientModel!: ClientModel[];
  currentUser: string = '';
  errorMessage: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  selectedReportType: string = 'dashboard';
  complianceData: StatutoryComplianceData[] = [];
  complianceDashboard: ComplianceDashboard | null = null;
  currentReportHtml: SafeHtml | null = null;
  
  // Report types
  reportTypes = [
    { value: 'dashboard', label: 'Compliance Dashboard' },
    { value: 'pf-compliance', label: 'PF Compliance Report' },
    { value: 'esi-compliance', label: 'ESI Compliance Report' },
    { value: 'pt-compliance', label: 'Professional Tax Compliance' },
    { value: 'tds-compliance', label: 'TDS Compliance Report' },
    { value: 'monthly-summary', label: 'Monthly Compliance Summary' },
    { value: 'annual-summary', label: 'Annual Compliance Summary' },
    { value: 'audit-report', label: 'Compliance Audit Report' }
  ];

  // Compliance status colors
  statusColors = {
    'Compliant': { color: '#28a745', icon: 'fas fa-check-circle' },
    'Non-Compliant': { color: '#dc3545', icon: 'fas fa-times-circle' },
    'Pending': { color: '#ffc107', icon: 'fas fa-clock' },
    'Overdue': { color: '#dc3545', icon: 'fas fa-exclamation-triangle' }
  };

  constructor(
    public sanitizer: DomSanitizer, 
    private fb: FormBuilder, 
    private _dataService: DatasharingService, 
    private _masterService: MastermoduleService,
    private _payrollService: PayrollModuleService,
    private _indianStatutoryService: IndianStatutoryService,
    private router: Router,
    private titleCasePipe: TitleCasePipe
  ) {
    this.statutoryComplianceForm = this.fb.group({
      ReportType: ['dashboard', Validators.required],
      BranchCode: ['', Validators.required],
      ClientCode: [''],
      Month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      Year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2030)]],
      Quarter: [''],
      FinancialYear: [''],
      IncludeDetails: [false]
    });

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
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
    this.getUserAccessRights(this.currentUser, 'Statutory Compliance Report');
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data: any) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
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

  onBranchSelectionChange(event: any) {
    const branchCode = this.statutoryComplianceForm.get('BranchCode')?.value;
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

  generateStatutoryComplianceReport(): void {
    if (this.statutoryComplianceForm.invalid) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    this.errorMessage = '';
    this.showLoadingSpinner = true;
    const formValues = this.statutoryComplianceForm.value;
    const month = formValues.Month.toString().padStart(2, '0');
    const period = `${formValues.Year}-${month}`;
    
    switch (formValues.ReportType) {
      case 'dashboard':
        this.generateComplianceDashboard(period, formValues);
        break;
      case 'pf-compliance':
        this.generatePFComplianceReport(period, formValues);
        break;
      case 'esi-compliance':
        this.generateESIComplianceReport(period, formValues);
        break;
      case 'pt-compliance':
        this.generatePTComplianceReport(period, formValues);
        break;
      case 'tds-compliance':
        this.generateTDSComplianceReport(period, formValues);
        break;
      case 'monthly-summary':
        this.generateMonthlySummary(period, formValues);
        break;
      case 'annual-summary':
        this.generateAnnualSummary(formValues);
        break;
      case 'audit-report':
        this.generateAuditReport(period, formValues);
        break;
      default:
        this.errorMessage = 'Invalid report type selected.';
        this.hideSpinner();
    }
  }

  generateComplianceDashboard(period: string, formValues: any) {
    // Mock dashboard data - in real implementation, this would call APIs
    this.complianceDashboard = {
      overallComplianceRate: 85.5,
      totalStatutoryDeductions: 2500000,
      totalPenalties: 15000,
      criticalIssues: 3,
      upcomingDueDates: [
        { complianceType: 'PF Return', dueDate: '2024-03-15', daysRemaining: 5 },
        { complianceType: 'ESI Return', dueDate: '2024-03-20', daysRemaining: 10 },
        { complianceType: 'PT Payment', dueDate: '2024-03-31', daysRemaining: 21 }
      ],
      monthlyTrends: [
        { month: 'Jan', pfRate: 92, esiRate: 88, ptRate: 95, tdsRate: 90 },
        { month: 'Feb', pfRate: 90, esiRate: 85, ptRate: 93, tdsRate: 88 },
        { month: 'Mar', pfRate: 88, esiRate: 87, ptRate: 91, tdsRate: 85 }
      ]
    };
    
    this.complianceData = [
      {
        complianceType: 'Provident Fund (PF)',
        totalEmployees: 150,
        compliantEmployees: 132,
        nonCompliantEmployees: 18,
        complianceRate: 88.0,
        lastFiledDate: '2024-02-15',
        dueDate: '2024-03-15',
        status: 'Compliant',
        penalties: 0,
        remarks: 'All contributions deposited on time'
      },
      {
        complianceType: 'Employee State Insurance (ESI)',
        totalEmployees: 120,
        compliantEmployees: 104,
        nonCompliantEmployees: 16,
        complianceRate: 86.7,
        lastFiledDate: '2024-02-20',
        dueDate: '2024-03-20',
        status: 'Compliant',
        penalties: 0,
        remarks: 'Monthly contributions regular'
      },
      {
        complianceType: 'Professional Tax (PT)',
        totalEmployees: 150,
        compliantEmployees: 137,
        nonCompliantEmployees: 13,
        complianceRate: 91.3,
        lastFiledDate: '2024-02-28',
        dueDate: '2024-03-31',
        status: 'Pending',
        penalties: 0,
        remarks: 'Payment due for current month'
      },
      {
        complianceType: 'Tax Deducted at Source (TDS)',
        totalEmployees: 80,
        compliantEmployees: 68,
        nonCompliantEmployees: 12,
        complianceRate: 85.0,
        lastFiledDate: '2024-02-25',
        dueDate: '2024-03-31',
        status: 'Non-Compliant',
        penalties: 15000,
        remarks: 'Quarterly filing pending for some employees'
      }
    ];
    
    this.generateDashboardHTML();
    this.hideSpinner();
  }

  generatePFComplianceReport(period: string, formValues: any) {
    this.complianceData = [
      {
        complianceType: 'PF Monthly Contribution',
        totalEmployees: 150,
        compliantEmployees: 145,
        nonCompliantEmployees: 5,
        complianceRate: 96.7,
        lastFiledDate: '2024-02-15',
        dueDate: '2024-03-15',
        status: 'Compliant',
        penalties: 0,
        remarks: 'Monthly contributions deposited regularly'
      },
      {
        complianceType: 'PF Annual Return',
        totalEmployees: 150,
        compliantEmployees: 150,
        nonCompliantEmployees: 0,
        complianceRate: 100.0,
        lastFiledDate: '2024-01-31',
        dueDate: '2025-01-31',
        status: 'Compliant',
        penalties: 0,
        remarks: 'Annual return filed for FY 2023-24'
      }
    ];
    
    this.generateComplianceHTML('PF Compliance Report');
    this.hideSpinner();
  }

  generateESIComplianceReport(period: string, formValues: any) {
    this.complianceData = [
      {
        complianceType: 'ESI Monthly Contribution',
        totalEmployees: 120,
        compliantEmployees: 115,
        nonCompliantEmployees: 5,
        complianceRate: 95.8,
        lastFiledDate: '2024-02-20',
        dueDate: '2024-03-20',
        status: 'Compliant',
        penalties: 0,
        remarks: 'Monthly contributions on time'
      },
      {
        complianceType: 'ESI Half-Yearly Return',
        totalEmployees: 120,
        compliantEmployees: 120,
        nonCompliantEmployees: 0,
        complianceRate: 100.0,
        lastFiledDate: '2024-01-31',
        dueDate: '2024-07-31',
        status: 'Compliant',
        penalties: 0,
        remarks: 'Half-yearly return filed'
      }
    ];
    
    this.generateComplianceHTML('ESI Compliance Report');
    this.hideSpinner();
  }

  generatePTComplianceReport(period: string, formValues: any) {
    this.complianceData = [
      {
        complianceType: 'Professional Tax Monthly',
        totalEmployees: 150,
        compliantEmployees: 140,
        nonCompliantEmployees: 10,
        complianceRate: 93.3,
        lastFiledDate: '2024-02-28',
        dueDate: '2024-03-31',
        status: 'Pending',
        penalties: 0,
        remarks: 'Payment due for March'
      }
    ];
    
    this.generateComplianceHTML('Professional Tax Compliance Report');
    this.hideSpinner();
  }

  generateTDSComplianceReport(period: string, formValues: any) {
    this.complianceData = [
      {
        complianceType: 'TDS Monthly Deduction',
        totalEmployees: 80,
        compliantEmployees: 75,
        nonCompliantEmployees: 5,
        complianceRate: 93.8,
        lastFiledDate: '2024-02-25',
        dueDate: '2024-03-25',
        status: 'Non-Compliant',
        penalties: 8000,
        remarks: 'Some employees TDS not deducted properly'
      },
      {
        complianceType: 'TDS Quarterly Return',
        totalEmployees: 80,
        compliantEmployees: 70,
        nonCompliantEmployees: 10,
        complianceRate: 87.5,
        lastFiledDate: '2024-01-31',
        dueDate: '2024-04-30',
        status: 'Pending',
        penalties: 7000,
        remarks: 'Quarter 4 return filing pending'
      }
    ];
    
    this.generateComplianceHTML('TDS Compliance Report');
    this.hideSpinner();
  }

  generateMonthlySummary(period: string, formValues: any) {
    this.complianceData = [
      {
        complianceType: 'PF Compliance',
        totalEmployees: 150,
        compliantEmployees: 132,
        nonCompliantEmployees: 18,
        complianceRate: 88.0,
        status: 'Compliant',
        penalties: 0
      },
      {
        complianceType: 'ESI Compliance',
        totalEmployees: 120,
        compliantEmployees: 104,
        nonCompliantEmployees: 16,
        complianceRate: 86.7,
        status: 'Compliant',
        penalties: 0
      },
      {
        complianceType: 'PT Compliance',
        totalEmployees: 150,
        compliantEmployees: 137,
        nonCompliantEmployees: 13,
        complianceRate: 91.3,
        status: 'Pending',
        penalties: 0
      },
      {
        complianceType: 'TDS Compliance',
        totalEmployees: 80,
        compliantEmployees: 68,
        nonCompliantEmployees: 12,
        complianceRate: 85.0,
        status: 'Non-Compliant',
        penalties: 15000
      }
    ];
    
    this.generateMonthlySummaryHTML();
    this.hideSpinner();
  }

  generateAnnualSummary(formValues: any) {
    this.complianceData = [
      {
        complianceType: 'PF Annual Compliance',
        totalEmployees: 150,
        compliantEmployees: 145,
        nonCompliantEmployees: 5,
        complianceRate: 96.7,
        status: 'Compliant',
        penalties: 5000
      },
      {
        complianceType: 'ESI Annual Compliance',
        totalEmployees: 120,
        compliantEmployees: 118,
        nonCompliantEmployees: 2,
        complianceRate: 98.3,
        status: 'Compliant',
        penalties: 2000
      },
      {
        complianceType: 'PT Annual Compliance',
        totalEmployees: 150,
        compliantEmployees: 148,
        nonCompliantEmployees: 2,
        complianceRate: 98.7,
        status: 'Compliant',
        penalties: 3000
      },
      {
        complianceType: 'TDS Annual Compliance',
        totalEmployees: 80,
        compliantEmployees: 75,
        nonCompliantEmployees: 5,
        complianceRate: 93.8,
        status: 'Non-Compliant',
        penalties: 25000
      }
    ];
    
    this.generateAnnualSummaryHTML();
    this.hideSpinner();
  }

  generateAuditReport(period: string, formValues: any) {
    this.complianceData = [
      {
        complianceType: 'PF Audit Findings',
        totalEmployees: 150,
        compliantEmployees: 130,
        nonCompliantEmployees: 20,
        complianceRate: 86.7,
        status: 'Non-Compliant',
        penalties: 10000,
        remarks: 'Minor discrepancies in contribution calculations'
      },
      {
        complianceType: 'ESI Audit Findings',
        totalEmployees: 120,
        compliantEmployees: 110,
        nonCompliantEmployees: 10,
        complianceRate: 91.7,
        status: 'Compliant',
        penalties: 0,
        remarks: 'All documentation in order'
      },
      {
        complianceType: 'PT Audit Findings',
        totalEmployees: 150,
        compliantEmployees: 145,
        nonCompliantEmployees: 5,
        complianceRate: 96.7,
        status: 'Compliant',
        penalties: 0,
        remarks: 'Timely payments maintained'
      },
      {
        complianceType: 'TDS Audit Findings',
        totalEmployees: 80,
        compliantEmployees: 72,
        nonCompliantEmployees: 8,
        complianceRate: 90.0,
        status: 'Non-Compliant',
        penalties: 15000,
        remarks: 'Some TDS certificates not issued'
      }
    ];
    
    this.generateAuditHTML();
    this.hideSpinner();
  }

  generateDashboardHTML() {
    if (!this.complianceDashboard) return;

    let html = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; color: #2c3e50;">Statutory Compliance Dashboard</h2>
        <p style="text-align: center;">Period: ${this.statutoryComplianceForm.get('Month')?.value}/${this.statutoryComplianceForm.get('Year')?.value}</p>
        
        <!-- Key Metrics -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">${this.complianceDashboard.overallComplianceRate}%</h3>
            <p style="margin: 5px 0;">Overall Compliance Rate</p>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">₹${(this.complianceDashboard.totalStatutoryDeductions / 100000).toFixed(1)}L</h3>
            <p style="margin: 5px 0;">Total Statutory Deductions</p>
          </div>
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">₹${this.complianceDashboard.totalPenalties.toLocaleString()}</h3>
            <p style="margin: 5px 0;">Total Penalties</p>
          </div>
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">${this.complianceDashboard.criticalIssues}</h3>
            <p style="margin: 5px 0;">Critical Issues</p>
          </div>
        </div>
        
        <!-- Upcoming Due Dates -->
        <div style="margin: 30px 0;">
          <h3>Upcoming Due Dates</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px;">
    `;

    this.complianceDashboard.upcomingDueDates.forEach(due => {
      const urgencyColor = due.daysRemaining <= 7 ? '#dc3545' : due.daysRemaining <= 15 ? '#ffc107' : '#28a745';
      html += `
        <div style="background: ${urgencyColor}20; border-left: 4px solid ${urgencyColor}; padding: 15px; border-radius: 5px;">
          <h4 style="margin: 0; color: ${urgencyColor};">${due.complianceType}</h4>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${due.dueDate}</p>
          <p style="margin: 5px 0;"><strong>Days Remaining:</strong> ${due.daysRemaining} days</p>
        </div>
      `;
    });

    html += `
          </div>
        </div>
        
        <!-- Compliance Details Table -->
        <div style="margin: 30px 0;">
          <h3>Compliance Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Compliance Type</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Total Employees</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliant</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Non-Compliant</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliance Rate</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Status</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Penalties</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
              </tr>
            </thead>
            <tbody>
    `;

    this.complianceData.forEach(item => {
      const statusColor = this.statusColors[item.status].color;
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${item.complianceType}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.totalEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">${item.compliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #dc3545; font-weight: bold;">${item.nonCompliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${item.complianceRate}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: ${statusColor}; font-weight: bold;">${item.status}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${(item.penalties || 0).toLocaleString()}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${item.remarks || '-'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
        
        <!-- Monthly Trends -->
        <div style="margin: 30px 0;">
          <h3>Monthly Compliance Trends</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #e9ecef;">
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Month</th>
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">PF Rate</th>
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">ESI Rate</th>
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">PT Rate</th>
                  <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">TDS Rate</th>
                </tr>
              </thead>
              <tbody>
    `;

    this.complianceDashboard.monthlyTrends.forEach(trend => {
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${trend.month}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: ${trend.pfRate >= 90 ? '#28a745' : '#dc3545'};">${trend.pfRate}%</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: ${trend.esiRate >= 90 ? '#28a745' : '#dc3545'};">${trend.esiRate}%</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: ${trend.ptRate >= 90 ? '#28a745' : '#dc3545'};">${trend.ptRate}%</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: ${trend.tdsRate >= 90 ? '#28a745' : '#dc3545'};">${trend.tdsRate}%</td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  generateComplianceHTML(reportTitle: string) {
    let html = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; color: #2c3e50;">${reportTitle}</h2>
        <p style="text-align: center;">Period: ${this.statutoryComplianceForm.get('Month')?.value}/${this.statutoryComplianceForm.get('Year')?.value}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Compliance Type</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Total Employees</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Non-Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliance Rate</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Last Filed</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Due Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Status</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Penalties</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.complianceData.forEach(item => {
      const statusColor = this.statusColors[item.status].color;
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${item.complianceType}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.totalEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">${item.compliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #dc3545; font-weight: bold;">${item.nonCompliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${item.complianceRate}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.lastFiledDate || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.dueDate || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: ${statusColor}; font-weight: bold;">${item.status}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${(item.penalties || 0).toLocaleString()}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${item.remarks || '-'}</td>
        </tr>
      `;
    });

    const totalPenalties = this.complianceData.reduce((sum, item) => sum + (item.penalties || 0), 0);
    const avgComplianceRate = (this.complianceData.reduce((sum, item) => sum + item.complianceRate, 0) / this.complianceData.length).toFixed(1);

    html += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #ddd; padding: 12px; text-align: right;">Average Compliance Rate:</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${avgComplianceRate}%</td>
              <td colspan="3" style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total Penalties:</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${totalPenalties.toLocaleString()}</td>
              <td style="border: 1px solid #ddd; padding: 12px;"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  generateMonthlySummaryHTML() {
    const totalEmployees = Math.max(...this.complianceData.map(d => d.totalEmployees));
    const totalCompliant = this.complianceData.reduce((sum, d) => sum + d.compliantEmployees, 0);
    const totalNonCompliant = this.complianceData.reduce((sum, d) => sum + d.nonCompliantEmployees, 0);
    const totalPenalties = this.complianceData.reduce((sum, d) => sum + (d.penalties || 0), 0);
    const overallRate = ((totalCompliant / (totalCompliant + totalNonCompliant)) * 100).toFixed(1);

    let html = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; color: #2c3e50;">Monthly Compliance Summary</h2>
        <p style="text-align: center;">Period: ${this.statutoryComplianceForm.get('Month')?.value}/${this.statutoryComplianceForm.get('Year')?.value}</p>
        
        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #28a745; margin: 0;">${overallRate}%</h3>
            <p style="margin: 5px 0;">Overall Compliance</p>
          </div>
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #28a745; margin: 0;">${totalCompliant}</h3>
            <p style="margin: 5px 0;">Total Compliant</p>
          </div>
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #dc3545; margin: 0;">${totalNonCompliant}</h3>
            <p style="margin: 5px 0;">Total Non-Compliant</p>
          </div>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #856404; margin: 0;">₹${totalPenalties.toLocaleString()}</h3>
            <p style="margin: 5px 0;">Total Penalties</p>
          </div>
        </div>
        
        <!-- Detailed Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Compliance Type</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Total Employees</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Non-Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliance Rate</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Status</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Penalties</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.complianceData.forEach(item => {
      const statusColor = this.statusColors[item.status].color;
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${item.complianceType}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.totalEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">${item.compliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #dc3545; font-weight: bold;">${item.nonCompliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${item.complianceRate}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: ${statusColor}; font-weight: bold;">${item.status}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${(item.penalties || 0).toLocaleString()}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  generateAnnualSummaryHTML() {
    let html = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; color: #2c3e50;">Annual Compliance Summary</h2>
        <p style="text-align: center;">Financial Year: ${this.statutoryComplianceForm.get('Year')?.value - 1} - ${this.statutoryComplianceForm.get('Year')?.value}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Compliance Type</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Total Employees</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Non-Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliance Rate</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Status</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Annual Penalties</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.complianceData.forEach(item => {
      const statusColor = this.statusColors[item.status].color;
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${item.complianceType}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.totalEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">${item.compliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #dc3545; font-weight: bold;">${item.nonCompliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${item.complianceRate}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: ${statusColor}; font-weight: bold;">${item.status}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${(item.penalties || 0).toLocaleString()}</td>
        </tr>
      `;
    });

    const totalPenalties = this.complianceData.reduce((sum, item) => sum + (item.penalties || 0), 0);

    html += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="6" style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total Annual Penalties:</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${totalPenalties.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  generateAuditHTML() {
    let html = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; color: #2c3e50;">Compliance Audit Report</h2>
        <p style="text-align: center;">Audit Period: ${this.statutoryComplianceForm.get('Month')?.value}/${this.statutoryComplianceForm.get('Year')?.value}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Audit Area</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Total Employees</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Non-Compliant</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Compliance Rate</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Status</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Audit Findings</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.complianceData.forEach(item => {
      const statusColor = this.statusColors[item.status].color;
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${item.complianceType}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.totalEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">${item.compliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #dc3545; font-weight: bold;">${item.nonCompliantEmployees}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${item.complianceRate}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: ${statusColor}; font-weight: bold;">${item.status}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${(item.penalties || 0).toLocaleString()}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${item.remarks || '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  exportToExcel() {
    if (this.complianceData.length === 0) {
      this.errorMessage = 'No data available to export.';
      return;
    }

    const fileName = `Statutory_Compliance_Report_${this.statutoryComplianceForm.get('Month')?.value}_${this.statutoryComplianceForm.get('Year')?.value}.xlsx`;
    
    const excelData = this.complianceData.map(item => ({
      'Compliance Type': item.complianceType,
      'Total Employees': item.totalEmployees,
      'Compliant Employees': item.compliantEmployees,
      'Non-Compliant Employees': item.nonCompliantEmployees,
      'Compliance Rate (%)': item.complianceRate,
      'Last Filed Date': item.lastFiledDate || '',
      'Due Date': item.dueDate || '',
      'Status': item.status,
      'Penalties': item.penalties || 0,
      'Remarks': item.remarks || ''
    }));
    
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const workbook: XLSX.WorkBook = { Sheets: { ['Statutory Compliance Report']: worksheet }, SheetNames: ['Statutory Compliance Report'] };
    XLSX.writeFile(workbook, fileName);
  }

  handleErrors(error: any) {
    this.errorMessage = 'An error occurred while processing your request. Please try again.';
    this.hideSpinner();
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
