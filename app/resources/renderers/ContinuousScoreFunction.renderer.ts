/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:41:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 12:05:47
*/

import { Injectable } 					from '@angular/core';
import { NgZone }						from '@angular/core';


// d3
import * as d3 							from 'd3';

// Application Classes
import { ChartDataService }				from '../services/ChartData.service';
import { ScoreFunctionRenderer }		from './ScoreFunction.renderer';
import { ChartUndoRedoService }			from '../services/ChartUndoRedo.service';


// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';

// This class contains the logic for creating and rendering the a ContinuousScoreFunction for an Objective as a scatter plot chart. 

@Injectable()
export class ContinuousScoreFunctionRenderer extends ScoreFunctionRenderer {

	public pointsContainer: d3.Selection<any>;
	public plottedPoints: d3.Selection<any>;
	public linesContainer: d3.Selection<any>;
	public fitLines: d3.Selection<any>;
	public pointLabelContainer: d3.Selection<any>;
	public pointLabels: d3.Selection<any>;

	private heightScale: d3.Linear<number, number>;

	constructor(chartDataService: ChartDataService, chartUndoRedoService: ChartUndoRedoService, private ngZone: NgZone) {
		super(chartDataService, chartUndoRedoService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	createPlot(plotElementsContainer: d3.Selection<any>, domainLabelContainer: d3.Selection<any>, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);
		
		// Create the continuous score function specific element containers
		this.linesContainer = plotElementsContainer.append('g')
			.classed('scorefunction-fitline-container', true)
			.attr('id', 'scorefunction-' + objective.getId() + '-fitline-container');

		this.pointsContainer = plotElementsContainer.append('g')
			.classed('scorefunction-points-container', true)
			.attr('id','scorefunction-' + objective.getId() + '-points-container');

		this.pointLabelContainer = plotElementsContainer.append('g')
			.classed('scorefunction-pointlabels-container', true)
			.attr('id', 'scorefunction-' + objective.getId() + '-pointlabels-container');


		this.createContinuousPlotElements(this.pointsContainer, this.linesContainer, this.pointLabelContainer, objective, domainElements);
	}

	createContinuousPlotElements(pointsContainer: d3.Selection<any>, linesContainer: d3.Selection<any>, labelsContainer: d3.Selection<any>, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Create a point for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		pointsContainer.selectAll('.scorefunction-point')
			.data(domainElements)
			.enter().append('circle')
				.classed('scorefunction-point', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objective.getId() + '-' + d + '-point';
				});

		this.plottedPoints = pointsContainer.selectAll('.scorefunction-point');

		labelsContainer.selectAll('.scorefunction-point-labels')
			.data(domainElements)
			.enter().append('text')
				.classed('scorefunction-point-labels', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objective.getId() + '-' + d + '-label';
				});

		this.pointLabels = labelsContainer.selectAll('.scorefunction-point-labels');

		// Each fit line connects domain element i to i + 1 in the plot. This means that we need to create one fewer lines than domain elements.
		// To do this, we simply remove the last domain element from the list before we create the lines.
		domainElements.pop();

		// Create a slope line for each new adjacent pair of elements in the Objective's domain. Note that this is all elements when the plot is first created.
		linesContainer.selectAll('.scorefunction-fitline')
			.data(domainElements)
			.enter().append('line')
				.classed('scorefunction-fitline', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objective.getId() + '-' + d + '-fitline';
				});

		this.fitLines = linesContainer.selectAll('.scorefunction-fitline');
	}

	// This method overrides the rednerPlot method in ScoreFunctionRenderer in order to render ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	renderPlot(domainLabels: d3.Selection<any>, plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, viewOrientation);

		this.renderContinuousPlot(plotElementsContainer, objective, (<ContinuousScoreFunction>scoreFunction), <number[]>domainElements, viewOrientation);

	}

	renderContinuousPlot(plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, scoreFunction: ContinuousScoreFunction, domainElements: number[], viewOrientation: string): void {
		var pointRadius = this.labelOffset / 2;

		this.heightScale = d3.scaleLinear()
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
			.style('fill', objective.getColor())
			.style('cursor', () => {
				return (viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			});

		this.pointLabels
			.text((d: any, i: number) => { return Math.round(100 * scoreFunction.getScore(+d)) / 100; })
			.attr(this.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + pointRadius + 2; })
			.attr(this.coordinateTwo, calculatePointCoordinateTwo)
			.style('font-size', 8);

		this.fitLines
			.attr(this.coordinateOne + '1', this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo + '1', calculatePointCoordinateTwo)
			.attr(this.coordinateOne + '2', (d: (string | number), i: number) => { return this.calculatePlotElementCoordinateOne(d, i + 1); })
			.attr(this.coordinateTwo + '2', (d: (string | number), i: number) => { return calculatePointCoordinateTwo(domainElements[i + 1]); });


		var dragToResizeScores = d3.drag();

		this.plottedPoints.call(dragToResizeScores.on('start', (d: any, i: number) => {
			// Save the current state of the ScoreFunction.
			this.chartUndoRedoService.saveScoreFunctionRecord(scoreFunction, objective);
		}));

		// Assign the callback function for when the points are dragged. Note that this must be done inside a anonymous function because we require
		// access to the scope defined by the renderContinuousPlot method.
		this.plottedPoints.call(dragToResizeScores.on('drag', (d: any, i: number) => {
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

	toggleValueLabels(displayScoreFunctionValueLabels: boolean): void {
		if (displayScoreFunctionValueLabels) {
			this.pointLabelContainer.style('display', 'block');
		} else {
			this.pointLabelContainer.style('display', 'none');
		}
	}
}





