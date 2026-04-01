import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SearchInvoiceComponent } from '../../finance/invoice/search-invoice/search-invoice.component';
import { CommonService } from "../../../service/common.service";
import { InventoryService } from "../../../service/inventory.service";
import { SearchUtilityBillsComponent } from "./search-utility-bills/search-utility-bills.component";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import Swal from "sweetalert2";
import { UserRegistration } from "../../../model/userregistration";
import { Router } from "@angular/router";
import { DatasharingService } from "../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

export interface IItemDetails {
  ID: number,
  InvoicePeriodFrom: Date,
  InvoicePeriodTo: Date,
  Amount: number,
  Note: string,
  index: number,
  SerialNo: number,
  ItemID: number,
  NoOfUnits: number,
  CostPerUnit: number,
  ValuePeriod: number,
  ValuePercentage: number,
  ValueStatus: string,
}

@Component({
  selector: 'app-utility-bills',
  templateUrl: './utility-bills.component.html',
  styleUrls: ['./utility-bills.component.css']
})
export class UtilityBillsComponent implements AfterViewInit {
  displayedColumns: string[] = ['InvoicePeriodFrom', 'InvoicePeriodTo', 'Amount', 'Note', 'action'];
  // dataSource = new MatTableDataSource(ELEMENT_DATA);
  frm!: FormGroup
  details: IItemDetails[] = [];
  branchList: any = [];
  supplierList: any = [];
  categoryList: any = [];
  payList: any = [];
  dataSource!: MatTableDataSource<IItemDetails>;
  detailEdit: boolean = false;
  errorDescription: string = "";
  isEdit: boolean = false;
  user: UserRegistration;
  returnResult: any;
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, commonService: CommonService, private service: InventoryService, private route: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

    this.user = commonService.getLocalUser();

    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Utility Bills');

    this.frm = this.fb.group({
      ID: [0],
      Branch: [''],
      Supplier: [''],
      ItemCategory: [''],
      RecID: [''],
      InvoiceNo: [''],
      InvoiceDate: [''],
      PaymentDate: [''],
      details: this.fb.group({
        ID: [0],
        InvoicePeriodFrom: [''],
        InvoicePeriodTo: [''],
        Amount: [''],
        Note: [''],
        index: [-1],
        SerialNo: [0]
      })
    })
  }


  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngAfterViewInit() {

  }
  onInvoiceDateSelected(event: any): void {
    const selectedDate = event.value; 
    const invoicePeriodFromControl = this.frm.get('details.InvoicePeriodFrom');
    const invoicePeriodToControl = this.frm.get('details.InvoicePeriodTo');
    if (selectedDate) {
      // Example: Maybe check if it's before the PaymentDate
      const paymentDate = this.frm.get('PaymentDate')?.value;

      if (invoicePeriodFromControl && this.returnDate(selectedDate) <= this.returnDate(paymentDate)) {       
        if (invoicePeriodFromControl) {
          invoicePeriodFromControl.setValue(this.returnDate(selectedDate));
        }
      } else if (invoicePeriodFromControl) { 
        invoicePeriodFromControl.setValue(this.returnDate(selectedDate))
        this.frm.get('PaymentDate')?.setValue(null);
        invoicePeriodToControl?.setValue("");
        this.showMessage(`Payment date cannot be earlier than the Invoice date.`, 'warning', 'Warning Message');
      }
    }
  }
  onPaymentDateSelected(event: any): void {
    const selectedDate = event.value; 
    const invoicePeriodToControl = this.frm.get('details.InvoicePeriodTo');

    if (selectedDate) {      
      const invoiceDate = this.frm.get('InvoiceDate')?.value;
      if (invoiceDate && this.returnDate(selectedDate) >= this.returnDate(invoiceDate)) {
        // Payment date is on or after Invoice date - This is likely the valid case
        if (invoicePeriodToControl) {
          invoicePeriodToControl.setValue(this.returnDate(selectedDate));
        }
      } else if (invoiceDate) {
        this.frm.get('PaymentDate')?.setValue(null); 
        invoicePeriodToControl?.setValue("");
        this.showMessage(`Payment date cannot be earlier than the Invoice date.`, 'warning', 'Warning Message');
      }
    }
  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.showLoadingSpinner = true;
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.service.getUtilityMaster("U", "", this.currentUser).subscribe((d: any) => {
              this.branchList = d['branchList'];
              this.supplierList = d['supplierList'];
              this.categoryList = d['categoryList'];
            })
            this.hideLoadingSpinner();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideLoadingSpinner();
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  searchinvoice() {
    const dialogRef = this.dialog.open(SearchUtilityBillsComponent, {
      disableClose: true,
      panelClass: ['wlt-c-lg-admin-dialog', 'animate__animated', 'animate__slideInDown'],
      width: '900px',
      //  position: { right: '0'}
    });
    dialogRef.afterClosed().subscribe(result => {
      this.returnResult = result
      this.frm.patchValue(result);
      this.frm.get("Supplier")?.setValue(result['Supplier'].toString());
      this.frm.get("ItemCategory")?.setValue(result['ItemCategory'].toString());

      this.categoryChange();
    });
  }

  categoryChange() {
    this.service.GetPaytoByCategory(this.frm.get('ItemCategory')?.value).subscribe((d: any) => {
      this.payList = [...d['List1'], ...d['List2']];
    }, () => {
    }, () => {
      let id = this.frm.get("ID")?.value;
      if (id != 0) {
        this.isEdit = true;
        this.frm.get("RecID")?.setValue(this.returnResult['RecID'].toString());
        this.service.GetUtilityDetailsByID(id).subscribe((d: any) => {
          console.log(d);
          d.map((d: any) => {
            d['InvoicePeriodFrom'] = this.returnDate(d['InvoicePeriodFrom']);
            d['InvoicePeriodTo'] = this.returnDate(d['InvoicePeriodTo']);
          })
          this.details = [...d];
          this.detailDataSource();
        })
      }
    })
  }

  detailDataSource() {
    this.dataSource = new MatTableDataSource(this.details);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  addItemDetails(action: string) {

    let frmData = this.frm.getRawValue();
    let details = frmData['details'];

    if (details['InvoicePeriodFrom'] == "" || details['InvoicePeriodTo'] == "" || details['Amount'] == "") {
      this.errorDescription = "please fill the field";
      return;
    }

    details['InvoicePeriodFrom'] = this.returnDate(this.frm.get('details.InvoicePeriodFrom')?.value);
    details['InvoicePeriodTo'] = this.returnDate(this.frm.get('details.InvoicePeriodTo')?.value);

    if (action == 'add') {
      details['ID'] = 0;
      this.details.push(details);
    } else if (details['index'] >= 0 && action == 'update') {
      this.details[details['index']] = details;
    }

    this.detailDataSource();


    this.emptyDetailData();
    this.detailEdit = false;
  }

  emptyDetailData() {
    let emptyData = {
      ID: 0,
      InvoicePeriodFrom: '',
      InvoicePeriodTo: '',
      Amount: 0,
      Note: "",
      index: -1,
      SerialNo: 0
    }


    this.frm.get('details')?.setValue(emptyData);
  }

  editRow(row: IItemDetails, index: any) {
    this.detailEdit = true;
    row['index'] = index;
    this.frm.get('details')?.patchValue(row);
  }

  deleteRow(row: IItemDetails, index: any) {
    if (row.ID != 0) {
      this.service.DeleteUtilityDetailById(row.ID + "").subscribe((d: any) => {
        console.log(d);
      })
    }
    this.details.splice(index, 1);
    this.detailDataSource();
  }

  returnDate(date?: any) {
    console.log(date);
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onSubmit() {

    if (this.frm.invalid) {
      return
    }

    let data = this.frm.getRawValue();

    this.details.map((d: any) => {
      d['InvoicePeriodFrom'] = this.returnDate(d['InvoicePeriodFrom']);
      d['InvoicePeriodTo'] = this.returnDate(d['InvoicePeriodTo']);
    });

    let total = 0;
    this.details.forEach((d: any, index) => {
      d['SerialNo'] = index + 1;
      d['LastUpdatedBy'] = this.currentUser;
      total += parseInt(d['Amount']);
    });


    data['Total'] = total;
    data['details'] = this.details;

    data['InvoiceType'] = "U";
    data['InvoiceDate'] = this.returnDate(this.frm.get('InvoiceDate')?.value);
    data['PaymentDate'] = this.returnDate(this.frm.get('PaymentDate')?.value);
    data['LastUpdatedBy'] = this.currentUser;

    console.log(data);
    let msg = "";
    this.service.saveUtility(data).subscribe((d: any) => {
      if (this.isEdit) {
        msg = 'Successfully Updated Utility Details';
      } else {
        msg = 'Successfully Saved Utility Details';
      }
      Swal.fire({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        title: 'Success',
        text: msg,
        icon: 'success',
        showCloseButton: false,
        timer: 3000,
      });
      this.route.navigate(['/inventory/utility-bills']);
      this.frm.reset();
      this.details = [];
      this.detailDataSource();
    })
  }

  supplierChange(event: any) {
    this.frm.get('RecID')?.setValue(event.value);
  }
private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: title,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px'
    });
    this.hideLoadingSpinner();
    return;
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner();
    }
  }
  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }
}
