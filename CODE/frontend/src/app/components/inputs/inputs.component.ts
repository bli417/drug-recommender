import { RecommendService } from './../../services/recommend/recommend.service';
import { Drug } from './../../models/drug.model';
import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { NGXLogger } from 'ngx-logger';
import { MatChipInputEvent } from '@angular/material';
import { Symptoms, Symptom } from 'src/app/models/symptom.model';

@Component({
  selector: 'app-inputs',
  templateUrl: './inputs.component.html',
  styleUrls: ['./inputs.component.scss']
})
export class InputsComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly symptoms: Symptom[];
  dailies: string[];
  allergies: string[];

  /**
   * Emits the recommended medicine
   */
  @Output()
  recommended: EventEmitter<Drug>;

  constructor(
    private logger: NGXLogger,
    private recommendService: RecommendService
  ) {
    this.dailies = new Array();
    this.allergies = new Array();
    this.recommended = new EventEmitter<Drug>();
    this.symptoms = new Symptoms().get();
    logger.debug(`InputsComponent: Received ${this.symptoms.length} symptoms`);
  }

  ngOnInit() {}

  // Get recommendation from backend
  search(symptom: string) {
    if (!symptom) {
      this.logger.warn(`InputsComponent.search: symptom is not provided.`);
      return;
    }
    this.recommendService
      .recommend(symptom, this.dailies, this.allergies)
      .subscribe(drug => this.recommended.emit(drug));
  }

  // Add medicine to daily medicines array
  addDaily(event: MatChipInputEvent) {
    this.__add(event, true);
  }

  // Remove medicine from array
  removeDaily(value: string) {
    const index = this.dailies.indexOf(value);
    this.logger.debug(
      `InputsComponent.removeDaily: Remove ${value} at ${index} in daily medicines.`
    );
    if (index >= 0) {
      this.dailies.splice(index, 1);
    }
  }

  // Add allergy to allergies array
  addAllergy(event: MatChipInputEvent) {
    this.__add(event, false);
  }

  // Remove allergy from array
  removeAllergy(value: string) {
    const index = this.allergies.indexOf(value);
    this.logger.debug(
      `InputsComponent.removeAllergy: Remove ${value} at ${index} in allergies.`
    );
    if (index >= 0) {
      this.allergies.splice(index, 1);
    }
  }

  // Add item to specified array
  private __add(event: MatChipInputEvent, isDaily: boolean) {
    const input = event.input;
    const value = event.value;

    // Add our value
    if ((value || '').trim()) {
      const trimmed = value.trim();
      if (isDaily) {
        this.logger.debug(
          `InputsComponent.__add: Add ${trimmed} to daily medicines.`
        );
        this.dailies.push(trimmed);
      } else {
        this.logger.debug(
          `InputsComponent.__add: Add ${trimmed} to allergies.`
        );
        this.allergies.push(trimmed);
      }
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }
}
