import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestablecerPasswordComponent } from './restablecer-password.component';

describe('RestablecerPasswordComponent', () => {
  let component: RestablecerPasswordComponent;
  let fixture: ComponentFixture<RestablecerPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestablecerPasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestablecerPasswordComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
