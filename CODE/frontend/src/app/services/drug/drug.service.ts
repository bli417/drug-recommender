import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { Drug } from '../../models/drug.model';

@Injectable({
  providedIn: 'root'
})
export class DrugService {
  private cache = new Map<string, Observable<Drug>>();

  constructor(
    private http: HttpClient,
    private logger: NGXLogger,
    @Inject('API') private apiUrl: string
  ) {}

  /**
   * Get drug by name
   * @param name - Name of the drug
   */
  get(name: string): Observable<Drug> {
    this.logger.debug(`DrugService.get: Getting drug by name ${name}`);
    const key = this.normalize(name);
    
    // Return from cache if available
    const cachedResult = this.cache.get(key);
    if (cachedResult) {
      this.logger.debug(`DrugService.get: Found ${name} in cache.`);
      return cachedResult;
    }

    // Otherwise, fetch from API and cache
    const result = this.http.get<Drug>(`${this.apiUrl}/drug/${key}`).pipe(
      map(drug => {
        // Add id and name properties if they don't exist
        if (!drug.id) {
          drug.id = key;
        }
        if (!drug.name) {
          drug.name = drug.genericName || drug.brandName;
        }
        return drug;
      })
    );
    
    this.cache.set(key, result);
    return result;
  }

  /**
   * Normalize drug name for API query
   * @param name - Name to normalize
   */
  private normalize(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }
}
