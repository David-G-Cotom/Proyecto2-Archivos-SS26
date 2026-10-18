import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoverElementoComponent } from './mover-elemento.component';

describe('MoverElementoComponent', () => {
  let component: MoverElementoComponent;
  let fixture: ComponentFixture<MoverElementoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoverElementoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoverElementoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
