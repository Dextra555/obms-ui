import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EmployeeService } from '../../../../service/employee.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

interface ImportResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: any[];
  successfulEmployees: any[];
}

interface PreviewResult {
  ValidRecords: any[];
  ValidationErrors: any[];
  TotalRecords: number;
  ValidCount: number;
  InvalidCount: number;
}

@Component({
  selector: 'app-employee-import-dialog',
  templateUrl: './employee-import-dialog.component.html',
  styleUrls: ['./employee-import-dialog.component.css']
})
export class EmployeeImportDialogComponent implements OnInit {
  selectedFile: File | null = null;
  isDragging = false;
  currentStep: 'upload' | 'preview' | 'importing' | 'result' = 'upload';
  
  previewData: PreviewResult | null = null;
  importResult: ImportResult | null = null;
  
  updateExisting = false;
  isProcessing = false;
  
  // For progress simulation
  progressValue = 0;
  progressMessage = '';

  constructor(
    public dialogRef: MatDialogRef<EmployeeImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type) && 
        !file.name.endsWith('.xlsx') && 
        !file.name.endsWith('.xls')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please upload a valid Excel file (.xlsx or .xls)'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'File size should not exceed 5MB'
      });
      return;
    }

    this.selectedFile = file;
    this.uploadFile();
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.progressMessage = 'Uploading and validating file...';
    this.progressValue = 30;

    this.employeeService.previewExcelImport(this.selectedFile).subscribe({
      next: (result: any) => {
        console.log('=== FRONTEND DEBUG ===');
        console.log('API Response:', result);
        console.log('Response keys:', Object.keys(result || {}));
        console.log('ValidCount:', result?.ValidCount);
        console.log('ValidRecords length:', result?.ValidRecords?.length);
        console.log('InvalidCount:', result?.InvalidCount);
        console.log('Full response JSON:', JSON.stringify(result, null, 2));
        console.log('====================');
        
        this.previewData = result;
        this.progressValue = 100;
        this.isProcessing = false;
        
        if (this.previewData && this.previewData.ValidCount > 0) {
          this.currentStep = 'preview';
        } else if (this.previewData && this.previewData.InvalidCount > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Validation Failed',
            text: `Found ${this.previewData.InvalidCount} errors in the file. Please fix and try again.`
          });
          this.currentStep = 'preview';
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'No Valid Records',
            text: 'No valid employee records found in the file.'
          });
          this.resetUpload();
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.progressValue = 0;
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: error.error?.message || 'Failed to process the file. Please try again.'
        });
      }
    });
  }

  importEmployees(): void {
    if (!this.previewData || this.previewData.ValidRecords.length === 0) return;

    this.currentStep = 'importing';
    this.isProcessing = true;
    this.progressValue = 0;
    this.progressMessage = 'Preparing import...';

    const request = {
      employees: this.previewData.ValidRecords,
      updateExisting: this.updateExisting,
      importedBy: sessionStorage.getItem('username') || 'admin'
    };

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (this.progressValue < 80) {
        this.progressValue += 5;
        this.progressMessage = `Importing ${this.progressValue}%...`;
      }
    }, 200);

    console.log('=== FRONTEND IMPORT DEBUG ===');
        console.log('Sending bulk import request:', request);
        console.log('Number of employees to import:', request.employees.length);
        console.log('============================');
        
        this.employeeService.bulkImportEmployees(request).subscribe({
      next: (result: any) => {
        console.log('=== FRONTEND IMPORT RESULT ===');
        console.log('Import result:', result);
        console.log('Successful imports:', result.successfulImports);
        console.log('Failed imports:', result.failedImports);
        console.log('============================');
        
        clearInterval(progressInterval);
        this.importResult = result;
        this.progressValue = 100;
        this.progressMessage = 'Import completed!';
        this.isProcessing = false;
        this.currentStep = 'result';

        // Show success notification
        if (result.successfulImports > 0) {
          this.snackBar.open(
            `Successfully imported ${result.successfulImports} employees`,
            'Close',
            { duration: 5000 }
          );
        }
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isProcessing = false;
        Swal.fire({
          icon: 'error',
          title: 'Import Failed',
          text: error.error?.message || 'Failed to import employees. Please try again.'
        });
        this.currentStep = 'preview';
      }
    });
  }

  downloadTemplate(): void {
    this.employeeService.downloadImportTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Employee_Import_Template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Template downloaded successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Failed to download template. Please try again.'
        });
      }
    });
  }

  resetUpload(): void {
    this.selectedFile = null;
    this.previewData = null;
    this.importResult = null;
    this.currentStep = 'upload';
    this.progressValue = 0;
    this.progressMessage = '';
    this.updateExisting = false;
  }

  closeDialog(refresh: boolean = false): void {
    this.dialogRef.close(refresh);
  }

  getErrorIcon(fieldName: string): string {
    const iconMap: { [key: string]: string } = {
      'EMP_CODE': 'badge',
      'EMP_NAME': 'person',
      'EMP_ROLE': 'work',
      'EMP_BRANCH_CODE': 'location_on',
      'EMP_SEX': 'wc',
      'AadhaarNumber': 'fingerprint',
      'PANNumber': 'credit_card',
      'BankIFSC': 'account_balance',
      'General': 'error'
    };
    return iconMap[fieldName] || 'error';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
