import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../../service/finance.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { DatasharingService } from '../../../service/datasharing.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

export interface ESIWageReportElement {
  IPNumber: string;
  IPName: string;
  EmployeeCode: string;
  DaysWorked: number;
  TotalMonthlyWages: number;
  ReasonCode: string;
  ReasonDescription: string;
  LastWorkingDay: Date;
  IsESIApplicable: boolean;
  EmployeeContribution: number;
  EmployerContribution: number;
  TotalContribution: number;
  HasZeroWorkingDays: boolean;
  HasValidationErrors: boolean;
}

@Component({
  selector: 'app-esi-wage-report',
  templateUrl: './esi-wage-report.component.html',
  styleUrls: ['./esi-wage-report.component.css']
})
export class EsiWageReportComponent implements OnInit {
  esiWageReportForm: FormGroup;
  esiWageReportData: any[] = [];
  branches: any[] = [];
  clients: any[] = [];
  employeeTypes: any[] = [];
  reasonCodes: any[] = [];
  years: number[] = [];
  isLoading: boolean = false;
  validationErrors: string[] = [];
  showValidationOnly: boolean = false;
  summary: any = {
    totalEmployees: 0,
    totalMonthlyWages: 0,
    employeesWithZeroDays: 0,
    employeesWithValidationErrors: 0,
    totalESIContribution: 0
  };
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  displayedColumns: string[] = ['IPNumber', 'IPName', 'EmployeeCode', 'DaysWorked', 'TotalMonthlyWages', 'ReasonCode', 'LastWorkingDay', 'IsESIApplicable', 'EmployeeContribution', 'EmployerContribution', 'TotalContribution', 'actions'];
  dataSource = new MatTableDataSource<ESIWageReportElement>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private _dataService: DatasharingService,
    private _masterService: MastermoduleService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    };

    this.currentUser = sessionStorage.getItem('username')!;

    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }

    this.getUserAccessRights(this.currentUser, 'ESI Wage Report');
    this.generateYearOptions();

    this.esiWageReportForm = this.fb.group({
      BranchCode: ['', Validators.required],
      ClientCode: [''],
      Month: [new Date().getMonth() + 1, Validators.required],
      Year: [new Date().getFullYear(), Validators.required],
      employeeType: [''],
      employeeCode: [''],
      includeZeroDaysEmployees: [false],
      validateOnly: [false]
    });
  }

  ngOnInit(): void {
    // Period is now handled by Month and Year dropdowns
  }

  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.showLoadingSpinner = true;
          this.userAccessModel.readAccess = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          this.hideLoadingSpinner();

          // Check permissions after API response is received
          this.checkPermissionsAndInitialize();
        }
      },
      (error) => {
        this.handleErrors(error);
        // Show error message if API call fails
        this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
          You do not have permissions to view this page. <br>
          If you feel you should have access to this page, Please contact administrator. <br>
          Thank you`;
      }
    );
  }

  checkPermissionsAndInitialize(): void {
    if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
      this.warningMessage = '';
      this.loadBranches();
      this.loadEmployeeTypes();
      this.loadReasonCodes();
      this.setDatasource([]);
    } else {
      this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
        You do not have permissions to view this page. <br>
        If you feel you should have access to this page, Please contact administrator. <br>
        Thank you`;
    }
  }

  setDatasource(d: any) {
    this.dataSource = new MatTableDataSource<ESIWageReportElement>(d);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner();
    }
  }

  hideLoadingSpinner() {
    this.showLoadingSpinner = false;
  }

  loadBranches(): void {
    this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
      this.branches = d;
    },
      (error: any) => {
        console.error('Error loading branches:', error);
      }
    );
  }

  onBranchSelectionChange(event: any) {
    const branchCode = this.esiWageReportForm.get('BranchCode')?.value;
    if (branchCode) {
      this.getClientListByBranch(branchCode);
    }
  }

  getClientListByBranch(branchCode: string) {
    this._masterService.getClientMsterListByBranch(branchCode).subscribe((data: any) => {
      this.clients = data;
    });
  }

  loadEmployeeTypes(): void {
    // Initialize with standard employee types like other reports
    this.employeeTypes = [
      { EmployeeType: 'Guard' },
      { EmployeeType: 'Staff' },
      { EmployeeType: 'All' }
    ];
  }

  loadReasonCodes(): void {
    this.financeService.getESIReasonCodes().subscribe({
      next: (data: any) => {
        this.reasonCodes = data;
      },
      error: (error: any) => {
        console.error('Error loading reason codes:', error);
      }
    });
  }

  generateESIWageReport(): void {
    if (this.esiWageReportForm.invalid) {
      Swal.fire({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        title: 'Error',
        text: 'Please fill required fields',
        icon: 'error',
        showCloseButton: false,
        timer: 3000,
      });
      return;
    }

    this.isLoading = true;
    this.validationErrors = [];
    this.showValidationOnly = false;

    const formValues = this.esiWageReportForm.value;
    const month = formValues.Month.toString().padStart(2, '0');
    const period = `${formValues.Year}-${month}`;

    const request = {
      ...formValues,
      period: period
    };

    this.financeService.getESIWageReport(request).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.Success === 'Success') {
          this.esiWageReportData = response.Data || [];
          this.summary = response.Summary || {
            totalEmployees: 0,
            totalMonthlyWages: 0,
            employeesWithZeroDays: 0,
            employeesWithValidationErrors: 0,
            totalESIContribution: 0
          };
          this.setDatasource(this.esiWageReportData);

          if (this.summary.employeesWithValidationErrors > 0) {
            this.validationErrors = this.esiWageReportData
              .filter((e: any) => e.HasValidationErrors)
              .map((e: any) => `${e.EmployeeCode}: ${e.ValidationErrors}`);
          }
        } else if (response && response.Success === 'Warning') {
          this.validationErrors = response.ValidationErrors || [];
          this.showValidationOnly = true;
        } else {
          Swal.fire({
            title: 'Error',
            text: response?.Message || 'Unknown error occurred',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;

        // Extract specific error message from backend if available
        let errorMessage = 'Failed to load ESI wage report data.';
        if (error.error && error.error.Message) {
          errorMessage = `Backend Error: ${error.error.Message}`;
          this.errorMessage = errorMessage;
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
          this.errorMessage = errorMessage;
        } else {
          this.errorMessage = 'Failed to load ESI wage report data. Please check if the backend service is running.';
        }

        console.error('ESI wage report error:', error);

        // Set empty data to prevent UI issues
        this.esiWageReportData = [];
        this.summary = {
          totalEmployees: 0,
          totalMonthlyWages: 0,
          employeesWithZeroDays: 0,
          employeesWithValidationErrors: 0,
          totalESIContribution: 0
        };
        this.setDatasource([]);
      }
    });
  }

  validateReport(): void {
    this.esiWageReportForm.patchValue({ validateOnly: true });
    this.generateESIWageReport();
    this.esiWageReportForm.patchValue({ validateOnly: false });
  }

  exportToExcel(): void {
    if (this.esiWageReportData.length === 0) {
      return;
    }

    // Main sheet with employee wage data
    const exportData = this.esiWageReportData.map(item => ({
      'IP Number': item.IPNumber,
      'IP Name': item.IPName,
      'Employee Code': item.EmployeeCode,
      'No. of Days for which wages paid/payable': item.DaysWorked,
      'Total Monthly Wages': item.TotalMonthlyWages,
      'Reason Code for Zero Working Days': item.ReasonCode || '',
      'Last Working Day': item.LastWorkingDay ? new Date(item.LastWorkingDay).toLocaleDateString('en-GB') : '',
      'ESI Applicable': item.IsESIApplicable ? 'Yes' : 'No',
      'Employee Contribution': item.EmployeeContribution,
      'Employer Contribution': item.EmployerContribution,
      'Total Contribution': item.TotalContribution
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // IP Number
      { wch: 30 }, // IP Name
      { wch: 15 }, // Employee Code
      { wch: 35 }, // Days
      { wch: 20 }, // Wages
      { wch: 30 }, // Reason Code
      { wch: 20 }, // Last Working Day
      { wch: 15 }, // ESI Applicable
      { wch: 20 }, // Employee Contribution
      { wch: 20 }, // Employer Contribution
      { wch: 20 }  // Total Contribution
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Instructions & Reason Codes sheet
    const instructionsData = [
      ['Instructions & Reason Codes'],
      [''],
      ['Reason Code', 'Description'],
      ...this.reasonCodes.map(rc => [rc.ReasonCode, rc.ReasonDescription]),
      [''],
      ['Important Notes:'],
      ['1. For employees with zero working days, Reason Code and Last Working Day are mandatory'],
      ['2. Reason codes must be selected from the standard ESIC list'],
      ['3. Last Working Day should be the actual date of exit or last working day'],
      ['4. ESI contribution is calculated based on wages and attendance'],
      ['5. Employees above ESI ceiling (₹21,000) are not covered under ESI']
    ];

    const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions & Reason Codes');

    const fileName = `ESI_Wage_Report_${this.esiWageReportForm.get('period')?.value}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  resetForm(): void {
    this.esiWageReportForm.reset();
    this.esiWageReportData = [];
    this.validationErrors = [];
    this.showValidationOnly = false;
    this.summary = {
      totalEmployees: 0,
      totalMonthlyWages: 0,
      employeesWithZeroDays: 0,
      employeesWithValidationErrors: 0,
      totalESIContribution: 0
    };

    this.esiWageReportForm.get('Month')?.setValue(new Date().getMonth() + 1);
    this.esiWageReportForm.get('Year')?.setValue(new Date().getFullYear());
    this.esiWageReportForm.get('includeZeroDaysEmployees')?.setValue(true);
    this.esiWageReportForm.get('validateOnly')?.setValue(false);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
  }

  getValidationErrorsClass(hasErrors: boolean): string {
    return hasErrors ? 'text-danger' : 'text-success';
  }

  generateYearOptions() {
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
  }
}
