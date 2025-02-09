import { DrugService } from './../drug/drug.service';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Mapping, Node } from 'src/app/models/mapping.model';
import { DrugName, Drug } from 'src/app/models/drug.model';

@Injectable({
  providedIn: 'root'
})
export class MapperService {
  constructor(private drugService: DrugService, private logger: NGXLogger) {}

  /**
   * Get mapping for the provided drug
   * @param name String representation of drug name
   */
  get(drug: Drug) {
    this.logger.debug(
      `MapperService.get: Start creating mapping for generic name(${
        drug.genericName
      }) and brand name (${drug.brandName})`
    );
    return this._explore(drug);
  }

  // Find more similar drugs and generate mappings
  private async _explore(d0: Drug) {
    const rootMapping = <Mapping>{
      nodes: [this.__generateNode(d0, 0)],
      links: []
    };
    if (d0.similar && d0.similar.length > 1) {
      const m23 = await Promise.all(
        d0.similar
          .map(s => this.drugService.get(s).toPromise())
          .map(async d1 => {
            const drug1 = await d1;
            if (drug1.similar && drug1.similar.length > 1) {
              const m3 = await Promise.all(
                drug1.similar
                  .map(s => this.drugService.get(s).toPromise())
                  .map(async d2 => {
                    const drug2 = await d2;
                    return this.__createMapping(drug2, 3);
                  })
              );
              m3.push(this.__createMapping(drug1, 2));
              return this.__reduce(m3);
            } else {
              return <Mapping>{ nodes: new Array(), links: new Array() };
            }
          })
      );
      m23.push(this.__createMapping(d0, 1));
      m23.push(rootMapping);

      return this.__reduce(m23);
    } else {
      return rootMapping;
    }
  }

  // Create mappings for the given drug
  private __createMapping(drug: Drug, degree: number): Mapping {
    const mappings = drug.similar.map(
      s =>
        <Mapping>{
          nodes: [this.__generateNode(s, degree)],
          links: [this.__generateLink(drug, s)]
        }
    );
    return this.__reduce(mappings);
  }

  // Merge the array of mappings into one
  private __reduce(mappings: Mapping[]): Mapping {
    const finalNodes: Node[] = new Array();
    mappings
      .map(m => m.nodes)
      .reduce((n1, n2) => [...n1, ...n2], [])
      .forEach(n => {
        const result = finalNodes.filter(f => f.id === n.id);
        if (result.length > 0) {
          const oldNode = result[0];
          if (n.degree > oldNode.degree) {
            oldNode.degree = n.degree;
          }
        } else {
          finalNodes.push(n);
        }
      });
    const links = mappings
      .map(m => m.links)
      .reduce((l1, l2) => [...l1, ...l2], []);
    return { nodes: finalNodes, links: links };
  }

  // Create node for the given drug name
  private __generateNode(drug: DrugName, degree: number) {
    const targetId = `${drug.genericName}:${drug.brandName}`;
    return {
      id: targetId,
      name: drug,
      degree: degree,
      isSimilar: true
    };
  }

  // Create link for the given drugs
  private __generateLink(root: Drug, drug: DrugName) {
    return {
      source: `${root.genericName}:${root.brandName}`,
      target: `${drug.genericName}:${drug.brandName}`
    };
  }
}
