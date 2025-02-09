import { DrugName } from './drug.model';

export interface Mapping {
  nodes: Node[];
  links: Link[];
}

export interface Node {
  id: string;
  name: DrugName;
  degree: number;
  isSimilar: boolean;
}

export interface Link {
  source: string;
  target: string;
}
