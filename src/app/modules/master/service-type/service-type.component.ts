import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { ServiceTypeService } from 'src/app/service/service-type.service';
import { ServiceType } from 'src/app/model/service-type.model';

@Component({
  selector: 'app-service-type',
  templateUrl: './service-type.component.html',
  styleUrls: ['./service-type.component.css']
})
export class ServiceTypeComponent implements AfterViewInit {
  serviceTypes: ServiceType[] = [];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = [
    'serviceName', 'serviceCode', 'description', 'hsnCode', 
    'isActive', 'action'
  ];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  userAccessModel: UserAccessModel = {
    readAccess: false,
    updateAccess: false,
    deleteAccess: false,
    createAccess: false,
  };

  constructor(
    private _serviceTypeService: ServiceTypeService,
    private _datasharingService: DatasharingService,
    private _dialog: MatDialog,
    private _router: Router,
    private _liveAnnouncer: LiveAnnouncer
  ) {
    this._datasharingService.getUsername().subscribe((username: string) => {
      this.currentUser = username || '';
    });
    this.errorMessage = '';
    this.showLoadingSpinner = false;
  }

  ngOnInit(): void {
    if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
      this.getServiceTypeList();
    } else {
      this.getUserAccessRights(this.currentUser, 'Service Type');
    }
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    // This would need to be implemented in the backend
    this.getServiceTypeList();
  }

  getServiceTypeList(): void {
    this.showLoadingSpinner = true;
    this._serviceTypeService.getAllServiceTypes().subscribe(
      (data: ServiceType[]) => {
        console.log('Service Type Data received:', data);
        if (data && data.length > 0) {
          this.serviceTypes = data;
          this.dataSource = new MatTableDataSource(data);
          
          setTimeout(() => {
            if (this.dataSource != null && this.dataSource != undefined) {
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            }
          }, 0);
        } else {
          this.errorMessage = `No service type data available. Please add service types.`;
        }
        this.hideSpinner();
      },
      (error: any) => {
        console.log('Error loading service type data:', error);
        this.errorMessage = 'Error loading service type configuration';
        this.hideSpinner();
      }
    );
  }

  hideSpinner(): void {
    setTimeout(() => {
      this.showLoadingSpinner = false;
    }, 1000);
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    if (this.sort) {
      this.sort.sortChange.subscribe(() => this._liveAnnouncer.announce('Sort changed.'));
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  deleteServiceType(serviceTypeId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this._serviceTypeService.deleteServiceType(serviceTypeId).subscribe(
          (data: any) => {
            Swal.fire({
              title: 'Deleted!',
              text: 'Service type has been deleted.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            this.getServiceTypeList();
          },
          (error: any) => {
            console.log(error);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Something went wrong while deleting service type!',
            });
          }
        );
      }
    });
  }

  editServiceType(serviceType: ServiceType): void {
    // Navigate to edit page or open dialog
    this._router.navigate(['/master/service-type/edit', serviceType.Id]);
  }

  addNewServiceType(): void {
    // Navigate to add page or open dialog
    this._router.navigate(['/master/service-type/add']);
  }

  viewServiceTypeDetails(serviceType: ServiceType): void {
    // Navigate to details page or open dialog
    this._router.navigate(['/master/service-type/details', serviceType.Id]);
  }

  refreshData(): void {
    this.getServiceTypeList();
  }
}
