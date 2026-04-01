import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { GSTConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-gst-slab',
  templateUrl: './gst-slab.component.html',
  styleUrls: ['./gst-slab.component.css']
})
export class GstSlabComponent implements AfterViewInit {
  gstConfigurations: GSTConfiguration[] = [];
  gstConfigurationsWithServices: any[] = [];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['supplyType', 'fromState', 'toState', 'taxApplied', 'taxSplit'];
  gstSlabData: any[] = [];
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel: UserAccessModel = {
    readAccess: false,
    updateAccess: false,
    deleteAccess: false,
    createAccess: false,
  };

  constructor(
    private _masterService: MastermoduleService,
    private _datasharingService: DatasharingService,
    private _dialog: MatDialog,
    private _router: Router,
    private _liveAnnouncer: LiveAnnouncer
  ) {
    this._datasharingService.getUsername().subscribe((username: string) => {
      this.currentUser = username || '';
    });
    this.warningMessage = '';
    this.errorMessage = '';
    this.showLoadingSpinner = false;
  }

  ngOnInit(): void {
    if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
      this.getGSTConfigurationList();
    } else {
      this.getUserAccessRights(this.currentUser, 'GST Slab');
    }
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    // This would need to be implemented in the backend
    this.getGSTConfigurationList();
  }

  getGSTConfigurationList(): void {
    this.showLoadingSpinner = true;
    this._masterService.getGSTConfigurationList().subscribe(
      (data: any) => {
        console.log('GST Slab Data received:', data);
        if (data && data.length > 0) {
          this.gstSlabData = data;
        } else {
          this.errorMessage = `No GST configuration data available.`;
        }
        this.hideSpinner();
      },
      (error: any) => {
        console.log('Error loading GST data:', error);
        this.errorMessage = 'Error loading GST configuration';
        this.hideSpinner();
      }
    );
  }

  loadGSTConfigurationWithServices(): void {
    this._masterService.getGSTConfigurationWithServices().subscribe(
      (response: any) => {
        console.log('GST Configuration with Services:', response);
        this.gstConfigurationsWithServices = response.data;
      },
      (error: any) => {
        console.error('Error loading GST configuration with services:', error);
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
    // No paginator or sort needed for simplified GST slab structure
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

  deleteGSTSlab(gstId: number): void {
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
        this._masterService.deleteGSTConfigurationById(gstId).subscribe(
          (data: any) => {
            Swal.fire({
              title: 'Deleted!',
              text: 'GST configuration has been deleted.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            this.getGSTConfigurationList();
          },
          (error: any) => {
            console.log(error);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Something went wrong while deleting the GST configuration!',
            });
          }
        );
      }
    });
  }

  editGSTSlab(gstConfig: GSTConfiguration): void {
    // Navigate to edit page or open dialog
    this._router.navigate(['/master/gst-slab/edit', gstConfig.id]);
  }

  addNewGSTSlab(): void {
    // Navigate to add page or open dialog
    this._router.navigate(['/master/gst-slab/add']);
  }

  viewGSTSlabDetails(gstConfig: GSTConfiguration): void {
    // Navigate to details page or open dialog
    this._router.navigate(['/master/gst-slab/details', gstConfig.id]);
  }

  exportToExcel(): void {
    // Export functionality
    console.log('Export to Excel functionality to be implemented');
  }

  getGSTRateBadgeClass(rate: number): string {
    if (rate === 5) return 'badge-success';
    if (rate === 12) return 'badge-info';
    if (rate === 18) return 'badge-warning';
    if (rate === 28) return 'badge-danger';
    return 'badge-secondary';
  }

  refreshData(): void {
    this.getGSTConfigurationList();
  }
}
