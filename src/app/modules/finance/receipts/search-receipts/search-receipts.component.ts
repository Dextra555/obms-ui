import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { forkJoin, Observable } from 'rxjs';
export interface PeriodicElement {
  receipt_date: string;
  type: string;
  bank_code: string;
  bank_branch: string;
  cheque_no: string;
  amount: string;
  particulars: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { receipt_date: '14-Nov-2022', type: 'others', bank_code: 'Online fund Transfer', bank_branch: 'CIMB-OFT', cheque_no: '7235.00', amount: '	KWSP (Supplier)', particulars: '	KWSP (Supplier)' }
];
@Component({
  selector: 'app-search-receipts',
  templateUrl: './search-receipts.component.html',
  styleUrls: ['./search-receipts.component.css']
})
export class SearchReceiptsComponent implements OnInit {
  frm!: FormGroup;
  currentUser: string = '';
  branchList: any = [];
  bankList: any = [];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  searchOption:string = 'Payment Date';
  displayedColumns: string[] = ['ID','ReceiptDate', 'ReceiptType', 'BankCode', 'BankBranch', 'ChequeNo', 'ReceiptAmount', 'Particulars', 'action'];
  dataSource: any;
  dtReceiptDate!: string;

  private formatDate(date: any) {
    const d = new Date(date);
    const year = d.getFullYear();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);
    let hours = ('0' + d.getHours()).slice(-2);
    let minutes = ('0' + d.getMinutes()).slice(-2);
    let seconds = ('0' + d.getSeconds()).slice(-2);
    //let milliseconds = ('00' + d.getMilliseconds()).slice(-3);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }


  constructor(private fb: FormBuilder, public dialog: MatDialog, private service: FinanceService, private route: Router, 
    private _liveAnnouncer: LiveAnnouncer,
    private _dataService: DatasharingService, private _masterService: MastermoduleService,private _financeService: FinanceService) {
    this.frm = this.fb.group({
      Branch: [''],
      search_option: ['Payment Date'],
      receipt_date: [''],
      bank: [''],
      cheque_no: [''],
    })     
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Receipts');
  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.showLoadingSpinner = true;
            this.warningMessage = '';
            forkJoin({
              branchList: this.service.GetBranchListByUserName(this.currentUser),
              bankList: this._masterService.GetBankListByUserName(this.currentUser)
            }).subscribe(
              
              (results: { branchList: any; bankList: any }) => {
                // Handle the responses
                this.branchList = results.branchList;
                this.bankList = results.bankList;
              },
              (error) => {
                this.handleErrors(error);
              }
            );            
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            
          }
          this.hideLoadingSpinner()
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  searchOptionCahnge(event: any){
    this.searchOption = event.value;
  }

  onSearchClick(){
    this.showLoadingSpinner = true;
    this.dtReceiptDate = this.formatDate(new Date(this.frm.value.receipt_date));
    this._financeService
    .getBoth(this.dtReceiptDate, this.frm.value.Branch, this.frm.value.bank, this.frm.value.cheque_no)
    .subscribe(
      ([dateAndBranchData, bankAndChequeData]) => {
         // Initialize an empty array for the data source
         let finalDataSource = [...dateAndBranchData];

         // Check if cheque number is provided and add bankAndChequeData
         if (this.frm.value.cheque_no && this.frm.value.cheque_no.trim() !== '') {
           finalDataSource = [...bankAndChequeData];
         }
         
         // Bind the filtered data to the dataSource
         this.dataSource = finalDataSource;    
         this.hideLoadingSpinner();   
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onEditClick(data: any): void {
    this.route.navigate(['/finance/receipts/new-receipt'], { queryParams: { id: data.ID }, queryParamsHandling: 'merge' });
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.showLoadingSpinner = false
    }
  }
  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }
}
