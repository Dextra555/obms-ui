import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { INDIAN_RELIGIONS } from 'src/app/model/indian-employee.model';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-employee-monthly-advance',
  templateUrl: './new-employee-monthly-advance.component.html',
  styleUrls: ['./new-employee-monthly-advance.component.css']
})
export class NewEmployeeMonthlyAdvanceComponent implements OnInit {
  employeeAdvanceForm!: FormGroup;
  dynamicForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  employeeAdvanceTitleStatus: string = 'new';
  branchCode: string = 'null';
  clientCode: string = 'null';
  branchModel!: BranchModel[];
  employeeModel!: EmployeeMonthlyAdvance[];
  salaryMonthlyAdvance: SalaryMonthlyAdvance = new SalaryMonthlyAdvance();
  religionsWithAll: string[] = ['All', ...INDIAN_RELIGIONS];
  minDate = new Date();
  year!: number;
  month!: number;
  currentUser: string = '';
  errorMessage: string = '';
  userAccessModel!: UserAccessModel;
  empId: number = 0;
  dtAdvanceDate!: string;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }


  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService) {
    this.employeeAdvanceForm = this.fb.group({
      ID: [0],
      EmployeeID: [''],
      AdvanceTakenDate: [this.formatDate(new Date)],
      AdvanceDate: [this.formatDate(new Date)],
      VoucherNo: [''],
      BranchCode: [''],
      Amount: ['', [twoDecimalPlacesValidator()]],
      NoOfInstallments: ['1'],
      PaymentType: ['Bank'],
      Particulars: [''],
      TransType: ['1'],
      EmployeeType: ['Guard'],
      Race: ['All'],
      IsDeleted: [false],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
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
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
        this.getBranchMasterListByUser(this.currentUser);
      });
    } else {
      this.getBranchMasterListByUser(this.currentUser);
    }
    this.getUserAccessRights(this.currentUser, 'Monthly Salary Advance');
    this.getEmployeeMasterList();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.employeeAdvanceTitleStatus = 'edit';
        this.getEmployeeListById(params['id']);
      }
    });
    this.createForm();
  }
  createForm() {
    this.dynamicForm = this.fb.group({
      formArray: this.fb.array([])
    });
  }
  get formArray() {
    return (this.dynamicForm.get('formArray') as FormArray).controls;
  }
  isEmployeeIdValid(): boolean {

    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const formGroup = formArray.at(i) as FormGroup;
      this.empId = formGroup.get('ID')?.value;
    }

    // Return true or false based on your conditions
    return this.empId == 0 ? false : true; // Modify this logic as needed

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
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  addFormFieldsdata(data: any) {
    console.log('[NewEmployeeMonthlyAdvance] addFormFieldsdata called with data:', data);
    console.log('[NewEmployeeMonthlyAdvance] Data length:', data?.length);
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();
    for (let i = 0; i < data.length; i++) {
      console.log(`[NewEmployeeMonthlyAdvance] Adding employee ${i}:`, data[i]);
      formArray.push(this.fb.group({
        ID: [data[i].ID],
        EMP_ID: [data[i].EMP_ID],
        EMP_NAME: [data[i].EMP_NAME],
        EMP_IC_NEW: [data[i].EMP_IC_NEW + data[i].EMP_PASSPORT_NO],
        EMP_IC_OLD: [data[i].EMP_IC_OLD],
        EMP_PASSPORT_NO: [data[i].EMP_PASSPORT_NO],
        EMPFL_BANK: [data[i].EMPFL_BANK],
        EMPFL_BK_ACCNO: [data[i].EMPFL_BK_ACCNO],
        PAYMODE: [data[i].PAYMODE],
        Amount: [data[i].Amount],
        Particulars: [data[i].Particulars],
      }));
    }
    console.log('[NewEmployeeMonthlyAdvance] FormArray length after adding:', formArray.length);
  }
  getBranchMasterList() {
    this._masterService.getBranchMaster('null').subscribe((responseData) => {
      if (responseData != null) {
        this.branchModel = responseData
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  getEmployeeMasterList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getEmployeeList().subscribe(
      (data) => {
        this.employeeModel = data;
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeAdvanceForm.value.AdvanceDate = this.formatDate(`${type}: ${event.value}`);
    const advanceDate = new Date(this.employeeAdvanceForm.get('AdvanceDate')?.value);
    const selectedBranch = this.employeeAdvanceForm.get('BranchCode')?.value;
    this.dtAdvanceDate = this.formatDate(advanceDate);
    if (selectedBranch != null && selectedBranch != undefined && selectedBranch != '') {
      this.getEmployeeListByEmployeeType(this.dtAdvanceDate, selectedBranch, this.employeeAdvanceForm.value.EmployeeType, 1, 0, this.employeeAdvanceForm.value.Race)
      this.getAdvanceVoucherNo(selectedBranch, '1');
    }
  }
  onBranchSelectionChange() {
    this.errorMessage = '';
    const advanceDate = new Date(this.employeeAdvanceForm.get('AdvanceDate')?.value);
    const selectedBranch = this.employeeAdvanceForm.get('BranchCode')?.value;

    this.dtAdvanceDate = this.formatDate(advanceDate);
    // this._payrollService.getEmployeeListByBranchCode(selectedBranch).subscribe(
    //   (data) => {
    //     this.addFormFieldsdata(data);
    //   },
    //   (error) => this.handleErrors(error)
    // );
    if (this.dtAdvanceDate != null && this.dtAdvanceDate != 'NaN-NaN-NaN' && selectedBranch != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(this.dtAdvanceDate, selectedBranch, this.employeeAdvanceForm.value.EmployeeType, 1, 0, this.employeeAdvanceForm.value.Race)
      this.getAdvanceVoucherNo(selectedBranch, '1');
    } else {
      this.errorMessage = 'Please select advance date selection.';
      this.employeeAdvanceForm.patchValue({
        EmployeeType: 'None',
        Race: 'All'
      })
    }


  }
  radioButtonTypeSelectionChange(event: any) {
    const advanceDate = new Date(this.employeeAdvanceForm.get('AdvanceDate')?.value);
    const branchCode = this.employeeAdvanceForm.get('BranchCode')?.value;
    this.dtAdvanceDate = this.formatDate(advanceDate);

    if (advanceDate != null && branchCode != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(this.dtAdvanceDate, branchCode, event.value, 1, 0, this.employeeAdvanceForm.value.Race)
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      this.employeeAdvanceForm.patchValue({
        EmployeeType: 'None',
        Race: 'All'
      })
    }
  }
  radioButtonRaceSelectionChange(event: any) {
    const advanceDate = this.formatDate(this.employeeAdvanceForm.get('AdvanceDate')?.value);
    const branchCode = this.employeeAdvanceForm.get('BranchCode')?.value;
    if (advanceDate != null && branchCode != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(advanceDate, branchCode, this.employeeAdvanceForm.value.EmployeeType, 1, 0, event.value)
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      this.employeeAdvanceForm.patchValue({
        EmployeeType: '3',
        Race: '5'
      })
    }
  }

  getEmployeeListById(id: number): void {
    this.showLoadingSpinner = true;
    this._payrollService.getSalaryAdvanceById(id).subscribe(
      (data) => {
        this._payrollService.getEmployeeListByAdvanceID(data[0].ID).subscribe(
          (data) => {
            this.addFormFieldsdata(data);
          },
          (error) => this.handleErrors(error)
        );
        this.employeeAdvanceForm.patchValue({
          ID: data[0].ID,
          EmployeeID: data[0].EmployeeID,
          AdvanceTakenDate: this.formatDate(data[0].AdvanceTakenDate),
          AdvanceDate: this.formatDate(data[0].AdvanceDate),
          VoucherNo: data[0].VoucherNo,
          Amount: data[0].Amount,
          NoOfInstallments: data[0].NoOfInstallments,
          PaymentType: data[0].PaymentType,
          Particulars: data[0].Particulars,
          TransType: data[0].TransType,
          IsDeleted: data[0].IsDeleted,
          LastUpdate: this.formatDate(data[0].LastUpdate),
          LastUpdatedBy: data[0].LastUpdatedBy,
        });
        this._payrollService.getEmployeeById(id).subscribe(
          (data) => {
            this.employeeAdvanceForm.patchValue({
              BranchCode: data[0].EMP_BRANCH_CODE
            });
          });
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }

  getEmployeeListByEmployeeType(dvanceDate: string, branchCode: string, employeeType: number, transType: number, advanceAmount: number, race: string): void {
    console.log('[NewEmployeeMonthlyAdvance] getEmployeeListByEmployeeType called');
    console.log('[NewEmployeeMonthlyAdvance] Parameters:', { dvanceDate, branchCode, employeeType, transType, advanceAmount, race });
    this._payrollService.getListByEmplyeeType(dvanceDate, branchCode, employeeType, transType, advanceAmount, race).subscribe(
      (data) => {
        console.log('[NewEmployeeMonthlyAdvance] Employee list received:', data);
        this.addFormFieldsdata(data);
      },
      (error) => {
        console.error('[NewEmployeeMonthlyAdvance] Error getting employee list:', error);
        this.handleErrors(error);
      }
    );
  }
  getAdvanceVoucherNo(branch: string, transType: string): void {
    forkJoin({
      voucherNo: this._payrollService.getAdvanceVoucherNo(branch, transType),
    }).subscribe(
      ({ voucherNo }) => {
        // Assuming the response contains VoucherNo directly
        this.employeeAdvanceForm.patchValue({
          VoucherNo: voucherNo.VoucherNo || voucherNo
        });
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  setButtonClick(): void {
    this.assignSetButtonValues();
  }
  assignSetButtonValues() {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup;
      control.get('Amount')?.patchValue(this.employeeAdvanceForm.value.Amount, { emitEvent: false });
    }
  }

  // savebuttonClick(): void {
  //   this.showLoadingSpinner = true;
  //   this.salaryMonthlyAdvance = this.employeeAdvanceForm.value;
  //   this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(this.employeeAdvanceForm.value.AdvanceDate));
  //   this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(this.employeeAdvanceForm.value.AdvanceDate));

  //   var dateYear = new Date(this.salaryMonthlyAdvance.AdvanceDate);
  //   this.year = dateYear.getFullYear();
  //   var dateMonth = new Date(this.salaryMonthlyAdvance.AdvanceDate);
  //   this.month = dateMonth.getMonth() + 1;

  //   const formArray = this.dynamicForm.get('formArray') as FormArray;
  //   for (let i = 0; i < formArray.length; i++) {
  //     const formGroup = formArray.at(i) as FormGroup;
  //     this.salaryMonthlyAdvance.ID = formGroup.get('ID')?.value;
  //     this.salaryMonthlyAdvance.EmployeeID = formGroup.get('EMP_ID')?.value;
  //     this.salaryMonthlyAdvance.Amount = formGroup.get('Amount')?.value;
  //     this.salaryMonthlyAdvance.Particulars = formGroup.get('Particulars')?.value;
  //     this.salaryMonthlyAdvance.PaymentType = formGroup.get('PAYMODE')?.value;

  //     this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe((response) => {
  //       if (response.True == 'True') {
  //       } else if (response.ResignDate == 'ResignDate') {
  //         this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
  //       } else if (response.Success == 'Success') {
  //         this.showMessage(`${response.Message}`, 'success', 'Success Message');
  //         this._router.navigate(['/payroll/employee-monthly-advance']);
  //       }
  //       this._dataService.setUsername(this.currentUser);
  //       this.showLoadingSpinner = false;
  //     },
  //       (error) => this.handleErrors(error)
  //     );
  //   }

  // }

  // savebuttonClick(): void {
  //   this.showLoadingSpinner = true;
  //   this.salaryMonthlyAdvance = { ...this.employeeAdvanceForm.value };
  //   this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(this.salaryMonthlyAdvance.AdvanceDate));
  //   this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(this.salaryMonthlyAdvance.AdvanceDate));

  //   const formArray = this.dynamicForm.get('formArray') as FormArray;
  //   const saveRequests: Observable<any>[] = [];

  //   this._payrollService.getAdvanceVoucherNo(this.employeeAdvanceForm.value.BranchCode, '1').pipe(
  //     map(response => {
  //       if (response && response.voucherNo) {
  //         return response.voucherNo.toString();
  //       }
  //     })
  //   ).subscribe(
  //     voucherNo => {
  //       for (let i = 0; i < formArray.length; i++) {
  //         const formGroup = formArray.at(i) as FormGroup;
  //         const advanceData = { 
  //           ...this.salaryMonthlyAdvance,
  //           ID: formGroup.get('ID')?.value,
  //           EmployeeID: formGroup.get('EMP_ID')?.value,
  //           Amount: formGroup.get('Amount')?.value,
  //           Particulars: formGroup.get('Particulars')?.value,
  //           PaymentType: formGroup.get('PAYMODE')?.value,
  //           VoucherNo: '0000000'+ i,
  //         };

  //         const saveRequest = this._payrollService.saveAndUpdateSalaryMonthlyAdvance(advanceData);
  //         saveRequests.push(saveRequest);
  //       }

  //       if (saveRequests.length === 0) {
  //         this.showLoadingSpinner = false;
  //         return;
  //       }

  //       forkJoin(saveRequests).subscribe(
  //         (responses) => {
  //           responses.forEach(response => {
  //             if (response.True === 'True') {
  //             } else if (response.ResignDate === 'ResignDate') {
  //               this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
  //             } else if (response.Success === 'Success') {
  //               this.showMessage(`${response.Message}`, 'success', 'Success Message');
  //               this._router.navigate(['/payroll/employee-monthly-advance']);
  //             }
  //           });
  //           this.showLoadingSpinner = false;
  //         },
  //         (error) => {
  //           this.handleErrors(error);
  //         }
  //       );
  //     },
  //     (error) => {
  //       this.handleErrors(error);
  //     }
  //   );
  // }



  savebuttonClick(): void {
    console.log('[NewEmployeeMonthlyAdvance] savebuttonClick called');
    this.showLoadingSpinner = true;
    this.salaryMonthlyAdvance = this.employeeAdvanceForm.value;
    this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(this.employeeAdvanceForm.value.AdvanceDate));
    this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(this.employeeAdvanceForm.value.AdvanceDate));

    console.log('[NewEmployeeMonthlyAdvance] Form data:', this.employeeAdvanceForm.value);
    console.log('[NewEmployeeMonthlyAdvance] SalaryMonthlyAdvance object:', this.salaryMonthlyAdvance);

    const dateYear = new Date(this.salaryMonthlyAdvance.AdvanceDate);
    this.year = dateYear.getFullYear();
    const dateMonth = new Date(this.salaryMonthlyAdvance.AdvanceDate);
    this.month = dateMonth.getMonth() + 1;

    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const requests = [];
    console.log('[NewEmployeeMonthlyAdvance] FormArray length:', formArray.length);

    if (formArray.length > 0) {
      for (let i = 0; i < formArray.length; i++) {
        const formGroup = formArray.at(i) as FormGroup;
        const amount = formGroup.get('Amount')?.value;

        console.log(`[NewEmployeeMonthlyAdvance] Processing item ${i}, Amount: ${amount}`);

        // Skip if Amount is null, empty, or 0
        if (!amount || parseFloat(amount) === 0) {
          console.log(`[NewEmployeeMonthlyAdvance] Skipping item ${i} due to zero/null amount`);
          continue;
        }

        const salaryAdvance = {
          ...this.salaryMonthlyAdvance,
          ID: formGroup.get('ID')?.value,
          EmployeeID: formGroup.get('EMP_ID')?.value,
          Amount: amount,
          Particulars: formGroup.get('Particulars')?.value,
          PaymentType: formGroup.get('PAYMODE')?.value,
          VoucherNo: (i + 1).toString().padStart(8, '0'),
        };

        console.log(`[NewEmployeeMonthlyAdvance] Adding request for item ${i}:`, salaryAdvance);
        requests.push(this._payrollService.saveAndUpdateSalaryMonthlyAdvance(salaryAdvance));
      }

      console.log(`[NewEmployeeMonthlyAdvance] Total requests to execute: ${requests.length}`);

      forkJoin(requests).subscribe(
        (responses) => {
          console.log('[NewEmployeeMonthlyAdvance] Responses received:', responses);
          const failedResponses: any[] = [];

          responses.forEach((response, index) => {
            console.log(`[NewEmployeeMonthlyAdvance] Processing response ${index}:`, response);
            if (response.True === 'True') {
              this.showMessage(response.Message, 'warning', 'Warning Message');
            } else if (response.ResignDate === 'ResignDate') {
              this.showMessage(response.Message, 'warning', 'Warning Message');
            } else if (response.Success === 'Success') {
              this.showMessage(response.Message, 'success', 'Success Message');
              this._router.navigate(['/payroll/employee-monthly-advance']);
            } else {
              console.error(`[NewEmployeeMonthlyAdvance] Unknown response type for item ${index}:`, response);
              failedResponses.push(response);  // Store failed responses
            }
          });

          if (failedResponses.length > 0) {
            console.error('[NewEmployeeMonthlyAdvance] Failed responses:', failedResponses);
            this.handleErrors(`Failed Responses: ${failedResponses}`);
          }

          this._dataService.setUsername(this.currentUser);
          this.hideSpinner();
        },
        (error) => {
          console.error('[NewEmployeeMonthlyAdvance] Error in forkJoin:', error);
          this.handleErrors(error);
        }
      );
    } else {
      this.hideSpinner();
    }
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
  clearEmployeeAdvanceDetails(): void {
    this.employeeAdvanceForm.reset();
    this.employeeAdvanceTitleStatus = 'new';
    this._router.navigate(['/payroll/new-employee-monthly-advance']);

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
