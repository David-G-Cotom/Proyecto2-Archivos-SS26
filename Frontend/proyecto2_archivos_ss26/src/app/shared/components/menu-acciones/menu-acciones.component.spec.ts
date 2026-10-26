import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuAccionesComponent } from './menu-acciones.component';

describe('MenuAccionesComponent', () => {
  let component: MenuAccionesComponent;
  let fixture: ComponentFixture<MenuAccionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuAccionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuAccionesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
