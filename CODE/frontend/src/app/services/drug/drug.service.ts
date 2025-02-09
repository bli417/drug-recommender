import { Injectable, Inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Drug, DrugName } from 'src/app/models/drug.model';
import { HttpClient } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DrugService {
  private readonly CACHE_SIZE = 2;
  private cache$: Map<string, Observable<Drug>>;

  constructor(
    private http: HttpClient,
    @Inject('API') private api: string,
    private logger: NGXLogger
  ) {
    this.cache$ = new Map<string, Observable<Drug>>();
  }

  /**
   * Get drug detail from cache; If not find in cache, get it from backend
   * @param name String representation of drug name
   */
  get(name: DrugName): Observable<Drug> {
    this.logger.debug(
      `DrugService.get: Attempt to retrieve data from cache using generic name (${
        name.genericName
      }) and brand name (${name.brandName}).`
    );
    const key = `?generic=${name.genericName}&brand=${name.brandName}`;
    if (!this.cache$.has(key)) {
      this.logger.debug(
        `DrugService.get: Unable to find data for ${key} in cache, retrieving data from API.`
      );
      this.cache$.set(
        key,
        this.requestDrugDetails(name).pipe(shareReplay(this.CACHE_SIZE))
      );
    }

    return this.cache$.get(key);
  }

  // Get drug detail for the given name from backend
  private requestDrugDetails(name: DrugName) {
    return this.http.get<Drug>(
      `${this.api}multi/?generic=${name.genericName}&brand=${name.brandName}`
    );
  }
}
