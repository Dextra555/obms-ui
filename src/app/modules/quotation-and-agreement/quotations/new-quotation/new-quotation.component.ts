import { Component, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { MatSort, Sort } from '@angular/material/sort';

import { jsPDF } from 'jspdf';

import autoTable from 'jspdf-autotable';

import { LiveAnnouncer } from '@angular/cdk/a11y';

import { QuotationService } from "../../quotation.service";

import { MastermoduleService } from 'src/app/service/mastermodule.service';

import { ServiceTypeService } from "../../../../service/service-type.service";

import { ServiceType } from "../../../../model/service-type.model";

import { UserAccessModel } from 'src/app/model/userAccesModel';

import Swal from "sweetalert2";

import { ActivatedRoute, Router } from "@angular/router";

import { DatasharingService } from "../../../../service/datasharing.service";

import { GSTConfiguration } from 'src/app/model/indian-compliance.model';

import { PdfExportService } from "../../../../service/pdf-export.service";

import { CommercialBreakdownDialogComponent } from "./commercial-breakdown-dialog/commercial-breakdown-dialog.component";

import { IQuotationDetail } from "../../../../model/quotation-detail.model";



export interface IQuotation {

  ID: number,

  BranchName: string;

  ClientName: string;

  QuotationDate: string;

}



@Component({

  selector: 'app-new-quotation',

  templateUrl: './new-quotation.component.html',

  styleUrls: ['./new-quotation.component.css']

})

export class NewQuotationComponent {

  displayedColumns: string[] = ['SNo', 'ServiceType', 'Description', 'NoOfGuards', 'PerMonth', 'PerDay', 'Rate', 'NoOfHours', 'NoOfDays', 'FollowCalender', 'MonthTotal', 'YearTotal', 'HasDiscount', 'DiscountAmount', 'DiscountHour', 'IsTaxable', 'TaxAmount', 'total', 'Category', 'Reason', 'action'];

  dataSource!: MatTableDataSource<IQuotationDetail>;



  quotationDisplayedColumns: string[] = ['SNo', 'QuotationID', 'BranchName', 'ClientName', 'QuotationDate', 'action'];

  quotationDataSource!: MatTableDataSource<IQuotation>;



  frm!: FormGroup

  details: IQuotationDetail[] = [];

  data: any;

  branchList: any;

  clientList: any;

  serviceTypes: ServiceType[] = [];

  gstConfigList: GSTConfiguration[] = [];

  isEdit: boolean = false;

  isFollowCalendarManuallyChanged: boolean = false;

  detailEdit: boolean = false;

  ID: any;

  today: any;

  sixMonthsAgo: any;

  errorDescription: string = "";

  type: string = "";

  currentUser: string = '';

  errorMessage: string = '';

  showLoadingSpinner: boolean = false;

  userAccessModel!: UserAccessModel;



  constructor(

    private fb: FormBuilder,

    private _liveAnnouncer: LiveAnnouncer,

    public service: QuotationService,

    private serviceTypeService: ServiceTypeService,

    private activatedRoute: ActivatedRoute,

    private route: Router,

    private _dataService: DatasharingService,

    private _masterService: MastermoduleService,

    private _pdfService: PdfExportService,

    private dialog: MatDialog

  ) {

    this.userAccessModel = {

      readAccess: false,

      updateAccess: false,

      deleteAccess: false,

      createAccess: false,

    }

    this.currentUser = sessionStorage.getItem('username')!;

    if (this.currentUser == 'null' || this.currentUser == undefined) {

      this._dataService.getUsername().subscribe((username) => {

        this.currentUser = username;

      });

    }

    this.getUserAccessRights(this.currentUser, 'Quotation');

    this.today = new Date();

    this.sixMonthsAgo = new Date();

    this.sixMonthsAgo.setMonth(this.today.getMonth() - 6);



    this.ID = this.activatedRoute.snapshot.params['ID'];

    this.frm = this.fb.group({

      ID: [0],

      QuotationDate: [new Date(), Validators.required],

      Branch: ['', Validators.required],

      Client: ['', Validators.required],

      IsValid: [true],

      details: this.fb.group({

        ID: [0],

        QuotationID: [0],

        ServiceTypeID: [null],

        Description: [''],

        NoOfGuards: [0],

        PerDay: [0],

        PerMonth: [0],

        Rate: [0],

        NoOfHours: [8],

        NoOfDays: [0],

        FollowCalender: [false],

        MonthTotal: [0],

        YearTotal: [0],

        HasDiscount: [false],

        DiscountAmount: [0],

        DiscountHour: [0],

        IsTaxable: [true],

        TaxAmount: [0],

        total: [0],

        Category: [''],

        Reason: [''],

        index: [-1],

        Basic: [0],

        DA: [0],

        Leaves: [0],

        Allowance: [0],

        Bonus: [0],

        NFH: [0],

        PF: [0],

        ESI: [0],

        Uniform: [0],

        ServiceFee: [0],

        CommercialBreakdown: [null]

      }),

      Note: ['-'],

    });



    service.getQuotationMaster(this.currentUser).subscribe((data: any) => {

      this.data = data;

      this.branchList = data['branchList'];

      this.clientList = data['clientList'];

    });



    this.loadServiceTypes();



    this._masterService.getGSTConfigurationList().subscribe(data => {

      this.gstConfigList = data || [];

    });



    if (this.ID != 0 && this.ID != undefined) {

      this.isEdit = true;

      service.getQuotationByID(this.ID).subscribe((d: any) => {

        let result = d['Result'] || d;

        let quotation = result['quotation'] || result;

        let quotationDetails = result['quotationDetails'] || result['details'] || [];



        this.frm.patchValue(quotation);



        quotationDetails.forEach((d: any) => {

          d['YearTotal'] = Math.round(d['MonthTotal'] * 12);



          let vDiscount = parseFloat(d['Discount'] || d['DiscountAmount'] || 0);

          if (!d['HasDiscount']) {

            vDiscount = 0;

          }



          let t = (parseFloat(d['MonthTotal']) - vDiscount);

          if (d['IsTaxable']) {

            d['total'] = this.formatCurrency((t * (108 / 100)));

          } else {

            d['total'] = this.formatCurrency(t);

          }



          // Reconstruct commercial breakdown data from individual columns

          d['CommercialBreakdown'] = {

            Basic: d['Basic'] || 0,

            DA: d['DA'] || 0,

            MinimumWages: (d['Basic'] || 0) + (d['DA'] || 0),

            HRA: d['HRA'] || 0,

            HRAPercentage: d['HRAPercentage'] || 0,

            Leaves: d['Leaves'] || 0,

            LeavesPercentage: d['LeavesPercentage'] || 0,

            ProfessionalTax: d['ProfessionalTax'] || 0,

            Bonus: d['Bonus'] || 0,

            BonusPercentage: d['BonusPercentage'] || 0,

            RelieverCharges: d['RelieverCharges'] || 0,

            RelieverChargesPercentage: d['RelieverChargesPercentage'] || 0,

            PF: d['PF'] || 0,

            PFPercentage: d['PFPercentage'] || 0,

            ESI: d['ESI'] || 0,

            ESIPercentage: d['ESIPercentage'] || 0,

            UniformCost: d['Uniform'] || d['UniformCost'] || 0,

            Others: d['Others'] || 0,

            OthersPercentage: d['OthersPercentage'] || 0,

            AdministrationCharges: d['AdministrationCharges'] || 0,

            AdministrationChargesPercentage: d['AdministrationChargesPercentage'] || 0,

            ManagementFee: d['ManagementFee'] || 0,

            ManagementFeePercentage: d['ManagementFeePercentage'] || 0,

            SubTotal: d['SubTotal'] || 0,

            TotalPlusStatutory: d['TotalPlusStatutory'] || 0,

            TotalDirectCost: d['TotalDirectCost'] || 0,

            MonthlyChargedCost: d['MonthlyChargedCost'] || 0

          };



          this.details.push(d);

        });



        this.detailDataSource();

      });

    }

  }



  getUserAccessRights(userName: string, screenName: string) {

    this._masterService.getUserAccessRights(userName, screenName).subscribe(

      (data) => {

        if (data != null) {

          this.userAccessModel.readAccess = data.Read

          this.userAccessModel.deleteAccess = data.Delete;

          this.userAccessModel.updateAccess = data.Update;

          this.userAccessModel.createAccess = data.Create;

        }

      },

      (error) => {

        this.handleErrors(error);

      }

    );

  }



  openCommercialDetails(row?: any, index: number = -1) {

    // Get commercial breakdown data separately from PER HEAD data

    const commercialBreakdownData = row ? row.CommercialBreakdown || {} : {};



    // Pass existing rate/guards/days if available to the dialog

    if (row) {

      commercialBreakdownData.NoOfGuards = row.NoOfGuards;

      commercialBreakdownData.NoOfDays = row.NoOfDays;

    } else {

      commercialBreakdownData.NoOfGuards = this.frm.get('details.NoOfGuards')?.value || 1;

      commercialBreakdownData.NoOfDays = this.frm.get('details.NoOfDays')?.value || 30;

    }



    const dialogRef = this.dialog.open(CommercialBreakdownDialogComponent, {

      width: '600px',

      data: commercialBreakdownData

    });



    dialogRef.afterClosed().subscribe(result => {

      if (result) {

        if (row) {

          // Find correct index in case of sorting/filtering

          const actualIndex = this.details.indexOf(row);

          if (actualIndex >= 0) {

            // ONLY update the CommercialBreakdown field - do NOT touch Rate, MonthTotal, or any main row fields

            this.details[actualIndex] = {

              ...this.details[actualIndex],

              CommercialBreakdown: result

            };

            this.detailDataSource();

          }

        } else {

          // Only store the CommercialBreakdown in the form - do NOT change Rate or MonthTotal

          this.frm.get('details.CommercialBreakdown')?.setValue(result);

        }

      }

    });

  }



  private calculateTotal(monthTotal: number, rate: number, row: any): any {

    let vDiscount = parseFloat(row.DiscountAmount || 0);

    if (!row.HasDiscount) vDiscount = 0;

    

    let t = monthTotal - vDiscount;

    

    // Get dynamic GST rate

    let gstRate = 18; // Default fallback

    const serviceTypeId = row.ServiceTypeID;

    if (serviceTypeId) {

      const selectedService = this.serviceTypes.find(st => st.Id === serviceTypeId);

      if (selectedService && selectedService.HSNCode) {

        const config = this.gstConfigList.find(c => c.hsnCode === selectedService.HSNCode);

        if (config && config.gstRate) {

          gstRate = config.gstRate;

        }

      }

    }



    // Apply CGST/IGST logic

    let branchState = '';

    let clientState = '';

    let taxType = 'IGST'; // Default to IGST

    

    if (this.branchList && this.clientList) {

      const branchObj = this.branchList.find((x: any) => x.Code === row.Branch);

      const clientObj = this.clientList.find((x: any) => x.Code === row.Client);

      branchState = branchObj?.State || branchObj?.state || '';

      clientState = clientObj?.State || clientObj?.state || '';

      

      // Normalize state codes

      const normalizedBranchState = branchState.toUpperCase().replace(/\s/g, '');

      const normalizedClientState = clientState.toUpperCase().replace(/\s/g, '');

      

      // Determine tax type

      if (normalizedBranchState === normalizedClientState && normalizedBranchState !== '') {

        taxType = 'CGST';

      } else {

        taxType = 'IGST';

      }

    }



    if (row.IsTaxable) {

       return this.formatCurrency((t * (1 + gstRate / 100)));

    }

    return this.formatCurrency(t);

  }



  loadServiceTypes(): void {

    this.serviceTypeService.getAllServiceTypes().subscribe(

      (data: ServiceType[]) => {

        this.serviceTypes = data;

      },

      () => {

        // Silently fail - service types are optional

      }

    );

  }



  onServiceTypeChange(serviceTypeId: number, detailIndex: number) {

    if (!this.frm.get('Branch')?.value || !this.frm.get('Client')?.value) {

      Swal.fire({

        toast: true, position: 'top', showConfirmButton: false, title: 'Warning',

        text: 'Please select Branch and Client first!', icon: 'warning', showCloseButton: false, timer: 4000

      });

      setTimeout(() => this.frm.get('details.ServiceTypeID')?.setValue(null));

      return;

    }



    const selectedService = this.serviceTypes.find(st => st.Id === serviceTypeId);

    if (!selectedService) return;



    this.frm.get('details.ServiceTypeID')?.setValue(serviceTypeId);

    this.frm.get('details.Description')?.setValue(selectedService.ServiceName);

    this.frm.get('details.Rate')?.setValue(0);



    this.DetailRowChange();

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



  onSubmit() {

    let data = this.frm.getRawValue();

    // Sync PerDay and PerMonth values from form to details array
    this.details.forEach((detail: any) => {
      detail.PerDay = parseFloat(detail.PerDay) || 0;
      detail.PerMonth = parseFloat(detail.PerMonth) || 0;
    });

    data['details'] = this.details;



    if (this.frm.invalid) {

      return

    }

    data['QuotationDate'] = this.returnDate(this.frm.get('QuotationDate')?.value);

    let msg = "";

    

    if (this.isEdit) {

      msg = 'Successfully Updated Quotation Details';

    } else {

      msg = 'Successfully Saved Quotation Details';

    }

    

    this.service.saveAndUpdateQuotation(data).subscribe((d: any) => {

      console.log('Quotation save response:', d);

      const quotationId = d['QuotationID'] || d['quotation']?.ID || d['quotation']?.id || d['ID'] || d['id'] || 0;

      

      console.log('Extracted quotationId:', quotationId);

      

      if (quotationId === 0) {

        console.error('Failed to get valid QuotationID from response:', d);

        Swal.fire({

          toast: true,

          position: 'top',

          showConfirmButton: false,

          title: 'Error',

          text: 'Failed to save quotation. Please try again.',

          icon: 'error',

          showCloseButton: false,

          timer: 3000,

        });

        return;

      }



      // Save each quotation detail

      if (this.details && this.details.length > 0) {

        const detailSavePromises = this.details.map((detail: any) => {

          detail.QuotationID = quotationId;

          detail.Client = this.frm.get('Client')?.value || '';

          detail.Branch = this.frm.get('Branch')?.value || '';

          detail.QuotationDate = data['QuotationDate'];

          

          // Ensure all required fields have proper values

          detail.Description = detail.Description || '';

          detail.NoOfGuards = parseInt(detail.NoOfGuards) || 0;

          detail.Rate = parseFloat(detail.Rate) || 0;

          detail.NoOfHours = parseFloat(detail.NoOfHours) || 0;

          detail.NoOfDays = parseFloat(detail.NoOfDays) || 0;

          detail.FollowCalender = detail.FollowCalender || false;

          detail.HasDiscount = detail.HasDiscount || false;

          detail.DiscountAmount = parseFloat(detail.DiscountAmount) || 0;

          detail.DiscountHour = parseInt(detail.DiscountHour) || 0;

          detail.IsTaxable = detail.IsTaxable || false;

          detail.TaxAmount = parseFloat(detail.TaxAmount) || 0;

          detail.MonthTotal = parseFloat(detail.MonthTotal) || 0;

          detail.LASTUPDATE = new Date();

          detail.Category = detail.Category || '';

          detail.Reason = detail.Reason || '';



          // Extract commercial breakdown data and merge into main detail object for database storage

          if (detail.CommercialBreakdown) {

            const cb = detail.CommercialBreakdown;

            detail.Basic = cb.Basic || 0;

            detail.DA = cb.DA || 0;

            detail.HRA = cb.HRA || 0;

            detail.HRAPercentage = cb.HRAPercentage || 0;

            detail.Leaves = cb.Leaves || 0;

            detail.LeavesPercentage = cb.LeavesPercentage || 0;

            detail.ProfessionalTax = cb.ProfessionalTax || 0;

            detail.Bonus = cb.Bonus || 0;

            detail.BonusPercentage = cb.BonusPercentage || 0;

            detail.RelieverCharges = cb.RelieverCharges || 0;

            detail.RelieverChargesPercentage = cb.RelieverChargesPercentage || 0;

            detail.PF = cb.PF || 0;

            detail.PFPercentage = cb.PFPercentage || 0;

            detail.ESI = cb.ESI || 0;

            detail.ESIPercentage = cb.ESIPercentage || 0;

            detail.Uniform = cb.UniformCost || cb.Uniform || 0;

            detail.Others = cb.Others || 0;

            detail.OthersPercentage = cb.OthersPercentage || 0;

            detail.AdministrationCharges = cb.AdministrationCharges || 0;

            detail.AdministrationChargesPercentage = cb.AdministrationChargesPercentage || 0;

            detail.ManagementFee = cb.ManagementFee || 0;

            detail.ManagementFeePercentage = cb.ManagementFeePercentage || 0;

            detail.SubTotal = cb.SubTotal || 0;

            detail.TotalPlusStatutory = cb.TotalPlusStatutory || 0;

            detail.TotalDirectCost = cb.TotalDirectCost || 0;

            detail.MonthlyChargedCost = cb.MonthlyChargedCost || 0;

          } else {

            // Set default values for commercial breakdown fields if not present

            detail.Basic = detail.Basic || 0;

            detail.DA = detail.DA || 0;

            detail.Leaves = detail.Leaves || 0;

            detail.Allowance = detail.Allowance || 0;

            detail.Bonus = detail.Bonus || 0;

            detail.NFH = detail.NFH || 0;

            detail.PF = detail.PF || 0;

            detail.ESI = detail.ESI || 0;

            detail.Uniform = detail.Uniform || 0;

            detail.ServiceFee = detail.ServiceFee || 0;

            detail.HRA = detail.HRA || 0;

            detail.HRAPercentage = detail.HRAPercentage || 0;

            detail.ProfessionalTax = detail.ProfessionalTax || 0;

            detail.RelieverCharges = detail.RelieverCharges || 0;

            detail.RelieverChargesPercentage = detail.RelieverChargesPercentage || 0;

            detail.Others = detail.Others || 0;

            detail.OthersPercentage = detail.OthersPercentage || 0;

            detail.AdministrationCharges = detail.AdministrationCharges || 0;

            detail.AdministrationChargesPercentage = detail.AdministrationChargesPercentage || 0;

            detail.ManagementFee = detail.ManagementFee || 0;

            detail.ManagementFeePercentage = detail.ManagementFeePercentage || 0;

            detail.SubTotal = detail.SubTotal || 0;

            detail.TotalPlusStatutory = detail.TotalPlusStatutory || 0;

            detail.TotalDirectCost = detail.TotalDirectCost || 0;

            detail.MonthlyChargedCost = detail.MonthlyChargedCost || 0;

          }



          console.log('Saving detail:', detail);

          return this.service.saveAndUpdateQuotationDetails(detail).toPromise();

        });



        // Wait for all details to be saved before proceeding

        Promise.all(detailSavePromises).then(() => {

          this.showSuccessMessageAndNavigate(msg);

        }).catch((err) => {

          console.error('Error saving some details:', err);

          // Still show success message even if some details fail to save

          this.showSuccessMessageAndNavigate(msg);

        });

      } else {

        this.showSuccessMessageAndNavigate(msg);

      }

    })

  }



  private showSuccessMessageAndNavigate(msg: string) {

    Swal.fire({

      toast: true,

      position: 'top',

      showConfirmButton: false,

      title: 'Success',

      text: msg,

      icon: 'success',

      showCloseButton: false,

      timer: 3000,

    }).then(() => {

      this.route.navigate(['/quotation-and-agreement/quotations']);

    });

  }



  returnDate(date?: any) {

    let currentDate = new Date();

    if (date) {

      currentDate = new Date(date);

    }

    const year = currentDate.getFullYear();

    const month = String(currentDate.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;

  }



  addItemDetails(action: string) {

    this.DetailRowChange();

    let frmData = this.frm.getRawValue();

    let details = frmData['details'];



    if (details['Description'] == "") {

      this.errorDescription = "Enter the type";

      return;

    }



    if (details['Category'] == "") {

      details['Category'] = "-";

    }



    if (details['ServiceTypeID']) {

      details['ServiceType'] = this.serviceTypes.find(st => st.Id === details['ServiceTypeID']);

    }



    if (action == 'add') {

      details['ID'] = 0;
      details['PerDay'] = parseFloat(details['PerDay']) || 0;
      details['PerMonth'] = parseFloat(details['PerMonth']) || 0;

      this.details.push(details);

    } else if (details['index'] >= 0 && action == 'update') {

      details['PerDay'] = parseFloat(details['PerDay']) || 0;
      details['PerMonth'] = parseFloat(details['PerMonth']) || 0;
      this.details[details['index']] = details;

    }

    this.detailDataSource();

    this.chkNormal("N");

    this.detailEdit = false;

  }



  detailDataSource() {

    this.dataSource = new MatTableDataSource(this.details);

    this.dataSource.sort = this.sort;

    this.dataSource.paginator = this.paginator;

  }



  emptyDetailData() {

    this.isFollowCalendarManuallyChanged = false;

    let emptyData = {

      ID: 0,

      QuotationID: 0,

      ServiceTypeID: null,

      Description: '',

      NoOfGuards: 0,

      PerDay: 0,

      PerMonth: 0,

      Rate: 0,

      NoOfHours: 8,

      NoOfDays: 0,

      FollowCalender: false,

      MonthTotal: 0,

      YearTotal: 0,

      HasDiscount: false,

      DiscountAmount: 0,

      DiscountHour: 0,

      IsTaxable: true,

      TaxAmount: 0,

      total: 0,

      Category: '',

      Reason: '',

      index: -1,

      Basic: 0,

      DA: 0,

      Leaves: 0,

      Allowance: 0,

      Bonus: 0,

      NFH: 0,

      PF: 0,

      ESI: 0,

      Uniform: 0,

      ServiceFee: 0,

      CommercialBreakdown: null

    }

    this.frm.get('details')?.setValue(emptyData);

  }



  editRow(row: IQuotationDetail, index: any) {

    this.detailEdit = true;

    this.isFollowCalendarManuallyChanged = true;

    row['index'] = index;

    this.frm.get('details')?.patchValue(row);

  }



  deleteRow(row: IQuotationDetail, index: any) {

    Swal.fire({

      title: 'Are you sure?',

      text: `Do you want to delete this service?`,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonColor: '#3085d6',

      cancelButtonColor: '#d33',

      confirmButtonText: 'Yes, delete it!'

    }).then((result) => {

      if (result.isConfirmed) {

        if (row.ID != 0) {

          this.service.deleteQuotationDetailById(row.ID + "").subscribe((d: any) => {

            console.log(d);

          });

        }

        this.details.splice(index, 1);

        this.detailDataSource();

        Swal.fire({

          toast: true,

          position: 'top',

          showConfirmButton: false,

          title: 'Deleted!',

          text: 'Service has been deleted successfully.',

          icon: 'success',

          showCloseButton: false,

          timer: 3000,

        });

      }

    });

  }



  getClientsByBranchID(value: any) {

    this.service.getClientsByBranchID(value).subscribe((d: any) => {

      console.log('getClientsByBranchID response (quotation):', d);

      let data = d['quotations'] || d['agreements'];

      this.clientList = d['clients'];

      let quotationsData = data?.Result || data || [];

      console.log('Quotations data:', quotationsData);

      this.quotationDataSource = new MatTableDataSource(quotationsData);

      this.quotationDataSource.sort = this.sort;

      this.quotationDataSource.paginator = this.paginator;

    });

  }



  checkClientStatus() {

    if (this.frm.get("Branch")?.value != null && this.frm.get("Client")?.value != null) {

      this.service.checkClientStatus(this.frm.get("Branch")?.value, this.frm.get("Client")?.value).subscribe((d: any) => {

        if (d['Result'] == 1) {

          Swal.fire({

            toast: true,

            position: 'top',

            showConfirmButton: false,

            title: 'Error',

            text: "Client Already Inactive!!!",

            icon: 'error',

            showCloseButton: false,

            timer: 3000,

          });

          this.frm.get("Branch")?.setValue("");

          this.frm.get("Client")?.setValue("");

        }

      })

    }

  }



  chkNormal(type: string) {

    this.type = type;

    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(8);

    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });

  }



  chkLumpSum(type: string) {

    this.type = type;

    this.emptyDetailData();

    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);

    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });

  }

  set8Hours() {
    this.frm.get('details.NoOfHours')?.setValue(8);
    this.DetailRowChange();
  }

  set12Hours() {
    this.frm.get('details.NoOfHours')?.setValue(12);
    this.DetailRowChange();
  }



  chkDogService(type: string) {

    this.type = type;

    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);

    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("DOG::");

  }



  chkTrip(type: string) {

    this.type = type;

    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);

    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("TRIP::");

  }



  chkBag(type: string) {

    this.type = type;

    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);

    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("BAG::");

  }



  chkHour(type: string) {

    this.type = type;

    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.disable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(8);

    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("HOUR::");

  }



  changeFollowCalender(event: any) {

    this.isFollowCalendarManuallyChanged = true;

    let dt = this.frm.get('QuotationDate')?.value;

    const currentDate = new Date(dt);

    const currentMonth = currentDate.getMonth();

    const currentYear = currentDate.getFullYear();

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();



    if (event.checked) {

      this.frm.get('details.NoOfDays')?.setValue(lastDayOfMonth);

      this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    } else {

      this.frm.get('details.NoOfDays')?.setValue(lastDayOfMonth);

      this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });

    }



    this.DetailRowChange();

  }



  onPerDayChange(): void {

    const perDay = parseFloat(this.frm.get('details.PerDay')?.value || 0);

    

    if (perDay > 0) {

      this.frm.get('details.Rate')?.setValue(this.formatCurrency(perDay));

      this.DetailRowChange();

    }

  }



  onPerMonthChange(): void {

    const perMonth = parseFloat(this.frm.get('details.PerMonth')?.value || 0);

    const noOfDays = parseFloat(this.frm.get('details.NoOfDays')?.value || 30);

    const noOfHours = parseFloat(this.frm.get('details.NoOfHours')?.value || 8);



    if (perMonth > 0 && noOfDays > 0) {

      const perDay = perMonth / noOfDays;

      this.frm.get('details.PerDay')?.setValue(this.formatCurrency(perDay));



      // Calculate per hour rate
      const perHour = perDay / noOfHours;

      this.frm.get('details.Rate')?.setValue(this.formatCurrency(perHour));



      this.DetailRowChange();

    }

  }



  onNoOfHoursChange(): void {

    const perDay = parseFloat(this.frm.get('details.PerDay')?.value || 0);

    const noOfHours = parseFloat(this.frm.get('details.NoOfHours')?.value || 8);



    if (perDay > 0 && noOfHours > 0) {

      // Recalculate per hour rate when working hours change
      const perHour = perDay / noOfHours;

      this.frm.get('details.Rate')?.setValue(this.formatCurrency(perHour));



      this.DetailRowChange();

    }

  }



  DetailRowChange(): void {

    const _description = this.frm.get('details.Description')?.value;

    if (_description != "") {

      this.errorDescription = "";

    } else {

      this.errorDescription = "Enter the type";

    }



    let dt = this.frm.get('QuotationDate')?.value;

    const currentDate = new Date(dt);

    const currentYear = currentDate.getFullYear();

    const currentMonth = currentDate.getMonth();



    let vMonthTotal = 0;

    const tNoOfGuards = this.frm.get('details.NoOfGuards')?.value;

    const tPerDay = this.frm.get('details.PerDay')?.value;

    const tNoOfHours = this.frm.get('details.NoOfHours')?.value;

    const tNoOfDays = this.frm.get('details.NoOfDays')?.value;



    if (tNoOfHours > 0 && tNoOfHours <= 8 && !this.isFollowCalendarManuallyChanged) {

      if (!this.frm.get('details.FollowCalender')?.value) {

        this.frm.get('details.FollowCalender')?.setValue(true);

        this.changeFollowCalender({ checked: true });

        return;

      }

    }



    if (parseInt("0" + tNoOfGuards, 10) === 0) {

      vMonthTotal = parseFloat(tPerDay) * parseFloat(tNoOfDays);

    } else {

      vMonthTotal = (

        parseFloat(tNoOfGuards) *

        parseFloat(tPerDay) *

        parseFloat(tNoOfDays)

      );

    }



    if (!(parseInt("0" + tNoOfGuards, 10) === 0 ||

      parseInt("0" + tPerDay, 10) === 0 ||

      parseInt("0" + tNoOfDays, 10) === 0)) {

      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(Math.round(vMonthTotal)));

    } else if (this.type == 'S') {

      vMonthTotal = tNoOfGuards * tPerDay;

      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(Math.round(vMonthTotal)));

    } else if (this.type == 'H') {

      vMonthTotal = tNoOfHours * tPerDay;

      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(Math.round(vMonthTotal)));

    } else {

      vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value);

    }

    // Round vMonthTotal to avoid floating-point precision errors before calculating Year Total
    vMonthTotal = Math.round(vMonthTotal);

    this.frm.get('details.YearTotal')?.setValue(Math.round(vMonthTotal * 12));

    let vDiscount = parseFloat(this.frm.get('details.DiscountAmount')?.value || '0');

    if (!this.frm.get('details.HasDiscount')?.value) {

      vDiscount = 0;

    }



    let gstRate = 18; // Default fallback

    const serviceTypeId = this.frm.get('details.ServiceTypeID')?.value;

    if (serviceTypeId) {

      const selectedService = this.serviceTypes.find(st => st.Id === serviceTypeId);

      if (selectedService && selectedService.HSNCode) {

        const config = this.gstConfigList.find(c => c.hsnCode === selectedService.HSNCode);

        if (config && config.gstRate) {

          gstRate = config.gstRate;

        }

      }

    }



    let branchState = '';

    let clientState = '';

    if (this.branchList && this.clientList) {

      const branchObj = this.branchList.find((x: any) => x.Code === this.frm.get('Branch')?.value);

      const clientObj = this.clientList.find((x: any) => x.Code === this.frm.get('Client')?.value);

      branchState = branchObj?.State || branchObj?.state || '';

      clientState = clientObj?.State || clientObj?.state || '';

    }



    if (this.frm.get('details.IsTaxable')?.value) {

      const taxAmt = (vMonthTotal - vDiscount) * (gstRate / 100);

      this.frm.get('details.TaxAmount')?.setValue(

        this.formatCurrency(taxAmt)

      );

    } else {

      this.frm.get('details.TaxAmount')?.setValue(0);

    }



    const tTaxAmount = parseFloat(this.frm.get('details.TaxAmount')?.value || '0');

    this.frm.get('details.total')?.setValue(this.formatCurrency(vMonthTotal - vDiscount + tTaxAmount));

  }



  SetNoOfDays(): void {

    let i = 31;

    for (i = 31; i >= 1; i--) {

      const vNewDate = new Date(this.frm.get('QuotationDate')?.value);

      vNewDate.setDate(i);

      if (vNewDate.getDate() === i) {

        break;

      }

    }

    this.frm.get('details.NoOfDays')?.setValue(i.toString());

    this.DetailRowChange();

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



  private formatCurrency(value: number): string {

    return value.toFixed(2);

  }



  cancel() {

    this.route.navigate(['/quotation-and-agreement/quotations']);

  }



  exportToPDF(save: boolean = true) {

    const branchCode = this.frm.get('Branch')?.value;

    const clientCode = this.frm.get('Client')?.value;

    const branchObj = this.branchList?.find((b: any) => b.Code == branchCode);

    const clientObj = this.clientList?.find((c: any) => c.Code == clientCode);



    const date = this.frm.get('QuotationDate')?.value || new Date();

    this._pdfService.exportQuotationPDF(this.details, branchObj, clientObj, this.serviceTypes, 'N/A', date, save);

  }

}

