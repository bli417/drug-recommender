import { Injectable, Inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { Drug } from '../../models/drug.model';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RecommendService {
  // Mock data for testing when API is unavailable
  private mockDrugs: { [key: string]: Drug } = {
    'fever': {
      id: 'acetaminophen',
      name: 'Acetaminophen',
      genericName: 'Acetaminophen',
      brandName: 'Tylenol',
      purpose: 'Pain reliever and fever reducer',
      warnings: 'Liver warning: This product contains acetaminophen. Severe liver damage may occur if you take more than the recommended dose.',
      similar: [
        { id: 'ibuprofen', name: 'Ibuprofen', genericName: 'Ibuprofen', brandName: 'Advil' },
        { id: 'aspirin', name: 'Aspirin', genericName: 'Aspirin', brandName: 'Bayer' }
      ],
      interactions: [
        { id: 'warfarin', name: 'Warfarin', genericName: 'Warfarin', brandName: 'Coumadin' }
      ]
    },
    'headache': {
      id: 'ibuprofen',
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      brandName: 'Advil',
      purpose: 'Pain reliever, fever reducer, and anti-inflammatory',
      warnings: 'Stomach bleeding warning: This product contains an NSAID, which may cause severe stomach bleeding.',
      similar: [
        { id: 'acetaminophen', name: 'Acetaminophen', genericName: 'Acetaminophen', brandName: 'Tylenol' },
        { id: 'naproxen', name: 'Naproxen', genericName: 'Naproxen', brandName: 'Aleve' }
      ],
      interactions: [
        { id: 'aspirin', name: 'Aspirin', genericName: 'Aspirin', brandName: 'Bayer' },
        { id: 'warfarin', name: 'Warfarin', genericName: 'Warfarin', brandName: 'Coumadin' }
      ]
    },
    'cough': {
      id: 'dextromethorphan',
      name: 'Dextromethorphan',
      genericName: 'Dextromethorphan',
      brandName: 'Robitussin',
      purpose: 'Cough suppressant',
      warnings: 'Do not use if you are taking MAOIs or have taken MAOIs in the past 14 days.',
      similar: [
        { id: 'guaifenesin', name: 'Guaifenesin', genericName: 'Guaifenesin', brandName: 'Mucinex' },
        { id: 'benzonatate', name: 'Benzonatate', genericName: 'Benzonatate', brandName: 'Tessalon' }
      ],
      interactions: [
        { id: 'ssri', name: 'SSRIs', genericName: 'Selective serotonin reuptake inhibitors', brandName: 'Various' }
      ]
    },
    'allergies': {
      id: 'loratadine',
      name: 'Loratadine',
      genericName: 'Loratadine',
      brandName: 'Claritin',
      purpose: 'Antihistamine for allergy relief',
      warnings: 'Do not use if you have narrow-angle glaucoma or urinary retention.',
      similar: [
        { id: 'cetirizine', name: 'Cetirizine', genericName: 'Cetirizine', brandName: 'Zyrtec' },
        { id: 'fexofenadine', name: 'Fexofenadine', genericName: 'Fexofenadine', brandName: 'Allegra' }
      ],
      interactions: []
    },
    'sore throat': {
      id: 'benzocaine',
      name: 'Benzocaine',
      genericName: 'Benzocaine',
      brandName: 'Cepacol',
      purpose: 'Local anesthetic for pain relief',
      warnings: 'Rare but serious side effects can occur. Stop use if rash or irritation develops.',
      similar: [
        { id: 'phenol', name: 'Phenol', genericName: 'Phenol', brandName: 'Chloraseptic' },
        { id: 'menthol', name: 'Menthol', genericName: 'Menthol', brandName: 'Halls' }
      ],
      interactions: []
    },
    'default': {
      id: 'default-drug',
      name: 'Acetaminophen',
      genericName: 'Acetaminophen',
      brandName: 'Tylenol',
      purpose: 'Pain reliever and fever reducer',
      warnings: 'Liver warning: This product contains acetaminophen. Severe liver damage may occur if you take more than the recommended dose.',
      similar: [
        { id: 'ibuprofen', name: 'Ibuprofen', genericName: 'Ibuprofen', brandName: 'Advil' },
        { id: 'naproxen', name: 'Naproxen', genericName: 'Naproxen', brandName: 'Aleve' }
      ],
      interactions: []
    }
  };

  constructor(
    private http: HttpClient,
    private logger: NGXLogger,
    @Inject('API') private apiUrl: string
  ) {}

  /**
   * Get drug recommendation based on symptoms, daily medications, and allergies
   * @param symptom - The symptom to get recommendations for
   * @param daily - List of daily medications
   * @param allergies - List of allergies
   */
  recommend(
    symptom: string,
    daily: string[] = [],
    allergies: string[] = []
  ): Observable<Drug> {
    this.logger.debug(
      `RecommendService.recommend: Getting recommendation for symptom ${symptom}`
    );

    // Build query parameters
    let params = new HttpParams().set('symptom', symptom);
    
    if (daily && daily.length > 0) {
      daily.forEach(med => {
        params = params.append('daily', med);
      });
    }
    
    if (allergies && allergies.length > 0) {
      allergies.forEach(allergy => {
        params = params.append('allergy', allergy);
      });
    }

    // Make API request
    return this.http
      .get<Drug>(`${this.apiUrl}/recommend`, { params })
      .pipe(
        map(drug => {
          // Add id and name properties if they don't exist
          if (!drug.id) {
            drug.id = drug.genericName.toLowerCase().replace(/\s+/g, '-');
          }
          if (!drug.name) {
            drug.name = drug.genericName || drug.brandName;
          }
          return drug;
        }),
        catchError(error => {
          this.logger.warn('Failed to get recommendation from API, using mock data', error);
          
          // Normalize symptom text (lowercase, remove extra spaces)
          const normalizedSymptom = symptom.toLowerCase().trim();
          
          // Try to match with our mock data keys
          let mockDrug: Drug;
          
          // Find the best matching symptom
          const matchingSymptoms = Object.keys(this.mockDrugs).filter(key => 
            key !== 'default' && normalizedSymptom.includes(key)
          );
          
          if (matchingSymptoms.length > 0) {
            // Pick the first matching symptom
            mockDrug = {...this.mockDrugs[matchingSymptoms[0]]};
          } else {
            // If no match, use default
            mockDrug = {...this.mockDrugs['default']};
          }
          
          // Filter out any drugs that are in the allergies list
          if (allergies.length > 0) {
            mockDrug.similar = mockDrug.similar.filter(drug => 
              !allergies.some(allergy => 
                drug.genericName.toLowerCase().includes(allergy.toLowerCase()) || 
                drug.brandName.toLowerCase().includes(allergy.toLowerCase())
              )
            );
          }
          
          return of(mockDrug);
        })
      );
  }
}