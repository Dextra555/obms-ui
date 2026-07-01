import { Component } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';

import { ServiceTypeService } from '../../../../service/service-type.service';

import { ServiceType } from '../../../../model/service-type.model';

import Swal from 'sweetalert2';



@Component({

  selector: 'app-new-service-type',

  templateUrl: './new-service-type.component.html',

  styleUrls: ['./new-service-type.component.css']

})

export class NewServiceTypeComponent {

  isEdit = false;

  serviceTypeForm!: FormGroup;

  showLoadingSpinner = false;

  serviceTypeId: number | null = null;



  constructor(

    private fb: FormBuilder,

    private serviceTypeService: ServiceTypeService,

    private router: Router,

    private route: ActivatedRoute

  ) { }



  ngOnInit(): void {

    this.serviceTypeForm = this.fb.group({

      serviceName: ['', Validators.required],

      hsnCode: ['', Validators.required],

      pricingModel: ['Standard'],

      isActive: [true]

    });



    // Check if we're in edit mode

    this.route.params.subscribe(params => {

      if (params['id']) {

        this.isEdit = true;

        this.serviceTypeId = +params['id'];

        this.loadServiceTypeData(this.serviceTypeId);

      }

    });

  }



  loadServiceTypeData(id: number): void {

    this.showLoadingSpinner = true;

    this.serviceTypeService.getServiceTypeById(id).subscribe({

      next: (data: ServiceType) => {

        this.serviceTypeForm.patchValue({

          serviceName: data.ServiceName,

          hsnCode: data.HSNCode,

          isActive: data.IsActive

        });

        this.showLoadingSpinner = false;

      },

      error: (error: any) => {

        Swal.fire('Error', 'Failed to load service type data', 'error');

        this.showLoadingSpinner = false;

      }

    });

  }



  onSubmit(): void {

    if (this.serviceTypeForm.valid) {

      const serviceTypeData = this.serviceTypeForm.value;

      this.showLoadingSpinner = true;



      if (this.isEdit && this.serviceTypeId) {

        // Map form data to update DTO

        const updateData = {

          Id: this.serviceTypeId,

          ServiceName: serviceTypeData.serviceName,

          HSNCode: serviceTypeData.hsnCode,

          IsActive: serviceTypeData.isActive

        };

        this.serviceTypeService.updateServiceType(this.serviceTypeId, updateData).subscribe({

          next: () => {

            Swal.fire('Success', 'Service type updated successfully', 'success');

            this.router.navigate(['/master/service-type']);

          },

          error: (error: any) => {

            Swal.fire('Error', 'Failed to update service type', 'error');

            this.showLoadingSpinner = false;

          }

        });

      } else {

        // Map form data to create DTO

        const createData = {

          ServiceName: serviceTypeData.serviceName,

          HSNCode: serviceTypeData.hsnCode

        };

        this.serviceTypeService.createServiceType(createData).subscribe({

          next: () => {

            Swal.fire('Success', 'Service type created successfully', 'success');

            this.router.navigate(['/master/service-type']);

          },

          error: (error: any) => {

            Swal.fire('Error', 'Failed to create service type', 'error');

            this.showLoadingSpinner = false;

          }

        });

      }

    }

  }



  cancel(): void {

    this.router.navigate(['/master/service-type']);

  }

}

