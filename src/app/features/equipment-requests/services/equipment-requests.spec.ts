import { TestBed } from '@angular/core/testing';

import { EquipmentRequests } from './equipment-requests';

describe('EquipmentRequests', () => {
  let service: EquipmentRequests;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EquipmentRequests);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
