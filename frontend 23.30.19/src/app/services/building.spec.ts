import { TestBed } from '@angular/core/testing';

import { Building } from './building';

describe('Building', () => {
  let service: Building;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Building);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
