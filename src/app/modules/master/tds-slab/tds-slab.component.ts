import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TDSSlabConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-tds-slab',
  templateUrl: './tds-slab.component.html',
  styleUrls: ['./tds-slab.component.css']
})
export class TdsSlabComponent implements AfterViewInit {
  tdsConfigurations: TDSSlabConfiguration[] = [];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['minIncome', 'maxIncome', 'taxRate', 'isActive', 'action'];
  dataSource: any;
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
      this.getTDSConfigurationList();
    } else {
      this.getUserAccessRights(this.currentUser, 'TDS Slab');
    }
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    // This would need to be implemented in the backend
    this.getTDSConfigurationList();
  }

  getTDSConfigurationList(): void {
    this.showLoadingSpinner = true;
    this._masterService.getTDSConfigurationList().subscribe(
      (data: TDSSlabConfiguration[]) => {
        console.log('TDS Data received:', data);
        if (data && data.length > 0) {
          this.tdsConfigurations = data;
          this.dataSource = new MatTableDataSource(data);
          console.log('First TDS row data:', data[0]);
          setTimeout(() => {
            if (this.dataSource != null && this.dataSource != undefined) {
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            }
          }, 0);
        } else {
          this.errorMessage = `No TDS configuration data available. Please add TDS configuration.`;
        }
        this.hideSpinner();
      },
      (error: any) => {
        console.log('Error loading TDS data:', error);
        this.errorMessage = 'Error loading TDS configuration';
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

  deleteTDSSlab(tdsId: number): void {
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
        this._masterService.deleteTDSSlabById(tdsId).subscribe(
          (data: any) => {
            Swal.fire({
              title: 'Deleted!',
              text: 'TDS configuration has been deleted.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            this.getTDSConfigurationList();
          },
          (error: any) => {
            console.log(error);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Something went wrong while deleting the TDS configuration!',
            });
          }
        );
      }
    });
  }

  editTDSSlab(tdsConfig: TDSSlabConfiguration): void {
    // Navigate to edit page or open dialog
    this._router.navigate(['/master/tds-slab/edit', tdsConfig.id]);
  }

  addNewTDSSlab(): void {
    // Navigate to add page or open dialog
    this._router.navigate(['/master/tds-slab/add']);
  }

  viewTDSSlabDetails(tdsConfig: TDSSlabConfiguration): void {
    // Navigate to details page or open dialog
    this._router.navigate(['/master/tds-slab/details', tdsConfig.id]);
  }

  exportToExcel(): void {
    // Export functionality
    console.log('Export to Excel functionality to be implemented');
  }

  refreshData(): void {
    this.getTDSConfigurationList();
  }
}
