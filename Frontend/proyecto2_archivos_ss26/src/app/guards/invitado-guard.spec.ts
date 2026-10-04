import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { invitadoGuard } from './invitado-guard';

describe('invitadoGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => invitadoGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
