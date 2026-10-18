import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelSubidaComponent } from './panel-subida.component';

describe('PanelSubidaComponent', () => {
  let component: PanelSubidaComponent;
  let fixture: ComponentFixture<PanelSubidaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelSubidaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelSubidaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
