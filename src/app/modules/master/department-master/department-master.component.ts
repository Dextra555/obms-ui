import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DepartmentService, Department } from '../../../service/department.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-department-master',
  templateUrl: './department-master.component.html',
  styleUrls: ['./department-master.component.css']
})
export class DepartmentMasterComponent implements OnInit {
  departments: Department[] = [];
  dataSource!: MatTableDataSource<Department>;
  displayedColumns: string[] = ['DepartmentId', 'DepartmentCode', 'DepartmentName', 'Description', 'IsActive', 'action'];
  
  frm!: FormGroup;
  isEdit: boolean = false;
  currentDepartmentId: number = 0;
  showForm: boolean = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private departmentService: DepartmentService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  initializeForm(): void {
    this.frm = this.fb.group({
      DepartmentId: [0],
      DepartmentCode: ['', [Validators.required, Validators.maxLength(100)]],
      DepartmentName: ['', [Validators.required, Validators.maxLength(200)]],
      Description: ['', Validators.maxLength(500)],
      IsActive: [true]
    });
  }

  loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (data) => {
        this.departments = data;
        this.dataSource = new MatTableDataSource(this.departments);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.showMessage('Error loading departments', 'error');
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onNew(): void {
    this.isEdit = false;
    this.currentDepartmentId = 0;
    this.frm.reset({
      DepartmentId: 0,
      DepartmentCode: '',
      DepartmentName: '',
      Description: '',
      IsActive: true
    });
    this.showForm = true;
  }

  onEdit(department: Department): void {
    this.isEdit = true;
    this.currentDepartmentId = department.DepartmentId;
    this.frm.patchValue({
      DepartmentId: department.DepartmentId,
      DepartmentCode: department.DepartmentCode,
      DepartmentName: department.DepartmentName,
      Description: department.Description || '',
      IsActive: department.IsActive
    });
    this.showForm = true;
  }

  onSave(): void {
    if (this.frm.invalid) {
      this.showMessage('Please fill in all required fields', 'warning');
      return;
    }

    const department: Department = this.frm.value;
    department.DepartmentId = this.currentDepartmentId;

    if (this.isEdit) {
      this.departmentService.update(this.currentDepartmentId, department).subscribe({
        next: () => {
          this.showMessage('Department updated successfully', 'success');
          this.loadDepartments();
          this.showForm = false;
        },
        error: (error) => {
          console.error('Error updating department:', error);
          this.showMessage('Error updating department: ' + (error.error || error.message), 'error');
        }
      });
    } else {
      this.departmentService.create(department).subscribe({
        next: () => {
          this.showMessage('Department created successfully', 'success');
          this.loadDepartments();
          this.showForm = false;
        },
        error: (error) => {
          console.error('Error creating department:', error);
          this.showMessage('Error creating department: ' + (error.error || error.message), 'error');
        }
      });
    }
  }

  onDelete(department: Department): void {
    Swal.fire({
      title: 'Confirm Delete',
      text: `Are you sure you want to delete department "${department.DepartmentName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.departmentService.delete(department.DepartmentId).subscribe({
          next: () => {
            this.showMessage('Department deleted successfully', 'success');
            this.loadDepartments();
          },
          error: (error) => {
            console.error('Error deleting department:', error);
            this.showMessage('Error deleting department: ' + (error.error || error.message), 'error');
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
