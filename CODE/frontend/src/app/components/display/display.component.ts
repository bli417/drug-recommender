import { DrugName } from 'src/app/models/drug.model';
import { Drug } from './../../models/drug.model';
import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import { MapperService } from 'src/app/services/mapper/mapper.service';
import { NGXLogger } from 'ngx-logger';
import { Node } from 'src/app/models/mapping.model';
import { DrugService } from 'src/app/services/drug/drug.service';

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit, AfterViewInit {
  _current: Drug;
  _currentName: string;
  _currentSimilar: string[];
  _currentInteractions: string[];
  private _width: number;
  private _height: number;

  constructor(
    private mapperService: MapperService,
    private drugService: DrugService,
    private logger: NGXLogger
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    const size = document
      .getElementsByClassName('graph')
      .item(0)
      .getBoundingClientRect();

    this._width = size.width;
    this._height = size.height;

    if (this._current) {
      this.draw();
    }
  }

  /**
   * Object representation of recommended drug
   */
  @Input()
  set currentDrug(input: Drug) {
    this._current = input;
    this._currentName = this._current.genericName.split(/(\s-\s)|,/)[0];
    this._currentSimilar = this._current.similar
      ? this._current.similar.map(({ genericName }) => genericName)
      : new Array();
    this._currentInteractions = this._current.interactions
      ? this._current.interactions.map(({ genericName }) => genericName)
      : new Array();
    if (this._width > 0 && this._height > 0) {
      this.draw();
    }
  }

  // Draw the d3 graph
  private draw() {
    d3.selectAll('svg > *').remove();
    this.logger.debug(
      `DisplayComponent.draw: Drawing the D3 graph for ${
        this._current.genericName
      }`
    );

    this.CreateMapping().then(m => {
      const nodes = m.nodes.map(d => Object.create(d));
      const links = m.links.map(d => Object.create(d));

      const graph = d3.select('svg');
      const simulation = d3
        .forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(this.getId))
        .force('charge', d3.forceManyBody().strength(-20))
        .force('center', d3.forceCenter(this._width / 2, this._height / 2))
        .force('collide', d3.forceCollide().radius(51));

      const link = this.createLinks(graph, links);
      const node = this.createNodes(graph, nodes, simulation);
      simulation.on('tick', () => this.ticked(link, node));
    });
  }

  // Create mapping for currently recommended drug
  private async CreateMapping() {
    return await this.mapperService.get(this._current);
  }

  // Create links
  private createLinks(graph, links) {
    return graph
      .append('g')
      .attr('stroke', '#bdbdbd')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', 2);
  }

  // Create nodes and labels
  private createNodes(graph, nodes, simulation) {
    const node = graph
      .append('g')
      .selectAll('.node')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 0.5)
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag()
          .on('start', d => this.onDragStart(d, simulation))
          .on('drag', this.onDragged)
          .on('end', d => this.onDragEnded(d, simulation))
      )
      .on('click', d => {
        this.changeCurrent(d.name);
      });

    // Add nodes
    node
      .append('circle')
      .attr('r', this.getSize)
      .attr('fill', this.getColor);

    // Add labels
    node
      .append('text')
      .attr('class', 'label')
      .style('cursor', 'default')
      .style('text-anchor', 'middle')
      .style('font-size', d => (d.degree < 1 ? '12pt' : '8pt'))
      .text(d =>
        d.degree < 2 ? d.name.genericName.split(/(\s-\s)|,/)[0] : ''
      );
    return node;
  }

  // Update nodes and links to the correct location
  private ticked(link, node) {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  }

  // Change currently recommended drug to the one selected by user
  private changeCurrent(name: DrugName) {
    this.logger.debug(
      `DisplayComponent.changeCurrent: Change current recommended drug to generic name(${
        name.genericName
      }) and brand name (${name.brandName})`
    );
    this.drugService.get(name).subscribe(d => (this.currentDrug = d));
  }

  // Get name as id for the current node
  private getId(data: Node) {
    return data.id;
  }

  // Get node radius for the provided node
  private getSize(data: Node) {
    switch (data.degree) {
      case 0:
        return 50;
      case 1:
        return 20;
      case 2:
        return 10;
      default:
        return 5;
    }
  }

  // Get color for the provided node
  private getColor(data: Node) {
    switch (data.degree) {
      case 0:
        return '#8bc34a';
      case 1:
        if (data.isSimilar) {
          return '#03a9f4';
        }
        return '#ef5350';
      default:
        if (data.isSimilar) {
          return '#77a1b4';
        }
        return '#b68887';
    }
  }

  // Update node location on drag start
  private onDragStart(d, simulation) {
    if (!d3.event.active) {
      simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  // Update node location on drag
  private onDragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  // Fix node location on drag ended
  private onDragEnded(d, simulation) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    if (!d3.event.active) {
      simulation.alphaTarget(0);
    }
  }
}
