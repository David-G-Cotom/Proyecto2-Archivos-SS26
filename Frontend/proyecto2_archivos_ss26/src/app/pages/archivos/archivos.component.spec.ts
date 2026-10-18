import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivosComponent } from './archivos.component';

describe('ArchivosComponent', () => {
  let component: ArchivosComponent;
  let fixture: ComponentFixture<ArchivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
