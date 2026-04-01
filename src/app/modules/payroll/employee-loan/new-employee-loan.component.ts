import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-employee-loan',
  templateUrl: './new-employee-loan.component.html',
  styleUrls: ['./new-employee-loan.component.css']
})
export class NewEmployeeLoanComponent implements OnInit {


  employeeLoanForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  employeeAdvanceTitleStatus: string = 'new';
  branchCode: string = 'null';
  clientCode: string = 'null';
  employeeModel!: EmployeeMonthlyAdvance[];
  salaryMonthlyAdvance: SalaryMonthlyAdvance = new SalaryMonthlyAdvance();
  minDate = new Date();
  branchModel!: BranchModel[];
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  employeeListModel!: EmployeeAdvanceListModel[];
  year!: number;
  month!: number;
  EmployeeID!: number;
  btnPrint: boolean = false;
  btnDelete: boolean = false;
  salaryAdvanceID: number = 0;
  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }


  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService,
    private _dataService: DatasharingService) {
    this.employeeLoanForm = this.fb.group({
      ID: [0],
      EmployeeID: [''],
      EmployeeType: ['Guard'],
      BranchCode: ['', [Validators.required]],
      AdvanceTakenDate: [''],
      AdvanceDate: ['', [Validators.required]],
      VoucherNo: [''],
      Amount: ['', [Validators.required, twoDecimalPlacesValidator()]],
      NoOfInstallments: ['', [Validators.required]],
      PaymentType: ['Bank'],
      Particulars: [''],
      TransType: ['3'],
      IsDeleted: [false],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
      MonthlyRepayment: [''],
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
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Employee Loan');
    //this.getEmployeeMasterList();
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

  changeAdvanceTakenDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeLoanForm.value.AdvanceTakenDate = this.formatDate(`${type}: ${event.value}`);
  }
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeLoanForm.value.AdvanceDate = this.formatDate(`${type}: ${event.value}`);
  }
  onBranchSelectionChange(event: any) {
    // this._payrollService.getEmployeeListByBranchCode(event.value).subscribe(
    //   (data) => {
    //     this.employeeListModel = data;
    //     this.getAdvanceVoucherNo(event.value, '3');
    //   },
    //   (error) => this.handleErrors(error)
    // );
    const advanceDate = this.formatDate(this.employeeLoanForm.get('AdvanceDate')?.value);
    const branchCode = this.employeeLoanForm.get('BranchCode')?.value;
    if (advanceDate != null && advanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(advanceDate, branchCode, this.employeeLoanForm.value.EmployeeType, 1, 0, 'All')
      this.getAdvanceVoucherNo(event.value, '3');
    } else {
      this.employeeLoanForm.patchValue({
        EmployeeType: 'None',
      })
      this.showMessage(`Please select advance date selection.`, 'error', 'Error Message');
    }
  }

  getEmployeeListByEmployeeType(advanceDate: string, branchCode: string, employeeType: number, transType: number, advanceAmount: number, race: string): void {
    forkJoin([
      this._payrollService.getListByEmplyeeType(advanceDate, branchCode, employeeType, transType, advanceAmount, race),
    ]).subscribe(
      ([employeeData]) => {
        // Clear the EmployeeID field in the form
        this.employeeLoanForm.patchValue({
          EmployeeID: '',
        });
        // Assign the employee data
        this.employeeListModel = employeeData;        
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  amountChange(event: any) {
    if (this.employeeLoanForm.value.NoOfInstallments != '' && this.employeeLoanForm.value.NoOfInstallments != undefined
      && this.employeeLoanForm.value.Amount != 0) {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: event.target.value / this.employeeLoanForm.value.NoOfInstallments
      });
    } else {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }
  noOfInstallmentsChange(event: any) {
    if (this.employeeLoanForm.value.Amount != '' && this.employeeLoanForm.value.Amount != undefined
      && this.employeeLoanForm.value.NoOfInstallments != '0') {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: this.employeeLoanForm.value.Amount / event.target.value
      });
    } else {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }
  getAdvanceVoucherNo(branch: string, transType: string): void {
    forkJoin({
      voucherNo: this._payrollService.getAdvanceVoucherNo(branch, transType),
    }).subscribe(
      ({ voucherNo }) => {
        // Assuming the response contains VoucherNo directly
        this.employeeLoanForm.patchValue({
          VoucherNo: voucherNo.VoucherNo || voucherNo
        });
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  getEmployeeMasterList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getEmployeeList().subscribe(
      (data) => {
        this.employeeModel = data;
        this.hideSpinner();
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  onEmployeeSelectionChange(event: any) {
    const advanceDate = this.formatDate(this.employeeLoanForm.value.AdvanceDate);

    if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {
      const requests = [
        this._payrollService.getSalaryAdvances(advanceDate, event.value, '3')
      ];

      forkJoin(requests).subscribe(
        (responses: any[]) => {
          console.log('Responses:', responses);

          if (responses[0]?.length > 0) {
            const response = responses[0]; // Assuming the first response is needed
            this.salaryAdvanceID = response[0].ID
            this.employeeLoanForm.patchValue({
              Amount: response[0].Amount,
              VoucherNo: response[0].VoucherNo,
              NoOfInstallments: response[0].NoOfInstallments,
              MonthlyRepayment: response[0].Amount / response[0].NoOfInstallments
            });
            this.btnDelete = true;
            this.btnPrint = true;
          }else{
            this.salaryAdvanceID = 0;
            this.btnDelete = false;
            this.btnPrint = false;
          }
        },
        (error) => {
          this.handleErrors(error);
        }
      );
    } else {
      this.showMessage(
        `Please select Advance Process. Data is a mandatory field.`,
        'warning',
        'Warning Message'
      );
    }
  }
  onDeleteClick(): void {
     this.showLoadingSpinner = true;
    
        this.dialog
          .open(DialogConfirmationComponent, {
            data: `Are you sure want to delete this employee loan details?`
          })
          .afterClosed()
          .subscribe((result: { confirmDialog: boolean; remarks: any }) => {       
        if (result.confirmDialog) {
              const advanceDate = this.formatDate(this.employeeLoanForm.value.AdvanceDate);
              const employeeID = this.employeeLoanForm.value.EmployeeID;

              if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {
                const requests = [
                  this._payrollService.getSalaryAdvances(advanceDate, employeeID, '3')
                ];          
                forkJoin(requests).subscribe(
                  (responses: any[]) => {
                    if (responses[0]?.length > 0) {
                      const response = responses[0];                  
                      var dateYear = new Date(response[0].AdvanceDate);
                      this.year = dateYear.getFullYear();
                      var dateMonth = new Date(response[0].AdvanceDate);
                      this.month = dateMonth.getMonth() + 1;

                      forkJoin({
                        salaryProcessed: this._payrollService.getSalaryProcessDate(response[0].EmployeeID, this.year, this.month).pipe(
                          catchError(() => of(false)) // Handle errors and fallback to false
                        )
                      }).subscribe({
                        next: ({ salaryProcessed }) => {
                          if (salaryProcessed) {
                            this.showMessage(
                              `Salary already processed for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
                              'warning',
                              'Warning Message'
                            );
                          } else{
                            forkJoin({
                              deleteResult: this._payrollService.deleteSalaryAdvance(this.salaryAdvanceID, this.currentUser),
                            }).subscribe(
                              ({ deleteResult }) => {                               
                                if(deleteResult.success == true){
                                  this.showMessage(`${deleteResult.message}`,'success','Success Message')
                                  this.clearEmployeeLoanDetails();
                                }                               
                              },
                              (error) => {
                                error: (error: any) => this.handleErrors(error)
                              }
                            );
                          }
                        },
                        error: (error) => this.handleErrors(error)
                      });
                    }
                  },
                  (error) => {
                    this.handleErrors(error);
                  }
                );
              } else {
                this.showMessage(
                  `Please select Advance Process. Data is a mandatory field.`,
                  'warning',
                  'Warning Message'
                );
              }
            }else {
              this.hideSpinner();
            }
            })
        
  }
  OnPrintClick(): void {
    this._router.navigate(['/payroll/loan-voucher-report'], { queryParams: { id: this.salaryAdvanceID }, queryParamsHandling: 'merge' });
  }
  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    var AdvanceDate = this.formatDate(this.employeeLoanForm.value.AdvanceDate);
    var AdvanceTakenDate = this.formatDate(this.employeeLoanForm.value.AdvanceTakenDate);
    this.EmployeeID = this.employeeLoanForm.value.EmployeeID;
    var dateYear = new Date(AdvanceDate);
    this.year = dateYear.getFullYear();
    var dateMonth = new Date(AdvanceDate);
    this.month = dateMonth.getMonth() + 1;

    this.salaryMonthlyAdvance = this.employeeLoanForm.value;
    this.salaryMonthlyAdvance.AdvanceDate = new Date(AdvanceDate)
    this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(AdvanceTakenDate)
    this.salaryMonthlyAdvance.ID = this.salaryAdvanceID == 0 ? 0 : this.salaryAdvanceID

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

                if (new Date(AdvanceDate) > resignDate1 && resignDate1.getTime() !== referenceDate.getTime()) {
                  this.showMessage(
                    `Advance Date cannot exceed the Guard/Staff Resign Date. Please contact HQ for more information.`,
                    'warning',
                    'Warning Message'
                  );
                } else {
                  // Save or update the salary advance
                  this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe((response) => {
                    if (response.Exists == 'Exists') {
                      this._dataService.setUsername(this.currentUser);
                      this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
                    }
                    if (response.Success == 'Success') {
                      this._dataService.setUsername(this.currentUser);
                      this.showMessage(`${response.Message}`, 'success', 'Success Message');
                      this._router.navigate(['/payroll/loan-voucher-report'], { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' });
                    }
                    setTimeout(() => {
                      this.hideSpinner();
                    }, 3000);

                  },
                    (error) => this.handleErrors(error)
                  );
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
  clearEmployeeLoanDetails(): void {
    this.salaryAdvanceID = 0
    this.employeeLoanForm.reset();

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}

