import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeService } from "../../../../service/employee.service";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { DatasharingService } from "../../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { IndianComplianceService } from 'src/app/service/indian-compliance.service';
import { CommercialBreakdownEnhancedDialogComponent } from './commercial-breakdown-enhanced-dialog.component';
import { INDIAN_STATES, SALARY_GROUPS, INDIAN_BANKS, INDIAN_RELIGIONS } from 'src/app/model/indian-employee.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-new-employee',
  templateUrl: './new-employee.component.html',
  styleUrls: ['./new-employee.component.css']
})
export class NewEmployeeComponent implements OnInit {

  frm!: FormGroup;
  isForeigner: boolean = false;
  isIndianCitizen: boolean = false;
  isBank: boolean = true;
  data: any;
  branchList: any;
  bankList: any;
  stateList: any;
  icColorList: any;
  nationalityList: any;
  raceList: any;
  clientList: any;
  salaryStructureList: any;
  employeeCheckInfoValidation: boolean = true;
  currentUser: string = '';
  empId: any;
  isEdit: boolean = false;
  empCodeData: any | undefined;
  check: any = 1;

  // Indian Compliance Data
  indianStates: string[] = INDIAN_STATES;
  salaryGroups: any[] = SALARY_GROUPS;
  indianBanks: any[] = INDIAN_BANKS;
  indianReligions: string[] = INDIAN_RELIGIONS;

  // Department and Designation Data
  departmentList: any[] = [];
  designationList: any[] = [];

  checkList: any = [
    {
      id: 0,
      display: ""
    }
  ];

  empChkError: any = [];
  showLoadingSpinner: boolean = false;
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  checklistItems = [
    { value: 0, label: 'Application Form' },
    { value: 1, label: 'Copy of Aadhaar' },
    { value: 3, label: 'Passport Size Photos' },
    { value: 4, label: 'Copy of Passport' },
    { value: 5, label: 'Copy of Visa' },
    { value: 6, label: 'Appointment Letter' },
    { value: 7, label: 'Confirmation Letter' },
    { value: 8, label: 'Police Verification' },
    { value: 9, label: 'CSG/TNG' },
  ];
  submitted = false;
  payMode: string = '';


  constructor(private _employeeService: EmployeeService, private fb: FormBuilder, private router: Router, private activatedRoute: ActivatedRoute, private _dataService: DatasharingService, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _indianComplianceService: IndianComplianceService, private http: HttpClient) {

    // Set default nationality to Indian Citizen
    this.isIndianCitizen = true;

    this.empId = this.activatedRoute.snapshot.params['EMP_ID'];
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    
    // Remove data loading from constructor - will be called in ngOnInit after proper initialization
    this.frm = this.fb.group({
      EMP_ID: [0],
      EMP_CODE: [''],
      EMP_BRANCH_CODE: [''],
      EMP_CLIENT: ['', Validators.required],
      EMP_ROLE: ['None'],
      EMP_NAME: ['', [Validators.required]],
      EMP_SEX: ['Male'],
      EMP_DATE_OF_BIRTH: [''],
      age: [''],
      EMP_CITIZEN: ['0'],
      EMP_NATIONAL: [''],
      EMP_PASSPORT_NO: [''],
      EMP_RACE: [''],
      EMP_ADDRESS1: ['', [Validators.required]],
      EMP_ADDRESS2: ['', [Validators.required]],
      EMP_PHONE: ['', [Validators.required]],
      EMP_MOBILEPHONE: [''],
      EMP_MARTIAL_STATUS: ['', Validators.required],
      EM_WORK_EXP: [''],
      EMP_HGH_EDU: [''],
      EMP_SPOUSE_NAME: [''],
      EMP_SP_WORK: ['0'],
      EMP_SP_TEL_NO: [''],
      EMP_NO_CHILD: [0],
      EMP_PER_NAME_CONTACT: [''],
      EMP_CONTACT_ADDRESS1: ['', [Validators.required]],
      EMP_CONTACT_ADDRESS2: ['', [Validators.required]],
      EMP_CONTACT_TELEPHONE: ['', [Validators.required]],
      
      // Malaysian fields (keeping for backward compatibility)
      EMP_POST_CODE: ['', [Validators.pattern('^[0-9]{6}$')]],
      EMP_TOWN: [''],
      EMP_STATE: [''],
      EMP_CONTACT_POST_CODE: ['', [Validators.pattern('^[0-9]{6}$')]],
      EMP_CONTACT_TOWN: [''],
      EMP_CONTACT_STATE: [''],
      TMPGUARD: ['1'],
      EPFDETECT: ['No'],
      EMPFL_EPFNO: [''],
      SOCSODETECT: ['No'],
      EMPFL_SOSCO_NO: [''],
      DETECTBYND55: ['No'],
      
      // Indian Compliance Fields
      AadhaarNumber: ['', [Validators.pattern('^[2-9]\\d{11}$')]],
      PANNumber: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      PFAccountNumber: [''],
      ESINumber: [''],
      SalaryGroup: ['None'],
      SpousePAN: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      SpouseAadhaar: ['', [Validators.pattern('^[2-9]\\d{11}$')]],
      IndianState: [''],
      BankAccountNumber: ['', [Validators.pattern('^\\d{9,18}$')]],
      BankIFSC: ['', [Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]], // IFSC pattern validation
      BankName: [''],
      UPIId: [''],
      EMPPAY_JOB_TITLE: ['', [Validators.required]],
      EMPPAY_CATEGORY: ['', [Validators.required]],
      EMPPAY_DATE_JOINED: [''],
      EMPPAY_DATE_RESIGNED: [''],
      salary_structure: [''],
      SALARYLAB: [0],
      NewSalaryStructure: ['N'],
      SalaryStructure1000_3h: ['0'],
      EMPPAY_BASIC_RATE: ['', [Validators.required]],
      ATTENDANCEALLOWANCE: [0],
      AttendanceAllowanceWorkingDays: [0],
      AttendanceAllowanceFollowCalendar: [false],
      SpecialAllowance: [0],
      PAYMODE: ['Bank'],
      INCOMETAXDETECT: ['', Validators.required],
      EMPFL_TAX_NO: [''],
      application_form: [''],
      copy_ic: [''],
      bank_ac_detail: [''],
      passport_size_photo: [''],
      copy_of_passport: [''],
      copy_of_visa: [''],
      appointment_letter: [''],
      confirm_letter: [''],
      kdn_vetting: [''],
      HasTransfered: [false],
      TransferDate: [''],
      KDNVetting: [],
      EMP_CHECKLIST: [],
      EMPPAY_ID: [0],
      EMPFL_ID: [0],
      
      // Commercial Breakdown Fields
      CB_Basic: [0],
      CB_DA: [0],
      CB_HRA: [0],
      CB_HRAPercentage: [0],
      CB_Leaves: [0],
      CB_LeavesPercentage: [0],
      CB_NH: [0],
      CB_NHPercentage: [0],
      CB_Advance: [0],
      CB_AdvancePercentage: [0],
      CB_ProfessionalTax: [0],
      CB_Bonus: [0],
      CB_BonusPercentage: [0],
      CB_RelieverCharges: [0],
      CB_RelieverChargesPercentage: [0],
      CB_PF: [0],
      CB_PFPercentage: [0],
      CB_ESI: [0],
      CB_ESIPercentage: [0],
      CB_UniformCost: [0],
      CB_Others: [0],
      CB_OthersPercentage: [0],
      CB_AdministrationCharges: [0],
      CB_AdministrationChargesPercentage: [0],
      CB_ManagementFee: [0],
      CB_ManagementFeePercentage: [0],
      CB_SubTotal: [0],
      CB_TotalPlusStatutory: [0],
      CB_TotalDirectCost: [0],
      CB_MonthlyChargedCost: [0],
      
      // Department and Designation Fields
      DepartmentId: [null],
      DesignationId: [null]
    });

    this.checklistItems.forEach((item) => {
      this.frm.addControl(`checklistItem_${item.value}`, new FormControl(false));
    });

    if (this.empId != 0 && this.empId != undefined) {
      this.isEdit = true;

      this._employeeService.getEmployeeById(this.empId).subscribe((d: any) => {
        let result = d['Result'];
        let employee = result['employee'];
        let employment = result['employment'];
        let salaryDetail = result['salaryDetail'];
        
        // Handle null salaryDetail case
        if (salaryDetail != null) {
          this.payMode = salaryDetail['PAYMODE'];
          this.changePaymentMode(salaryDetail['PAYMODE']);
        } else {
          this.payMode = 'Bank'; // Default payment mode
          this.changePaymentMode('Bank');
        }
        
        this.nationalityChange(employee['EMP_CITIZEN']);
        this.frm.patchValue(employee);
        this.frm.patchValue(employment);
        if (salaryDetail != null) {
          this.frm.patchValue(salaryDetail);
        }

        // Load Commercial Breakdown data from salaryDetail record
        // DEBUG: Log the raw data received from backend
        console.log('=== COMMERCIAL BREAKDOWN DATA FROM BACKEND ===');
        console.log('Raw salaryDetail:', salaryDetail);
        console.log('Raw salaryDetail CB_Basic:', salaryDetail?.CB_Basic);
        console.log('Raw salaryDetail CB_DA:', salaryDetail?.CB_DA);
        console.log('Raw salaryDetail CB_HRA:', salaryDetail?.CB_HRA);
        console.log('==============================================');
        
        this.frm.get('CB_Basic')?.setValue(salaryDetail?.CB_Basic || 0);
        this.frm.get('CB_DA')?.setValue(salaryDetail?.CB_DA || 0);
        this.frm.get('CB_HRA')?.setValue(salaryDetail?.CB_HRA || 0);
        this.frm.get('CB_HRAPercentage')?.setValue(salaryDetail?.CB_HRAPercentage || 0);
        this.frm.get('CB_Leaves')?.setValue(salaryDetail?.CB_Leaves || 0);
        this.frm.get('CB_LeavesPercentage')?.setValue(salaryDetail?.CB_LeavesPercentage || 0);
        this.frm.get('CB_NH')?.setValue(salaryDetail?.CB_NH || 0);
        this.frm.get('CB_NHPercentage')?.setValue(salaryDetail?.CB_NHPercentage || 0);
        this.frm.get('CB_Advance')?.setValue(salaryDetail?.CB_Advance || 0);
        this.frm.get('CB_AdvancePercentage')?.setValue(salaryDetail?.CB_AdvancePercentage || 0);
        this.frm.get('CB_ProfessionalTax')?.setValue(salaryDetail?.CB_ProfessionalTax || 0);
        this.frm.get('CB_Bonus')?.setValue(salaryDetail?.CB_Bonus || 0);
        this.frm.get('CB_BonusPercentage')?.setValue(salaryDetail?.CB_BonusPercentage || 0);
        this.frm.get('CB_RelieverCharges')?.setValue(salaryDetail?.CB_RelieverCharges || 0);
        this.frm.get('CB_RelieverChargesPercentage')?.setValue(salaryDetail?.CB_RelieverChargesPercentage || 0);
        this.frm.get('CB_PF')?.setValue(salaryDetail?.CB_PF || 0);
        this.frm.get('CB_PFPercentage')?.setValue(salaryDetail?.CB_PFPercentage || 0);
        this.frm.get('CB_ESI')?.setValue(salaryDetail?.CB_ESI || 0);
        this.frm.get('CB_ESIPercentage')?.setValue(salaryDetail?.CB_ESIPercentage || 0);
        this.frm.get('CB_UniformCost')?.setValue(salaryDetail?.CB_UniformCost || 0);
        this.frm.get('CB_Others')?.setValue(salaryDetail?.CB_Others || 0);
        this.frm.get('CB_OthersPercentage')?.setValue(salaryDetail?.CB_OthersPercentage || 0);
        this.frm.get('CB_AdministrationCharges')?.setValue(salaryDetail?.CB_AdministrationCharges || 0);
        this.frm.get('CB_AdministrationChargesPercentage')?.setValue(salaryDetail?.CB_AdministrationChargesPercentage || 0);
        this.frm.get('CB_ManagementFee')?.setValue(salaryDetail?.CB_ManagementFee || 0);
        this.frm.get('CB_ManagementFeePercentage')?.setValue(salaryDetail?.CB_ManagementFeePercentage || 0);
        this.frm.get('CB_SubTotal')?.setValue(salaryDetail?.CB_SubTotal || 0);
        this.frm.get('CB_TotalPlusStatutory')?.setValue(salaryDetail?.CB_TotalPlusStatutory || 0);
        this.frm.get('CB_TotalDirectCost')?.setValue(salaryDetail?.CB_TotalDirectCost || 0);
        this.frm.get('CB_MonthlyChargedCost')?.setValue(salaryDetail?.CB_MonthlyChargedCost || 0);
        
        this.frm.get('EMP_CITIZEN')?.setValue(employee['EMP_CITIZEN'].toString());
        this.frm.get('SALARYLAB')?.setValue(employment['SALARYLAB'].toString() ?? 0);
        this.frm.get('EMP_SP_WORK')?.setValue(employee['EMP_SP_WORK'] == true ? "1" : "0");
        this.frm.get('TMPGUARD')?.setValue(salaryDetail?.TMPGUARD == true ? "0" : "1");
        this.frm.get('INCOMETAXDETECT')?.setValue(salaryDetail?.INCOMETAXDETECT == true ? "Yes" : "No");
        this.frm.get('SOCSODETECT')?.setValue(salaryDetail?.SOCSODETECT == true ? "Yes" : "No");
        this.frm.get('EPFDETECT')?.setValue(salaryDetail?.EPFDETECT == true ? "Yes" : "No");
        this.frm.get('DETECTBYND55')?.setValue(salaryDetail?.DETECTBYND55 == true ? "Yes" : "No");

        this.frm.get('AttendanceAllowanceFollowCalendar')?.setValue(employment['AttendanceAllowanceFollowCalendar'] == "Y");

        this.calendarChangeEvent(employment['AttendanceAllowanceFollowCalendar'] == "Y");

        const oEmployeeCheckList = employee['EMP_CHECKLIST']; //256+128+64+32+16+8+4+2+1;
        this.checklistItems.forEach((item) => {
          const formControl = this.frm.get(`checklistItem_${item.value}`);
          if (formControl) {
            formControl.setValue(!!(oEmployeeCheckList & (1 << item.value)));
          }
        });
      }, () => {
      }, () => {
        this.calculateAge();
        this.typeChange();
      });
    }
    // Employee code data is now handled in loadInitialData method
    this.frm.get('EMP_CODE')?.disable({ onlySelf: true });
    this.frm.get("EMP_NO_CHILD")?.disable({ onlySelf: true });
    this.frm.get("EMPPAY_BASIC_RATE")?.disable({ onlySelf: true });
    this.frm.get("AttendanceAllowanceWorkingDays")?.disable({ onlySelf: true });

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
        this.getUserAccessRights(this.currentUser, 'Employee Master');
        this.loadInitialData();
      });
    } else {
      this.getUserAccessRights(this.currentUser, 'Employee Master');
      this.loadInitialData();
    }

    this.frm.get('EMPPAY_DATE_RESIGNED')?.valueChanges.subscribe(value => {
      const currentPayMode = this.frm.get('PAYMODE')?.value;
      if (value && currentPayMode !== 'Cheque') {
        this.frm.get('PAYMODE')?.setValue('Cheque');
      } else {
        this.frm.get('PAYMODE')?.setValue(this.payMode);
      }
    });
  }

  loadInitialData(): void {
    this._employeeService.getEmployeeMaster(this.currentUser).subscribe((data: any) => {
      this.data = data;
      this.branchList = data['branchList'];
      this.bankList = data['bankList'];
      this.stateList = data['stateList'];
      this.icColorList = data['icColorList'];
      
      // Load Department and Designation data
      this.loadDepartments();
      this.loadDesignations();
      this.nationalityList = data['nationalityList'];
      this.raceList = data['raceList'];
      this.clientList = data['clientList'];
      this.salaryStructureList = data['salaryStructureList'];
      
      // Handle edit scenario - load employee code data after initial data is loaded
      if (this.empId != 0 && this.empId != undefined) {
        // Edit mode - employee data will be loaded separately
      } else {
        // Create mode - load employee code data
        this.empCodeData = data['emp']['Result'];
        if (!this.isEdit) {
          this.setEmpCode();
        }
      }
    });
  }

  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
          } else {
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
            } else {
              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;

            }
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  nationalityChange(value: any) {
    this.isForeigner = value == 1;
    this.isIndianCitizen = value == 0 || value == 3; // Include Migrate People as Indian citizen type

    if (this.isForeigner) {
      // For foreigners, passport is required
      this.frm.get('EMP_PASSPORT_NO')?.setValidators([Validators.required]);
    } else {
      // For Indian citizens and Migrate People, remove passport requirement
      this.frm.get('EMP_PASSPORT_NO')?.clearValidators();
      this.frm.get('EMP_PASSPORT_NO')?.setValue('');
    }
    
    this.frm.get('EMP_PASSPORT_NO')?.updateValueAndValidity();
  }

  clientChange(value: any) {
    this._employeeService.getClientsFromBranchId(value, this.frm.get('EMP_ROLE')?.value).subscribe((data: any) => {
      // this.empCodeData = data.emp
      console.log(data);
      this.clientList = data['clientList'];
      this.setEmpCode();
    })
  }

  typeChange() {
    if (this.empCodeData != undefined) {
      this.setEmpCode();
    }

    if (this.frm.get('EMP_ROLE')?.value === 'Staff') {
      this.frm.get("EMP_CLIENT")?.setValue("");
      this.frm.get("EMP_CLIENT")?.disable({ onlySelf: true });
    } else {
      this.frm.get("EMP_CLIENT")?.enable({ onlySelf: true });
    }

  }

  setEmpCode() {
    if (this.empCodeData) {
      const empRole = this.frm.get('EMP_ROLE')?.value || 'Guard';
      const roleChar = empRole.charAt(0).toUpperCase();
      let empCode = this.empCodeData["ShortName"] + roleChar + this.empCodeData["Code"];
      this.frm.get('EMP_CODE')?.setValue(empCode);
    }
  }

  calculateAge() {
    let dob = this.frm.get('EMP_DATE_OF_BIRTH')?.value
    if (dob) {
      const birthDate = new Date(dob);
      const currentDate = new Date();
      this.frm.get('age')?.setValue(currentDate.getFullYear() - birthDate.getFullYear());
    }
  }

  // Department and Designation methods
  loadDepartments(): void {
    this.http.get('/api/Department').subscribe({
      next: (response: any) => {
        this.departmentList = response;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.showMessage('Error loading departments', 'error', 'Error Message');
      }
    });
  }

  loadDesignations(): void {
    this.http.get('/api/Designation').subscribe({
      next: (response: any) => {
        this.designationList = response;
      },
      error: (error) => {
        console.error('Error loading designations:', error);
        this.showMessage('Error loading designations', 'error', 'Error Message');
      }
    });
  }

  formatDateInput(event: any, formControlName: string): void {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    
    if (value.length >= 8) {
      // Format as DD-MM-YYYY
      const day = value.substring(0, 2);
      const month = value.substring(2, 4);
      const year = value.substring(4, 8);
      
      // Create a valid date string for the datepicker
      const formattedDate = `${day}-${month}-${year}`;
      event.target.value = formattedDate;
      
      // Parse and set the date value
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(dateObj.getTime())) {
        this.frm.get(formControlName)?.setValue(dateObj);
        
        // Calculate age if it's the date of birth field
        if (formControlName === 'EMP_DATE_OF_BIRTH') {
          this.calculateAge();
        }
      }
    }
  }


  changePaymentMode(value: any) {
    this.isBank = value === "Bank";
    // Bank field validation removed as bank details section is removed from form
  }

  onSubmit() {
    this.submitted = true;
    
    // Custom validation: Prevent submission if EMP_ROLE is 'None'
    if (this.frm.get('EMP_ROLE')?.value === 'None') {
      this.showMessage('Please select a valid employee type (Guard or Staff) before creating employee.', 'warning', 'Warning Message');
      return;
    }
    
    if (this.frm.invalid) {
      this.showMessage('Please correct the validation errors in the form before submitting.', 'warning', 'Warning Message');
      console.log('Form invalid:', this.frm.errors);
      
      // Log individual control errors for debugging
      Object.keys(this.frm.controls).forEach(key => {
        const controlErrors = this.frm.get(key)?.errors;
        if (controlErrors != null) {
          console.log('Key control error:', key, controlErrors);
        }
      });
      return;
    }

    if (!this.employeeCheckInfoValidation && this.isForeigner) {
      this.showMessage('Employee already has this IC number. Please choose a different IC number.', 'warning', 'Warning Message');      
      return;
    }

    this.showSpinner();
    let data = this.frm.getRawValue();

    // Convert numeric fields from string to number
    data['EMPPAY_BASIC_RATE'] = parseFloat(data['EMPPAY_BASIC_RATE']) || 0;
    data['SALARYLAB'] = parseFloat(data['SALARYLAB']) || 0;
    data['ATTENDANCEALLOWANCE'] = parseFloat(data['ATTENDANCEALLOWANCE']) || 0;
    data['NewStructureATTENDANCEALLOWANCE'] = parseFloat(data['NewStructureATTENDANCEALLOWANCE']) || 0;
    data['SpecialAllowance'] = parseFloat(data['SpecialAllowance']) || 0;
    data['AttendanceAllowanceWorkingDays'] = parseFloat(data['AttendanceAllowanceWorkingDays']) || 0;

    // Convert Commercial Breakdown fields to numbers
    data['CB_Basic'] = parseFloat(data['CB_Basic']) || 0;
    data['CB_DA'] = parseFloat(data['CB_DA']) || 0;
    data['CB_HRA'] = parseFloat(data['CB_HRA']) || 0;
    data['CB_HRAPercentage'] = parseFloat(data['CB_HRAPercentage']) || 0;
    data['CB_Leaves'] = parseFloat(data['CB_Leaves']) || 0;
    data['CB_LeavesPercentage'] = parseFloat(data['CB_LeavesPercentage']) || 0;
    data['CB_ProfessionalTax'] = parseFloat(data['CB_ProfessionalTax']) || 0;
    data['CB_Bonus'] = parseFloat(data['CB_Bonus']) || 0;
    data['CB_BonusPercentage'] = parseFloat(data['CB_BonusPercentage']) || 0;
    data['CB_RelieverCharges'] = parseFloat(data['CB_RelieverCharges']) || 0;
    data['CB_RelieverChargesPercentage'] = parseFloat(data['CB_RelieverChargesPercentage']) || 0;
    data['CB_PF'] = parseFloat(data['CB_PF']) || 0;
    data['CB_PFPercentage'] = parseFloat(data['CB_PFPercentage']) || 0;
    data['CB_ESI'] = parseFloat(data['CB_ESI']) || 0;
    data['CB_ESIPercentage'] = parseFloat(data['CB_ESIPercentage']) || 0;
    data['CB_UniformCost'] = parseFloat(data['CB_UniformCost']) || 0;
    data['CB_Others'] = parseFloat(data['CB_Others']) || 0;
    data['CB_OthersPercentage'] = parseFloat(data['CB_OthersPercentage']) || 0;
    data['CB_AdministrationCharges'] = parseFloat(data['CB_AdministrationCharges']) || 0;
    data['CB_AdministrationChargesPercentage'] = parseFloat(data['CB_AdministrationChargesPercentage']) || 0;
    data['CB_ManagementFee'] = parseFloat(data['CB_ManagementFee']) || 0;
    data['CB_ManagementFeePercentage'] = parseFloat(data['CB_ManagementFeePercentage']) || 0;
    data['CB_SubTotal'] = parseFloat(data['CB_SubTotal']) || 0;
    data['CB_TotalPlusStatutory'] = parseFloat(data['CB_TotalPlusStatutory']) || 0;
    data['CB_TotalDirectCost'] = parseFloat(data['CB_TotalDirectCost']) || 0;
    data['CB_MonthlyChargedCost'] = parseFloat(data['CB_MonthlyChargedCost']) || 0;

    // DEBUG: Log CB values being sent
    console.log('=== CB VALUES BEFORE SAVE ===');
    console.log('CB_Basic:', data['CB_Basic'], typeof data['CB_Basic']);
    console.log('CB_DA:', data['CB_DA'], typeof data['CB_DA']);
    console.log('CB_HRA:', data['CB_HRA'], typeof data['CB_HRA']);
    console.log('CB_MonthlyChargedCost:', data['CB_MonthlyChargedCost'], typeof data['CB_MonthlyChargedCost']);
    console.log('Form CB_Basic:', this.frm.get('CB_Basic')?.value);
    console.log('Form CB_DA:', this.frm.get('CB_DA')?.value);
    console.log('================================');

    // DEBUG: Log data being sent to backend
    console.log('=== COMMERCIAL BREAKDOWN DATA SENT TO BACKEND ===');
    console.log('CB_Basic:', data['CB_Basic']);
    console.log('CB_DA:', data['CB_DA']);
    console.log('CB_HRA:', data['CB_HRA']);
    console.log('CB_MonthlyChargedCost:', data['CB_MonthlyChargedCost']);
    console.log('=== FULL DATA OBJECT ===');
    console.log(data);

    if (data['EMP_NO_CHILD'] !== undefined) {
      data['EMP_NO_CHILD'] = parseInt(data['EMP_NO_CHILD'], 10) || 0;
    }

    if (data['EMP_CITIZEN'] !== undefined) {
      data['EMP_CITIZEN'] = parseInt(data['EMP_CITIZEN'], 10) || 0;
    }

    data['EMP_SP_WORK'] = this.frm.get('EMP_SP_WORK')?.value == 'Yes';

    data['OldBranch'] = '';
    data['EMP_IC_COLOR'] = 'test';
    data['LastUpdatedBy'] = 'admin';
    data['TMPGUARD'] = this.frm.get('TMPGUARD')?.value == '0';
    data['DETECTBYND55'] = this.frm.get('DETECTBYND55')?.value == 'Yes';
    data['INCOMETAXDETECT'] = this.frm.get('INCOMETAXDETECT')?.value == 'Yes';
    data['SOCSODETECT'] = this.frm.get('SOCSODETECT')?.value == 'Yes';
    data['EPFDETECT'] = this.frm.get('EPFDETECT')?.value == 'Yes';
    data['KDNVetting'] = false;

    data['AttendanceAllowanceFollowCalendar'] = this.frm.get('AttendanceAllowanceFollowCalendar')?.value ? 'Y' : 'N';

    data['LASTUPDATE'] = new Date().toISOString();
    
    // Process Employment details dates securely avoiding auto-filling today's date
    data['EMP_DATE_OF_BIRTH'] = this.frm.get('EMP_DATE_OF_BIRTH')?.value ? this.returnDate(this.frm.get('EMP_DATE_OF_BIRTH')?.value) : null;
    data['TransferDate'] = null;
    
    data['EMPPAY_DATE_JOINED'] = this.frm.get('EMPPAY_DATE_JOINED')?.value ? this.returnDate(this.frm.get('EMPPAY_DATE_JOINED')?.value) : null;
    data['EMPPAY_DATE_RESIGNED'] = this.frm.get('EMPPAY_DATE_RESIGNED')?.value ? this.returnDate(this.frm.get('EMPPAY_DATE_RESIGNED')?.value) : null;
    let total = 0;
    this.checklistItems.forEach((item) => {
      const formControl = this.frm.get(`checklistItem_${item.value}`);

      if (formControl && formControl.value) {
        total += Math.pow(2, item.value);
        if (Math.pow(2, item.value) == 256) {
          data['KDNVetting'] = true;
        }
      }
    });

    data['EMP_CHECKLIST'] = total;
    data['EMP_POST_CODE'] = this.frm.get('EMP_POST_CODE')?.value ?? "";
    data['EMP_STATE'] = this.frm.get('EMP_STATE')?.value ?? "";
    data['EMP_CONTACT_POST_CODE'] = this.frm.get('EMP_CONTACT_POST_CODE')?.value ?? "";
    data['EMP_CONTACT_STATE'] = this.frm.get('EMP_CONTACT_STATE')?.value ?? "";


    this._employeeService.saveEmployee(data).subscribe({
      next: (d: any) => {
        if (d.Success == 'Success') {
          if (this.isEdit) {
            this.showMessage('Successfully Updated Employee Details', 'success', 'Success Message')
          } else {
            this.showMessage('Successfully Saved Employee Details', 'success', 'Success Message')
          }
          this.router.navigate(['/master/employee-master']);
        } else {
          if (d.Success == 'Warning') {
            this.showMessage(d.Message || 'Form contains some errors', 'warning', 'Warning Message');
          } else if (d.Success == 'Error') {
            this.showMessage(d.Message || 'Failed to save employee details', 'error', 'Error Message');
          }
        }
        this.hideSpinner();
      },
      error: (err: any) => {
        this.hideSpinner();
        console.error('Save error:', err);
        const errorMsg = typeof err === 'string' ? err : (err.error?.Message || err.message || 'Server error occurred');
        this.showMessage('Network/Server error: ' + errorMsg, 'error', 'Error Message');
      }
    });
  }

  returnDate(date?: any) {
    if (!date) {
      return null;
    }
    let currentDate = new Date(date);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  calendarChange(event: any) {
    this.calendarChangeEvent(event.checked);
  }

  calendarChangeEvent(flag: boolean) {
    if (flag) {
      this.frm.get('AttendanceAllowanceWorkingDays')?.setValue("0");
      this.frm.get('AttendanceAllowanceWorkingDays')?.disable({ onlySelf: true });
    } else {
      this.frm.get('AttendanceAllowanceWorkingDays')?.setValue("0");
      this.frm.get('AttendanceAllowanceWorkingDays')?.enable({ onlySelf: true });
    }
  }

  salaryStructureChange(event: any) {
    if (event.value == 'N') {
      // Salary is set via Commercial Breakdown only - keep disabled
      this.frm.get('EMPPAY_BASIC_RATE')?.setValue("");
    } else {
      this.frm.get('EMPPAY_BASIC_RATE')?.setValue("0");
    }
    // Salary field always remains disabled - only editable via Commercial Breakdown
    this.frm.get('EMPPAY_BASIC_RATE')?.disable({ onlySelf: true });
  }

  isTemporaryEmployeeChange(value: any) {
    if (value == '0') {
      this.frm.get("INCOMETAXDETECT")?.setValue("No");
      this.frm.get("SOCSODETECT")?.setValue("No");
      this.frm.get("EPFDETECT")?.setValue("No");
      this.frm.get("DETECTBYND55")?.setValue("No");
      this.frm.get("EMPFL_TAX_NO")?.disable({ onlySelf: true });
      this.frm.get("EMPFL_EPFNO")?.disable({ onlySelf: true });
      this.frm.get("EMPFL_SOSCO_NO")?.disable({ onlySelf: true });

    } else {
      this.frm.get("INCOMETAXDETECT")?.setValue("Yes");
      this.frm.get("SOCSODETECT")?.setValue("Yes");
      this.frm.get("EPFDETECT")?.setValue("Yes");
      this.frm.get("DETECTBYND55")?.setValue("Yes");

      this.frm.get("EMPFL_TAX_NO")?.enable({ onlySelf: true });
      this.frm.get("EMPFL_EPFNO")?.enable({ onlySelf: true });
      this.frm.get("EMPFL_SOSCO_NO")?.enable({ onlySelf: true });
    }
  }

  checkEmployeeInfo(from: any) {
    let _trigger = true;
    let data;
    if (from == "NewIC") {
      data = this.frm.get("EMP_IC_NEW")?.value;
    } else if (from == "OldIC") {
      data = this.frm.get("EMP_IC_OLD")?.value;
    } else if (from == "Passport") {
      data = this.frm.get("EMP_PASSPORT_NO")?.value;
    } else if (from == "SOCSONo") {
      data = this.frm.get("ESINumber")?.value;
    } else if (from == "EPFNo") {
      data = this.frm.get("PFAccountNumber")?.value;
    } else if (from == "BankAccount") {
      if (this.frm.get("BankName")?.value != "" && this.frm.get("BankAccountNumber")?.value != "") {
        data = this.frm.get("BankName")?.value + "//" + this.frm.get("BankAccountNumber")?.value;
        _trigger = true;
      } else {
        _trigger = false;
      }
    }

    if (_trigger) {
      this._employeeService.checkEmployeeInfo(from, data).subscribe((d: any) => {
        var result = d['Result'];
        result.EMP_ID = result?.EMP_ID == 0 ? -1 : result?.EMP_ID;
        if (result?.EMP_ID != this.empId) {          
          this.empChkError[from] = result?.MESSAGE;
          this.employeeCheckInfoValidation = result?.MESSAGE == "success";
        }
      })
    }
  }

  maritalStatusChange(event: any) {
    if (event.value == "Married") {
      this.frm.get("EMP_NO_CHILD")?.enable({ onlySelf: true });
    } else {
      this.frm.get("EMP_NO_CHILD")?.disable({ onlySelf: true });
    }
  }

  salaryStructureChangeSlab(data: any) {
    console.log(data.value);

    // SalaryBand
    // WorkingDays

    let da = this.salaryStructureList.filter((x: any) => x.SalaryId == data.value)
    console.log(da);
    // Set working days but salary is set via Commercial Breakdown only
    this.frm.get("AttendanceAllowanceWorkingDays")?.setValue(da[0]['WorkingDays'])

  }

  // Bank selection handler
  onBankChange(bankCode: string) {
    const selectedBank = this.indianBanks.find(bank => bank.code === bankCode);
    if (selectedBank) {
      this.frm.get('BankName')?.setValue(selectedBank.name);
      this.frm.get('BankIFSC')?.setValue(selectedBank.ifsc);
      this.checkEmployeeInfo('BankAccount');
    }
  }

  // Salary group change handler
  onSalaryGroupChange(group: string) {
    this.frm.get('SalaryGroup')?.setValue(group);
    // Add logic for salary group specific validations or calculations
  }

  showSpinner() {
    this.showLoadingSpinner = true;
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
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
      this.hideSpinner();
    }
  };

  openCommercialDetails() {
    const dialogRef = this.dialog.open(CommercialBreakdownEnhancedDialogComponent, {
      width: '1200px',
      data: {
        NoOfGuards: 1,
        NoOfDays: 30,
        MinimumWages: this.frm.get('MinimumWages')?.value || 0,
        Basic: this.frm.get('CB_Basic')?.value || 0,
        DA: this.frm.get('CB_DA')?.value || 0,
        HRA: this.frm.get('CB_HRA')?.value || 0,
        HRAPercentage: this.frm.get('CB_HRAPercentage')?.value || 0,
        Leaves: this.frm.get('CB_Leaves')?.value || 0,
        LeavesPercentage: this.frm.get('CB_LeavesPercentage')?.value || 0,
        ProfessionalTax: this.frm.get('CB_ProfessionalTax')?.value || 0,
        Bonus: this.frm.get('CB_Bonus')?.value || 0,
        BonusPercentage: this.frm.get('CB_BonusPercentage')?.value || 0,
        RelieverCharges: this.frm.get('CB_RelieverCharges')?.value || 0,
        RelieverChargesPercentage: this.frm.get('CB_RelieverChargesPercentage')?.value || 0,
        PF: this.frm.get('CB_PF')?.value || 0,
        PFPercentage: this.frm.get('CB_PFPercentage')?.value || 0,
        ESI: this.frm.get('CB_ESI')?.value || 0,
        ESIPercentage: this.frm.get('CB_ESIPercentage')?.value || 0,
        UniformCost: this.frm.get('CB_UniformCost')?.value || 0,
        Others: this.frm.get('CB_Others')?.value || 0,
        OthersPercentage: this.frm.get('CB_OthersPercentage')?.value || 0,
        AdministrationCharges: this.frm.get('CB_AdministrationCharges')?.value || 0,
        AdministrationChargesPercentage: this.frm.get('CB_AdministrationChargesPercentage')?.value || 0,
        ManagementFee: this.frm.get('CB_ManagementFee')?.value || 0,
        ManagementFeePercentage: this.frm.get('CB_ManagementFeePercentage')?.value || 0,
        SubTotal: this.frm.get('CB_SubTotal')?.value || 0,
        TotalPlusStatutory: this.frm.get('CB_TotalPlusStatutory')?.value || 0,
        TotalDirectCost: this.frm.get('CB_TotalDirectCost')?.value || 0,
        MonthlyChargedCost: this.frm.get('CB_MonthlyChargedCost')?.value || 0
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update the form with the new values
        this.frm.patchValue({
          CB_Basic: result.Basic || 0,
          CB_DA: result.DA || 0,
          CB_HRA: result.HRA || 0,
          CB_HRAPercentage: result.HRAPercentage || 0,
          CB_Leaves: result.Leaves || 0,
          CB_LeavesPercentage: result.LeavesPercentage || 0,
          CB_ProfessionalTax: result.ProfessionalTax || 0,
          CB_Bonus: result.Bonus || 0,
          CB_BonusPercentage: result.BonusPercentage || 0,
          CB_RelieverCharges: result.RelieverCharges || 0,
          CB_RelieverChargesPercentage: result.RelieverChargesPercentage || 0,
          CB_PF: result.PF || 0,
          CB_PFPercentage: result.PFPercentage || 0,
          CB_ESI: result.ESI || 0,
          CB_ESIPercentage: result.ESIPercentage || 0,
          CB_UniformCost: result.UniformCost || 0,
          CB_Others: result.Others || 0,
          CB_OthersPercentage: result.OthersPercentage || 0,
          CB_AdministrationCharges: result.AdministrationCharges || 0,
          CB_AdministrationChargesPercentage: result.AdministrationChargesPercentage || 0,
          CB_ManagementFee: result.ManagementFee || 0,
          CB_ManagementFeePercentage: result.ManagementFeePercentage || 0,
          CB_SubTotal: result.SubTotal || 0,
          CB_TotalPlusStatutory: result.TotalPlusStatutory || 0,
          CB_TotalDirectCost: result.TotalDirectCost || 0,
          CB_MonthlyChargedCost: result.MonthlyChargedCost || 0
        });

        // Update the salary field with the monthly charged cost
        this.frm.get('EMPPAY_BASIC_RATE')?.setValue(result.MonthlyChargedCost || 0);
      }
    });
  }
}
