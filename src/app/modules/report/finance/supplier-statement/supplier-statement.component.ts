import { Component, OnInit } from '@angular/core';
import { environment } from "../../../../../environments/environment";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MastermoduleService } from "../../../../service/mastermodule.service";
import { InventoryService } from "../../../../service/inventory.service";
import { EmployeeService } from "../../../../service/employee.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { Router, NavigationEnd } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { forkJoin } from 'rxjs';
import { MatSelectChange } from '@angular/material/select';
import { FinanceService } from 'src/app/service/finance.service';

@Component({
  selector: 'app-supplier-statement',
  templateUrl: './supplier-statement.component.html',
  styleUrls: ['./supplier-statement.component.css']
})
export class SupplierStatementComponent implements OnInit {
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Finance/"
  category: string = '';
  frm!: FormGroup;
  branchList: any = [];
  supplierList: any = [];
  categoryList: any = [];
  paytoList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  reportPageName: string = "";

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService,
    private empService: EmployeeService, private fb: FormBuilder, private router: Router, private _dataService: DatasharingService,
    private _financeService: FinanceService) {

    this.frm = fb.group({
      Branch: ["0"],
      Supplier: ["0"],
      ActivityType: ['A'],
      Category: [],
      payTo: [],
      StartDate: ["", Validators.required],
      EndDate: ["", Validators.required],
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
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Supplier Statement Report');
  }
  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            forkJoin({
              branchList: this._masterService.GetBranchListByUserName(this.currentUser),
              supplierList: this._masterService.getSuppliers(this.category),
              categoryList: this._masterService.getInventoryCategories('U'),
              paytoList: this._masterService.getSuppliers('U')
            }).subscribe({
              next: (result) => {
                this.branchList = result.branchList;
                this.supplierList = result.supplierList;
                this.categoryList = result.categoryList;
                this.paytoList = result.paytoList;
              },
              error: (err) => {
                console.error('Error fetching data', err);
              }
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
  onSupplierSelectionChange(event: any) {
    console.log('Supplier: ', this.frm.get("Supplier")?.value ?? 0)
    forkJoin({
      categoryList: this._masterService.getInventoryCategories(event.value),
      paytoList: this._masterService.getSuppliers(event.value)
    }).subscribe({
      next: (result) => {
        this.categoryList = result.categoryList;
        this.paytoList = result.paytoList;
      },
      error: (err) => {
        console.error('Error fetching data', err);
      }
    });
  }
  returnDate(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  clkBtn(number: number) {
    this.reportPageName = number == 1 ? "SupplierStatementReport.aspx?" : 'InvoiceCollectionTotalReportNoTax.aspx?';
    this.reportPageName += "LoginID=" + this.currentUser;
  }
  onSubmit() {
    if (this.frm.invalid) return;

    const startDate = this.returnDate(this.frm.get("StartDate")?.value);
    const endDate = this.returnDate(this.frm.get("EndDate")?.value);
    const branch = this.frm.get("Branch")?.value ?? '';
    const supplier = this.frm.get("Supplier")?.value ?? 0;
    const payTo = this.frm.get("payTo")?.value ?? 0;
    const category = this.frm.get("Category")?.value ?? '';
    const status = this.frm.get("ActivityType")?.value ?? '';

    if (supplier == 0) {
      this.frm.get("Supplier")?.setErrors({ required: true });
      return;
    }
    const payload = { startDate, endDate, branch, supplier, payTo, category, status };

    this._financeService.executeSupplierReport(payload).subscribe({
      next: () => {
        let localURL = '';
        localURL += `&StartDate=${startDate}`;
        localURL += `&EndDate=${endDate}`;
        localURL += `&Branch=${branch}`;
        localURL += `&Supplier=${supplier}`;

        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
          environment.baseReportUrl + this.currentUrl + this.reportPageName + localURL
        );
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
