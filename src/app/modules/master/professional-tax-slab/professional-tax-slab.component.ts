import { AfterViewInit, Component, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { IndianStatutoryService } from 'src/app/service/indian-statutory.service';
import { ProfessionalTaxModel } from 'src/app/model/professionalTaxModel';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { NewProfessionalTaxSlabComponent } from './new-professional-tax-slab/new-professional-tax-slab.component';
import { ProfessionalTaxCalculatorComponent } from './professional-tax-calculator/professional-tax-calculator.component';

@Component({
  selector: 'app-professional-tax-slab',
  templateUrl: './professional-tax-slab.component.html',
  styleUrls: ['./professional-tax-slab.component.css']
})
export class ProfessionalTaxSlabComponent implements OnInit, AfterViewInit {

  professionalTax!: ProfessionalTaxModel[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['state', 'minSalary', 'maxSalary', 'taxAmount', 'effectiveDate', 'isActive', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  
  constructor(
    private _statutoryService: IndianStatutoryService,
    private _liveAnnouncer: LiveAnnouncer,
    private _dialog: MatDialog,
    private _router: Router,
    private cdr: ChangeDetectorRef
  ) { 
    this.userAccessModel = {
      readAccess: false,
      updateAccess:false,
      deleteAccess:false,
      createAccess:false,
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

  ngOnInit() {
    this.getProfessionalTaxData();
  }

  ngAfterViewInit() {
    // Set paginator and sort after view is initialized
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  getProfessionalTaxData() {
    this.showLoadingSpinner = true;
    this.cdr.detectChanges(); // Ensure change detection runs
    
    this._statutoryService.getPTConfiguration().subscribe({
      next: (data) => {
        this.professionalTax = data;
        this.dataSource = new MatTableDataSource(this.professionalTax);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.showLoadingSpinner = false;
        this.cdr.detectChanges(); // Ensure change detection runs
      },
      error: (error) => {
        this.errorMessage = 'Error loading professional tax data';
        this.showLoadingSpinner = false;
        this.cdr.detectChanges(); // Ensure change detection runs
        console.error('Error:', error);
      }
    });
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  openAddDialog() {
    const dialogRef = this._dialog.open(NewProfessionalTaxSlabComponent, {
      width: '600px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.getProfessionalTaxData();
      }
    });
  }

  openEditDialog(element: ProfessionalTaxModel) {
    const dialogRef = this._dialog.open(NewProfessionalTaxSlabComponent, {
      width: '600px',
      data: { mode: 'edit', data: element }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.getProfessionalTaxData();
      }
    });
  }

  deleteItem(element: ProfessionalTaxModel) {
    const dialogRef = this._dialog.open(DialogConfirmationComponent, {
      width: '400px',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete this professional tax slab for ${element.state}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.deleteProfessionalTax(element.id!);
      }
    });
  }

  deleteProfessionalTax(id: number) {
    this.showLoadingSpinner = true;
    this._statutoryService.deletePTConfiguration(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Professional tax slab deleted successfully',
          showConfirmButton: false,
          timer: 1500
        });
        this.getProfessionalTaxData();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete professional tax slab',
          confirmButtonColor: '#d33'
        });
        this.showLoadingSpinner = false;
        console.error('Error:', error);
      }
    });
  }

  calculateTax() {
    const dialogRef = this._dialog.open(ProfessionalTaxCalculatorComponent, {
      width: '500px'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }
}
