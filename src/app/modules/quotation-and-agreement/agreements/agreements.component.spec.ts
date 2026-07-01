<<<<<<< HEAD
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementsComponent } from './agreements.component';

describe('AgreementsComponent', () => {
  let component: AgreementsComponent;
  let fixture: ComponentFixture<AgreementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgreementsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgreementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementsComponent } from './agreements.component';

describe('AgreementsComponent', () => {
  let component: AgreementsComponent;
  let fixture: ComponentFixture<AgreementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgreementsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgreementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
