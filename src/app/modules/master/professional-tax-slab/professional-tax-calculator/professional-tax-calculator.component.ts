import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { IndianStatutoryService } from 'src/app/service/indian-statutory.service';
import { ProfessionalTaxCalculationRequest, ProfessionalTaxCalculationResponse } from 'src/app/model/professionalTaxModel';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-professional-tax-calculator',
  templateUrl: './professional-tax-calculator.component.html',
  styleUrls: ['./professional-tax-calculator.component.css']
})
export class ProfessionalTaxCalculatorComponent implements OnInit {

  calculatorForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  calculationResult: ProfessionalTaxCalculationResponse | null = null;
  states: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry', 'Chandigarh'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProfessionalTaxCalculatorComponent>,
    private _statutoryService: IndianStatutoryService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.calculatorForm = this.fb.group({
      grossSalary: [0, [Validators.required, Validators.min(0)]],
      state: ['', Validators.required],
      calculationDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  calculateTax(): void {
    if (this.calculatorForm.invalid) {
      this.markFormGroupTouched(this.calculatorForm);
      return;
    }

    this.showLoadingSpinner = true;
    const formData = this.calculatorForm.value;

    const request: ProfessionalTaxCalculationRequest = {
      grossSalary: formData.grossSalary,
      state: formData.state,
      calculationDate: formData.calculationDate
    };

    this._statutoryService.calculateProfessionalTaxByQuery(
      request.grossSalary,
      request.state,
      request.calculationDate
    ).subscribe({
      next: (result) => {
        this.calculationResult = result;
        this.showLoadingSpinner = false;
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Calculation Error',
          text: 'Failed to calculate professional tax',
          confirmButtonColor: '#d33'
        });
        this.showLoadingSpinner = false;
        console.error('Error:', error);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
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
    const control = this.calculatorForm.get(field);
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }
}
