import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { ClientModel } from 'src/app/model/clientModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-client-compliance-report',
  templateUrl: './client-compliance-report.component.html',
  styleUrls: ['./client-compliance-report.component.css']
})
export class ClientComplianceReportComponent implements OnInit {
  complianceForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  clientModel!: ClientModel[];
  currentUser: string = '';
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentReportHtml: SafeHtml | null = null;
  currentReportHtmlRaw: string = '';
  errorMessage: string = '';
  warningMessage: string = '';
  reportTemplates: { [key: string]: string } = {};
  userAccessModel!: UserAccessModel;
  selectedReportType: string = 'wage-register';

  // Indian compliance form types
  complianceFormTypes = [
    { value: 'form-xvii', label: 'Form XVII - Register of Wages' },
    { value: 'form-xxvi', label: 'Form XXVI - Muster Roll' },
    { value: 'form-xxvii', label: 'Form XXVII - Register of Wages' },
    { value: 'form-xxviii', label: 'Form XXVIII - Wage Slips' },
    { value: 'form-xxix', label: 'Form XXIX - Advances & Deductions' },
    { value: 'form-overtime', label: 'Overtime Register' },
    { value: 'compliance-summary', label: 'Compliance Summary Report' }
  ];

  stateList = [
    { code: 'Central', name: 'Central Rules' },
    { code: 'AP', name: 'Andhra Pradesh' }
  ];

  constructor(
    public sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private _dataService: DatasharingService,
    private _masterService: MastermoduleService,
    private http: HttpClient,
    private router: Router,
    private titleCasePipe: TitleCasePipe
  ) {
    this.complianceForm = this.fb.group({
      ReportType: ['form-xvii', Validators.required],
      State: ['Central', Validators.required],
      BranchCode: ['', Validators.required],
      ClientCode: [''],
      Month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      Year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2030)]],
      UnitName: [''],
      PrincipalEmployer: [''],
      ContractorName: [''],
      WorkSite: [''],
      ShowIndividualSlips: [false]
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
    this.loadComplianceReportTemplates();
    this.getUserAccessRights(this.currentUser, 'Client Compliance Report');
  }

  loadComplianceReportTemplates() {
    const reportTypes = ['form-xvii', 'form-xxvi', 'form-xxvii', 'form-xxviii', 'form-xxix', 'overtime', 'ap-form-xvi', 'ap-form-xvii', 'ap-form-xx', 'ap-form-xxi', 'ap-form-xxii', 'ap-form-xxiii', 'ap-form-xxix'];
    reportTypes.forEach(type => {
      const path = `assets/report-templates/client-compliance/${type}.html`;
      this.http.get(path, { responseType: 'text' }).subscribe(
        (htmlTemplate: string) => { this.reportTemplates[type] = htmlTemplate; },
        (error) => { console.warn(`Could not load template for ${type}`, error); }
      );
    });
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
    const branchCode = this.complianceForm.get('BranchCode')?.value;
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

  generateComplianceReport(): void {
    if (this.complianceForm.invalid) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    this.errorMessage = '';
    const formValues = this.complianceForm.value;
    const month = formValues.Month.toString().padStart(2, '0');
    const period = `${formValues.Year}-${month}`;

    // Build URL based on report type
    this.url = environment.baseReportUrl;

    switch (formValues.ReportType) {
      case 'form-xvii':
        this.generateFormXVIIReport(period, formValues);
        break;
      case 'form-xxvi':
        this.generateFormXXVIReport(period, formValues);
        break;
      case 'form-xxvii':
        this.generateFormXXVIIReport(period, formValues);
        break;
      case 'form-xxviii':
        this.generateFormXXVIIIReport(period, formValues);
        break;
      case 'form-xxix':
        this.generateFormXXIXReport(period, formValues);
        break;
      case 'form-overtime':
        this.generateOvertimeReport(period, formValues);
        break;
      case 'compliance-summary':
        this.generateComplianceSummaryReport(period, formValues);
        break;
      default:
        this.errorMessage = 'Invalid report type selected.';
        return;
    }

    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  private generateFormXVIIReport(period: string, formValues: any) {
    this.url += 'Compliance/FormXVIIReport.aspx?';
    this.url += `LoginID=${this.currentUser}`;
    this.url += `&Branch=${formValues.BranchCode}`;
    this.url += `&Client=${formValues.ClientCode || ''}`;
    this.url += `&Period=${period}`;
    this.url += `&UnitName=${encodeURIComponent(formValues.UnitName || '')}`;
    this.url += `&PrincipalEmployer=${encodeURIComponent(formValues.PrincipalEmployer || '')}`;
    this.url += `&ContractorName=${encodeURIComponent(formValues.ContractorName || '')}`;
    this.url += `&WorkSite=${encodeURIComponent(formValues.WorkSite || '')}`;
  }

  private generateFormXXVIReport(period: string, formValues: any) {
    this.url += 'Compliance/FormXXVIReport.aspx?';
    this.url += `LoginID=${this.currentUser}`;
    this.url += `&Branch=${formValues.BranchCode}`;
    this.url += `&Client=${formValues.ClientCode || ''}`;
    this.url += `&Period=${period}`;
    this.url += `&PrincipalEmployer=${encodeURIComponent(formValues.PrincipalEmployer || '')}`;
    this.url += `&ContractorName=${encodeURIComponent(formValues.ContractorName || '')}`;
    this.url += `&WorkSite=${encodeURIComponent(formValues.WorkSite || '')}`;
  }

  private generateFormXXVIIReport(period: string, formValues: any) {
    this.url += 'Compliance/FormXXVIIReport.aspx?';
    this.url += `LoginID=${this.currentUser}`;
    this.url += `&Branch=${formValues.BranchCode}`;
    this.url += `&Client=${formValues.ClientCode || ''}`;
    this.url += `&Period=${period}`;
    this.url += `&PrincipalEmployer=${encodeURIComponent(formValues.PrincipalEmployer || '')}`;
    this.url += `&ContractorName=${encodeURIComponent(formValues.ContractorName || '')}`;
    this.url += `&WorkSite=${encodeURIComponent(formValues.WorkSite || '')}`;
  }

  private generateFormXXVIIIReport(period: string, formValues: any) {
    this.url += 'Compliance/FormXXVIIIReport.aspx?';
    this.url += `LoginID=${this.currentUser}`;
    this.url += `&Branch=${formValues.BranchCode}`;
    this.url += `&Client=${formValues.ClientCode || ''}`;
    this.url += `&Period=${period}`;
    this.url += `&ShowIndividual=${formValues.ShowIndividualSlips}`;
  }

  private generateFormXXIXReport(period: string, formValues: any) {
    this.url += 'Compliance/FormXXIXReport.aspx?';
    this.url += `LoginID=${this.currentUser}`;
    this.url += `&Branch=${formValues.BranchCode}`;
    this.url += `&Client=${formValues.ClientCode || ''}`;
    this.url += `&Period=${period}`;
    this.url += `&PrincipalEmployer=${encodeURIComponent(formValues.PrincipalEmployer || '')}`;
    this.url += `&ContractorName=${encodeURIComponent(formValues.ContractorName || '')}`;
    this.url += `&WorkSite=${encodeURIComponent(formValues.WorkSite || '')}`;
  }

  private generateOvertimeReport(period: string, formValues: any) {
    this.url += 'Compliance/OvertimeReport.aspx?';
    this.url += `LoginID=${this.currentUser}`;
    this.url += `&Branch=${formValues.BranchCode}`;
    this.url += `&Client=${formValues.ClientCode || ''}`;
    this.url += `&Period=${period}`;
  }

  private generateComplianceSummaryReport(period: string, formValues: any) {
    this.url += 'Compliance/ComplianceSummaryReport.aspx?';
    this.url += `LoginID=${this.currentUser}`;
    this.url += `&Branch=${formValues.BranchCode}`;
    this.url += `&Client=${formValues.ClientCode || ''}`;
    this.url += `&Period=${period}`;
    this.url += `&IncludeAllForms=${formValues.ShowIndividualSlips}`;
  }

  // Helper methods for month names
  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  }

  formatReportType(reportType: string): string {
    return this.titleCasePipe.transform(reportType.split('-').join(' '));
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

      const reportTypeLabel = this.formatReportType(this.selectedReportType).replace(/\s+/g, '_');
      const month = this.complianceForm.value.Month || new Date().getMonth() + 1;
      const year = this.complianceForm.value.Year || new Date().getFullYear();
      const fileName = `${reportTypeLabel}_${year}_${String(month).padStart(2, '0')}.xlsx`;
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
    </style></head><body>${this.currentReportHtmlRaw}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  showReport(reportType: string) {
    if (this.complianceForm.invalid) {
      this.errorMessage = 'Please select Branch, Month and Year first.';
      return;
    }
    this.selectedReportType = reportType;
    this.errorMessage = '';
    const formValues = this.complianceForm.value;
    const monthName = this.getMonthName(formValues.Month);
    const year = formValues.Year;
    const period = `${year}-${(formValues.Month as number).toString().padStart(2, '0')}`;
    const branchCode = formValues.BranchCode;
    const clientCode = formValues.ClientCode || '';

    const baseTemplate = this.reportTemplates[reportType];
    if (!baseTemplate) {
      this.errorMessage = `Template '${reportType}' not loaded yet. Please wait and try again.`;
      return;
    }

    const payload = {
      branch: branchCode,
      client: clientCode,
      period,
      unitName: formValues.UnitName || '',
      principalEmployer: formValues.PrincipalEmployer || '',
      contractorName: formValues.ContractorName || '',
      workSite: formValues.WorkSite || '',
      showIndividualSlips: formValues.ShowIndividualSlips
    };

    const isAPReport = reportType.startsWith('ap-');
    this.showLoadingSpinner = true;
    const backendReportName = this.mapReportName(reportType);

    // AP forms are not yet supported by the backend; show clear message early
    if (isAPReport) {
      this.showLoadingSpinner = false;
      this.errorMessage = `AP Compliance Report data for '${this.formatReportType(reportType)}' is not yet available from the server. Backend support for AP forms is coming soon.`;
      return;
    }

    this._masterService.getComplianceReportData(backendReportName, payload).subscribe(
      (reportData: any) => {
        this.showLoadingSpinner = false;

        // Use metadata from API response; merge with any form overrides
        const apiMeta = reportData?.metadata || {};
        const isAP = (formValues.State === 'AP');
        const resolvedBranchName = this.branchModel?.find(b => b.Code === branchCode)?.Name || branchCode;
        const resolvedClientName = this.clientModel?.find(c => c.Code === clientCode)?.Name || clientCode || 'All Clients';

        // Company details (contractor = OBMS own company)
        const companyName = apiMeta['CompanyName'] || 'FreightWatch G Security Services India Pvt. Ltd.';
        const companyAddress = apiMeta['CompanyAddress'] || 'No.397 (old no.281), Anna Salai, Precision Plaza, 1st Floor, Teynampet, Chennai - 600018';
        const companyPhone = apiMeta['CompanyPhone'] || '+91 4440050684';
        const companyEmail = apiMeta['CompanyEmail'] || 'info@fwgindia.com';
        const companyCIN = apiMeta['CompanyCIN'] || 'U74920TN2005PTC057775';

        const establishment = resolvedClientName || formValues.WorkSite || resolvedBranchName;

        const metaData = {
          ...apiMeta,
          // Company info (for form-xvii header and form-xxvii contractor address)
          CompanyName: companyName,
          CompanyAddress: companyAddress,
          CompanyPhone: companyPhone,
          CompanyEmail: companyEmail,
          CompanyCIN: companyCIN,
          // Allow form overrides
          PrincipalEmployer: formValues.PrincipalEmployer || apiMeta['PrincipalEmployer'] || (isAP ? 'Principal Employer (AP)' : resolvedClientName),
          ContractorName: formValues.ContractorName || apiMeta['ContractorName'] || companyName,
          WorkSite: formValues.WorkSite || apiMeta['WorkSite'] || (isAP ? 'Work Site (AP)' : resolvedClientName),
          UnitName: formValues.UnitName || apiMeta['UnitName'] || '',
          Establishment: establishment,
          // Overtime template needs these combined fields
          EstablishmentNameAndAddress: apiMeta['EstablishmentNameAndAddress'] || `${establishment}, ${resolvedBranchName}`,
          EmployerContractorNameAndAddress: apiMeta['EmployerContractorNameAndAddress'] || `${companyName}, ${companyAddress}`,
          // Fallbacks for templates that expect specific key names
          Branch: resolvedBranchName,
          BranchName: resolvedBranchName,
          Client: resolvedClientName,
          ClientName: resolvedClientName,
          Period: apiMeta['Period'] || `${monthName} ${year}`,
          SalaryDate: apiMeta['SalaryDate'] || `${monthName} ${year}`,
          Year: year.toString(),
          Month: (formValues.Month as number).toString(),
          MonthName: monthName,
          DateRange: period,
          GeneratedDate: new Date().toLocaleDateString('en-IN'),
          ReportId: `RPT-${year}${String(formValues.Month).padStart(2, '0')}-${branchCode}`
        };

        const html = this.renderReportHtml(reportType, baseTemplate, reportData, metaData);
        this.currentReportHtmlRaw = html;
        this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
      },
      (error: any) => {
        this.showLoadingSpinner = false;
        this.errorMessage = `Failed to load report data. Please check the server is running and try again.`;
        console.error('API error loading compliance report:', error);
      }
    );
  }

  private mapReportName(reportType: string): string {
    const nameMap: { [key: string]: string } = {
      'form-xvii': 'FormXVII',
      'form-xxvi': 'FormXXVI',
      'form-xxvii': 'FormXXVII',
      'form-xxviii': 'FormXXVIII',
      'form-xxix': 'FormXXIX',
      'form-overtime': 'OvertimeRegister',
      'overtime': 'OvertimeRegister',
      'ap-form-xvi': 'AP_FormXVI',
      'ap-form-xvii': 'AP_FormXVII',
      'ap-form-xx': 'AP_FormXX',
      'ap-form-xxi': 'AP_FormXXI',
      'ap-form-xxii': 'AP_FormXXII',
      'ap-form-xxiii': 'AP_FormXXIII',
      'ap-form-xxix': 'AP_FormXXIX'
    };
    return nameMap[reportType] || reportType;
  }

  private generateSampleData(reportType: string): any {
    const sampleRows = [
      {
        sno: 1,
        name: 'John Doe',
        empId: 'EMP001',
        designation: 'Security Guard',
        basic: 9031,
        da: 10192,
        hra: 3615,
        others: 0,
        bonus: 1601,
        pf: 1800,
        esi: 0,
        pt: 208,
        net: 22431,
        sex: 'M',
        uan: '10191802',
        attendance: 28,
        gross: 24439,
        advBonus: 1601,
        otHours: 5,
        otRate: 450,
        otAmount: 2250,
        leaveWages: 0,
        nh: 0,
        advance: 0,
        actualDays: 28,
        fixedSalary: 24439,
        workDays: 28,
        advanceDed: 0,
        lwf: 0,
        mobile: 0,
        arrear: 0,
        remarks: 'Regular',
        signature: 'J.Doe',
        // Form XXVI specific fields
        age: 30,
        fatherName: 'Robert Doe',
        workerSignature: 'John Doe',
        reportDate: '28-02-2026',
        submissionDate: '01-03-2026',
        terminationDate: '',
        inchargeSignature: 'Manager',
        // Form XXIX specific fields
        advance1Date: '15-02-2026',
        advance1Amount: 5000,
        advance2Date: '10-02-2026',
        advance2Amount: 3000,
        advance3Date: '05-02-2026',
        advance3Amount: 2000,
        deduction1Date: '20-02-2026',
        deduction1Amount: 500,
        deduction2Amount: 200,
        fine1Date: '25-02-2026',
        fine1Amount: 100,
        fine2Amount: 50
      },
      {
        sno: 2,
        name: 'Jane Smith',
        empId: 'EMP002',
        designation: 'Security Officer',
        basic: 9031,
        da: 10192,
        hra: 3615,
        others: 0,
        bonus: 1601,
        pf: 1800,
        esi: 0,
        pt: 208,
        net: 22431,
        sex: 'F',
        uan: '10192102',
        attendance: 27,
        gross: 24439,
        advBonus: 1601,
        otHours: 3,
        otRate: 450,
        otAmount: 1350,
        leaveWages: 0,
        nh: 0,
        advance: 0,
        actualDays: 27,
        fixedSalary: 24439,
        workDays: 27,
        advanceDed: 0,
        lwf: 0,
        mobile: 0,
        arrear: 0,
        remarks: 'Regular',
        signature: 'J.Smith',
        // Form XXVI specific fields
        age: 28,
        fatherName: 'William Smith',
        workerSignature: 'Jane Smith',
        reportDate: '28-02-2026',
        submissionDate: '01-03-2026',
        terminationDate: '',
        inchargeSignature: 'Manager',
        // Form XXIX specific fields
        advance1Date: '12-02-2026',
        advance1Amount: 4000,
        advance2Date: '08-02-2026',
        advance2Amount: 2500,
        advance3Date: '03-02-2026',
        advance3Amount: 1500,
        deduction1Date: '18-02-2026',
        deduction1Amount: 300,
        deduction2Amount: 150,
        fine1Date: '22-02-2026',
        fine1Amount: 80,
        fine2Amount: 40
      }
    ];

    // Add day columns for Form XXVI
    sampleRows.forEach((row: any) => {
      for (let i = 1; i <= 28; i++) {
        row[`day${i}`] = i <= (row.attendance || 28) ? 'P' : 'A';
      }
      row.daysWorked = row.attendance || 28;
    });

    const totals: { [key: string]: any } = {
      totalBasic: 18062,
      totalDA: 20384,
      totalHRA: 7230,
      totalOthers: 0,
      totalBonus: 3202,
      totalPF: 3600,
      totalESI: 0,
      totalPT: 416,
      totalNet: 44862,
      totalGross: 48878,
      totalAdvBonus: 3202,
      totalDays: 55,
      totalLeaveWages: 0,
      totalNH: 0,
      totalAdvance: 0,
      totalActualDays: 55,
      totalFixedSalary: 48878,
      totalWorkDays: 55,
      totalOT: 8,
      totalOTAmount: 3600,
      totalAdvanceDed: 0,
      totalLWF: 0,
      totalDeductions: 4016,
      totalMobile: 0,
      totalArrear: 0,
      // Form XXIX totals
      advance1Total: 9000,
      advance2Total: 5500,
      advance3Total: 3500,
      deduction1Total: 800,
      deduction2Total: 350,
      fine1Total: 180,
      fine2Total: 90
    };

    return {
      rows: sampleRows,
      totals: totals,
      components: [
        { label: 'Basic', amount: 9031 },
        { label: 'DA', amount: 10192 },
        { label: 'HRA', amount: 3615 },
        { label: 'Bonus', amount: 1601 }
      ],
      deductions: [
        { label: 'PF', amount: 1800 },
        { label: 'PT', amount: 208 },
        { label: 'ESI', amount: 0 }
      ],
      employee: {
        name: 'John Doe',
        code: 'EMP001',
        designation: 'Security Guard',
        fatherName: 'Robert Doe',
        age: 30,
        sex: 'M',
        uan: '10191802'
      },
      totalEarnings: 24439,
      totalDeductions: 2008,
      netAmount: 22431,
      summary: 'Total employees in report: 2'
    };
  }

  private generateAPSampleData(reportType: string): any {
    // AP sample rows based on EXACT real data from Andhra Pradesh Excel documents (FORM XVI.xlsx)
    const apRowsRaw = [
      { sno: 1, empId: 26983, name: 'BALACHANDRA', fatherName: 'THONDAMANADU', sex: 'M', designation: 'SG',
        basic: 18317, gross: 19379, pf: 1800, esi: 137.3775, pt: 0, net: 17441.6225, actualDays: 31, bonus: 0, others: 0,
        days: ['P','W/O','P','P','P','P','P','P','W/O','P','P','P','P','P','H','W/O','P','P','P','P','P','P','W/O','P','P','NH','P','P','P','W/O','P'] },
      { sno: 2, empId: 34595, name: 'Vinod', fatherName: 'kotapolluru', sex: 'M', designation: 'SG',
        basic: 18317, gross: 17503.61, pf: 1800, esi: 124.08, pt: 0, net: 15579.53, actualDays: 28, bonus: 0, others: 0,
        days: ['P','P','W/O','L','P','P','P','P','P','W/O','P','L','L','P','H','P','W/O','P','P','P','P','P','P','W/O','P','NH','P','P','P','P','W/O'] },
      { sno: 3, empId: 34596, name: 'Dilli Kumar', fatherName: 'Nadipaiah', sex: 'M', designation: 'MST',
        basic: 18317, gross: 19716, pf: 1800, esi: 139.74, pt: 0, net: 17776.26, actualDays: 31, bonus: 0, others: 0,
        days: ['P','P','P','P','W/O','P','P','P','P','P','P','W/O','P','P','H','P','P','P','W/O','P','P','P','P','P','P','NH','W/O','P','P','P','P'] },
      { sno: 4, empId: 34602, name: 'Nagarjuna', fatherName: 'Mallam Rathnaiah', sex: 'M', designation: 'MST',
        basic: 18632, gross: 19716, pf: 1800, esi: 139.74, pt: 0, net: 17776.26, actualDays: 31, bonus: 0, others: 0,
        days: ['P','P','P','P','P','P','W/O','P','P','P','P','P','P','W/O','H','P','P','P','P','P','W/O','P','P','P','P','NH','P','W/O','P','P','P'] },
      { sno: 5, empId: 34600, name: 'Srinivasulu', fatherName: 'chithukati venkaresa', sex: 'M', designation: 'MST',
        basic: 18632, gross: 16536, pf: 1800, esi: 117.20, pt: 0, net: 14618.80, actualDays: 26, bonus: 0, others: 0,
        days: ['L','L','P','P','P','W/O','P','P','P','P','P','P','W/O','P','H','P','P','P','P','W/O','P','P','P','P','P','NH','W/O','P','L','L','L'] },
      { sno: 6, empId: 34622, name: 'BHASKAR', fatherName: 'Guntaka Chengaiah', sex: 'M', designation: 'HK',
        basic: 18632, gross: 14376.19, pf: 1620, esi: 101.25, pt: 0, net: 12654.94, actualDays: 27, bonus: 0, others: 0,
        days: ['P','P','P','W/O','L','P','P','P','P','L','W/O','P','P','P','H','L','P','W/O','L','P','P','P','P','P','W/O','NH','P','P','P','P','P'] },
      { sno: 7, empId: 34882, name: 'NAGARAJU', fatherName: 'Chinna adaiah', sex: 'M', designation: 'HK',
        basic: 15500, gross: 15973.55, pf: 1800, esi: 112.50, pt: 0, net: 14061.05, actualDays: 30, bonus: 0, others: 0,
        days: ['P','P','P','W/O','P','P','P','P','P','P','W/O','P','P','P','H','P','P','W/O','P','P','L','P','P','P','W/O','NH','P','P','P','P','P'] },
      { sno: 8, empId: '', name: 'Nagaiah', fatherName: 'Kattuvapalle', sex: 'M', designation: 'HK',
        basic: 15500, gross: 15441.10, pf: 1740, esi: 108.75, pt: 0, net: 13592.35, actualDays: 29, bonus: 0, others: 0,
        days: ['P','P','P','W/O','P','P','P','P','P','P','W/O','P','L','P','H','P','P','W/O','P','P','L','P','P','P','W/O','NH','P','P','P','P','P'] },
      { sno: 9, empId: '', name: 'Meena', fatherName: 'BHASKAR', sex: 'F', designation: 'HK',
        basic: 15500, gross: 13843.74, pf: 1560, esi: 97.50, pt: 0, net: 12186.24, actualDays: 26, bonus: 0, others: 0,
        days: ['P','P','P','W/O','L','P','P','P','P','L','W/O','P','P','L','H','L','P','W/O','L','P','P','P','P','P','W/O','NH','P','P','P','P','P'] }
    ];

    // Populate day1..day31 from the days array
    apRowsRaw.forEach((row: any) => {
      (row.days as string[]).forEach((v: string, i: number) => {
        row[`day${i + 1}`] = v;
      });
      delete row.days;
    });

    const totals = {
      totalBasic: 157347,
      totalDA: 32000.52,
      totalOthers: 38908.74,
      totalBonus: 8732.97,
      totalGross: 152485.19,
      totalPF: 15720,
      totalESI: 1078.14,
      totalPTDeduction: 1886.4,
      totalNet: 135687.05,
      totalDays: 259
    };

    return { rows: apRowsRaw, totals };
  }


  private renderReportHtml(reportType: string, template: string, apiData: any, meta: any): string {
    let filled = template;

    const globalData = { ...meta, ...(apiData?.totals || {}) };

    // Auto-calculate missing wage totals for AP Form XVII
    if (reportType === 'ap-form-xvii') {
      if (globalData.totalPFWages === undefined) {
         globalData.totalPFWages = (globalData.totalBasic || 0) + (globalData.totalDA || 0);
      }
      if (globalData.totalESIWages === undefined) {
         globalData.totalESIWages = globalData.totalGross || 0;
      }
    }

    // Extract Form XXVIII slip template EARLY to avoid global replacement overwriting its {{Placeholders}}
    let rowTemplateObj = '';
    if (reportType === 'form-xxviii') {
      const templateMatch = filled.match(/<!-- START_WAGE_SLIP_TEMPLATE -->([\s\S]*?)<!-- END_WAGE_SLIP_TEMPLATE -->/);
      rowTemplateObj = templateMatch ? templateMatch[1] : '';
      // Remove it from the main template so global replacement doesn't touch it
      filled = filled.replace(/<!-- START_WAGE_SLIP_TEMPLATE -->[\s\S]*?<!-- END_WAGE_SLIP_TEMPLATE -->/, '');
    }

    // Dynamic Days Headers for Form XXVI
    if (reportType === 'form-xxvi') {
      const daysCount = globalData.DaysInMonth || 31;
      globalData.DaysColspan = daysCount;
      globalData.FooterColspan = daysCount + 11;
      globalData.DaysHeaders = Array.from({ length: daysCount }, (_, i) => `<th>${i + 1}</th>`).join('');
    }

    // Replace metadata and totals using a regex that supports {{Key || Default}}
    filled = filled.replace(/{{\s*([\w]+)(?:\s*\|\|\s*['"]?([^'"}]+)['"]?)?\s*}}/g, (match, key, defaultValue) => {
      // Keep structural placeholders intact for later
      if (['DataRows', 'SummaryData', 'WageSlipsData', 'OvertimeData', 'Summary'].includes(key)) {
        return match;
      }
      if (globalData[key] !== undefined && globalData[key] !== null && globalData[key] !== '') {
        return globalData[key];
      }
      return defaultValue !== undefined ? defaultValue : '';
    });

    // Handle Form XXVIII special case
    if (reportType === 'form-xxviii') {
      const rows = this.normalizeFormXXVIIIRows(apiData, meta);

      let slips = '<div class="wage-slip-card">No data available for the selected period.</div>';
      if (rows.length > 0 && rowTemplateObj) {
        slips = rows.map((row: any, index: number) => this.populateSlipTemplate(rowTemplateObj, row, meta, apiData)).join('<div class="wage-slip-separator"></div>');
      }

      // Generate summary data for Form XXVIII
      const summaryRows = rows.map((row: any, index: number) => this.buildSummaryRow(reportType, row, index)).join('');
      filled = filled.replace(/{{SummaryData}}/g, summaryRows);

      filled = filled.replace(/{{WageSlipsData}}/g, slips);
      return filled;
    }

    // Build row HTML for all other forms
    let rowHtml = '<tr><td colspan="99">No records found</td></tr>';
    if (apiData?.rows && apiData.rows.length > 0) {
      rowHtml = apiData.rows.map((row: any, index: number) => this.buildRowHtml(reportType, row, index, globalData)).join('');
    }
    filled = filled.replace(/{{DataRows}}/g, rowHtml);

    // Handle OvertimeData specifically for overtime register
    if (reportType === 'form-overtime') {
      filled = filled.replace(/{{OvertimeData}}/g, rowHtml);
    }

    if (apiData?.summary) {
      filled = filled.replace(/{{Summary}}/g, apiData.summary);
    }

    return filled;
  }

  private findAmountByComponent(list: any[], key1: string, key2: string): number {
    if (!Array.isArray(list)) return 0;

    const item = list.find(x =>
      (x.label?.toLowerCase() === key1.toLowerCase() ||
        x.component?.toLowerCase() === key1.toLowerCase()) ||
      (x.label?.toLowerCase() === key2.toLowerCase() ||
        x.component?.toLowerCase() === key2.toLowerCase())
    );

    return item ? (item.amount || 0) : 0;
  }

  private normalizeFormXXVIIIRows(apiData: any, meta: any): any[] {
    if (!apiData?.rows) return [];

    return apiData.rows.map((row: any) => ({
      EmployeeName: row.EmployeeName || row.name || '',
      EmployeeCode: row.EmployeeCode || row.empId || '',
      Designation: row.Designation || row.designation || '',
      Basic: row.Basic || row.basic || 0,
      DA: row.DA || row.da || 0,
      HRA: row.HRA || row.hra || 0,
      Others: row.Others || row.others || 0,
      Bonus: row.Bonus || row.bonus || 0,
      PF: row.PF || row.pf || 0,
      ESI: row.ESI || row.esi || 0,
      PT: row.PT || row.pt || 0,
      OT: row.OT || row.ot || 0,
      Gross: row.Gross || row.gross || 0,
      TotalDed: row.TotalDed || row.totalDeductions || 0,
      Net: row.Net || row.net || 0,
      DaysWorked: row.DaysWorked || row.daysWorked || 0,
      SalaryDate: row.SalaryDate || meta.SalaryDate || ''
    }));
  }

  private buildSummaryRow(reportType: string, row: any, index: number): string {
    switch (reportType) {
      case 'form-xxviii':
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${row.EmployeeName || row.name || ''}</td>
            <td>${row.Basic || row.basic || 0}</td>
            <td>${row.DA || row.da || 0}</td>
            <td>${row.HRA || row.hra || 0}</td>
            <td>${row.Bonus || row.bonus || 0}</td>
            <td>${row.Gross || row.gross || 0}</td>
            <td>${row.TotalDed || row.totalDeductions || 0}</td>
            <td>${row.Net || row.net || 0}</td>
            <td>${row.SalaryDate || ''}</td>
          </tr>
        `;
      default:
        return '';
    }
  }

  private populateSlipTemplate(template: string, row: any, meta: any, apiData: any): string {
    let filled = template;

    // Replace all placeholders with actual data (handle both PascalCase and camelCase)
    const allData = { ...row, ...meta };

    // Replace specific wage slip placeholders
    const replacements: { [key: string]: any } = {
      'Basic': row.Basic || row.basic || 0,
      'DA': row.DA || row.da || 0,
      'HRA': row.HRA || row.hra || 0,
      'Others': row.Others || row.others || 0,
      'Bonus': row.Bonus || row.bonus || 0,
      'PF': row.PF || row.pf || 0,
      'ESI': row.ESI || row.esi || 0,
      'PT': row.PT || row.pt || 0,
      'AdvanceDed': row.AdvanceDed || row.advanceDed || 0,
      'OtherDed': row.OtherDed || row.otherDed || 0,
      'OT': row.OT || row.ot || 0,
      'Gross': row.Gross || row.gross || 0,
      'TotalDed': row.TotalDed || row.totalDeductions || 0,
      'Net': row.Net || row.net || 0,
      'EmployeeName': row.EmployeeName || row.name || '',
      'EmployeeCode': row.EmployeeCode || row.empId || '',
      'Designation': row.Designation || row.designation || '',
      'DaysWorked': row.DaysWorked || row.daysWorked || 0,
      'SalaryDate': row.SalaryDate || meta.SalaryDate || ''
    };

    // Replace placeholders matching {{Key}} or {{Key || Default}}
    filled = filled.replace(/{{\s*([\w]+)(?:\s*\|\|\s*['"]?([^'"}]+)['"]?)?\s*}}/g, (match, key, defaultValue) => {
      if (allData[key] !== undefined && allData[key] !== null && allData[key] !== '') {
        return allData[key];
      }
      return defaultValue !== undefined ? defaultValue : (['EmployeeName', 'EmployeeCode', 'Designation', 'SalaryDate'].includes(key) ? 'N/A' : '0');
    });

    return filled;
  }

  private buildRowHtml(reportType: string, row: any, index: number, meta?: any): string {
    switch (reportType) {
      case 'form-xvii':
        // Complete 28-column structure for Form XVII
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td>${row.empId || row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td class="left-text">${row.designation || ''}</td>
          <td>${row.basic || 0}</td>
          <td>${row.da || 0}</td>
          <td>${row.others || 0}</td>
          <td>${row.hra || 0}</td>
          <td>${row.leaveWages || 0}</td>
          <td>${row.nh || 0}</td>
          <td>${row.advance || 0}</td>
          <td>${row.bonus || row.advBonus || 0}</td>
          <td>${row.actualDays || row.attendance || 0}</td>
          <td>${row.fixedSalary || row.gross || 0}</td>
          <td>${row.workDays || row.attendance || 0}</td>
          <td>${row.basic || 0}</td>
          <td>${row.da || 0}</td>
          <td>${row.others || 0}</td>
          <td>${row.hra || 0}</td>
          <td>${row.leaveWages || 0}</td>
          <td>${row.nh || 0}</td>
          <td>${row.advance || 0}</td>
          <td>${row.bonus || row.advBonus || 0}</td>
          <td>${row.otHours || 0}</td>
          <td>${row.otAmount || 0}</td>
          <td>${row.gross || 0}</td>
          <td>${row.pf || 0}</td>
          <td>${row.esi || 0}</td>
          <td>${row.pt || 0}</td>
          <td>${row.advanceDed || 0}</td>
          <td>${row.lwf || 0}</td>
          <td>${(row.pf || 0) + (row.esi || 0) + (row.pt || 0) + (row.advanceDed || 0) + (row.lwf || 0)}</td>
          <td>${row.mobile || 0}</td>
          <td>${row.arrear || 0}</td>
          <td>${row.net || 0}</td>
          <td>${row.remarks || ''}</td>
          <td>${row.signature || ''}</td>
        </tr>`;
      case 'form-xxvi':
        const daysInMonth = meta?.DaysInMonth || 31;
        const dayCells = Array.from({ length: daysInMonth }, (_, dayIndex) => {
          const value = row[`day${dayIndex + 1}`] ?? '';
          return `<td>${value}</td>`;
        }).join('');
        return `<tr><td>${row.sno || index + 1}</td><td class="left-text">${row.name || ''} (${row.empId || ''})</td><td>${row.age || ''}/${row.sex || ''}</td><td class="left-text">${row.designation || ''}</td><td class="left-text">${row.fatherName || ''}</td>${dayCells}<td>${row.daysWorked || row.attendance || 0}</td><td>${row.workerSignature || ''}</td><td>${row.reportDate || ''}</td><td>${row.submissionDate || ''}</td><td>${row.terminationDate || ''}</td><td>${row.inchargeSignature || ''}</td></tr>`;
      case 'form-xxvii':
        // Complete 23-column structure for Form XXVII Register of Wages
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td>${row.sex || ''}</td>
          <td>${row.uan || ''}</td>
          <td>${row.esiNo || ''}</td>
          <td class="left-text">${row.designation || ''}</td>
          <td>${row.payType || 'Monthly'}</td>
          <td>${row.wagePeriod || ''}</td>
          <td>${row.totalDays || 0}</td>
          <td>${row.daysWorked || 0}</td>
          <td>${row.basic || 0}</td>
          <td>${row.da || 0}</td>
          <td>${row.hra || 0}</td>
          <td>${row.others || 0}</td>
          <td>${row.bonus || 0}</td>
          <td>${row.leaveWages || 0}</td>
          <td>${row.basicDA || 0}</td>
          <td>${row.gross || 0}</td>
          <td>${row.pf || 0}</td>
          <td>${row.esi || 0}</td>
          <td>${row.pt || 0}</td>
          <td>${row.advance || 0}</td>
          <td>${row.fines || 0}</td>
          <td>${row.net || 0}</td>
          <td>${row.signature || ''}</td>
        </tr>`;
      case 'form-xxviii':
        // This is handled separately in normalizeFormXXVIIIRows
        return '';
      case 'form-xxix':
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td>${row.advance1Date || ''}</td>
          <td>${row.advance1Amount || 0}</td>
          <td>${row.advance2Date || ''}</td>
          <td>${row.advance2Amount || 0}</td>
          <td>${row.advance3Date || ''}</td>
          <td>${row.advance3Amount || 0}</td>
          <td>${row.deduction1Date || ''}</td>
          <td>${row.deduction1Amount || 0}</td>
          <td>${row.deduction2Amount || 0}</td>
          <td>${row.fine1Date || ''}</td>
          <td>${row.fine1Amount || 0}</td>
          <td>${row.fine2Amount || 0}</td>
          <td>${row.signature || ''}</td>
        </tr>`;
      case 'form-overtime':
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td class="left-text">${row.fathersName || ''}</td>
          <td>${row.sex || ''}</td>
          <td class="left-text">${row.designation || ''}</td>
          <td>${row.overtimeWorkedDate || ''}</td>
          <td>${row.totalOvertimeHours || 0}</td>
          <td>${row.normalRateOfWages || 0}</td>
          <td>${row.recoveryCompletedDate || ''}</td>
          <td>${row.overtimeRate || 0}</td>
          <td>${row.overtimeEarnings || 0}</td>
          <td>${row.overtimeWagePaidDate || ''}</td>
          <td class="left-text">${row.remarks || ''}</td>
        </tr>`;
      case 'ap-form-xvi': {
        // Exact structure: Sno | EMP ID | Name | Father's Name | Designation | Day1..31 | Total | Remarks
        const dayCells = Array.from({ length: 31 }, (_, i) => {
          const val = row[`day${i + 1}`] || '';
          return `<td>${val}</td>`;
        }).join('');
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td>${row.empId || ''}</td>
          <td class="left-text">${row.name || ''}</td>
          <td class="left-text">${row.fatherName || ''}</td>
          <td>${row.designation || ''}</td>
          ${dayCells}
          <td><strong>${row.actualDays || 0}</strong></td>
          <td>${row.remarks || ''}</td>
        </tr>`;
      }
      case 'ap-form-xvii': {
        // Exact Excel structure: Sl | EmpId | Name | Designation | Days | Unit | DailyRate | Basic | DA | Others | Bonus | Total | PF Wages | ESI Wages | PF Ded | ESIC Ded | Net | Signature | Initial
        const grossVal = row.gross || 0;
        const basicVal = row.basic || 0;
        const othersVal = row.others || 0;
        const bonusVal = row.bonus || 0;
        const daVal = Math.max(0, grossVal - basicVal - othersVal - bonusVal);
        const pfWagesVal = row.pfWages || (basicVal + daVal);
        const esiWagesVal = row.esiWages || grossVal;
        
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td>${row.empId || ''}</td>
          <td class="left-text">${row.name || ''}</td>
          <td>${row.designation || ''}</td>
          <td>${row.actualDays || 0}</td>
          <td>0</td>
          <td>${basicVal}</td>
          <td>${basicVal}</td>
          <td>${daVal.toFixed(2)}</td>
          <td>${othersVal}</td>
          <td>${bonusVal}</td>
          <td>${grossVal.toFixed(2)}</td>
          <td>${pfWagesVal.toFixed(2)}</td>
          <td>${esiWagesVal.toFixed(2)}</td>
          <td>${row.pf || 0}</td>
          <td>${(row.esi || 0).toFixed(4)}</td>
          <td>${(row.net || 0).toFixed(2)}</td>
          <td></td>
          <td></td>
        </tr>`;
      }
      case 'ap-form-xx': {
        // 13-column structure from NILL RIGISTER Form XX
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td class="left-text">${row.fatherName || ''}</td>
          <td>${row.designation || ''}</td>
          <td>Nil</td><td>Nil</td><td>Nil</td><td>Nil</td>
          <td>0</td><td>0</td><td>Nil</td><td>Nil</td><td>Nil</td>
        </tr>`;
      }
      case 'ap-form-xxi': {
        // 12-column structure from NILL RIGISTER Form XXI
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td class="left-text">${row.fatherName || ''}</td>
          <td>${row.designation || ''}</td>
          <td>Nil</td><td>Nil</td><td>Nil</td><td>Nil</td>
          <td>Nil</td><td>0</td><td>Nil</td><td>Nil</td>
        </tr>`;
      }
      case 'ap-form-xxii': {
        // 11-column structure from NILL RIGISTER Form XXII
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td class="left-text">${row.fatherName || ''}</td>
          <td>${row.designation || ''}</td>
          <td>Nil</td><td>Nil</td><td>Nil</td>
          <td>0</td><td>Nil</td><td>Nil</td><td>Nil</td>
        </tr>`;
      }
      case 'ap-form-xxiii': {
        // 12-column structure from NILL RIGISTER Form XXIII
        return `<tr>
          <td>${row.sno || index + 1}</td>
          <td class="left-text">${row.name || ''}</td>
          <td class="left-text">${row.fatherName || ''}</td>
          <td>${row.sex || ''}</td>
          <td>${row.designation || ''}</td>
          <td>Nil</td><td>0</td><td>0</td><td>0</td><td>0</td><td>Nil</td><td>Nil</td>
        </tr>`;
      }
      case 'ap-form-xxix': {
        // Exact Form XXIX Excel layout - rendered as individual wage slip card per employee
        return `<div class="wage-slip-card">
          <div class="ws-title">FORM XXIX - WAGE SLIP</div>
          <div class="ws-rule">(Vide rule 78(2)(b) of the contract labour<br/>(Regulation and abolition central &amp; A.P Rules 1971))</div>
          <table class="ws-table">
            <tr><td class="label">Name &amp; Address of the Employer/Contractor:</td><td class="value" colspan="3">{{ContractorName}}</td></tr>
            <tr><td class="label">Name of the Employee:</td><td class="value"><strong>${row.name || ''}</strong></td><td class="label">Designation of the Employee:</td><td class="value">${row.designation || ''}</td></tr>
            <tr><td class="label">Name and Father's/Husband:</td><td class="value">${row.fatherName || ''}</td><td class="label">Nature and location of work:</td><td class="value">${row.designation || ''}</td></tr>
            <tr><td class="label">For the week/Fortnight/Month ending:</td><td class="value" colspan="3">{{Period}}</td></tr>
            <tr><td class="label">1. No of Days worked:</td><td class="value">${row.actualDays || 0}</td><td class="label">2. Rate of daily wages/piece rate:</td><td class="value">${row.basic || 0}</td></tr>
            <tr><td class="label">3. Gross wages payable:</td><td class="value"><strong>${(+(row.gross || 0)).toFixed(2)}</strong></td><td></td><td></td></tr>
            <tr><td class="label" colspan="4" style="background:#d9d9d9;font-weight:bold;">4. Deduction, If any:</td></tr>
            <tr><td class="label">PF:</td><td class="value">${row.pf || 0}</td><td class="label">ESIC:</td><td class="value">${(+(row.esi || 0)).toFixed(4)}</td></tr>
            <tr><td class="label">PT:</td><td class="value">${row.pt || 0}</td><td></td><td></td></tr>
            <tr><td class="label">5. Net amount of wages paid:</td><td class="value"><strong>${(+(row.net || 0)).toFixed(4)}</strong></td><td class="label">6. Other allowance:</td><td class="value">0</td></tr>
            <tr><td class="label">7. Holidays:</td><td class="value">1</td><td class="label">8. Net amount paid:</td><td class="value"><strong>${(+(row.net || 0)).toFixed(4)}</strong></td></tr>
          </table>
          <div class="ws-sig">
            <span>Signature of the Employee</span>
            <span>Initial of the Contractor<br/>or his representative</span>
          </div>
        </div>`;
      }
      default:
        return '';
    }

  }

  private toPascalCase(value: string): string {
    if (!value) return '';
    return value.replace(/([A-Z])/g, ' $1').split(/[_\s]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('').replace(/\s+/g, '');
  }

  private hideSpinner(): void {
    this.showLoadingSpinner = false;
  }

  private handleErrors(error: any): void {
    this.showLoadingSpinner = false;
    this.errorMessage = 'An error occurred. Please try again.';
    console.error('Error:', error);
  }
}
