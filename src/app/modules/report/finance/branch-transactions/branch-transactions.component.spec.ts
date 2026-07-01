<<<<<<< HEAD
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchTransactionsComponent } from './branch-transactions.component';

describe('BranchTransactionsComponent', () => {
  let component: BranchTransactionsComponent;
  let fixture: ComponentFixture<BranchTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BranchTransactionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BranchTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchTransactionsComponent } from './branch-transactions.component';

describe('BranchTransactionsComponent', () => {
  let component: BranchTransactionsComponent;
  let fixture: ComponentFixture<BranchTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BranchTransactionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BranchTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
