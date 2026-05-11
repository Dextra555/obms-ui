import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { DatePipe } from '@angular/common';

export interface BulkUploadResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: BulkUploadError[];
  successRecords: BulkUploadSuccess[];
}

export interface BulkUploadError {
  rowNumber: number;
  employeeCode: string;
  employeeName: string;
  errorMessage: string;
  fieldName?: string;
}

export interface BulkUploadSuccess {
  rowNumber: number;
  employeeCode: string;
  employeeName: string;
  attendanceID: number;
  message: string;
}

@Component({
  selector: 'app-bulk-attendance-upload',
  templateUrl: './bulk-attendance-upload.component.html',
  styleUrls: ['./bulk-attendance-upload.component.css']
})
export class BulkAttendanceUploadComponent implements OnInit {
  uploadForm!: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadResult: BulkUploadResult | null = null;
  branches: any[] = [];
  errorMessage: string = '';
  errorDisplayedColumns: string[] = ['rowNumber', 'employeeCode', 'employeeName', 'errorMessage'];
  successDisplayedColumns: string[] = ['rowNumber', 'employeeCode', 'employeeName', 'attendanceID', 'message'];
  currentUser: string = 'admin'; // TODO: Get from auth service
  attendanceCodes = ['P', 'W/O', 'H', 'L', 'NH'];
  attendanceCodeDescriptions = {
    'P': 'Present - Regular working day',
    'W/O': 'Weekly Off - Non-working day',
    'H': 'Holiday - Public holiday',
    'L': 'Leave - Any type of leave',
    'NH': 'National Holiday - National festival holiday'
  };

  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollModuleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadBranches();
  }

  private initializeForm(): void {
    this.uploadForm = this.fb.group({
      period: [new Date(), Validators.required],
      branchCode: ['', Validators.required]
    });
  }

  private loadBranches(): void {
    // Load branches from service
    this.payrollService.getBranchList().subscribe({
      next: (branches: any[]) => {
        this.branches = branches;
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
        this.snackBar.open('Error loading branches', 'Close', { duration: 3000 });
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.xlsx')) {
        this.snackBar.open('Please select an Excel file (.xlsx)', 'Close', { duration: 3000 });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('File size must be less than 10MB', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFile = file;
      this.uploadResult = null;
    }
  }

  downloadTemplate(): void {
    if (this.uploadForm.invalid) {
      this.snackBar.open('Please select period and branch', 'Close', { duration: 3000 });
      return;
    }

    const period = this.uploadForm.get('period')?.value;
    const branchCode = this.uploadForm.get('branchCode')?.value;
    const formattedPeriod = this.datePipe.transform(period, 'MMM-yy');

    this.payrollService.downloadSimplifiedAttendanceTemplate(period, branchCode).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Attendance_Template_${formattedPeriod}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Simplified template downloaded successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error downloading template:', error);
        this.snackBar.open('Error downloading template', 'Close', { duration: 3000 });
      }
    });
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a file to upload', 'Close', { duration: 3000 });
      return;
    }

    if (this.uploadForm.invalid) {
      this.snackBar.open('Please select period and branch', 'Close', { duration: 3000 });
      return;
    }

    this.isUploading = true;
    this.uploadResult = null;

    this.payrollService.uploadSimplifiedAttendance(this.selectedFile, this.currentUser).subscribe({
      next: (result: BulkUploadResult) => {
        this.uploadResult = result;
        this.isUploading = false;

        if (result.success) {
          this.snackBar.open(
            `Upload completed: ${result.successfulRecords} successful, ${result.failedRecords} failed`,
            'Close',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open('Upload completed with errors', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.isUploading = false;
        this.snackBar.open('Error uploading file: ' + (error.error?.message || error.message), 'Close', { duration: 5000 });
      }
    });
  }

  exportData(): void {
    // Export functionality not yet implemented for simplified format
    this.snackBar.open('Export feature coming soon for simplified format', 'Close', { duration: 3000 });
  }

  validateData(): void {
    // Validation functionality not yet implemented for simplified format
    this.snackBar.open('Validation feature coming soon for simplified format', 'Close', { duration: 3000 });
  }

  clearForm(): void {
    this.uploadForm.reset({
      period: new Date(),
      branchCode: ''
    });
    this.selectedFile = null;
    this.uploadResult = null;

    // Clear file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getAttendanceCodeColor(code: string): string {
    const colors: { [key: string]: string } = {
      'P': 'primary',
      'W/O': 'accent',
      'H': 'warn',
      'L': 'warn',
      'NH': 'primary'
    };
    return colors[code] || 'primary';
  }

  getAttendanceCodeDescription(code: string): string {
    return this.attendanceCodeDescriptions[code as keyof typeof this.attendanceCodeDescriptions] || '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  showInstructions(): void {
    const instructions = `
SIMPLIFIED ATTENDANCE BULK UPLOAD INSTRUCTIONS:

1. Download Template:
   - Select period (month/year) and branch
   - Click "Download Template" to get the Excel template
   - The template will have columns for each day of the month

2. Fill Template:
   - Name of Contraction: Employee name
   - Unit: Unit/Department
   - Designation: Employee designation
   - Employee Code: Must exist in the system
   - Branch Code: Must match selected branch
   - Period: Attendance period (auto-filled from selection)

3. Attendance Codes (Simplified Format):
   - P = Present (Regular working day)
   - W/O = Weekly Off (Non-working day)
   - H = Holiday (Public holiday)
   - L = Leave (Any type of leave)
   - NH = National Holiday (National festival holiday)

4. Filling Daily Attendance:
   - For each day column (1-31), enter one of the codes: P, W/O, H, L, NH
   - Leave cells empty for non-working days
   - Example: Enter 'P' for present, 'W/O' for weekly off

5. Summary Columns:
   - Duty = Count of 'P' codes
   - W/O = Count of 'W/O' codes
   - NH/H = Count of 'H' and 'NH' codes
   - L = Count of 'L' codes
   - Total = Sum of all codes

6. Upload:
   - Select filled Excel file
   - Click "Upload File" to process
   - Review results for any errors

IMPORTANT NOTES:
- Use only the codes: P, W/O, H, L, NH
- Employee codes must exist in the system
- Branch must match your selection
- The system will automatically calculate summary columns
- Check error messages for failed records

TIPS:
- Save frequently while filling the template
- Verify employee codes before uploading
- Use the dropdown in Excel to select valid codes
- Review error messages for any failed uploads
    `;

    this.dialog.open(BulkUploadInstructionsDialogComponent, {
      width: '650px',
      data: { instructions }
    });
  }
}

@Component({
  selector: 'app-bulk-upload-instructions-dialog',
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Upload Instructions</h2>
      <mat-dialog-content>
        <pre>{{ data.instructions }}</pre>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
    }
    pre {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.4;
    }
  `]
})
export class BulkUploadInstructionsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { instructions: string }) { }
}
