import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-tds-report',
  templateUrl: './tds-report.component.html',
  styleUrls: ['./tds-report.component.css']
})
export class TdsReportComponent implements OnInit {
  frm!: FormGroup;
  currentUser: string = '';
  branchList: any = [];
  clientList: any = [];
  dataSource: any[] = [];
  displayedColumns: string[] = [
    'SNo', 'ReceiptDate', 'VoucherNo', 'Branch', 'PaymentFrom',
    'ReceiptAmount', 'HQPercentage', 'HQAmount', 'BranchCollection'
  ];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;

  totalReceiptAmount: number = 0;
  totalHQAmount: number = 0;
  totalBranchCollection: number = 0;

  constructor(
    private fb: FormBuilder,
    private _financeService: FinanceService,
    private _masterService: MastermoduleService,
    private _dataService: DatasharingService,
    private router: Router
  ) {
    this.frm = this.fb.group({
      Branch: [''],
      Client: [''],
      StartDate: ['', Validators.required],
      EndDate: ['', Validators.required],
    });

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    };
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
    this.getUserAccessRights(this.currentUser, 'TDS Report');
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            });
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
              You do not have permissions to view this page. <br>
              If you feel you should have access to this page, Please contact administrator. <br>
              Thank you`;
          }
        }
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  returnDate(date?: any): string {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  branchChange(branchCode: string) {
    this.clientList = [];
    this.frm.patchValue({ Client: '' });
    
    if (branchCode) {
      this._financeService.GetClientByBranch(branchCode).subscribe((d: any) => {
        this.clientList = d;
      });
    }
  }

  onSearch() {
    if (this.frm.invalid) {
      return;
    }
    this.showLoadingSpinner = true;
    this.errorMessage = '';
    const startDate = this.returnDate(this.frm.get('StartDate')?.value);
    const endDate = this.returnDate(this.frm.get('EndDate')?.value);
    const branch = this.frm.get('Branch')?.value || '';
    const client = this.frm.get('Client')?.value || '';

    this._financeService.getTDSReport(startDate, endDate, branch, client).subscribe({
      next: (data: any[]) => {
        this.dataSource = data || [];
        this.calculateTotals();
        this.hideSpinner();
      },
      error: (err) => {
        this.handleErrors(err);
      }
    });
  }

  calculateTotals() {
    this.totalReceiptAmount = this.dataSource.reduce((sum, r) => sum + (Number(r.ReceiptAmount) || 0), 0);
    this.totalHQAmount = this.dataSource.reduce((sum, r) => sum + (Number(r.HQAmount) || 0), 0);
    this.totalBranchCollection = this.dataSource.reduce((sum, r) => sum + (Number(r.BranchCollection) || 0), 0);
  }

  exportToExcel() {
    if (!this.dataSource || this.dataSource.length === 0) return;

    const exportData = this.dataSource.map((r, i) => ({
      'S.No': i + 1,
      'Receipt Date': r.ReceiptDate ? this.returnDate(r.ReceiptDate) : '',
      'Voucher No': r.VoucherNo,
      'Branch': r.Branch,
      'Payment From': r.PaymentFrom,
      'Receipt Amount': Number(r.ReceiptAmount).toFixed(2),
      'TDS %': r.HQPercentage,
      'TDS Amount': Number(r.HQAmount).toFixed(2),
      'Branch Collection': Number(r.BranchCollection).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TDS Report');
    XLSX.writeFile(wb, 'TDS_Report.xlsx');
  }

  onPrint() {
    window.print();
  }

  handleErrors(error: any) {
    this.errorMessage = 'Error loading data. Please try again.';
    this.hideSpinner();
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
