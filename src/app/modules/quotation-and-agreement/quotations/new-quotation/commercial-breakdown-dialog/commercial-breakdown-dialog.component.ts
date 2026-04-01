import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-commercial-breakdown-dialog',
  templateUrl: './commercial-breakdown-dialog.component.html',
  styleUrls: ['./commercial-breakdown-dialog.component.css']
})
export class CommercialBreakdownDialogComponent implements OnInit {
  frm: FormGroup;
  noOfGuards: number = 1;
  noOfDays: number = 30;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CommercialBreakdownDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Get guards and days from parent data
    this.noOfGuards = data.NoOfGuards || 1;
    this.noOfDays = data.NoOfDays || 30;

    this.frm = this.fb.group({
      // Man Power Cost
      MinimumWages: [{ value: 0, disabled: true }], // Calculated as Basic + DA
      Basic: [data.Basic || 0, Validators.required],
      DA: [data.DA || 0, Validators.required],
      HRA: [data.HRA || 0],
      HRAPercentage: [data.HRAPercentage || 0],
      Leaves: [data.Leaves || 0],
      LeavesPercentage: [data.LeavesPercentage || 0],
      ProfessionalTax: [data.ProfessionalTax || 0],
      Bonus: [data.Bonus || 0],
      BonusPercentage: [data.BonusPercentage || 0],
      RelieverCharges: [data.RelieverCharges || 0],
      RelieverChargesPercentage: [data.RelieverChargesPercentage || 0],

      // Statutory Costs
      PF: [data.PF || 0],
      PFPercentage: [data.PFPercentage || 0],
      ESI: [data.ESI || 0],
      ESIPercentage: [data.ESIPercentage || 0],

      // Other Costs
      UniformCost: [data.UniformCost || 0],
      Others: [data.Others || 0],
      OthersPercentage: [data.OthersPercentage || 0],
      AdministrationCharges: [data.AdministrationCharges || 0],
      AdministrationChargesPercentage: [data.AdministrationChargesPercentage || 0],

      // Management Fee
      ManagementFee: [data.ManagementFee || 0],
      ManagementFeePercentage: [data.ManagementFeePercentage || 0]
    });
  }

  ngOnInit(): void {
    // Auto-fill functionality removed - users must input data manually
  }

  // Excel Format Calculations

  // Calculate Minimum Wages as Basic + DA
  get minimumWages() {
    return (this.frm.get('Basic')?.value || 0) + (this.frm.get('DA')?.value || 0);
  }

  // Man Power Cost Calculations
  get subTotal() {
    return this.minimumWages +
      (this.frm.get('HRA')?.value || 0) +
      (this.frm.get('Leaves')?.value || 0) +
      (this.frm.get('ProfessionalTax')?.value || 0) +
      (this.frm.get('Bonus')?.value || 0) +
      (this.frm.get('RelieverCharges')?.value || 0);
  }

  // Statutory Costs
  get totalStatutory() {
    return (this.frm.get('PF')?.value || 0) + (this.frm.get('ESI')?.value || 0);
  }

  // TOTAL + STATUTORY
  get totalPlusStatutory() {
    return this.subTotal + this.totalStatutory;
  }

  // Other Costs
  get otherCosts() {
    return (this.frm.get('UniformCost')?.value || 0) +
      (this.frm.get('Others')?.value || 0) +
      (this.frm.get('AdministrationCharges')?.value || 0);
  }

  // TOTAL DIRECT COST (A)
  get totalDirectCost() {
    return this.totalPlusStatutory + this.otherCosts;
  }

  // Management Fee (using user input percentage)
  get managementFee() {
    const percentage = (this.frm.get('ManagementFeePercentage')?.value || 10) / 100;
    return this.totalDirectCost * percentage;
  }

  // Monthly Charged Cost (B)
  get monthlyChargedCost() {
    return this.totalDirectCost + this.managementFee;
  }

  // Grand Total (Total for all guards for the month)
  get grandTotal() {
    return this.monthlyChargedCost * this.noOfGuards;
  }

  // Auto-calculate percentage-based fields using user input percentages
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

    // Update form values
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

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.frm.valid) {
      // Calculate daily rate to return as 'Rate' to the parent table
      // because parent table calculates: Total = Rate * Guards * Days
      const dailyRate = this.noOfDays > 0 ? Math.round((this.monthlyChargedCost / this.noOfDays) * 100) / 100 : this.monthlyChargedCost;

      this.dialogRef.close({
        ...this.frm.value,
        Rate: dailyRate,
        MonthTotal: this.grandTotal,
        SubTotal: this.subTotal,
        TotalPlusStatutory: this.totalPlusStatutory,
        TotalDirectCost: this.totalDirectCost,
        ManagementFee: this.managementFee,
        MonthlyChargedCost: this.monthlyChargedCost
      });
    }
  }
}
