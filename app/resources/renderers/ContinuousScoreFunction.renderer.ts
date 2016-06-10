/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:41:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-10 11:03:08
*/

import { Injectable } 					from '@angular/core';

// d3
import * as d3 							from 'd3';

// Application Classes
import { ChartDataService }				from '../services/ChartData.service';
import { ScoreFunctionRenderer }		from './ScoreFunction.renderer';


// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';


@Injectable()
export class ContinuousScoreFunctionRenderer extends ScoreFunctionRenderer {

	public pointsContainer: any;
	public plottedPoints: any;
	public linesContainer: any;
	public fitLines: any;

	constructor(chartDataService: ChartDataService) {
		super(chartDataService);
	}

	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);

		this.pointsContainer = plotElementsContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-points-container', true);

		this.linesContainer = plotElementsContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-fitline-container', true);

		this.createContinuousPlotElements(this.pointsContainer, this.linesContainer, objective, domainElements);
	}

	createContinuousPlotElements(pointsContainer: any, linesContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {

		pointsContainer.selectAll('.scorefunction-' + objective.getName() + '-point')
			.data(domainElements)
			.enter().append('circle')
			.classed('scorefunction-' + objective.getName() + '-point', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-point';
			});

		this.plottedPoints = pointsContainer.selectAll('.scorefunction-' + objective.getName() + '-point');

		domainElements.pop();

		linesContainer.selectAll('.scorefunction-' + objective.getName() + '-fitline')
			.data(domainElements)
			.enter().append('line')
			.classed('scorefunction-' + objective.getName() + '-fitline', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-fitline';
			});

		this.fitLines = linesContainer.selectAll('.scorefunction-' + objective.getName() + '-fitline');
	}

	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], width: number, height: number): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, width, height);

		this.renderContinuousPlot(plotElementsContainer, objective, (<ContinuousScoreFunction>scoreFunction), <number[]>domainElements, width, height);

	}

	renderContinuousPlot(plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ContinuousScoreFunction, domainElements: number[], width: number, height: number): void {
		var pointRadius = this.labelOffset / 3;

		var heightScale = d3.scale.linear()
			.domain([0, 1])
			.range([0, this.xAxisYCoordinate - pointRadius]);

		var calculatePointCoordinateTwo = (d: (string | number)) => { return (this.xAxisYCoordinate) - heightScale(scoreFunction.getScore(+d)); };

		plotElementsContainer.selectAll('circle')
			.attr('cx', this.calculatePlotElementCoordinateOne)
			.attr('cy', calculatePointCoordinateTwo)
			.attr('r', pointRadius)
			.style('fill', objective.getColor());

		plotElementsContainer.selectAll('line')
			.attr('x1', this.calculatePlotElementCoordinateOne)
			.attr('y1', calculatePointCoordinateTwo)
			.attr('x2', (d: (string | number), i: number) => { return this.calculatePlotElementCoordinateOne(d, i + 1); })
			.attr('y2', (d: (string | number), i: number) => { return calculatePointCoordinateTwo(domainElements[i + 1]); })
			.style('stroke', 'black')
			.style('stroke-width', 1);
	}
}