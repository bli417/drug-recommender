export interface Symptom {
  id: string;
  value: string;
}

export class Symptoms {
  raw =
    // tslint:disable-next-line:max-line-length
    '[{"column0":"abdomen"},{"column0":"abdominal"},{"column0":"aches"},{"column0":"acne"},{"column0":"aging"},{"column0":"alcoholism"},{"column0":"allergies"},{"column0":"anxiety"},{"column0":"appendicitis"},{"column0":"appetite"},{"column0":"arteriosclerosis"},{"column0":"backache"},{"column0":"belching"},{"column0":"bleeding"},{"column0":"bowel"},{"column0":"bronchial"},{"column0":"bruised"},{"column0":"burn"},{"column0":"cardiovascular"},{"column0":"chilliness"},{"column0":"cold"},{"column0":"congestion"},{"column0":"coughing"},{"column0":"cramps"},{"column0":"cutting"},{"column0":"digestion"},{"column0":"discharge"},{"column0":"dizziness"},{"column0":"drowsiness"},{"column0":"dryness"},{"column0":"exhaustion"},{"column0":"fatigue"},{"column0":"fear"},{"column0":"fever"},{"column0":"flu"},{"column0":"headache"},{"column0":"hypertension"},{"column0":"infection"},{"column0":"inflammation"},{"column0":"irritated"},{"column0":"lethargy"},{"column0":"low_energy"},{"column0":"malaise"},{"column0":"menses"},{"column0":"miasmic"},{"column0":"mood_swings"},{"column0":"mucus"},{"column0":"muscles"},{"column0":"nausea"},{"column0":"odor"},{"column0":"overexertion"},{"column0":"panic"},{"column0":"paranoia"},{"column0":"phlegm"},{"column0":"psoriasis"},{"column0":"rashes"},{"column0":"redness"},{"column0":"regrow_hair"},{"column0":"restlessness"},{"column0":"shortness_breath"},{"column0":"spasms"},{"column0":"stiffness"},{"column0":"suppuration"},{"column0":"swelling"},{"column0":"swimming_sweating"},{"column0":"swish"},{"column0":"swollen"},{"column0":"tearing"},{"column0":"terror"},{"column0":"toothache"},{"column0":"trauma"},{"column0":"warts"}]';

  symptoms: Symptom[];
  constructor() {
    const r = JSON.parse(this.raw);
    this.symptoms = r.map(({ column0 }) => {
      const i = column0;
      const v = column0.replace('_', ' ');
      return { id: i, value: v };
    });
  }

  get() {
    return this.symptoms;
  }
}
