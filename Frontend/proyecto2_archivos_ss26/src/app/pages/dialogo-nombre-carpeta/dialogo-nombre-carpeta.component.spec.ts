import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoNombreCarpetaComponent } from './dialogo-nombre-carpeta.component';

describe('DialogoNombreCarpetaComponent', () => {
  let component: DialogoNombreCarpetaComponent;
  let fixture: ComponentFixture<DialogoNombreCarpetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoNombreCarpetaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogoNombreCarpetaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
