import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceTypeService } from '../../../../service/service-type.service';
import { ServiceType } from '../../../../model/service-type.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-view-service-type',
  templateUrl: './view-service-type.component.html',
  styleUrls: ['./view-service-type.component.css']
})
export class ViewServiceTypeComponent implements OnInit {
  serviceType: ServiceType | null = null;
  showLoadingSpinner = false;
  serviceTypeId: number | null = null;

  constructor(
    private serviceTypeService: ServiceTypeService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.serviceTypeId = +params['id'];
        this.loadServiceTypeDetails(this.serviceTypeId);
      }
    });
  }

  loadServiceTypeDetails(id: number): void {
    this.showLoadingSpinner = true;
    this.serviceTypeService.getServiceTypeById(id).subscribe({
      next: (data: ServiceType) => {
        this.serviceType = data;
        this.showLoadingSpinner = false;
      },
      error: (error: any) => {
        Swal.fire('Error', 'Failed to load service type details', 'error');
        this.showLoadingSpinner = false;
        this.router.navigate(['/master/service-type']);
      }
    });
  }

  editServiceType(): void {
    if (this.serviceTypeId) {
      this.router.navigate(['/master/service-type/edit', this.serviceTypeId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/master/service-type']);
  }
}
