import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoRenombrarArchivoComponent } from './dialogo-renombrar-archivo.component';

describe('DialogoRenombrarArchivoComponent', () => {
  let component: DialogoRenombrarArchivoComponent;
  let fixture: ComponentFixture<DialogoRenombrarArchivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoRenombrarArchivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogoRenombrarArchivoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
