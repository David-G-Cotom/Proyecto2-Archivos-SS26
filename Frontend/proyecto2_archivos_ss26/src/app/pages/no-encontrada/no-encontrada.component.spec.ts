import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoEncontradaComponent } from './no-encontrada.component';

describe('NoEncontradaComponent', () => {
  let component: NoEncontradaComponent;
  let fixture: ComponentFixture<NoEncontradaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoEncontradaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoEncontradaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
