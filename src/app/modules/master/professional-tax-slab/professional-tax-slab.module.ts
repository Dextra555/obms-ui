import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfessionalTaxSlabComponent } from './professional-tax-slab.component';
import { NewProfessionalTaxSlabComponent } from './new-professional-tax-slab/new-professional-tax-slab.component';
import { ProfessionalTaxCalculatorComponent } from './professional-tax-calculator/professional-tax-calculator.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ProfessionalTaxSlabComponent,
    NewProfessionalTaxSlabComponent,
    ProfessionalTaxCalculatorComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  entryComponents: [
    NewProfessionalTaxSlabComponent,
    ProfessionalTaxCalculatorComponent
  ]
})
export class ProfessionalTaxSlabModule { }
