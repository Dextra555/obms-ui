import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DesignationService, Designation } from '../../../service/designation.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-designation-master',
  templateUrl: './designation-master.component.html',
  styleUrls: ['./designation-master.component.css']
})
export class DesignationMasterComponent implements OnInit {
  designations: Designation[] = [];
  dataSource!: MatTableDataSource<Designation>;
  displayedColumns: string[] = ['DesignationId', 'DesignationCode', 'DesignationName', 'Description', 'IsActive', 'action'];
  
  frm!: FormGroup;
  isEdit: boolean = false;
  currentDesignationId: number = 0;
  showForm: boolean = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private designationService: DesignationService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadDesignations();
  }

  initializeForm(): void {
    this.frm = this.fb.group({
      DesignationId: [0],
      DesignationCode: ['', [Validators.required, Validators.maxLength(100)]],
      DesignationName: ['', [Validators.required, Validators.maxLength(200)]],
      Description: ['', Validators.maxLength(500)],
      IsActive: [true]
    });
  }

  loadDesignations(): void {
    this.designationService.getAll().subscribe({
      next: (data) => {
        this.designations = data;
        this.dataSource = new MatTableDataSource(this.designations);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (error) => {
        console.error('Error loading designations:', error);
        this.showMessage('Error loading designations', 'error');
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onNew(): void {
    this.isEdit = false;
    this.currentDesignationId = 0;
    this.frm.reset({
      DesignationId: 0,
      DesignationCode: '',
      DesignationName: '',
      Description: '',
      IsActive: true
    });
    this.showForm = true;
  }

  onEdit(designation: Designation): void {
    this.isEdit = true;
    this.currentDesignationId = designation.DesignationId;
    this.frm.patchValue({
      DesignationId: designation.DesignationId,
      DesignationCode: designation.DesignationCode,
      DesignationName: designation.DesignationName,
      Description: designation.Description || '',
      IsActive: designation.IsActive
    });
    this.showForm = true;
  }

  onSave(): void {
    if (this.frm.invalid) {
      this.showMessage('Please fill in all required fields', 'warning');
      return;
    }

    const designation: Designation = this.frm.value;
    designation.DesignationId = this.currentDesignationId;

    if (this.isEdit) {
      this.designationService.update(this.currentDesignationId, designation).subscribe({
        next: () => {
          this.showMessage('Designation updated successfully', 'success');
          this.loadDesignations();
          this.showForm = false;
        },
        error: (error) => {
          console.error('Error updating designation:', error);
          this.showMessage('Error updating designation: ' + (error.error || error.message), 'error');
        }
      });
    } else {
      this.designationService.create(designation).subscribe({
        next: () => {
          this.showMessage('Designation created successfully', 'success');
          this.loadDesignations();
          this.showForm = false;
        },
        error: (error) => {
          console.error('Error creating designation:', error);
          this.showMessage('Error creating designation: ' + (error.error || error.message), 'error');
        }
      });
    }
  }

  onDelete(designation: Designation): void {
    Swal.fire({
      title: 'Confirm Delete',
      text: `Are you sure you want to delete designation "${designation.DesignationName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.designationService.delete(designation.DesignationId).subscribe({
          next: () => {
            this.showMessage('Designation deleted successfully', 'success');
            this.loadDesignations();
          },
          error: (error) => {
            console.error('Error deleting designation:', error);
            this.showMessage('Error deleting designation: ' + (error.error || error.message), 'error');
          }
        });
      }
    });
  }

  onCancel(): void {
    this.showForm = false;
    this.frm.reset();
  }

  showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    Swal.fire({
      text: message,
      icon: type,
      timer: 3000,
      showConfirmButton: false
    });
  }
}
