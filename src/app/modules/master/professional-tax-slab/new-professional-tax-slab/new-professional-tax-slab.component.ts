import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IndianStatutoryService } from 'src/app/service/indian-statutory.service';
import { ProfessionalTaxModel } from 'src/app/model/professionalTaxModel';
import Swal from 'sweetalert2';

export interface DialogData {
  mode: 'add' | 'edit';
  data?: ProfessionalTaxModel;
}

@Component({
  selector: 'app-new-professional-tax-slab',
  templateUrl: './new-professional-tax-slab.component.html',
  styleUrls: ['./new-professional-tax-slab.component.css']
})
export class NewProfessionalTaxSlabComponent implements OnInit {

  professionalTaxForm!: FormGroup;
  isEditMode: boolean = false;
  showLoadingSpinner: boolean = false;
  states: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry', 'Chandigarh'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<NewProfessionalTaxSlabComponent>,
    private _statutoryService: IndianStatutoryService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {
    this.isEditMode = this.data.mode === 'edit';
    this.initializeForm();
    
    if (this.isEditMode && this.data.data) {
      this.populateForm(this.data.data);
    }
  }

  initializeForm(): void {
    this.professionalTaxForm = this.fb.group({
      state: ['', Validators.required],
      minSalary: [0, [Validators.required, Validators.min(0)]],
      maxSalary: [null, [Validators.min(0)]],
      taxAmount: [0, [Validators.required, Validators.min(0)]],
      effectiveDate: [new Date().toISOString().split('T')[0], Validators.required],
      isActive: [true]
    });
  }

  populateForm(data: ProfessionalTaxModel): void {
    this.professionalTaxForm.patchValue({
      state: data.state,
      minSalary: data.minSalary,
      maxSalary: data.maxSalary,
      taxAmount: data.taxAmount,
      effectiveDate: new Date(data.effectiveDate).toISOString().split('T')[0],
      isActive: data.isActive
    });
  }

  onSubmit(): void {
    if (this.professionalTaxForm.invalid) {
      this.markFormGroupTouched(this.professionalTaxForm);
      return;
    }

    this.showLoadingSpinner = true;
    const formData = this.professionalTaxForm.value;

    const professionalTaxData: ProfessionalTaxModel = {
      ...formData,
      effectiveDate: new Date(formData.effectiveDate).toISOString()
    };

    if (this.isEditMode) {
      professionalTaxData.id = this.data.data!.id;
      this.updateProfessionalTax(professionalTaxData);
    } else {
      this.saveProfessionalTax(professionalTaxData);
    }
  }

  saveProfessionalTax(data: ProfessionalTaxModel): void {
    this._statutoryService.savePTConfiguration(data).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Professional tax slab created successfully',
          showConfirmButton: false,
          timer: 1500
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create professional tax slab',
          confirmButtonColor: '#d33'
        });
        this.showLoadingSpinner = false;
        console.error('Error:', error);
      }
    });
  }

  updateProfessionalTax(data: ProfessionalTaxModel): void {
    this._statutoryService.updatePTConfiguration(data.id!, data).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Professional tax slab updated successfully',
          showConfirmButton: false,
          timer: 1500
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update professional tax slab',
          confirmButtonColor: '#d33'
        });
        this.showLoadingSpinner = false;
        console.error('Error:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.professionalTaxForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
      if (control.errors['min']) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} must be greater than or equal to 0`;
      }
    }
    return '';
  }
}
