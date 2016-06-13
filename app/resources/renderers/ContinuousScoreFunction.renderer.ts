/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:41:27
* @Last Modified by:   aaronpmishkin
<<<<<<< e3ce95e43af878580ac692fe03af75398cead44a
* @Last Modified time: 2016-06-13 15:16:32
=======
* @Last Modified time: 2016-06-10 14:58:37
>>>>>>> Set up ValueFunctionRenderer and its child classed to render both horizontally and vertically.
*/

import { Injectable } 					from '@angular/core';
import { NgZone }						from '@angular/core';


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

	private heightScale: any;

	constructor(chartDataService: ChartDataService, private ngZone: NgZone) {
		super(chartDataService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);
		
		// Create the continuous score function specific element containers
		this.linesContainer = plotElementsContainer.append('g')
			.classed('scorefunction-fitline-container', true)
			.attr('id', 'scorefunction-' + objective.getName() + '-fitline-container');

		this.pointsContainer = plotElementsContainer.append('g')
			.classed('scorefunction-points-container', true)
			.attr('id','scorefunction-' + objective.getName() + '-points-container');


		this.createContinuousPlotElements(this.pointsContainer, this.linesContainer, objective, domainElements);
	}

	createContinuousPlotElements(pointsContainer: any, linesContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Create a point for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		pointsContainer.selectAll('.scorefunction-point')
			.data(domainElements)
			.enter().append('circle')
				.classed('scorefunction-point', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objective.getName() + '-' + d + '-point';
				});

		this.plottedPoints = pointsContainer.selectAll('.scorefunction-point');

		// Each fit line connects domain element i to i + 1 in the plot. This means that we need to create one fewer lines than domain elements.
		// To do this, we simply remove the last domain element from the list before we create the lines.
		domainElements.pop();

		// Create a slope line for each new adjacent pair of elements in the Objective's domain. Note that this is all elements when the plot is first created.
		linesContainer.selectAll('.scorefunction-fitline')
			.data(domainElements)
			.enter().append('line')
				.classed('scorefunction-fitline', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objective.getName() + '-' + d + '-fitline';
				});

		this.fitLines = linesContainer.selectAll('.scorefunction-fitline');
	}

	// This method overrides the rednerPlot method in ScoreFunctionRenderer in order to render ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, viewOrientation);

		this.renderContinuousPlot(plotElementsContainer, objective, (<ContinuousScoreFunction>scoreFunction), <number[]>domainElements, viewOrientation);

	}

	renderContinuousPlot(plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ContinuousScoreFunction, domainElements: number[], viewOrientation: string): void {
		var pointRadius = this.labelOffset / 2;

		this.heightScale = d3.scale.linear()
			.domain([0, 1])
			.range([0, this.domainAxisCoordinateTwo - pointRadius]);

		if (viewOrientation === 'vertical') {
			this.heightScale.range([0, this.domainAxisCoordinateTwo - pointRadius]);
		} else {
			this.heightScale.range([this.domainAxisCoordinateTwo, this.utilityAxisMaxCoordinateTwo - pointRadius]);
		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculatePointCoordinateTwo = (d: (string | number)) => { 
			return (viewOrientation === 'vertical') ? (this.domainAxisCoordinateTwo) - this.heightScale(scoreFunction.getScore(+d)) : this.heightScale(scoreFunction.getScore(+d)); 
		};

		this.plottedPoints
			.attr('c' + this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr('c' + this.coordinateTwo, calculatePointCoordinateTwo)
			.attr('r', pointRadius)
			.style('fill', objective.getColor());

		this.fitLines
			.attr(this.coordinateOne + '1', this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo + '1', calculatePointCoordinateTwo)
			.attr(this.coordinateOne + '2', (d: (string | number), i: number) => { return this.calculatePlotElementCoordinateOne(d, i + 1); })
			.attr(this.coordinateTwo + '2', (d: (string | number), i: number) => { return calculatePointCoordinateTwo(domainElements[i + 1]); });


		// Assign the callback function for when the points are dragged. Note that this must be done inside a anonymous function because we require
		// access to the scope defined by the renderContinuousPlot method.
		this.plottedPoints.call(d3.behavior.drag().on('drag', (d: any, i: number) => {
			var score: number;
			// Convert the y position of the mouse into a score by using the inverse of the scale used to convert scores into y positions:
			if (viewOrientation === 'vertical') {
				// Subtract the event y form the offset to obtain the y value measured from the bottom of the plot.
				score = this.heightScale.invert(this.domainAxisCoordinateTwo - (<any>d3.event)[this.coordinateTwo]);
			} else {
				// No need to do anything with offsets here because x is already left to right.
				score = this.heightScale.invert((<any>d3.event)[this.coordinateTwo]);
			}
			score = Math.max(0, Math.min(score, 1)); // Normalize the score to be between 0 and 1.

			// Run inside the angular zone. Angular is not necessarily aware of this function executing because it is triggered by a d3 event, which 
			// exists outside of angular. In order to make sure that change detection is triggered, we must do the value assignment inside the "Angular Zone".
			this.ngZone.run(() => { scoreFunction.setElementScore(d, score) });

		}));
	}
}





