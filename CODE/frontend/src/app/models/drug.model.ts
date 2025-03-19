/* Model interface for drug information */
export interface Drug {
  id: string;               // Unique identifier
  name: string;             // Display name
  genericName: string;
  brandName: string;
  purpose: string;
  warnings: string;
  similar: DrugName[];
  interactions: DrugName[];
}

export interface DrugName {
  id: string;               // Unique identifier
  name: string;             // Display name
  genericName: string;
  brandName: string;
}
