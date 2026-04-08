import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, tap, catchError, finalize, throwError } from 'rxjs';
import { forkJoin } from 'rxjs';
import { AttendanceModel } from 'src/app/model/attendanceModel';
import { AttendanceDetails } from 'src/app/model/AttendanceDetails';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';

export interface AttendanceData {
  id: number;
  period: string;
  attendanceDate: string;
  timeStart: string | null;
  timeEnd: string | null;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  branch: string;
  branchName?: string; // Full branch name
  clientName?: string; // Client name
  employeeType?: string; // Optional employee type field
  punchInTime: string;
  punchOutTime: string;
  totalHours: number;
  overtimeHours: number;
  behavior: string;
  status: string;
  lastUpdate: string;
  details: AttendanceDetails[];
}

@Component({
  selector: 'app-attendance-display',
  templateUrl: './attendance-display.component.html',
  styleUrls: ['./attendance-display.component.css']
})
export class AttendanceDisplayComponent implements OnInit, AfterViewInit {
  
  // Form controls
  attendanceFilterForm!: FormGroup;
  
  // Table properties
  displayedColumns: string[] = [
    'id',
    'employeeCode',
    'employeeName',
    'clientName',
    'branchName',
    'attendanceDate',
    'punchInTime',
    'punchOutTime',
    'totalHours',
    'overtimeHours',
    'behavior',
    'status',
    'actions'
  ];
  
  dataSource!: MatTableDataSource<AttendanceData>;
  
  // View children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Data properties
  attendanceData: AttendanceData[] = [];
  filteredAttendanceData: AttendanceData[] = [];
  employees: any[] = [];
  branches: any[] = [];
  clients: any[] = [];
  previousFilters: any = {}; // Track previous filter values
  
  // Loading flags
  branchesLoaded: boolean = false;
  clientsLoaded: boolean = false;
  
  // Loading and status
  isLoading: boolean = false;
  showLoadingSpinner: boolean = false;
  totalRecords: number = 0;
  
  // Error and warning messages
  errorMessage: string = '';
  warningMessage: string = '';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  
  // Statistics
  totalEmployees: number = 0;
  totalHours: number = 0;
  totalOvertime: number = 0;
  presentCount: number = 0;
  absentCount: number = 0;
  lateCount: number = 0;
  
  // Today's date
  today: Date = new Date();
  
  // Selected data
  selectedAttendance: AttendanceData | null = null;
  showDetailsDialog: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollModuleService,
    private masterService: MastermoduleService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private _liveAnnouncer: LiveAnnouncer,
    private _dataService: DatasharingService
  ) {
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
    
    // Initialize form FIRST before any other operations
    this.initializeForm();
    
    if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
      this.loadInitialData();
    } else {
      this.getUserAccessRights(this.currentUser, 'Attendance Display');
    }
  }
  
  ngAfterViewInit(): void {
    // Set paginator and sort if they exist
    if (this.paginator && this.dataSource) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort && this.dataSource) {
      this.dataSource.sort = this.sort;
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this.masterService.getUserAccessRights(userName, screenName).subscribe(
      (data: any) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            // Ensure form is initialized before loading data
            if (!this.attendanceFilterForm) {
              this.initializeForm();
            }
            this.loadInitialData();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.showLoadingSpinner = false;
          }
        }
      },
      (error: any) => {
        this.handleErrors(error);
      }
    );
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
    this.isLoading = false;
  }
  
  private initializeForm(): void {
    this.attendanceFilterForm = this.fb.group({
      attendanceDate: [new Date(), Validators.required],
      branchCode: [''],
      clientCode: [''],
      employeeCode: [''],
      status: [''],
      employeeType: ['']
    });
  }

  /**
   * Calculate the first day of the month for a given date
   * This ensures the period matches what's stored in the .NET database
   * (attendance records are stored with first day of month as Period)
   */
  private getMonthStartPeriod(date: Date): string {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDay = new Date(year, month, 1);
    
    // Format as YYYY-MM-DD
    const year_str = firstDay.getFullYear();
    const month_str = String(firstDay.getMonth() + 1).padStart(2, '0');
    const day_str = String(firstDay.getDate()).padStart(2, '0');
    
    return `${year_str}-${month_str}-${day_str}`;
  }
  
  private loadInitialData(): void {
    this.isLoading = true;
    this.showLoadingSpinner = true;
    
    // Load branches and clients from API first, then load attendance data
    this.loadBranches();
    this.loadClients();
  }
  
  private loadBranches(): void {
    // Load branches based on user role
    if (this.currentUser === 'admin' || this.currentUser === 'superadmin') {
      // Admin gets all branches
      this.masterService.getBranchMasterList().subscribe(
        (data: any) => {
          this.branches = data || [];
          console.log('Loaded branches for admin:', this.branches);
          this.branchesLoaded = true;
          this.checkAllDataLoaded();
        },
        (error: any) => {
          console.error('Error loading branches:', error);
          this.branches = []; // Empty array if API fails
          this.branchesLoaded = true;
          this.checkAllDataLoaded();
        }
      );
    } else {
      // Regular users get branches assigned to them
      this.masterService.GetBranchListByUserName(this.currentUser).subscribe(
        (data: any) => {
          this.branches = data || [];
          console.log('Loaded branches for user:', this.currentUser, this.branches);
          this.branchesLoaded = true;
          this.checkAllDataLoaded();
        },
        (error: any) => {
          console.error('Error loading user branches:', error);
          this.branches = []; // Empty array if API fails
          this.branchesLoaded = true;
          this.checkAllDataLoaded();
        }
      );
    }
  }
  
  private loadClients(): void {
    // Load all clients for the client filter
    this.masterService.getClientMsterListByStatus('Active').subscribe(
      (data: any) => {
        this.clients = data || [];
        console.log('Loaded clients:', this.clients);
        this.clientsLoaded = true;
        this.checkAllDataLoaded();
      },
      (error: any) => {
        console.error('Error loading clients:', error);
        this.clients = []; // Empty array if API fails
        this.clientsLoaded = true;
        this.checkAllDataLoaded();
      }
    );
  }
  
  private checkAllDataLoaded(): void {
    // Only load attendance data when both branches and clients are loaded
    if (this.branchesLoaded && this.clientsLoaded) {
      this.loadAttendanceData();
    }
  }
  
  
  loadAttendanceData(): void {
    this.isLoading = true;
    this.showLoadingSpinner = true;
    
    // Ensure form exists before accessing its values
    if (!this.attendanceFilterForm) {
      console.error('Form not initialized');
      this.isLoading = false;
      this.showLoadingSpinner = false;
      return;
    }
    
    const filters = this.attendanceFilterForm.value;
    const selectedBranch = filters.branchCode;
    const selectedDate = filters.attendanceDate;
    
    console.log('Loading attendance data for branch:', selectedBranch || 'ALL', 'date:', selectedDate);
    
    // Check if selected date is today
    const today = new Date();
    const filterDate = new Date(selectedDate);
    today.setHours(0, 0, 0, 0);
    filterDate.setHours(0, 0, 0, 0);
    
    let attendanceObservable;
    let formattedDate: string;
    
    if (filterDate.getTime() === today.getTime()) {
      // Use today's attendance endpoint for today's date
      console.log('Using getTodayAttendanceList for today\'s date');
      attendanceObservable = this.payrollService.getTodayAttendanceList(selectedBranch || 'ALL');
    } else {
      // Use the new method for historical dates
      formattedDate = filterDate.getFullYear() + '-' + 
                      String(filterDate.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(filterDate.getDate()).padStart(2, '0'); // YYYY-MM-DD format (local timezone)
      console.log('Using getAttendanceByDate for date:', formattedDate);
      attendanceObservable = this.payrollService.getAttendanceByDate(formattedDate, selectedBranch || 'ALL');
    }
    
    attendanceObservable.pipe(
      tap(attendanceRecords => {
        console.log('Received attendance records:', attendanceRecords);
        if (filterDate.getTime() === today.getTime()) {
          this.transformTodayAttendanceData(attendanceRecords);
        } else {
          this.transformAttendanceData(attendanceRecords, formattedDate);
        }
      }),
      catchError(error => {
        console.error('Error loading attendance data:', error);
        this.snackBar.open('Failed to load attendance data', 'Error', { duration: 3000 });
        this.attendanceData = [];
        this.filteredAttendanceData = [];
        this.dataSource = new MatTableDataSource<AttendanceData>([]);
        this.isLoading = false;
        this.showLoadingSpinner = false;
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
        this.showLoadingSpinner = false;
      })
    ).subscribe();
  }

  private transformTodayAttendanceData(attendanceRecords: any[]): void {
    const attendanceDataList: AttendanceData[] = [];
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log('No attendance records found for today');
    } else {
      attendanceRecords.forEach((record: any, index: number) => {
        try {
          // Debug: Log the record structure to identify available fields for today's attendance
          console.log('Today\'s attendance record structure:', record);
          console.log('Available fields:', Object.keys(record));
          
          // Check for client-related fields specifically
          const clientFields = Object.keys(record).filter(key => 
            key.toLowerCase().includes('client') || 
            key.toLowerCase().includes('customer') ||
            key.toLowerCase().includes('company')
          );
          if (clientFields.length > 0) {
            console.log('🔍 Found client-related fields:', clientFields);
            clientFields.forEach(field => {
              console.log(`  ${field}: ${record[field]}`);
            });
          } else {
            console.log('🔍 No client-related fields found in attendance record');
          }
          
          // Transform the attendance record to our interface
          const transformedData: AttendanceData = {
            id: record.ID || record.id || index + 1,
            period: record.Period || new Date().toISOString(),
            attendanceDate: new Date().toISOString().split('T')[0], // Use today's date
            timeStart: record.TimeStart || null,
            timeEnd: record.TimeEnd || null,
            employeeId: record.EmployeeID || record.employeeId || 0,
            employeeName: record.EmployeeName || record.employeeName || 'Unknown',
            employeeCode: record.EmployeeCode || record.employeeCode || `EMP${index + 1}`,
            branch: record.Branch || record.branch || 'Unknown',
            branchName: record.BranchName || record.branchName || this.getBranchName(record.Branch || record.branch),
            // Try different possible client field names from API response
            clientName: record.ClientName || record.clientName || record.Client || record.client || record.CompanyName || record.companyName || 'Not Assigned',
            employeeType: record.EmployeeType || record.employeeType || 'Unknown',
            punchInTime: record.PunchInTime || '-',
            punchOutTime: record.PunchOutTime || '-',
            totalHours: record.TotalHours || 0,
            overtimeHours: record.OvertimeHours || 0,
            behavior: record.Behavior || 'Unknown',
            status: record.Status || 'Unknown',
            lastUpdate: record.LastUpdate ? new Date(record.LastUpdate).toISOString() : new Date().toISOString(),
            details: []
          };
          
          console.log('Transformed today\'s attendance data:', transformedData);
          attendanceDataList.push(transformedData);
        } catch (error) {
          console.error('Error transforming attendance record:', record, error);
        }
      });
    }
    
    this.attendanceData = attendanceDataList;
    this.applyFiltersInternal();
  }

  private transformAttendanceData(attendanceRecords: any[], attendanceDate: string): void {
    const attendanceDataList: AttendanceData[] = [];
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log('No attendance records found for date:', attendanceDate);
      this.attendanceData = attendanceDataList;
      this.applyFiltersInternal();
      return;
    }
    
    attendanceRecords.forEach((record: any, index: number) => {
      try {
        // Debug: Log the record structure to identify available fields for historical attendance
        console.log('Historical attendance record structure:', record);
        console.log('Available fields:', Object.keys(record));
        
        // Check for client-related fields specifically
        const clientFields = Object.keys(record).filter(key => 
          key.toLowerCase().includes('client') || 
          key.toLowerCase().includes('customer') ||
          key.toLowerCase().includes('company')
        );
        if (clientFields.length > 0) {
          console.log('🔍 Found client-related fields in historical:', clientFields);
          clientFields.forEach(field => {
            console.log(`  ${field}: ${record[field]}`);
          });
        } else {
          console.log('🔍 No client-related fields found in historical attendance record');
        }
        
        // Transform the attendance record to our interface
        const transformedData: AttendanceData = {
          id: record.ID || record.id || index + 1,
          period: attendanceDate, // Keep for compatibility but use attendance date
          attendanceDate: attendanceDate, // Use the requested date, not the database date
          timeStart: record.TimeStart || null,
          timeEnd: record.TimeEnd || null,
          employeeId: record.EmployeeID || record.employeeId || 0,
          employeeName: record.EmployeeName || record.employeeName || 'Unknown',
          employeeCode: record.EmployeeCode || record.employeeCode || `EMP${index + 1}`,
          branch: record.Branch || record.branch || 'Unknown',
          branchName: record.BranchName || record.branchName || this.getBranchName(record.Branch || record.branch),
          // Try different possible client field names from API response
          clientName: record.ClientName || record.clientName || record.Client || record.client || record.CompanyName || record.companyName || 'Not Assigned',
          employeeType: record.EmployeeType || record.employeeType || 'Unknown',
          punchInTime: record.PunchInTime || this.formatTime(record.TimeStart),
          punchOutTime: record.PunchOutTime || this.formatTime(record.TimeEnd),
          totalHours: record.TotalHours || this.calculateHours(record.TimeStart, record.TimeEnd),
          overtimeHours: record.OvertimeHours || 0,
          behavior: this.determineBehavior(record.PunchInTime || this.formatTime(record.TimeStart)),
          status: record.Status || this.determineStatus(record),
          lastUpdate: record.LastUpdate ? new Date(record.LastUpdate).toISOString() : new Date().toISOString(),
          details: record.AttendanceDetails || []
        };
        
        console.log('Transformed attendance data:', transformedData);
        attendanceDataList.push(transformedData);
      } catch (error) {
        console.error('Error transforming attendance record:', record, error);
      }
    });
    
    this.attendanceData = attendanceDataList;
    this.applyFiltersInternal();
  }

  private formatTime(timeString: any): string {
    if (!timeString) return '-';
    
    try {
      const time = new Date(timeString);
      return time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '-';
    }
  }

  private determineStatus(record: any): string {
    // Determine status based on the attendance record
    if (record.TimeStart && record.TimeEnd) {
      return 'Present';
    } else if (record.TimeStart && !record.TimeEnd) {
      return 'In Progress';
    } else if (!record.TimeStart && !record.TimeEnd) {
      return 'Absent';
    } else {
      return 'Unknown';
    }
  }

  private determineBehavior(punchInTime: string): string {
    if (!punchInTime || punchInTime === '-') return 'unknown';
    
    try {
      // Parse "hh:mm AM/PM" format safely
      const isPM = punchInTime.toLowerCase().includes('pm');
      const parts = punchInTime.replace(/am|pm/i, '').trim().split(':');
      
      if (parts.length < 2) return 'regular';
      
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      
      if (isNaN(hours) || isNaN(minutes)) return 'regular';
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      // Early: <= 8:30 AM
      if (hours < 8 || (hours === 8 && minutes <= 30)) return 'early';
      
      // Late: > 9:00 AM
      if (hours > 9 || (hours === 9 && minutes > 0)) return 'late';
      
      return 'regular';
    } catch {
      return 'regular';
    }
  }

  private calculateHours(startTime: any, endTime: any): number {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.round(hours * 100) / 100; // Round to 2 decimal places
    } catch {
      return 0;
    }
  }

  private getBranchName(branchCode: string): string {
    if (!branchCode || branchCode === 'Unknown') {
      return 'Unknown';
    }
    
    const branch = this.branches.find(b => b.Code === branchCode);
    return branch ? branch.Name : branchCode;
  }

  private applyFiltersInternal(): void {
    // Ensure form exists before accessing its values
    if (!this.attendanceFilterForm) {
      console.error('Form not initialized in applyFiltersInternal');
      return;
    }
    
    const filters = this.attendanceFilterForm.value;
    console.log('🔍 Applying filters:', filters);
    console.log('🔍 Total attendance records before filtering:', this.attendanceData.length);
    
    // Apply filters to the attendance data
    let filteredData = this.attendanceData.filter(attendance => {
      // Date filter is no longer needed here since we load data from server based on date
      
      // Branch filter
      if (filters.branchCode && attendance.branch) {
        const filterBranch = filters.branchCode.toString().trim().toLowerCase();
        const attendanceBranch = attendance.branch.toString().trim().toLowerCase();
        if (attendanceBranch !== filterBranch) {
          return false;
        }
      }
      
      // Client filter
      if (filters.clientCode && attendance.clientName) {
        const filterClient = filters.clientCode.toString().trim().toLowerCase();
        const attendanceClient = attendance.clientName.toString().trim().toLowerCase();
        if (!attendanceClient.includes(filterClient)) {
          return false;
        }
      }
      
      // Employee filter
      if (filters.employeeCode && attendance.employeeCode) {
        const filterEmployee = filters.employeeCode.toString().trim().toLowerCase();
        const attendanceEmployee = attendance.employeeCode.toString().trim().toLowerCase();
        if (!attendanceEmployee.includes(filterEmployee)) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && attendance.status) {
        const filterStatus = filters.status.toString().trim().toLowerCase();
        const attendanceStatus = attendance.status.toString().trim().toLowerCase();
        if (attendanceStatus !== filterStatus) {
          return false;
        }
      }
      
      // Employee type filter (if implemented)
      if (filters.employeeType && attendance.employeeType) {
        const filterEmpType = filters.employeeType.toString().trim().toLowerCase();
        const attendanceEmpType = attendance.employeeType.toString().trim().toLowerCase();
        if (attendanceEmpType !== filterEmpType) {
          return false;
        }
      }
      
      return true;
    });
    
    this.filteredAttendanceData = filteredData;
    console.log('Filtered attendance records:', this.filteredAttendanceData.length, 'from', this.attendanceData.length, 'total');
    
    this.dataSource = new MatTableDataSource<AttendanceData>(this.filteredAttendanceData);
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    this.totalRecords = this.filteredAttendanceData.length;
    this.calculateStatistics();
  }
  
  private calculateStatistics(): void {
    this.totalEmployees = this.filteredAttendanceData.length;
    this.totalHours = this.filteredAttendanceData.reduce((sum, att) => sum + att.totalHours, 0);
    this.totalOvertime = this.filteredAttendanceData.reduce((sum, att) => sum + att.overtimeHours, 0);
    
    this.presentCount = this.filteredAttendanceData.filter(att => att.status === 'Present').length;
    this.absentCount = this.filteredAttendanceData.filter(att => att.status === 'Absent').length;
    this.lateCount = this.filteredAttendanceData.filter(att => att.behavior === 'late').length;
  }
  
  applyFilters(): void {
    // Ensure form exists before accessing its values
    if (!this.attendanceFilterForm) {
      console.error('Form not initialized in applyFilters');
      return;
    }
    
    const filters = this.attendanceFilterForm.value;
    
    console.log('Applying filters:', filters);
    
    // For branch or date changes, reload data from server
    // For other filters (client, employee code, status, employee type), apply client-side filtering
    const previousFilters = this.previousFilters || {};
    const branchChanged = previousFilters.branchCode !== filters.branchCode;
    const dateChanged = previousFilters.attendanceDate?.getTime() !== filters.attendanceDate?.getTime();
    
    // Store current filters for comparison
    this.previousFilters = { ...filters };
    
    if (branchChanged || dateChanged || this.attendanceData.length === 0) {
      // Reload data from server for new branch or date
      console.log('Reloading data from server - branch changed:', branchChanged, 'date changed:', dateChanged);
      this.loadAttendanceData();
    } else {
      // Apply client-side filters for other filter changes
      console.log('Applying client-side filters');
      this.applyFiltersInternal();
    }
  }
  
  clearFilters(): void {
    const today = new Date();
    
    // Ensure form exists before resetting
    if (!this.attendanceFilterForm) {
      console.error('Form not initialized in clearFilters');
      this.initializeForm();
    }
    
    // Reset previous filters
    this.previousFilters = {};
    
    this.attendanceFilterForm.reset({
      attendanceDate: today,
      branchCode: '',
      clientCode: '', // Add client filter reset
      employeeCode: '',
      status: '',
      employeeType: ''
    });
    this.loadAttendanceData();
  }
  
  exportAttendanceData(): void {
    // Use current filtered data, or all data if no filters applied
    const dataToExport = this.filteredAttendanceData.length > 0 ? this.filteredAttendanceData : this.attendanceData;
    
    if (dataToExport.length === 0) {
      this.snackBar.open('No data available to export', 'Warning', { duration: 3000 });
      return;
    }
    
    const csvContent = this.convertToCSV(dataToExport);
    const filename = this.generateExportFilename();
    this.downloadCSV(csvContent, filename);
    
    this.snackBar.open(`Exported ${dataToExport.length} records successfully`, 'Success', { duration: 3000 });
  }
  
  private convertToCSV(data: AttendanceData[]): string {
    if (!data || data.length === 0) {
      return '';
    }
    
    const headers = [
      'ID',
      'Employee Code',
      'Employee Name',
      'Client Name',
      'Branch Code',
      'Branch Name',
      'Attendance Date',
      'Punch In',
      'Punch Out',
      'Total Hours',
      'Overtime Hours',
      'Behavior',
      'Status',
      'Last Update'
    ];
    
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const csvRow = [
        row.id,
        `"${row.employeeCode}"`,
        `"${row.employeeName}"`,
        `"${row.clientName}"`,
        `"${row.branch}"`,
        `"${row.branchName}"`,
        `"${row.attendanceDate}"`,
        `"${row.punchInTime}"`,
        `"${row.punchOutTime}"`,
        row.totalHours || 0,
        row.overtimeHours || 0,
        `"${row.behavior}"`,
        `"${row.status}"`,
        `"${row.lastUpdate}"`
      ];
      csvRows.push(csvRow.join(','));
    });
    
    // Add summary row at the end
    if (data.length > 0) {
      const summaryRow = [
        '',
        '',
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        '',
        data.reduce((sum, att) => sum + (att.totalHours || 0), 0).toFixed(2),
        data.reduce((sum, att) => sum + (att.overtimeHours || 0), 0).toFixed(2),
        '',
        '',
        ''
      ];
      csvRows.push(summaryRow.join(','));
    }
    
    return csvRows.join('\n');
  }
  
  private downloadCSV(csvContent: string, filename: string): void {
    try {
      const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      this.snackBar.open('Failed to export data', 'Error', { duration: 3000 });
    }
  }
  
  private generateExportFilename(): string {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    return `attendance_export_${dateStr}_${timeStr}.csv`;
  }
  
  viewAttendanceDetails(attendance: AttendanceData): void {
    this.selectedAttendance = attendance;
    this.showDetailsDialog = true;
  }
  
  closeDetailsDialog(): void {
    this.showDetailsDialog = false;
    this.selectedAttendance = null;
  }
  
  refreshData(): void {
    this.loadAttendanceData();
  }
  
  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.attendanceFilterForm.patchValue({
        attendanceDate: event.value
      });
      // Apply filters instead of reloading data since we now filter by date on client side
      this.applyFilters();
    }
  }
  
  // Table row action methods
  editAttendance(attendance: AttendanceData): void {
    // Navigate to edit page or open edit dialog
    this.router.navigate(['/payroll/attendance/edit', attendance.id]);
  }
  
  deleteAttendance(attendance: AttendanceData): void {
    const dialogRef = this.dialog.open(DialogConfirmationComponent, {
      width: '350px',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete attendance record for ${attendance.employeeName}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.payrollService.deleteAttendance(attendance.id).pipe(
          tap(() => {
            this.snackBar.open('Attendance record deleted successfully', 'Success', { duration: 3000 });
            this.loadAttendanceData();
          }),
          catchError(error => {
            console.error('Error deleting attendance:', error);
            this.snackBar.open('Failed to delete attendance record', 'Error', { duration: 3000 });
            return of(null);
          })
        ).subscribe();
      }
    });
  }
  
  // Search functionality
  applySearch(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredAttendanceData = [...this.attendanceData];
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      this.filteredAttendanceData = this.attendanceData.filter(attendance =>
        (attendance.employeeName && attendance.employeeName.toLowerCase().includes(lowerSearchTerm)) ||
        (attendance.employeeCode && attendance.employeeCode.toLowerCase().includes(lowerSearchTerm)) ||
        (attendance.branch && attendance.branch.toLowerCase().includes(lowerSearchTerm)) ||
        (attendance.branchName && attendance.branchName.toLowerCase().includes(lowerSearchTerm)) ||
        (attendance.clientName && attendance.clientName.toLowerCase().includes(lowerSearchTerm)) ||
        (attendance.status && attendance.status.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    this.dataSource = new MatTableDataSource<AttendanceData>(this.filteredAttendanceData);
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    this.totalRecords = this.filteredAttendanceData.length;
    this.calculateStatistics();
  }

  // Helper methods for CSS classes
  getHoursClass(hours: number): string {
    if (hours < 4) return 'bg-danger';
    if (hours > 10) return 'bg-warning';
    return 'bg-success';
  }

  getOvertimeClass(hours: number): string {
    if (hours === 0) return 'bg-secondary';
    if (hours < 2) return 'bg-info';
    return 'bg-warning';
  }

  getBehaviorClass(behavior: string): string {
    switch (behavior.toLowerCase()) {
      case 'regular': return 'bg-success';
      case 'early': return 'bg-info';
      case 'late': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'present': return 'bg-success';
      case 'absent': return 'bg-danger';
      case 'late': return 'bg-warning';
      case 'on leave': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  calculateDuration(startTime: Date | null | undefined, endTime: Date | null | undefined): string {
    if (!startTime || !endTime) {
      return 'N/A';
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  }
}
