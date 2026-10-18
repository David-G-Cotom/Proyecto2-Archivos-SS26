import { TestBed } from '@angular/core/testing';

import { SubidaArchivosService } from './subida-archivos.service';

describe('SubidaArchivosService', () => {
  let service: SubidaArchivosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubidaArchivosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
