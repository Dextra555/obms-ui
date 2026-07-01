<<<<<<< HEAD
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChequeStatusComponent } from './cheque-status.component';

describe('ChequeStatusComponent', () => {
  let component: ChequeStatusComponent;
  let fixture: ComponentFixture<ChequeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChequeStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChequeStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChequeStatusComponent } from './cheque-status.component';

describe('ChequeStatusComponent', () => {
  let component: ChequeStatusComponent;
  let fixture: ComponentFixture<ChequeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChequeStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChequeStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
