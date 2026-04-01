import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, take } from 'rxjs';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { InventoryCategory } from 'src/app/model/inventoryCategory';
import { ItemMasterModel } from 'src/app/model/itemMasterModel';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-employee-uniform-loan',
  templateUrl: './new-employee-uniform-loan.component.html',
  styleUrls: ['./new-employee-uniform-loan.component.css']
})
export class NewEmployeeUniformLoanComponent implements OnInit {
  employeeUniformLoanForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchCode: string = 'null';
  clientCode: string = 'null';
  employeeModel!: EmployeeMonthlyAdvance[];
  inventoryModel!: InventoryCategory[];
  salaryMonthlyAdvance: SalaryMonthlyAdvance = new SalaryMonthlyAdvance();
  minDate = new Date();
  voucherNumber!: string;
  itemMaster!: ItemMasterModel[];
  branchModel!: BranchModel[];
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  employeeListModel!: EmployeeAdvanceListModel[];
  year!: number;
  month!: number;
  EmployeeID!: number;
  employeeSelectedType: string = '';
  StartPeriod!: string;
  EndPeriod!: string;
  advanceDate!: string;
  nameList: string[] = [];
  advanceID: number = 0;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  dataSource: any;
  displayedColumns: string[] = ['Name', 'Price', 'Quantity', 'Total'];
  formReady = true;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService,
    private _dataService: DatasharingService) {
    this.employeeUniformLoanForm = this.fb.group({
      ID: [0],
      InventoryCategoryID: [0],
      Quantity: [0],
      Price: [0],
      EmployeeID: [''],
      EmployeeType: ['Guard'],
      BranchCode: [''],
      AdvanceTakenDate: ['', [Validators.required]],
      AdvanceDate: [this.formatDate(new Date)],
      VoucherNo: [''],
      Amount: ['', [Validators.required, twoDecimalPlacesValidator()]],
      NoOfInstallments: ['', [Validators.required]],
      PaymentType: ['Bank'],
      Particulars: [''],
      TransType: ['4'],
      IsDeleted: [false],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
      MonthlyRepayment: [''],
      items: this.fb.array([])
    });

    this.salaryMonthlyAdvance.ID = 0;
    this.salaryMonthlyAdvance.EmployeeID = 0;
    this.salaryMonthlyAdvance.AdvanceTakenDate = new Date();
    this.salaryMonthlyAdvance.AdvanceDate = new Date();
    this.salaryMonthlyAdvance.VoucherNo = '';
    this.salaryMonthlyAdvance.Amount = 0;
    this.salaryMonthlyAdvance.NoOfInstallments = 0;
    this.salaryMonthlyAdvance.PaymentType = '';
    this.salaryMonthlyAdvance.Particulars = '';
    this.salaryMonthlyAdvance.TransType = 1;
    this.salaryMonthlyAdvance.IsDeleted = false;
    this.salaryMonthlyAdvance.LastUpdate = new Date();
    this.salaryMonthlyAdvance.LastUpdatedBy = '';

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.initForm();
  }
  get itemFormArray(): FormArray {
    return this.employeeUniformLoanForm.get('items') as FormArray;
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  initForm() {
    this.itemFormArray.clear();
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) {
      return;
    }

    this.dataSource.data.forEach((item: any) => {
      this.itemFormArray.push(this.fb.group({
        Quantity: [item.Quantity],
        Total: [item.Price * item.Quantity]
      }));
    });
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Employee Uniform');

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
            this.getBranchMasterListByUser(this.currentUser);
            this.getInventoryList();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideSpinner();
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getInventoryList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getInventoryCategories().subscribe(
      (data) => {
        this.inventoryModel = data;
        this.hideSpinner();
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  changeAdvanceTakenDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeUniformLoanForm.value.AdvanceTakenDate = this.formatDate(`${type}: ${event.value}`);
    this.reloadEmployee();
  }
  onBranchSelectionChange(event: any) {
    this.EmployeeID = 0;
    this.reloadEmployee();
    this.getAdvanceVoucherNo(event.value, '4');
  }
  radioButtonTypeSelectionChange(event: any) {
    this.employeeSelectedType = event.value;
    this.reloadEmployee();
  }
  onEmployeeChange(event: any) {
    this.EmployeeID = event.value;
    this.ReloadGrid();
  }
  onInventoryChange(event: any) {
    if (this.advanceID > 0) {
      this.loadUniformItemRows(this.advanceID, event.value);
    }
  }
  loadUniformItemRows(advanceId: number, category: number) {
    this.formReady = false;
    this._payrollService.getUniformItemRows(advanceId, category).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource<ItemMasterModel>(data);
        this.initForm();
        this.formReady = true;
      },
      (error) => this.handleErrors(error)
    );
  }
  onQuantityChange(index: number): void {
    const control = this.itemFormArray.at(index);

    if (!control) {
      console.warn('FormGroup not found for index:', index);
      return;
    }

    const quantity = +control.get('Quantity')?.value;
    const price = this.dataSource.data[index]?.Price ?? 0;

    const previousTotal = +control.get('Total')?.value || 0;
    const newTotal = price * quantity;

    // Update the total for the item
    control.get('Total')?.setValue(newTotal);

    // Get current Amount
    const existingAmount = +this.employeeUniformLoanForm.get('Amount')?.value || 0;

    // Adjust Amount: remove previous total, add new total
    const adjustedAmount = existingAmount - previousTotal + newTotal;

    this.employeeUniformLoanForm.get('Amount')?.setValue(adjustedAmount);

    this.employeeUniformLoanForm.get('MonthlyRepayment')?.setValue(adjustedAmount / this.employeeUniformLoanForm.get('NoOfInstallments')?.value)
  }

  amountChange(event: any) {
    if (this.employeeUniformLoanForm.value.NoOfInstallments != '' && this.employeeUniformLoanForm.value.NoOfInstallments != undefined
      && this.employeeUniformLoanForm.value.Amount != 0) {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: event.target.value / this.employeeUniformLoanForm.value.NoOfInstallments
      });
    } else {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }
  noOfInstallmentsChange(event: any) {
    if (this.employeeUniformLoanForm.value.Amount != '' && this.employeeUniformLoanForm.value.Amount != undefined
      && this.employeeUniformLoanForm.value.NoOfInstallments != '0') {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: this.employeeUniformLoanForm.value.Amount / event.target.value
      });
    } else {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }
  getNewVoucherNumber(transType: number): void {
    this._payrollService.getNewVoucherNumber(transType).subscribe(
      result => {
        this.employeeUniformLoanForm.patchValue({
          VoucherNo: result.VoucherNumber
        });
      },
      (error) => this.handleErrors(error)
    );
  }
  getAdvanceVoucherNo(branch: string, transType: string): void {
    forkJoin({
      voucherNo: this._payrollService.getAdvanceVoucherNo(branch, transType),
    }).subscribe(
      ({ voucherNo }) => {
        // Assuming the response contains VoucherNo directly
        this.employeeUniformLoanForm.patchValue({
          VoucherNo: voucherNo.VoucherNo || voucherNo
        });
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  reloadEmployee() {
    this.employeeSelectedType = this.employeeUniformLoanForm.get('EmployeeType')?.value;
    this.advanceDate = this.formatDate(this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value);
    this.branchCode = this.employeeUniformLoanForm.get('BranchCode')?.value;
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(this.advanceDate)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(this.advanceDate)));
    if ((this.branchCode != null && this.branchCode != 'NaN-NaN-NaN' && this.branchCode != '')
      && this.advanceDate != null && this.advanceDate != 'NaN-NaN-NaN' && this.advanceDate != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(this.branchCode, this.employeeUniformLoanForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      this.employeeUniformLoanForm.patchValue({
        EmployeeType: 'Guard',
      })
    }
  }
  ReloadGrid() {
    this.advanceDate = this.formatDate(this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value);
    if (this.advanceDate != null && this.advanceDate != 'NaN-NaN-NaN' && this.advanceDate != '') {
      if (this.employeeListModel.length > 0) {
        const requests = [
          this._payrollService.getSalaryAdvances(this.advanceDate, this.EmployeeID.toString(), '4')
        ];

        forkJoin(requests).subscribe(
          (responses: any[]) => {
            console.log('Responses:', responses);

            if (responses[0]?.length > 0) {
              const response = responses[0]; // Assuming the first response is needed
              this.advanceID = response[0].ID
              this.employeeUniformLoanForm.patchValue({
                Amount: response[0].Amount,
                VoucherNo: response[0].VoucherNo,
                NoOfInstallments: response[0].NoOfInstallments,
                MonthlyRepayment: response[0].Amount / response[0].NoOfInstallments
              });
            } else {
              this.advanceID = 0;
            }
          },
          (error) => {
            this.handleErrors(error);
          }
        );
      }
    } else {
      this.employeeUniformLoanForm.patchValue({
        Amount: "",
        VoucherNo: "",
        NoOfInstallments: "",
        MonthlyRepayment: ""
      });
    }
  }
  getEmployeeListByEmployeeType(branchCode: string, employeeType: string, startPeriod: string, endPeriod: string, status: string): void {
    this.showLoadingSpinner = true;
    forkJoin({
      employeeList: this._payrollService.getListByEmployee(branchCode, employeeType, startPeriod, endPeriod, status),
      nameList: this._payrollService.getEmployeeLoanList(this.advanceDate, branchCode, employeeType, 4)
    }).subscribe(
      ({ employeeList, nameList }) => {
        // Handle successful response
        this.employeeListModel = employeeList;
        this.nameList = nameList;

        // ✅ Set default selection to first employee
        if (this.employeeListModel && this.employeeListModel.length > 0) {
          const firstEmployeeId = this.employeeListModel[0].EMP_ID;
          this.employeeUniformLoanForm.get('EmployeeID')?.setValue(firstEmployeeId);
        }
        this.ReloadGrid();
        this.hideSpinner();
      },
      (error) => this.handleErrors(error) // Handle errors
    );
  }

  // Function to check if EMP_CODE is in nameList
  isEmployeeInNameList(empCode: string): boolean {
    return this.nameList && this.nameList.includes(empCode);
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    var AdvanceDate = this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value;

    var dateYear = new Date(AdvanceDate);
    this.year = dateYear.getFullYear();
    var dateMonth = new Date(AdvanceDate);
    this.month = dateMonth.getMonth() + 1;
    this.salaryMonthlyAdvance = this.employeeUniformLoanForm.value;
    this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(this.employeeUniformLoanForm.value.AdvanceTakenDate));
    this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(this.employeeUniformLoanForm.value.AdvanceTakenDate));
    this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID;

    // Your existing method
    this._payrollService.checkExistAdvance(this.EmployeeID, this.formatDate(AdvanceDate), 4).subscribe({
      next: (exists) => {
        if (exists) {
          this.showMessage(`Record Exists. Please check.`, 'warning', 'Warning Message');
        } else {
          // Use forkJoin to combine multiple service calls
          forkJoin({
            salaryProcessed: this._payrollService.getSalaryProcessDate(this.EmployeeID, this.year, this.month).pipe(
              catchError(() => of(false)) // Handle errors and fallback to false
            ),
            resignDate: this._payrollService.getResignDateByEmployeeID(this.EmployeeID).pipe(
              catchError(() => of('1900-01-01T00:00:00')) // Fallback to default date if an error occurs
            )
          }).subscribe({
            next: ({ salaryProcessed, resignDate }) => {
              if (salaryProcessed) {
                this.showMessage(
                  `Salary already processed for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
                  'warning',
                  'Warning Message'
                );
              } else {
                const resignDate1 = new Date(resignDate);
                const referenceDate = new Date('1900-01-01T00:00:00');

                if (AdvanceDate > resignDate1 && resignDate1.getTime() !== referenceDate.getTime()) {
                  this.showMessage(
                    `Advance Date cannot exceed the Guard/Staff Resign Date. Please contact HQ for more information.`,
                    'warning',
                    'Warning Message'
                  );
                } else {
                  // Save or update the salary advance
                  this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe({
                    next: (response) => {
                      if (response.Exists === 'Exists') {
                        this._dataService.setUsername(this.currentUser);
                        this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
                      }
                      if (response.Success === 'Success') {
                        console.log('response', response);
                        this._dataService.setUsername(this.currentUser);
                        this.showMessage(`${response.Message}`, 'success', 'Success Message');
                        //this._router.navigate(['/payroll/employee-monthly-advance']);
                        this._router.navigate(['/payroll/uniform-loan-report'], { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' });
                      }
                      this.hideSpinner();
                    },
                    error: (error) => this.handleErrors(error)
                  });
                }
              }
            },
            error: (error) => this.handleErrors(error)
          });
        }
      },
      error: (error) => this.handleErrors(error)
    });
  }
  clearEmployeeLoanDetails(): void {
    this.employeeUniformLoanForm.reset();

  }
  generateReport() {

  }
  public firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  public lastOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
    this.hideSpinner();
    return;
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showMessage(`${error}`, 'error', 'Error Message');
    }
  };

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
