import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Drug, DrugName } from '../../models/drug.model';
import { DrugService } from '../drug/drug.service';
import { Node, Mapping, Link } from '../../models/mapping.model';

@Injectable({
  providedIn: 'root'
})
export class MapperService {
  constructor(private drugService: DrugService, private logger: NGXLogger) {}

  /**
   * Get mapping for the given drug
   * @param drug - Drug to get mapping for
   */
  async get(drug: Drug): Promise<Mapping> {
    this.logger.debug(
      `MapperService.get: Getting mapping for drug ${drug.name || drug.genericName}`
    );

    const nodes: Node[] = new Array();
    const links: Link[] = new Array();
    const mapping: Mapping = {
      nodes: nodes,
      links: links
    };

    this.createMapping(drug, 1, mapping);
    return mapping;
  }

  /**
   * Create mapping for the given drug recursively
   * @param drug - Drug to create mapping for
   * @param depth - Current depth of recursion
   * @param mapping - Current mapping object
   */
  private createMapping(drug: Drug, depth: number, mapping: Mapping): Mapping {
    if (!drug || depth < 1) {
      return mapping;
    }

    // Add nodes for similar drugs
    if (drug.similar && drug.similar.length > 0) {
      for (const similar of drug.similar) {
        if (similar) {
          const nodeId = similar.id || similar.genericName;
          
          mapping.nodes.push({
            name: { 
              genericName: similar.genericName, 
              brandName: similar.brandName 
            },
            id: nodeId,
            degree: depth,
            isSimilar: true
          });
          
          // Add links between the current drug and similar drugs
          mapping.links.push({
            source: drug.id || drug.genericName,
            target: nodeId
          });
        }
      }
    }

    return mapping;
  }

  // Find more similar drugs and generate mappings
  private async _explore(d0: Drug) {
    const rootMapping: Mapping = {
      nodes: [this.__generateNode(d0, 0)],
      links: []
    };
    
    if (d0.similar && d0.similar.length > 1) {
      const promises = d0.similar
        .map(s => this.drugService.get(s.genericName).toPromise())
        .map(async d1Promise => {
          const drug1 = await d1Promise;
          if (drug1.similar && drug1.similar.length > 1) {
            const m3 = await Promise.all(
              drug1.similar
                .map(s => this.drugService.get(s.genericName).toPromise())
                .map(async d2Promise => {
                  const drug2 = await d2Promise;
                  return this.__createMapping(drug2, 3);
                })
            );
            m3.push(this.__createMapping(drug1, 2));
            return this.__reduce(m3);
          } else {
            return { nodes: [], links: [] } as Mapping;
          }
        });
      
      const m23 = await Promise.all(promises);
      m23.push(this.__createMapping(d0, 1));
      m23.push(rootMapping);

      return this.__reduce(m23);
    } else {
      return rootMapping;
    }
  }

  // Create mappings for the given drug
  private __createMapping(drug: Drug, degree: number): Mapping {
    if (!drug.similar) return { nodes: [], links: [] };
    
    const mappings = drug.similar.map(
      s => {
        return {
          nodes: [this.__generateNode(s, degree)],
          links: [this.__generateLink(drug, s)]
        } as Mapping;
      }
    );
    return this.__reduce(mappings);
  }

  // Merge the array of mappings into one
  private __reduce(mappings: Mapping[]): Mapping {
    const finalNodes: Node[] = [];
    
    // Combine and deduplicate nodes
    const allNodes = mappings.flatMap(m => m.nodes);
    
    for (const n of allNodes) {
      const existingNode = finalNodes.find(f => f.id === n.id);
      if (existingNode) {
        if (n.degree > existingNode.degree) {
          existingNode.degree = n.degree;
        }
      } else {
        finalNodes.push(n);
      }
    }
    
    // Combine links
    const links = mappings.flatMap(m => m.links);
    
    return { nodes: finalNodes, links };
  }

  // Create node for the given drug name
  private __generateNode(drug: DrugName, degree: number): Node {
    const targetId = `${drug.genericName}:${drug.brandName}`;
    return {
      id: targetId,
      name: drug,
      degree: degree,
      isSimilar: true
    };
  }

  // Create link for the given drugs
  private __generateLink(root: Drug, drug: DrugName): Link {
    return {
      source: `${root.genericName}:${root.brandName}`,
      target: `${drug.genericName}:${drug.brandName}`
    };
  }
}
