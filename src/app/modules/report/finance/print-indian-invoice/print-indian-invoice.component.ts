import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { FinanceService } from 'src/app/service/finance.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

export interface PeriodicElement {
  s_no: number,
  client_name: string,
}

@Component({
  selector: 'app-print-indian-invoice',
  templateUrl: './print-indian-invoice.component.html',
  styleUrls: ['./print-indian-invoice.component.css']
})
export class PrintIndianInvoiceComponent implements AfterViewInit {
  rowCheckedState: boolean[] = [];
  displayedColumns: string[] = ['s_no', 'Name'];
  dataSource = new MatTableDataSource();
  frm!: FormGroup
  currentUser: string = '';
  branchList: any;
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  batchInvoice: any = [];
  selectedBatchInvoiceIds: string[] = [];
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  client: any;
  InvoiceDate: any;
  Subject: any;
  Note: any;

  constructor(public sanitizer: DomSanitizer, private fb: FormBuilder, public dialog: MatDialog,
    private _liveAnnouncer: LiveAnnouncer, private service: FinanceService, private router: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.frm = this.fb.group({
      invoice_period: ['', [Validators.required]],
      branch: ['', [Validators.required]],
      client: [''],
      checkAll: [false]
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Invoice Report');
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
            this.service.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            })
            this.hideLoadingSpinner()
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideLoadingSpinner()
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  returnMonthAndYear(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;


    const monthString = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));
    return `${monthString} ${year}`;
  }
  changeAdvanceDate() {
    this.getClients();
  }
  getClients() {
    if (this.frm.get("branch")?.value != "" && this.frm.get("invoice_period")?.value != "") {
      let branch = this.frm.get("branch")?.value;
      this.InvoiceDate = this.returnDate(this.frm.get("invoice_period")?.value);

      let dateStr = this.returnMonthAndYear(this.frm.get("invoice_period")?.value)
      this.Subject = "Being Charges for Security Services for the month of " + dateStr;
      this.Note = "Being Charges for Security Services for the month of " + dateStr;

      this.rowCheckedState = [];
      this.service.getBatchInvoiceClients(branch, this.InvoiceDate).subscribe((d: any) => {

        this.batchInvoice = d['batchInvoice'];
        this.setDatasource(this.batchInvoice);
        if (this.batchInvoice.length == 0) {
          this.frm.patchValue({
            branch: '0'
          });
        }

        for (let i = 0; i < this.batchInvoice.length; i++) {
          this.rowCheckedState.push(false);
        }
      }, () => {
      },
        () => {
          this.toggleRowCheckboxAll();
        });
    }
  }

  toggleRowCheckbox(index: number, id: string) {
    // Toggle the checkbox state
    this.rowCheckedState[index] = !this.rowCheckedState[index];

    // Add or remove ID from selectedBatchInvoiceIds
    if (this.rowCheckedState[index]) {
      this.selectedBatchInvoiceIds.push(id);
    } else {
      this.selectedBatchInvoiceIds = this.selectedBatchInvoiceIds.filter(invoiceId => invoiceId !== id);
    }
    // Check if all rows are selected
    let allChecked = this.rowCheckedState.every(checked => checked);
    this.frm.get('checkAll')?.setValue(allChecked);
  }

  toggleRowCheckboxAll() {
    let state = this.frm.get('checkAll')?.value; // Get the current state of the "checkAll" checkbox

    this.rowCheckedState = this.rowCheckedState.map(() => state); // Set all rows to the same state

    if (state) {
      // If "checkAll" is checked, add all IDs to the selectedBatchInvoiceIds
      this.selectedBatchInvoiceIds = (this.batchInvoice || []).map((invoice: { ID: any; }) => invoice.ID);
    } else {
      // If "checkAll" is unchecked, clear the selectedBatchInvoiceIds
      this.selectedBatchInvoiceIds = [];
    }
  }

  setDatasource(d: any) {
    this.dataSource = new MatTableDataSource(d);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
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

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner()
    }
  }

  printIndianInvoiceClick() {
    // Load the HTML template and populate with invoice data
    this.loadIndianInvoiceTemplate();
  }

  loadIndianInvoiceTemplate() {
    // Fetch the HTML template
    fetch('assets/invoice-templates/invoice.html')
      .then(response => response.text())
      .then(htmlContent => {
        // Populate template with invoice data
        const populatedHtml = this.populateInvoiceTemplate(htmlContent);

        // Create a blob URL for the populated HTML
        const blob = new Blob([populatedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Set the iframe source to the populated HTML
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      })
      .catch(error => {
        console.error('Error loading invoice template:', error);
        // Fallback to report URL if template fails to load
        this.url = environment.baseReportUrl;
        this.url += 'Finance/IndianInvoiceReport.aspx?';
        this.url += "LoginID=" + this.currentUser;
        this.url += "&ID=" + this.selectedBatchInvoiceIds;
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
      });
  }

  populateInvoiceTemplate(template: string): string {
    // Get sample invoice data - in real implementation, this would come from API
    const invoiceData = this.getInvoiceData();

    // Replace all template variables
    let populatedTemplate = template;

    // Replace each placeholder with actual data
    populatedTemplate = populatedTemplate.replace(/\{\{InvoiceNo\}\}/g, invoiceData.invoiceNo);
    populatedTemplate = populatedTemplate.replace(/\{\{InvoiceDate\}\}/g, invoiceData.invoiceDate);
    populatedTemplate = populatedTemplate.replace(/\{\{BillingName\}\}/g, invoiceData.billingName);
    populatedTemplate = populatedTemplate.replace(/\{\{BillingAddress\}\}/g, invoiceData.billingAddress);
    populatedTemplate = populatedTemplate.replace(/\{\{BillingGSTIN\}\}/g, invoiceData.billingGSTIN);
    populatedTemplate = populatedTemplate.replace(/\{\{BillingState\}\}/g, invoiceData.billingState);
    populatedTemplate = populatedTemplate.replace(/\{\{ShippingName\}\}/g, invoiceData.shippingName);
    populatedTemplate = populatedTemplate.replace(/\{\{ShippingAddress\}\}/g, invoiceData.shippingAddress);
    populatedTemplate = populatedTemplate.replace(/\{\{ShippingGSTIN\}\}/g, invoiceData.shippingGSTIN);
    populatedTemplate = populatedTemplate.replace(/\{\{ShippingState\}\}/g, invoiceData.shippingState);
    populatedTemplate = populatedTemplate.replace(/\{\{WorkOrderNo\}\}/g, invoiceData.workOrderNo);
    populatedTemplate = populatedTemplate.replace(/\{\{WorkOrderDate\}\}/g, invoiceData.workOrderDate);
    populatedTemplate = populatedTemplate.replace(/\{\{SACCode\}\}/g, invoiceData.sacCode);
    populatedTemplate = populatedTemplate.replace(/\{\{DataRows\}\}/g, invoiceData.dataRows);
    populatedTemplate = populatedTemplate.replace(/\{\{Subtotal\}\}/g, invoiceData.subtotal);
    populatedTemplate = populatedTemplate.replace(/\{\{CGSTPct\}\}/g, invoiceData.cgstPct);
    populatedTemplate = populatedTemplate.replace(/\{\{CGSTAmount\}\}/g, invoiceData.cgstAmount);
    populatedTemplate = populatedTemplate.replace(/\{\{SGSTPct\}\}/g, invoiceData.sgstPct);
    populatedTemplate = populatedTemplate.replace(/\{\{SGSTAmount\}\}/g, invoiceData.sgstAmount);
    populatedTemplate = populatedTemplate.replace(/\{\{IGSTPct\}\}/g, invoiceData.igstPct);
    populatedTemplate = populatedTemplate.replace(/\{\{IGSTAmount\}\}/g, invoiceData.igstAmount);
    populatedTemplate = populatedTemplate.replace(/\{\{GrandTotal\}\}/g, invoiceData.grandTotal);
    populatedTemplate = populatedTemplate.replace(/\{\{AmountInWords\}\}/g, invoiceData.amountInWords);
    populatedTemplate = populatedTemplate.replace(/\{\{ServicePeriod\}\}/g, invoiceData.servicePeriod);
    populatedTemplate = populatedTemplate.replace(/\{\{ThankYouMessage\}\}/g, invoiceData.thankYouMessage);
    populatedTemplate = populatedTemplate.replace(/\{\{BankName\}\}/g, invoiceData.bankName);
    populatedTemplate = populatedTemplate.replace(/\{\{BankBranch\}\}/g, invoiceData.bankBranch);
    populatedTemplate = populatedTemplate.replace(/\{\{AccountNo\}\}/g, invoiceData.accountNo);
    populatedTemplate = populatedTemplate.replace(/\{\{IFSCCode\}\}/g, invoiceData.ifscCode);
    populatedTemplate = populatedTemplate.replace(/\{\{PAN\}\}/g, invoiceData.pan);
    populatedTemplate = populatedTemplate.replace(/\{\{CompanyGSTIN\}\}/g, invoiceData.companyGSTIN);
    populatedTemplate = populatedTemplate.replace(/\{\{EPFNo\}\}/g, invoiceData.epfNo);
    populatedTemplate = populatedTemplate.replace(/\{\{ESIC\}\}/g, invoiceData.esic);
    populatedTemplate = populatedTemplate.replace(/\{\{CompanyName\}\}/g, invoiceData.companyName);
    populatedTemplate = populatedTemplate.replace(/\{\{CompanyPhone\}\}/g, invoiceData.companyPhone);
    populatedTemplate = populatedTemplate.replace(/\{\{GlobalOfficeAddress\}\}/g, invoiceData.globalOfficeAddress);
    populatedTemplate = populatedTemplate.replace(/\{\{GlobalOfficePhone\}\}/g, invoiceData.globalOfficePhone);
    populatedTemplate = populatedTemplate.replace(/\{\{GlobalOfficeFax\}\}/g, invoiceData.globalOfficeFax);

    return populatedTemplate;
  }

  getInvoiceData() {
    // Sample invoice data - in real implementation, this would come from API based on selected invoices
    return {
      invoiceNo: 'FWG/INV/2024-25/001',
      invoiceDate: this.returnDate(new Date()),
      billingName: 'Sample Client Company',
      billingAddress: '123 Business Street, Chennai, Tamil Nadu - 600001',
      billingGSTIN: '33AAAPL1234C1ZV',
      billingState: 'Tamil Nadu',
      shippingName: 'Sample Client Company',
      shippingAddress: '123 Business Street, Chennai, Tamil Nadu - 600001',
      shippingGSTIN: '33AAAPL1234C1ZV',
      shippingState: 'Tamil Nadu',
      workOrderNo: 'WO-2024-001',
      workOrderDate: this.returnDate(new Date()),
      sacCode: '998811',
      dataRows: `
        <tr>
          <td>1</td>
          <td>Security Services - Manpower Supply</td>
          <td>998811</td>
          <td>18%</td>
          <td>1</td>
          <td>50,000.00</td>
          <td>50,000.00</td>
        </tr>
      `,
      subtotal: '50,000.00',
      cgstPct: '9',
      cgstAmount: '4,500.00',
      sgstPct: '9',
      sgstAmount: '4,500.00',
      igstPct: '0',
      igstAmount: '0.00',
      grandTotal: '59,000.00',
      amountInWords: 'Fifty Nine Thousand Only',
      servicePeriod: 'April 2024',
      thankYouMessage: 'Thank you for your business!',
      bankName: 'State Bank of India',
      bankBranch: 'Anna Salai Branch, Chennai',
      accountNo: '123456789012345',
      ifscCode: 'SBIN0001234',
      pan: 'AAAPL1234C',
      companyGSTIN: '33AAAPL1234C1ZV',
      epfNo: 'TNMAS1234567890',
      esic: '1234567890',
      companyName: 'FreightWatch G Security Services India Pvt. Ltd.',
      companyPhone: '+91 4440050684',
      globalOfficeAddress: 'Global Office: 123 International Plaza, Singapore',
      globalOfficePhone: '+65 1234 5678',
      globalOfficeFax: '+65 1234 5679'
    };
  }

  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }
}
