import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort, Sort} from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from 'src/app/service/finance.service';
export interface PeriodicElement {
  voucher_no: string,
  payment_date: string,
  supplier_name: string,
  bank_code: string,
  cheque_no: string,
  pay_to: string,
  particulars: string,
  amount: string,
  category_name: string,
}

const ELEMENT_DATA: PeriodicElement[] = [
  {voucher_no : '12842', payment_date: '14-Nov-2022', supplier_name: 'LEMBAGA HASIL DALAM NEGERI	', bank_code: 'CIMB', cheque_no: 'OFT', pay_to: 'LEMBAGA HASIL DALAM NEGERI (Supplier)', particulars:'MAC 23 - STAMPING CENTRAL MEDICARE SDN BHD AGREEMENT', amount: '887.00', category_name: 'STAMPING FEE'},
];
@Component({
  selector: 'app-category-search',
  templateUrl: './category-search.component.html',
  styleUrls: ['./category-search.component.css']
})
export class CategorySearchComponent implements AfterViewInit {
  frm!: FormGroup;
   categoryList: any = [];
  displayedColumns: string[] = ['voucher_no', 'payment_date', 'supplier_name', 'bank_code', 'cheque_no', 'pay_to', 'particulars', 'amount', 'category_name'];
  //dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  constructor(private fb:FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _financeService: FinanceService
  ) {
    this.frm= this.fb.group({
      StartDate: [''],
      EndDate: [''],
      Category: [''],
    })
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
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
   ngOnInit(): void {
    this._financeService.getInventoryCategoryList().subscribe({
      next: (data) => this.categoryList = data,
      error: (err) => console.error('Error fetching categories', err)
    });
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
}


