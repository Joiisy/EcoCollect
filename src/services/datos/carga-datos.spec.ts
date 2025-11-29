import { TestBed } from '@angular/core/testing';

import { CargaDatos } from './carga-datos';

describe('CargaDatos', () => {
  let service: CargaDatos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CargaDatos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
