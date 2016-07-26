/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:41:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-19 10:32:05
*/

import { Injectable } 					from '@angular/core';
import { NgZone }						from '@angular/core';


// d3
import * as d3 							from 'd3';

// Application Classes
import { ValueChartService }			from '../services/ValueChart.service';
import { ScoreFunctionViewerService }	from '../services/ScoreFunctionViewer.service';
import { ScoreFunctionRenderer }		from './ScoreFunction.renderer';
import { ChartUndoRedoService }			from '../services/ChartUndoRedo.service';


// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';

import { DomainElement, UserDomainElements } 			from '../types/ScoreFunctionViewer.types';


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

	public static defs: any = {
		FITLINES_CONTAINER: 'scorefunction-fitlines-container',
		FITLINE: 'scorefunction-fitline',

		POINTS_CONTAINER: 'scorefunction-points-container',
		POINT: 'scorefunction-point',

		POINT_LABELS_CONTAINER: 'scorefunction-point-labels-container',
		POINT_LABEL: 'scorefunction-point-label',

	}

	constructor(valueChartService: ValueChartService, scoreFunctionViewerService: ScoreFunctionViewerService, chartUndoRedoService: ChartUndoRedoService, private ngZone: NgZone) {
		super(valueChartService, scoreFunctionViewerService, chartUndoRedoService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	createPlot(plotElementsContainer: d3.Selection<any>, domainLabelContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, usersDomainElements);
		
		// Create the continuous score function specific element containers
		this.linesContainer = this.userContainers.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.FITLINES_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-fitlines-container');

		this.pointsContainer = this.userContainers.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.POINTS_CONTAINER, true)
			.attr('id','scorefunction-' + objective.getId() + '-points-container');

		this.pointLabelContainer = this.userContainers.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.POINT_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-point-labels-container');


		this.createContinuousPlotElements(this.pointsContainer, this.linesContainer, this.pointLabelContainer, objective, usersDomainElements);
	}

	createContinuousPlotElements(pointsContainer: d3.Selection<any>, linesContainer: d3.Selection<any>, labelsContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {
		// Create a point for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		pointsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('circle')
				.classed(ContinuousScoreFunctionRenderer.defs.POINT, true)
				.attr('id', (d: DomainElement) => {
					return 'scorefunction-' + objective.getId() + '-' + d.element + '-point';
				});

		this.plottedPoints = pointsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT);

		labelsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT_LABEL)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('text')
				.classed(ContinuousScoreFunctionRenderer.defs.POINT_LABEL, true)
				.attr('id', (d: DomainElement) => {
					return 'scorefunction-' + objective.getId() + '-' + d.element + 'point-label';
				});

		this.pointLabels = labelsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT_LABEL);

		// Each fit line connects domain element i to i + 1 in the plot. This means that we need to create one fewer lines than domain elements.
		// To do this, we simply remove the last domain element from the list before we create the lines.
		usersDomainElements.pop();

		// Create a slope line for each new adjacent pair of elements in the Objective's domain. Note that this is all elements when the plot is first created.
		linesContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.FITLINE)
			.data((d: UserDomainElements) => { 
				var temp = d.elements.pop();
				var data = d.elements.slice();
				d.elements.push(temp);
				return data; 
			})
			.enter().append('line')
				.classed(ContinuousScoreFunctionRenderer.defs.FITLINE, true)
				.attr('id', (d: DomainElement) => {
					return 'scorefunction-' + objective.getId() + '-' + d.element + '-fitline';
				});

		this.fitLines = linesContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.FITLINE);
	}

	// This method overrides the rednerPlot method in ScoreFunctionRenderer in order to render ContinuousScoreFunction specific elements, 
	// like points and connecting lines for the scatter plot that is used to represent element scores.
	renderPlot(domainLabels: d3.Selection<any>, plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, usersDomainElements, viewOrientation);

		this.renderContinuousPlot(plotElementsContainer, objective, usersDomainElements, viewOrientation);

	}

	renderContinuousPlot(plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		var pointRadius = this.labelOffset / 2.5;
		var pointOffset = 3;

		this.heightScale = d3.scaleLinear()
			.domain([0, 1])

		if (viewOrientation === 'vertical') {
			this.heightScale.range([0, (this.domainAxisCoordinateTwo) - this.utilityAxisMaxCoordinateTwo]);
		} else {
			this.heightScale.range([this.domainAxisCoordinateTwo, this.utilityAxisMaxCoordinateTwo]);
		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculatePointCoordinateTwo = (d: DomainElement) => { 
			let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
			return (viewOrientation === 'vertical') ? (this.domainAxisCoordinateTwo) - this.heightScale(scoreFunction.getScore(+d.element)) : this.heightScale(scoreFunction.getScore(+d.element)); 
		};

		this.plottedPoints
			.attr('c' + this.coordinateOne, (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d,i) - pointOffset })
			.attr('c' + this.coordinateTwo, calculatePointCoordinateTwo)
			.attr('r', pointRadius)
			.style('fill', (d: DomainElement) => { return ((usersDomainElements.length === 1) ? objective.getColor() : d.user.color); } )
			.style('fill-opacity', 0.5)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.pointLabels
			.text((d: any, i: number) => { 
				let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				return Math.round(100 * scoreFunction.getScore(+d.element)) / 100; 
			})
			.attr(this.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + pointRadius + 1; })
			.attr(this.coordinateTwo, calculatePointCoordinateTwo)
			.style('font-size', 8);

		this.fitLines
			.attr(this.coordinateOne + '1', (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d,i) - pointOffset })
			.attr(this.coordinateTwo + '1', calculatePointCoordinateTwo)
			.attr(this.coordinateOne + '2', (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d, i + 1) - pointOffset; })
			.attr(this.coordinateTwo + '2', (d: DomainElement, i: number) => { 
				var userElements = usersDomainElements.find((userElements: UserDomainElements) => {
					return userElements.user.getUsername() === d.user.getUsername();
				});
				return calculatePointCoordinateTwo(userElements.elements[i + 1]); 
			});

		this.toggleDragToChangeScore(this.valueChartService.isIndividual(), objective, viewOrientation);
	}

	toggleDragToChangeScore(enableDragging: boolean, objective: PrimitiveObjective, viewOrientation: string): void {
		var dragToResizeScores = d3.drag();

		if (enableDragging) {
			dragToResizeScores.on('start', (d: DomainElement, i: number) => {
				let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				// Save the current state of the ScoreFunction.
				this.chartUndoRedoService.saveScoreFunctionRecord(scoreFunction, objective);
			});

			dragToResizeScores.on('drag', (d: DomainElement, i: number) => {
				let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
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
				this.ngZone.run(() => { scoreFunction.setElementScore(<number> d.element, score) });
			});
		}

		this.plottedPoints.call(dragToResizeScores);

		this.plottedPoints.style('cursor', () => {
			if (!enableDragging) {
				return 'auto';
			} else {
				return (viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			}
		});
	}

	toggleValueLabels(displayScoreFunctionValueLabels: boolean): void {
		if (displayScoreFunctionValueLabels) {
			this.pointLabelContainer.style('display', 'block');
		} else {
			this.pointLabelContainer.style('display', 'none');
		}
	}
}





