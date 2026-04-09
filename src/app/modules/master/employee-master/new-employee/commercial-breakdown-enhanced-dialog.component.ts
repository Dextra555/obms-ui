import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface CommercialBreakdownData {
  NoOfGuards?: number;
  NoOfDays?: number;
  MinimumWages?: number;
  Basic?: number;
  DA?: number;
  HRA?: number;
  HRAPercentage?: number;
  Leaves?: number;
  LeavesPercentage?: number;
  ProfessionalTax?: number;
  Bonus?: number;
  BonusPercentage?: number;
  RelieverCharges?: number;
  RelieverChargesPercentage?: number;
  PF?: number;
  PFPercentage?: number;
  ESI?: number;
  ESIPercentage?: number;
  UniformCost?: number;
  Others?: number;
  OthersPercentage?: number;
  AdministrationCharges?: number;
  AdministrationChargesPercentage?: number;
  ManagementFee?: number;
  ManagementFeePercentage?: number;
  SubTotal?: number;
  TotalPlusStatutory?: number;
  TotalDirectCost?: number;
  MonthlyChargedCost?: number;
}

@Component({
  selector: 'app-commercial-breakdown-enhanced-dialog',
  templateUrl: './commercial-breakdown-enhanced-dialog.component.html',
  styleUrls: ['./commercial-breakdown-enhanced-dialog.component.scss']
})
export class CommercialBreakdownEnhancedDialogComponent implements OnInit {
  frm!: FormGroup;
  noOfGuards = 1;
  noOfDays = 30;

  // Helper properties for styling
  get hasValidDirectCost(): boolean {
    return this.totalDirectCost > 0;
  }

  get totalDirectCostClass(): string {
    return this.totalDirectCost <= 0 ? 'border-warning bg-warning bg-opacity-10' : 'border-success bg-success bg-opacity-10';
  }

  get totalDirectCostBadgeClass(): string {
    return this.totalDirectCost <= 0 ? 'bg-warning text-dark fs-5' : 'bg-success text-white fs-5';
  }

  // Calculate Minimum Wages as Basic + DA (same as Quotation page)
  get minimumWages() {
    return (this.frm.get('Basic')?.value || 0) + (this.frm.get('DA')?.value || 0);
  }

  // Man Power Cost Calculations (same as Quotation page)
  get subTotal() {
    return this.minimumWages +
      (this.frm.get('HRA')?.value || 0) +
      (this.frm.get('Leaves')?.value || 0) +
      (this.frm.get('ProfessionalTax')?.value || 0) +
      (this.frm.get('Bonus')?.value || 0) +
      (this.frm.get('RelieverCharges')?.value || 0);
  }

  // Statutory Costs (same as Quotation page)
  get totalStatutory() {
    return (this.frm.get('PF')?.value || 0) + (this.frm.get('ESI')?.value || 0);
  }

  // TOTAL + STATUTORY (same as Quotation page)
  get totalPlusStatutory() {
    return this.subTotal + this.totalStatutory;
  }

  // Other Costs (same as Quotation page)
  get otherCosts() {
    return (this.frm.get('UniformCost')?.value || 0) +
      (this.frm.get('Others')?.value || 0) +
      (this.frm.get('AdministrationCharges')?.value || 0);
  }

  // TOTAL DIRECT COST (A) (same as Quotation page)
  get totalDirectCost() {
    return this.totalPlusStatutory + this.otherCosts;
  }

  // Management Fee (using user input percentage) (same as Quotation page)
  get managementFee() {
    const percentage = (this.frm.get('ManagementFeePercentage')?.value || 10) / 100;
    return this.totalDirectCost * percentage;
  }

  // Monthly Charged Cost (B) (same as Quotation page)
  get monthlyChargedCost() {
    return this.totalDirectCost + this.managementFee;
  }

  // Grand Total (Total for all guards for the month) (same as Quotation page)
  get grandTotal() {
    return this.monthlyChargedCost * this.noOfGuards;
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CommercialBreakdownEnhancedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CommercialBreakdownData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadExistingData();
    this.calculatePercentages();
  }

  private initializeForm(): void {
    this.frm = this.fb.group({
      NoOfGuards: [this.noOfGuards, [Validators.required, Validators.min(1)]],
      NoOfDays: [this.noOfDays, [Validators.required, Validators.min(1)]],
      MinimumWages: [0, Validators.required],
      Basic: [0, [Validators.required, Validators.min(0)]],
      DA: [0, [Validators.required, Validators.min(0)]],
      HRA: [{value: 0, disabled: true}, Validators.required],
      HRAPercentage: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      Leaves: [{value: 0, disabled: true}, Validators.required],
      LeavesPercentage: [8.33, [Validators.required, Validators.min(0), Validators.max(100)]],
      ProfessionalTax: [0, [Validators.required, Validators.min(0)]],
      Bonus: [{value: 0, disabled: true}, Validators.required],
      BonusPercentage: [8.33, [Validators.required, Validators.min(0), Validators.max(100)]],
      RelieverCharges: [{value: 0, disabled: true}, Validators.required],
      RelieverChargesPercentage: [25, [Validators.required, Validators.min(0), Validators.max(100)]],
      PF: [{value: 0, disabled: true}, Validators.required],
      PFPercentage: [12, [Validators.required, Validators.min(0), Validators.max(100)]],
      ESI: [{value: 0, disabled: true}, Validators.required],
      ESIPercentage: [3.25, [Validators.required, Validators.min(0), Validators.max(100)]],
      UniformCost: [0, [Validators.required, Validators.min(0)]],
      Others: [{value: 0, disabled: true}, Validators.required],
      OthersPercentage: [2, [Validators.required, Validators.min(0), Validators.max(100)]],
      AdministrationCharges: [{value: 0, disabled: true}, Validators.required],
      AdministrationChargesPercentage: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
      ManagementFee: [{value: 0, disabled: true}, Validators.required],
      ManagementFeePercentage: [15, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    // Watch for changes in number of guards and days
    this.frm.get('NoOfGuards')?.valueChanges.subscribe(val => {
      this.noOfGuards = val || 1;
      this.calculatePercentages();
    });

    this.frm.get('NoOfDays')?.valueChanges.subscribe(val => {
      this.noOfDays = val || 30;
      this.calculatePercentages();
    });
  }

  private loadExistingData(): void {
    if (this.data) {
      this.noOfGuards = this.data.NoOfGuards || 1;
      this.noOfDays = this.data.NoOfDays || 30;
      
      this.frm.patchValue({
        NoOfGuards: this.noOfGuards,
        NoOfDays: this.noOfDays,
        MinimumWages: this.data.MinimumWages || 0,
        Basic: this.data.Basic || 0,
        DA: this.data.DA || 0,
        HRAPercentage: this.data.HRAPercentage || 10,
        LeavesPercentage: this.data.LeavesPercentage || 8.33,
        ProfessionalTax: this.data.ProfessionalTax || 0,
        BonusPercentage: this.data.BonusPercentage || 8.33,
        RelieverChargesPercentage: this.data.RelieverChargesPercentage || 25,
        PFPercentage: this.data.PFPercentage || 12,
        ESIPercentage: this.data.ESIPercentage || 3.25,
        UniformCost: this.data.UniformCost || 0,
        OthersPercentage: this.data.OthersPercentage || 2,
        AdministrationChargesPercentage: this.data.AdministrationChargesPercentage || 5,
        ManagementFeePercentage: this.data.ManagementFeePercentage || 15
      });
    }
  }

  calculatePercentages() {
    const basic = this.frm.get('Basic')?.value || 0;
    const da = this.frm.get('DA')?.value || 0;
    const basicPlusDA = basic + da;

    // Get user input percentages
    const hraPercentage = (this.frm.get('HRAPercentage')?.value || 0) / 100;
    const leavesPercentage = (this.frm.get('LeavesPercentage')?.value || 0) / 100;
    const bonusPercentage = (this.frm.get('BonusPercentage')?.value || 0) / 100;
    const relieverChargesPercentage = (this.frm.get('RelieverChargesPercentage')?.value || 0) / 100;
    const pfPercentage = (this.frm.get('PFPercentage')?.value || 0) / 100;
    const esiPercentage = (this.frm.get('ESIPercentage')?.value || 0) / 100;
    const othersPercentage = (this.frm.get('OthersPercentage')?.value || 0) / 100;
    const adminChargesPercentage = (this.frm.get('AdministrationChargesPercentage')?.value || 0) / 100;

    // Calculate values based on user input percentages
    const hra = hraPercentage === 0 ? 0 : Math.round(basicPlusDA * hraPercentage * 100) / 100;
    const leaves = leavesPercentage === 0 ? 0 : Math.round(basicPlusDA * leavesPercentage * 100) / 100;
    const bonus = bonusPercentage === 0 ? 0 : Math.round(basicPlusDA * bonusPercentage * 100) / 100;
    const relieverCharges = relieverChargesPercentage === 0 ? 0 : Math.round(basicPlusDA * relieverChargesPercentage * 100) / 100;
    const pf = pfPercentage === 0 ? 0 : Math.round(basicPlusDA * pfPercentage * 100) / 100;
    const esi = esiPercentage === 0 ? 0 : Math.round(basicPlusDA * esiPercentage * 100) / 100;
    const others = othersPercentage === 0 ? 0 : Math.round(this.subTotal * othersPercentage * 100) / 100;
    const adminCharges = adminChargesPercentage === 0 ? 0 : Math.round(this.subTotal * adminChargesPercentage * 100) / 100;
    const managementFeePercentage = (this.frm.get('ManagementFeePercentage')?.value || 0) / 100;
    const managementFee = managementFeePercentage === 0 ? 0 : Math.round(this.totalDirectCost * managementFeePercentage * 100) / 100;

    // Update form values (same as Quotation page)
    this.frm.patchValue({
      MinimumWages: Math.round(this.minimumWages * 100) / 100,
      HRA: hra,
      Leaves: leaves,
      Bonus: bonus,
      RelieverCharges: relieverCharges,
      PF: pf,
      ESI: esi,
      Others: others,
      AdministrationCharges: adminCharges,
      ManagementFee: managementFee
    }, { emitEvent: false });
  }

  onSave(): void {
    if (this.frm.valid) {
      const result = {
        ...this.frm.value,
        SubTotal: this.subTotal,
        TotalPlusStatutory: this.totalPlusStatutory,
        TotalDirectCost: this.totalDirectCost,
        ManagementFee: this.managementFee,
        MonthlyChargedCost: this.monthlyChargedCost,
        GrandTotal: this.grandTotal
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
