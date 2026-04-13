import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, Subject } from 'rxjs';

export interface CommercialBreakdownData {
  Basic?: number;
  DA?: number;
  HRA?: number;
  HRAPercentage?: number;
  OtherAllowances?: number;
  CB_NH?: number;
  CB_NHPercentage?: number;
}

@Component({
  selector: 'app-commercial-breakdown-enhanced-dialog',
  templateUrl: './commercial-breakdown-enhanced-dialog.component.html',
  styleUrls: ['./commercial-breakdown-enhanced-dialog.component.scss']
})
export class CommercialBreakdownEnhancedDialogComponent implements OnInit {
  frm!: FormGroup;

  // Man Power Cost Calculations
  get subTotal() {
    return (this.frm.get('Basic')?.value || 0) +
      (this.frm.get('DA')?.value || 0) +
      (this.frm.get('HRA')?.value || 0) +
      (this.frm.get('OtherAllowances')?.value || 0) +
      (this.frm.get('CB_NH')?.value || 0);
  }

  // Debounce subject for calculatePercentages
  private calculationSubject = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CommercialBreakdownEnhancedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CommercialBreakdownData
  ) {
    // Setup debounced calculation (300ms delay)
    this.calculationSubject.pipe(debounceTime(300)).subscribe(() => {
      this.performPercentageCalculation();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadExistingData();
    this.calculatePercentages();
  }

  private initializeForm(): void {
    this.frm = this.fb.group({
      Basic: [0, [Validators.required, Validators.min(0)]],
      DA: [0, [Validators.required, Validators.min(0)]],
      HRA: [0, [Validators.required, Validators.min(0)]],
      HRAPercentage: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      OtherAllowances: [0, [Validators.required, Validators.min(0)]],
      CB_NH: [0, [Validators.required, Validators.min(0)]],
      CB_NHPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  private loadExistingData(): void {
    if (this.data) {
      this.frm.patchValue({
        Basic: this.data.Basic ?? 0,
        DA: this.data.DA ?? 0,
        HRA: this.data.HRA ?? 0,
        HRAPercentage: this.data.HRAPercentage ?? 10,
        OtherAllowances: this.data.OtherAllowances ?? 0,
        CB_NH: this.data.CB_NH ?? 0,
        CB_NHPercentage: this.data.CB_NHPercentage ?? 0
      });
    }
  }

  calculatePercentages() {
    this.calculationSubject.next();
  }

  private performPercentageCalculation() {
    const basic = this.frm.get('Basic')?.value || 0;
    const da = this.frm.get('DA')?.value || 0;
    const basicPlusDA = basic + da;

    // Get user input percentages
    const hraPercentage = (this.frm.get('HRAPercentage')?.value || 0) / 100;

    // Calculate HRA from percentage if user hasn't entered a direct value
    const currentHRA = this.frm.get('HRA')?.value || 0;
    const hra = (currentHRA > 0) ? currentHRA : (hraPercentage === 0 ? 0 : Math.round(basicPlusDA * hraPercentage * 100) / 100);

    // Update form values
    const patchData: any = {};

    // Only include HRA in patch if user hasn't entered a direct value
    if (currentHRA === 0) {
      patchData.HRA = hra;
    }

    this.frm.patchValue(patchData, { emitEvent: false });
  }

  onSave(): void {
    if (this.frm.valid) {
      const result = {
        ...this.frm.value,
        SubTotal: this.subTotal
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.calculationSubject.complete();
  }
}
