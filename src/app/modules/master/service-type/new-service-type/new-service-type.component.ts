import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceTypeService } from '../../../../service/service-type.service';
import { ServiceType } from '../../../../model/service-type.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-service-type',
  template: `
    <div class="container">
      <h2>{{isEdit ? 'Edit Service Type' : 'Create Service Type'}}</h2>
      
      <form [formGroup]="serviceTypeForm" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Service Name</mat-label>
            <input matInput formControlName="serviceName" placeholder="Enter service name">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Service Code</mat-label>
            <input matInput formControlName="serviceCode" placeholder="Enter service code">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>HSN Code</mat-label>
            <input matInput formControlName="hsnCode" placeholder="Enter HSN code">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" placeholder="Enter description"></textarea>
          </mat-form-field>
        </div>
        
        <div class="form-actions">
          <button type="submit" mat-raised-button color="primary" [disabled]="serviceTypeForm.invalid">
            {{isEdit ? 'Update' : 'Create'}}
          </button>
          <button type="button" mat-raised-button color="accent" (click)="cancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }
    
    .mat-form-field {
      width: 100%;
    }
  `]
})
export class NewServiceTypeComponent {
  isEdit = false;
  serviceTypeForm!: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private serviceTypeService: ServiceTypeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.serviceTypeForm = this.fb.group({
      serviceName: ['', Validators.required],
      serviceCode: ['', Validators.required],
      hsnCode: ['', Validators.required],
      description: ['']
    });
  }

  onSubmit(): void {
    if (this.serviceTypeForm.valid) {
      const serviceTypeData = this.serviceTypeForm.value;
      
      this.serviceTypeService.createServiceType(serviceTypeData).subscribe({
        next: () => {
          Swal.fire('Success', 'Service type created successfully', 'success');
          this.router.navigate(['/master/service-type']);
        },
        error: (error: any) => {
          Swal.fire('Error', 'Failed to create service type', 'error');
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/master/service-type']);
  }
}
