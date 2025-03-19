import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Symptom } from '../../models/symptom.model';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private apiUrl: string;
  private mockSymptoms: Symptom[] = [
    { id: 1, name: 'Fever', description: 'Elevated body temperature' },
    { id: 2, name: 'Headache', description: 'Pain in the head or upper neck' },
    { id: 3, name: 'Cough', description: 'Sudden expulsion of air from the lungs' },
    { id: 4, name: 'Sore Throat', description: 'Pain or irritation in the throat' },
    { id: 5, name: 'Body Pain', description: 'General pain throughout the body' },
    { id: 6, name: 'Fatigue', description: 'Extreme tiredness resulting from physical or mental exertion' },
    { id: 7, name: 'Nausea', description: 'Sensation of unease and discomfort in the stomach' },
    { id: 8, name: 'Vomiting', description: 'Forceful expulsion of stomach contents through the mouth' },
    { id: 9, name: 'Diarrhea', description: 'Loose, watery stools' },
    { id: 10, name: 'Rash', description: 'Area of reddened, irritated, or swollen skin' }
  ];

  constructor(
    private http: HttpClient, 
    private logger: NGXLogger,
    @Inject('API') private baseUrl: string
  ) {
    this.apiUrl = `${this.baseUrl}/symptoms`;
  }

  getSymptoms(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(this.apiUrl).pipe(
      catchError(error => {
        this.logger.warn('Failed to load symptoms from API, using mock data', error);
        return of(this.mockSymptoms);
      })
    );
  }

  getSymptomById(id: number): Observable<Symptom> {
    return this.http.get<Symptom>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        const symptom = this.mockSymptoms.find(s => s.id === id);
        if (symptom) {
          this.logger.warn(`Failed to load symptom ${id} from API, using mock data`, error);
          return of(symptom);
        }
        throw error;
      })
    );
  }
} 