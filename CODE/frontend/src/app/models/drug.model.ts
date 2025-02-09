/* Model interface for drug information */
export interface Drug {
  genericName: string;
  brandName: string;
  purpose: string;
  warnings: string;
  similar: DrugName[];
  interactions: DrugName[];
}

export interface DrugName {
  genericName: string;
  brandName: string;
}
