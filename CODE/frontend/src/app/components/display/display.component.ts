import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import * as d3 from 'd3';
import { Drug, DrugName } from '../../models/drug.model';
import { DrugService } from '../../services/drug/drug.service';
import { MapperService } from '../../services/mapper/mapper.service';

// Define the custom Node interface to fix type errors
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string | DrugName;
  degree: number;
  isSimilar: boolean;
}

// Define the Link interface for better type safety
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
}

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit, OnChanges {
  @Input() recommended: Drug;
  _current: Drug;
  _currentName: string;
  _currentSimilar: string[] = [];
  _currentInteractions: string[] = [];
  currentDrug: Drug;
  private _width = 600;
  private _height = 600;
  private svg: any;
  private simulation: d3.Simulation<GraphNode, GraphLink>;

  constructor(
    private logger: NGXLogger,
    private mapperService: MapperService,
    private drugService: DrugService
  ) {}

  ngOnInit() {
    this._width = 600;
    this._height = 600;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.recommended && changes.recommended.currentValue) {
      this._current = changes.recommended.currentValue;
      this._currentName = this._current.name || this._current.genericName;
      
      // Extract similar drug names
      this._currentSimilar = this._current.similar 
        ? this._current.similar.map(drug => drug.genericName || drug.name || 'Unknown')
        : [];
      
      // Extract interaction drug names
      this._currentInteractions = this._current.interactions 
        ? this._current.interactions.map(drug => drug.genericName || drug.name || 'Unknown')
        : [];
      
      this.logger.debug('DisplayComponent: Receive new drug:', this._current);
      if (this._width > 0 && this._height > 0) {
        this.drawGraph();
      }
    }
  }

  set current(val: Drug) {
    this._current = val;
    this._currentName = val ? val.name : '';
    this.logger.debug(
      `DisplayComponent.set.current: Set current drug to ${
        val ? val.genericName : 'null'
      }`
    );
  }

  get current(): Drug {
    return this._current;
  }

  private drawGraph() {
    this.logger.debug('DisplayComponent.drawGraph: Draw a new graph.');
    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };

    // Remove previous graph if exists
    d3.select('.graph')
      .select('svg')
      .remove();

    // append the svg object to the body of the page
    this.svg = d3
      .select('.graph')
      .append('svg')
      .attr('width', this._width)
      .attr('height', this._height)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Create the data for the graph
    const links: GraphLink[] = [];
    const nodes: GraphNode[] = [];
    
    if (this._current) {
      this.createLinks(this._current, links);
      this.createNodes(this._current, nodes, this.simulation);
    }

    // Initialize the links
    const link = this.svg
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('stroke', '#aaa')
      .style('stroke-width', 2);

    // Initialize the nodes
    const node = this.svg
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g');
      
    // Simple method that works with most D3 versions
    const drag = d3.drag()
      .on('start', (d: any) => {
        if (this.simulation) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (d: any) => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
      .on('end', (d: any) => {
        if (this.simulation) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
      
    node.call(drag as any);

    // Specify the size of the circle
    node
      .append('circle')
      .attr('r', (d: any) => {
        const drugNode = d as unknown as GraphNode;
        return drugNode.isSimilar ? 15 : 25; // Recommended drug is larger
      })
      .style('fill', (d: any) => {
        const drugNode = d as unknown as GraphNode;
        return drugNode.isSimilar ? '#03a9f4' : '#8bc34a'; // Recommended=green, Similar=blue
      })
      .style('stroke', 'white')
      .style('stroke-width', 2);

    // Add a label at each node
    node
      .append('text')
      .attr('dx', 0)
      .attr('dy', (d: any) => {
        const drugNode = d as unknown as GraphNode;
        return drugNode.isSimilar ? 0 : 5; // Center text better
      })
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .style('font-size', (d: any) => {
        const drugNode = d as unknown as GraphNode;
        return drugNode.isSimilar ? '10pt' : '12pt';
      })
      .text((d: any) => {
        const drugNode = d as unknown as GraphNode;
        const name = this.getNodeName(drugNode);
        const maxLength = drugNode.isSimilar ? 8 : 12;
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
      });

    // Let's list the force we want to add to the simulation
    this.simulation = d3
      .forceSimulation<GraphNode, GraphLink>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(this._width / 2, this._height / 2))
      .force('collision', d3.forceCollide().radius(40)) // Prevent node overlap
      .on('tick', () => this.ticked(link, node));
  }

  private getNodeName(node: GraphNode): string {
    if (typeof node.name === 'string') {
      return node.name;
    } else if (node.name) {
      return node.name.genericName || node.name.brandName || '';
    }
    return '';
  }

  private createLinks(graph: Drug, links: GraphLink[]) {
    if (!graph.similar) {
      return;
    }
    for (const similar of graph.similar) {
      links.push({
        source: graph.id || graph.genericName,
        target: similar.id || similar.genericName
      });
    }
  }

  private createNodes(graph: Drug, nodes: GraphNode[], simulation: d3.Simulation<GraphNode, GraphLink>) {
    if (!graph) return;
    
    const nodeId = graph.id || graph.genericName;
    if (nodes.findIndex(n => n.id === nodeId) >= 0) {
      return;
    }
    
    // Add the main (recommended) drug node
    nodes.push({
      id: nodeId,
      name: graph.name || graph.genericName,
      degree: 0,
      isSimilar: false // This is the recommended drug, not a similar one
    });

    if (!graph.similar) {
      return;
    }
    
    // Add all similar drug nodes
    for (const similar of graph.similar) {
      // For similar drugs, we might not have the full Drug object yet
      // So we add a basic node with the information we have
      const similarId = similar.id || similar.genericName;
      if (nodes.findIndex(n => n.id === similarId) < 0) {
        nodes.push({
          id: similarId,
          name: similar,
          degree: 1,
          isSimilar: true // Mark as similar drug
        });
      }
    }
  }

  private ticked(link: any, node: any) {
    link
      .attr('x1', (d: GraphLink) => (d.source as any).x)
      .attr('y1', (d: GraphLink) => (d.source as any).y)
      .attr('x2', (d: GraphLink) => (d.target as any).x)
      .attr('y2', (d: GraphLink) => (d.target as any).y);
    node.attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`);
  }

  // Change current drug to the selected one
  changeCurrent(name: DrugName) {
    this.drugService.get(name.genericName).subscribe(d => {
      this.currentDrug = d;
      this.drawGraph();
    });
  }

  // Get name as id for the current node
  private getId(data: GraphNode): string {
    return data.id;
  }
}
