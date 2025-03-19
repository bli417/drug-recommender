import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { NGXLogger } from 'ngx-logger';
import { SymptomService } from '../../services/symptom/symptom.service';
import { RecommendService } from '../../services/recommend/recommend.service';
import { Symptom } from '../../models/symptom.model';
import { Drug } from '../../models/drug.model';

@Component({
  selector: 'app-inputs',
  templateUrl: './inputs.component.html',
  styleUrls: ['./inputs.component.scss']
})
export class InputsComponent implements OnInit {
  @Output() recommended = new EventEmitter<Drug>();
  symptoms: Symptom[] = [];
  dailyMedicines: string[] = [];
  allergies: string[] = [];
  selectedSymptom: Symptom | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private logger: NGXLogger,
    private symptomService: SymptomService,
    private recommendService: RecommendService
  ) {}

  ngOnInit() {
    this.loadSymptoms();
  }

  loadSymptoms() {
    this.symptomService.getSymptoms().subscribe(
      (symptoms) => {
        this.symptoms = symptoms;
        this.logger.debug('Loaded symptoms:', symptoms);
      },
      (error) => {
        this.errorMessage = 'Failed to load symptoms. Please try again later.';
        this.logger.error('Error loading symptoms:', error);
      }
    );
  }

  addDaily(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.dailyMedicines.push(value);
      event.input.value = '';
    }
  }

  removeDaily(medicine: string): void {
    const index = this.dailyMedicines.indexOf(medicine);
    if (index >= 0) {
      this.dailyMedicines.splice(index, 1);
    }
  }

  addAllergy(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.allergies.push(value);
      event.input.value = '';
    }
  }

  removeAllergy(allergy: string): void {
    const index = this.allergies.indexOf(allergy);
    if (index >= 0) {
      this.allergies.splice(index, 1);
    }
  }

  search(symptom: Symptom) {
    if (!symptom) {
      this.logger.warn('No symptom selected');
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedSymptom = symptom;
    
    this.logger.debug('Searching for symptom:', symptom);
    this.logger.debug('Daily medicines:', this.dailyMedicines);
    this.logger.debug('Allergies:', this.allergies);
    
    this.recommendService.recommend(
      symptom.name,
      this.dailyMedicines,
      this.allergies
    ).subscribe(
      (drug) => {
        this.logger.debug('Recommended drug:', drug);
        this.recommended.emit(drug);
        this.isLoading = false;
      },
      (error) => {
        this.logger.error('Error getting recommendation:', error);
        this.errorMessage = 'Failed to get drug recommendation. Please try again later.';
        this.isLoading = false;
      }
    );
  }
}
