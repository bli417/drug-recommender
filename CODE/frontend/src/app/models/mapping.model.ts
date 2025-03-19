import { DrugName } from './drug.model';

export interface Node {
  id: string;
  name: any;  // More flexible to handle both string and DrugName
  degree: number;
  isSimilar: boolean;
}

export interface Mapping {
  nodes: Node[];
  links: any[];
}

export interface Link {
  source: string;
  target: string;
}
