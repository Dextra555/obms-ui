<<<<<<< HEAD
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptsComponent } from './receipts.component';

describe('ReceiptsComponent', () => {
  let component: ReceiptsComponent;
  let fixture: ComponentFixture<ReceiptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptsComponent } from './receipts.component';

describe('ReceiptsComponent', () => {
  let component: ReceiptsComponent;
  let fixture: ComponentFixture<ReceiptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
