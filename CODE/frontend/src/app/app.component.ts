import { Drug } from './models/drug.model';
import { Component } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Rx Recommender';
  recommended: Drug;
  recommendExist: boolean;

  constructor(private logger: NGXLogger) {
    this.recommendExist = false;
  }

  /**
   * Pass the recommended drug to display component
   * @param drug Recommended drug
   */
  onRecommended(drug: Drug) {
    this.logger.debug('AppComponent.onRecommended: Received a recommendation.');
    this.logger.debug(drug);
    this.recommendExist = true;
    this.recommended = drug;
  }
}
