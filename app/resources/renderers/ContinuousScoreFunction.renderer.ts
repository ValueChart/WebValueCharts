/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:41:27
* @Last Modified by:   aaronpmishkin
<<<<<<< e3ce95e43af878580ac692fe03af75398cead44a
* @Last Modified time: 2016-06-10 15:04:14
=======
* @Last Modified time: 2016-06-10 14:58:37
>>>>>>> Set up ValueFunctionRenderer and its child classed to render both horizontally and vertically.
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

// This class contains the logic for creating and rendering the a ContinuousScoreFunction for an Objective as a scatter plot chart. 

@Injectable()
export class ContinuousScoreFunctionRenderer extends ScoreFunctionRenderer {

	public pointsContainer: any;
	public plottedPoints: any;
	public linesContainer: any;
	public fitLines: any;

	constructor(chartDataService: ChartDataService) {
		super(chartDataService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);

		// Create the continuous score function specific element containers
		this.pointsContainer = plotElementsContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-points-container', true);

		this.linesContainer = plotElementsContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-fitline-container', true);

		this.createContinuousPlotElements(this.pointsContainer, this.linesContainer, objective, domainElements);
	}

	createContinuousPlotElements(pointsContainer: any, linesContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Create a point for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		pointsContainer.selectAll('.scorefunction-' + objective.getName() + '-point')
			.data(domainElements)
			.enter().append('circle')
			.classed('scorefunction-' + objective.getName() + '-point', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-point';
			});

		this.plottedPoints = pointsContainer.selectAll('.scorefunction-' + objective.getName() + '-point');

		// Each fit line connects domain element i to i + 1 in the plot. This means that we need to create one fewer lines than domain elements.
		// To do this, we simply remove the last domain element from the list before we create the lines.
		domainElements.pop();

		// Create a slope line for each new adjacent pair of elements in the Objective's domain. Note that this is all elements when the plot is first created.
		linesContainer.selectAll('.scorefunction-' + objective.getName() + '-fitline')
			.data(domainElements)
			.enter().append('line')
			.classed('scorefunction-' + objective.getName() + '-fitline', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-fitline';
			});

		this.fitLines = linesContainer.selectAll('.scorefunction-' + objective.getName() + '-fitline');
	}

	// This method overrides the rednerPlot method in ScoreFunctionRenderer in order to render ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, viewOrientation);

		this.renderContinuousPlot(plotElementsContainer, objective, (<ContinuousScoreFunction>scoreFunction), <number[]>domainElements, viewOrientation);

	}

	renderContinuousPlot(plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ContinuousScoreFunction, domainElements: number[], viewOrientation: string): void {
		var pointRadius = this.labelOffset / 3;

		var heightScale = d3.scale.linear()
			.domain([0, 1])
			.range([0, this.domainAxisCoordinateTwo - pointRadius]);

		if (viewOrientation === 'vertical') {
			heightScale.range([0, this.domainAxisCoordinateTwo - pointRadius]);
		} else {
			heightScale.range([this.domainAxisCoordinateTwo, this.utilityAxisMaxCoordinateTwo - pointRadius]);
		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculatePointCoordinateTwo = (d: (string | number)) => { 
			return (viewOrientation === 'vertical') ? (this.domainAxisCoordinateTwo) - heightScale(scoreFunction.getScore(+d)) : heightScale(scoreFunction.getScore(+d)); 
		};

		plotElementsContainer.selectAll('circle')
			.attr('c' + this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr('c' + this.coordinateTwo, calculatePointCoordinateTwo)
			.attr('r', pointRadius)
			.style('fill', objective.getColor());

		plotElementsContainer.selectAll('line')
			.attr(this.coordinateOne  + '1', this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo + '1', calculatePointCoordinateTwo)
			.attr(this.coordinateOne  + '2', (d: (string | number), i: number) => { return this.calculatePlotElementCoordinateOne(d, i + 1); })
			.attr(this.coordinateTwo + '2', (d: (string | number), i: number) => { return calculatePointCoordinateTwo(domainElements[i + 1]); })
			.style('stroke', 'black')
			.style('stroke-width', 1);
	}
}





