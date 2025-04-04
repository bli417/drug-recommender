import { Drug } from './models/drug.model';
import { Component } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AppComponent {
  title = 'Rx Recommender';
  recommended: Drug;
  recommendExist: boolean;
  currentYear: number = new Date().getFullYear();

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
