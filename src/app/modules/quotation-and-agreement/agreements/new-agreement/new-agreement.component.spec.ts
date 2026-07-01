<<<<<<< HEAD
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAgreementComponent } from './new-agreement.component';

describe('NewAgreementComponent', () => {
  let component: NewAgreementComponent;
  let fixture: ComponentFixture<NewAgreementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewAgreementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAgreementComponent } from './new-agreement.component';

describe('NewAgreementComponent', () => {
  let component: NewAgreementComponent;
  let fixture: ComponentFixture<NewAgreementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewAgreementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
