import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DecimalPipe } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-indian-gst-report',
  templateUrl: './indian-gst-report.component.html',
  styleUrls: ['./indian-gst-report.component.css']
})
export class IndianGSTReportComponent implements OnInit {
  frm!: FormGroup;
  currentUser: string = '';
  branchList: any = [];
  dataSource: any[] = [];
  summary: any = {};
  displayedColumns: string[] = [
    'SNo', 'TransactionType', 'InvoiceNo', 'InvoiceDate', 'Branch', 'ClientName',
    'ClientGSTIN', 'TaxableValue', 'CGST', 'SGST', 'IGST', 'TotalGST', 'InvoiceValue'
  ];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;

  constructor(
    private fb: FormBuilder,
    private _financeService: FinanceService,
    private _masterService: MastermoduleService,
    private _dataService: DatasharingService,
    private router: Router,
    private decimalPipe: DecimalPipe
  ) {
    this.frm = this.fb.group({
      Branch: [''],
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
    this.getUserAccessRights(this.currentUser, 'Indian GST Report');
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

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin' || this.currentUser == 'admin') {
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

  onSearch() {
    if (this.frm.invalid) {
      return;
    }
    this.showLoadingSpinner = true;
    this.errorMessage = '';
    const startDate = this.returnDate(this.frm.get('StartDate')?.value);
    const endDate = this.returnDate(this.frm.get('EndDate')?.value);
    const branch = this.frm.get('Branch')?.value || '';

    this._financeService.getIndianGSTReport(startDate, endDate, branch).subscribe({
      next: (data: any) => {
        this.dataSource = data.data || [];
        this.summary = data.summary || {};
        this.hideSpinner();
      },
      error: (err) => {
        this.handleErrors(err);
      }
    });
  }

  exportToExcel() {
    if (!this.dataSource || this.dataSource.length === 0) return;

    const exportData = this.dataSource.map((r, i) => ({
      'S.No': i + 1,
      'Invoice No': r.invoiceNo,
      'Invoice Date': r.invoiceDate,
      'Branch': r.branch,
      'Branch State': r.branchState,
      'Client Code': r.clientCode,
      'Client Name': r.clientName,
      'Client GSTIN': r.clientGSTIN,
      'Client State': r.clientState,
      'HSN/SAC Code': r.hsnSacCode,
      'Taxable Value': Number(r.taxableValue).toFixed(2),
      'CGST Amount': Number(r.cgstAmount).toFixed(2),
      'SGST Amount': Number(r.sgstAmount).toFixed(2),
      'IGST Amount': Number(r.igstAmount).toFixed(2),
      'Total GST': Number(r.totalGST).toFixed(2),
      'Invoice Value': Number(r.invoiceValue).toFixed(2),
      'Tax Type': r.taxType
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Indian GST Report');
    XLSX.writeFile(wb, 'Indian_GST_Report.xlsx');
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

  formatNumber(value: any): string {
    if (value === null || value === undefined) return '0.00';
    return this.decimalPipe.transform(value, '1.2-2') || '0.00';
  }
}
