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

export interface PFReportElement {
  UAN: string;
  Name: string;
  EmployeeCode: string;
  GrossSalary: number;
  PFSalary: number;
  PensionSalary: number;
  EDLISalary: number;
  EPF: number;
  EPS: number;
  Balance: number;
  NCP: number;
  EDLI: number;
  Days: number;
  Age: number;
}

@Component({
  selector: 'app-pf-report',
  templateUrl: './pf-report.component.html',
  styleUrls: ['./pf-report.component.css']
})
export class PfReportComponent implements OnInit {
  pfReportForm: FormGroup;
  pfReportData: any[] = [];
  branches: any[] = [];
  clients: any[] = [];
  employeeTypes: any[] = [];
  isLoading: boolean = false;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  years: number[] = [];
  displayedColumns: string[] = ['UAN', 'Name', 'EmployeeCode', 'GrossSalary', 'PFSalary', 'PensionSalary', 'EDLISalary', 'EPF', 'EPS', 'Balance', 'NCP', 'EDLI', 'Days', 'Age', 'actions'];
  dataSource = new MatTableDataSource<PFReportElement>();

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

    this.getUserAccessRights(this.currentUser, 'PF Statement Report');

    this.pfReportForm = this.fb.group({
      BranchCode: ['', Validators.required],
      ClientCode: [''],
      Month: [new Date().getMonth() + 1, Validators.required],
      Year: [new Date().getFullYear(), Validators.required],
      EmployeeType: ['All'],
      EmployeeCode: ['']
    });

    this.generateYearOptions();
  }

  ngOnInit(): void {
    this.loadBranches();
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
      this.setDatasource([]);
    } else {
      this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
        You do not have permissions to view this page. <br>
        If you feel you should have access to this page, Please contact administrator. <br>
        Thank you`;
    }
  }

  setDatasource(d: any) {
    this.dataSource = new MatTableDataSource(d);
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

  generateYearOptions() {
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  loadBranches(): void {
    this._masterService.GetBranchListByUserName(this.currentUser).subscribe(
      (data: any) => {
        this.branches = data;
      },
      (error) => {
        console.error('Error loading branches:', error);
      }
    );
  }

  onBranchSelectionChange(event: any): void {
    const branchCode = event.value;
    if (branchCode) {
      this.loadClients(branchCode);
    } else {
      this.clients = [];
    }
  }

  loadClients(branchCode: string): void {
    this._masterService.getClientMsterListByBranch(branchCode).subscribe(
      (data: any) => {
        this.clients = data;
      },
      (error) => {
        console.error('Error loading clients:', error);
      }
    );
  }

  hideLoadingSpinner() {
    this.showLoadingSpinner = false;
  }

  loadEmployeeTypes(): void {
    // Initialize with standard employee types like other reports
    this.employeeTypes = [
      { EmployeeType: 'Guard' },
      { EmployeeType: 'Staff' },
      { EmployeeType: 'All' }
    ];
  }

  generatePFReport(): void {
    if (this.pfReportForm.invalid) {
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
    const formValues = this.pfReportForm.value;

    // Convert separate Month/Year to period format for backend compatibility
    const month = formValues.Month.toString().padStart(2, '0');
    const period = `${formValues.Year}-${month}`;

    const request = {
      BranchCode: formValues.BranchCode,
      ClientCode: formValues.ClientCode || '',
      period: period,
      EmployeeType: formValues.EmployeeType,
      EmployeeCode: formValues.EmployeeCode || ''
    };

    this.financeService.getPFStatement(request).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.Success === 'Success') {
          this.pfReportData = response.Data;
          this.setDatasource(this.pfReportData);
        } else {
          Swal.fire({
            title: 'Error',
            text: response.Message,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'Failed to generate PF report',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  exportToExcel(): void {
    if (this.pfReportData.length === 0) {
      return;
    }

    const exportData = this.pfReportData.map(item => ({
      'UAN': item.UAN,
      'Name': item.Name,
      'Employee Code': item.EmployeeCode,
      'Gross Salary': item.GrossSalary,
      'PF Salary': item.PFSalary,
      'Pension Salary': item.PensionSalary,
      'EDLI Salary': item.EDLISalary,
      'EPF': item.EPF,
      'EPS': item.EPS,
      'Balance': item.Balance,
      'NCP': item.NCP,
      'EDLI': item.EDLI,
      'Days': item.Days,
      'Age': item.Age,
      'Above 55': item.IsAbove55 ? 'Yes' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PF Statement');

    const fileName = `PF_Statement_${this.pfReportForm.get('period')?.value}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  resetForm(): void {
    this.pfReportForm.reset();
    this.pfReportData = [];
    this.setDatasource([]);
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.pfReportForm.get('period')?.setValue(period);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getTotalGrossSalary(): number {
    return this.pfReportData.reduce((sum, item) => sum + (item.GrossSalary || 0), 0);
  }

  getTotalEPF(): number {
    return this.pfReportData.reduce((sum, item) => sum + (item.EPF || 0), 0);
  }

  getTotalEPS(): number {
    return this.pfReportData.reduce((sum, item) => sum + (item.EPS || 0), 0);
  }
}
