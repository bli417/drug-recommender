import { TestBed } from '@angular/core/testing';

import { RecommendService } from './recommend.service';

describe('RecommendService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RecommendService = TestBed.get(RecommendService);
    expect(service).toBeTruthy();
  });
});
