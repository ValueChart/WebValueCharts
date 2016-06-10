/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 15:34:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-10 11:00:34
*/

import { Injectable } 					from '@angular/core';

// d3
import * as d3 							from 'd3';

// Application Classes
import { ChartDataService }				from '../services/ChartData.service';


// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';


@Injectable()
export abstract class ScoreFunctionRenderer {

	protected domainSize: number;

	public rootContainer: any;
	public plotOutline: any;
	public plotContainer: any;
	public domainLabelContainer: any;
	public domainLabels: any;
	public plotElementsContainer: any;
	public axisContainer: any;
	public utilityLabelContainer: any;

	protected yAxisXCoordinate: number;
	protected xAxisYCoordinate: number;
	protected yAxisTopCoordinate: number;
	protected xAxisRightCoordinate: number;

	protected labelOffset: number = 10;	// Minimum offset of the x and y axis from the edge of the container in a score function plot.

	constructor(protected chartDataService: ChartDataService) { }


	createScoreFunction(el: any, objective: PrimitiveObjective): void {
		var objectiveName: string = objective.getName();

		this.rootContainer = el;

		this.plotOutline = el.append('g')
			.classed('scorefunction-' + objectiveName + '-outline-container', true)
			.append('rect')
				.classed('scorefunction-' + objectiveName + '-outline', true)
				.style('fill', 'white')
				.style('stroke-width', 1)
				.style('stroke', 'grey');

		this.plotContainer = el.append('g')
			.classed('scorefunction-' + objectiveName + '-chart-container', true);

		this.createScoreFunctionAxis(this.plotContainer, objectiveName);

		// TODO: should make this method a member of PrimitiveObjective?
		var domainElements: (string | number)[] = this.chartDataService.getDomainElements(objective);

		this.domainLabelContainer = this.plotContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-domainlabels-container', true);

		this.plotElementsContainer = this.plotContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-plot-container', true);

		this.createPlot(this.plotElementsContainer, this.domainLabelContainer, objective, domainElements);
	}

	createScoreFunctionAxis(plotContainer: any, objectiveName: string): void {
		
		this.axisContainer = plotContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-axis-container', true);

		this.axisContainer.append('line')
			.classed('scorefunction-' + objectiveName + '-x-axis', true)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.axisContainer.append('line')
			.classed('scorefunction-' + objectiveName + '-y-axis', true)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.utilityLabelContainer = plotContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-utilitylabel-container', true);

		this.utilityLabelContainer.append('text')
			.classed('scorefunction-' + objectiveName + '-0-label', true);

		this.utilityLabelContainer.append('text')
			.classed('scorefunction-' + objectiveName + '-1-label', true);
	}

	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		var objectiveName = objective.getName();

		domainLabelContainer.selectAll('.scorefunction-' + objectiveName + '-domain-labels')
			.data(domainElements)
			.enter().append('text')
				.classed('scorefunction-' + objectiveName + '-domain-labels', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objectiveName + '-' + d + '-label';
				});

		this.domainLabels = domainLabelContainer.selectAll('.scorefunction-' + objectiveName + '-domain-labels');
	}

	renderScoreFunction(el: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, width: number, height: number): void {
		var objectiveName: string = objective.getName();

		var domainElements: (number | string)[] = this.chartDataService.getDomainElements(objective);
		var domainSize: number = domainElements.length;

		this.yAxisXCoordinate = Math.max(width / 20, this.labelOffset);
		this.xAxisYCoordinate = Math.min((19 / 20) * height, height - this.labelOffset);
		this.yAxisTopCoordinate = Math.max(height / 20, 5);
		this.xAxisRightCoordinate = Math.min((19 / 20) * width, width - this.labelOffset);

		this.plotOutline
			.select('rect')
				.attr('width', width - 1)
				.attr('height', height);


		this.renderScoreFunctionAxis(this.axisContainer, this.utilityLabelContainer, objectiveName);

		this.renderPlot(this.domainLabels, this.plotElementsContainer, objective, scoreFunction, domainElements, width, height);			
	}

	renderScoreFunctionAxis(axisContainer: any, utilityLabelContainer: any, objectiveName: string): void {

		axisContainer.select('.scorefunction-' + objectiveName + '-x-axis')
			.attr('x1', this.yAxisXCoordinate)
			.attr('y1', this.xAxisYCoordinate)
			.attr('x2', this.xAxisRightCoordinate)
			.attr('y2', this.xAxisYCoordinate);

		axisContainer.select('.scorefunction-' + objectiveName + '-y-axis')
			.attr('x1', this.yAxisXCoordinate)
			.attr('y1', this.xAxisYCoordinate)
			.attr('x2', this.yAxisXCoordinate)
			.attr('y2', this.yAxisTopCoordinate);

		utilityLabelContainer.select('.scorefunction-' + objectiveName + '-0-label')
			.text('0')
			.attr('x', this.yAxisXCoordinate - this.labelOffset)
			.attr('y', this.xAxisYCoordinate + (this.labelOffset / 2));

		utilityLabelContainer.select('.scorefunction-' + objectiveName + '-1-label')
			.text('1')
			.attr('x', this.yAxisXCoordinate - this.labelOffset)
			.attr('y', this.yAxisTopCoordinate + this.labelOffset);
	}

	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[],  width: number, height: number): void {

		this.domainSize = domainElements.length;

		domainLabels
			.attr('x', (d: (string | number), i: number) => { return (((this.xAxisRightCoordinate - this.yAxisXCoordinate) / this.domainSize) * i) + this.labelOffset; })
			.attr('y', this.xAxisYCoordinate + this.labelOffset - 2)
			.text((d: (string | number)) => { return d; })
			.style('font-size', '9px');
	}



	// Anonymous functions that are used often enough to be made class fields:

	calculatePlotElementCoordinateOne = (d: (string | number), i: number) => { return (((this.xAxisRightCoordinate - this.yAxisXCoordinate) / this.domainSize) * i) + this.labelOffset * 1.5; }



}
