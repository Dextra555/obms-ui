import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PFConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-pf-slab',
  templateUrl: './pf-slab.component.html',
  styleUrls: ['./pf-slab.component.css']
})
export class PfSlabComponent implements AfterViewInit {
  pfConfigurations: PFConfiguration[] = [];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['basicSalaryLimit', 'employeeContributionRate', 'employerContributionRate', 'effectiveDate', 'isActive', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  constructor(
    private _liveAnnouncer: LiveAnnouncer, 
    public dialog: MatDialog,
    private _masterService: MastermoduleService, 
    private _router: Router,
    private _dataService: DatasharingService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.dataSource != null && this.dataSource != undefined) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    }, 0);
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
      this.getPFConfigurationList();
    } else {
      this.getUserAccessRights(this.currentUser, 'PF Slab');
    }
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    // This would need to be implemented in the backend
    this.getPFConfigurationList();
  }

  getPFConfigurationList(): void {
    this.showLoadingSpinner = true;
    this._masterService.getPFConfigurationList().subscribe(
      (data: PFConfiguration[]) => {
        console.log('PF Data received:', data);
        if (data && data.length > 0) {
          this.pfConfigurations = data;
          this.dataSource = new MatTableDataSource(data);
          console.log('First row data:', data[0]);
          setTimeout(() => {
            if (this.dataSource != null && this.dataSource != undefined) {
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            }
          }, 0);
        } else {
          this.errorMessage = `No PF configuration data available. Please add PF configuration.`;
        }
        this.hideSpinner();
      },
      (error: any) => {
        console.log('Error loading PF data:', error);
        this.errorMessage = 'Error loading PF configuration';
        this.hideSpinner();
      }
    );
  }

  onEditClick(data: PFConfiguration): void {
    this._router.navigate(['/master/pf-slab/new-pf-slab'], { queryParams: { id: data.id }, queryParamsHandling: 'merge' });
  }

  onDeleteClick(id: number): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this PF configuration?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {       
        if (result.confirmDialog) {
          // This would need to be implemented in the backend
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Info',
            text: 'Delete functionality needs to be implemented in backend',
            icon: 'info',
            showCloseButton: false,
            timer: 3000,
          });
          this.showLoadingSpinner = false;
        } else {
          this.showLoadingSpinner = false;
        }
      });
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
