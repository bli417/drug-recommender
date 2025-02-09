import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { Drug } from 'src/app/models/drug.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendService {
  constructor(
    private http: HttpClient,
    @Inject('API') private api: string,
    private logger: NGXLogger
  ) {}

  /**
   * Return the most recommended medicine base on user inputs
   * @param symptom string representation of user's symptom
   * @param dailies List of user's daily medicines
   * @param allergies List of user's allergies
   */
  recommend(symptom: string, dailies: string[], allergies: string[]) {
    this.logger.debug(
      `RecommendService.recommend: Search drug for ${symptom} with daily medicines (${dailies}) and allergies (${allergies}).`
    );
    return this.http.get<Drug>(
      `${this.api}?symptom=${symptom}&interactions=` +
        (dailies.length === 0 ? '' : `${dailies}`) +
        '&ingredient=' +
        (allergies.length === 0 ? '' : `${allergies}`)
    );
  }
}
