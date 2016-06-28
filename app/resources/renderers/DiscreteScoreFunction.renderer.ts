/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 11:08:17
*/

import { Injectable } 					from '@angular/core';
import { NgZone }						from '@angular/core';
// d3
import * as d3 							from 'd3';

// Application Classes
import { ChartDataService }				from '../services/ChartData.service';
import { ChartUndoRedoService }			from '../services/ChartUndoRedo.service';
import { ScoreFunctionRenderer }		from './ScoreFunction.renderer';

// Model Classes
import { ValueChart }					from '../model/ValueChart';
import { IndividualValueChart }			from '../model/IndividualValueChart';
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';


// This class contains the logic for creating and rendering the a DiscreteScoreFunction for an Objective as a bar chart. 

@Injectable()
export class DiscreteScoreFunctionRenderer extends ScoreFunctionRenderer {

	public barContainer: d3.Selection<any>;
	public utilityBars: d3.Selection<any>;
	public barTops: d3.Selection<any>;
	public barLabelContainer: d3.Selection<any>;
	public barLabels: d3.Selection<any>;

	private heightScale: any;
	private domainElements: any;

	constructor(chartDataService: ChartDataService, chartUndoRedoService: ChartUndoRedoService, private ngZone: NgZone) {
		super(chartDataService, chartUndoRedoService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create DiscreteScoreFunction specific elements, 
	// like bars for the bar chart that is used to represent element scores.
	createPlot(plotElementsContainer: d3.Selection<any>, domainLabelContainer: d3.Selection<any>, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);

		this.domainElements = domainElements;

		// Create the discrete score function specific elements (e.g. the bars for the bar graph)
		this.barContainer = plotElementsContainer.append('g')
			.classed('scorefunction-bars-container', true)
			.attr('id', 'scorefunction-' + objective.getName() + '-bars-container');

		this.barLabelContainer = plotElementsContainer.append('g')
			.classed('scorefunction-pointlabels-container', true)
			.attr('id', 'scorefunction-' + objective.getName() + '-pointlabels-container');

		this.createDiscretePlotElements(this.barContainer, this.barLabelContainer, objective, domainElements);
	}

	createDiscretePlotElements(barContainer: d3.Selection<any>, labelContainer: d3.Selection<any>, objective: PrimitiveObjective, domainElements: (string | number)[]) {
		// Create a bar for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barContainer.selectAll('.scorefunction-bar')
			.data(domainElements)
			.enter().append('rect')
			.classed('scorefunction-bar', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-bar';
			});

		this.utilityBars = barContainer.selectAll('.scorefunction-bar');

		labelContainer.selectAll('.scorefunction-point-labels')
			.data(domainElements)
			.enter().append('text')
			.classed('scorefunction-point-labels', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-label';
			});

		this.barLabels = labelContainer.selectAll('.scorefunction-point-labels');

		// Create a selectable bar top for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barContainer.selectAll('.scorefunction-bartop')
			.data(domainElements)
			.enter().append('rect')
				.classed('scorefunction-bartop', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objective.getName() + '-' + d + '-bartop';
				});

		this.barTops = barContainer.selectAll('.scorefunction-bartop');

	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to render DiscreteScoreFunction specific elements, 
	// like bars for the bar chart that is used to represent element scores.
	renderPlot(domainLabels: d3.Selection<any>, plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, viewOrientation);

		this.renderDiscretePlot(plotElementsContainer, objective, (<DiscreteScoreFunction> scoreFunction), viewOrientation);
	}

	renderDiscretePlot(plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, scoreFunction: DiscreteScoreFunction, viewOrientation: string): void {
		var barWidth: number = (this.dimensionOneSize / this.domainSize) / 3;
		this.heightScale = d3.scale.linear()
			.domain([0, 1]);
		if (viewOrientation === 'vertical') {
			this.heightScale.range([0, this.domainAxisCoordinateTwo - this.utilityAxisMaxCoordinateTwo]);
		} else {
			this.heightScale.range([0, this.utilityAxisMaxCoordinateTwo - this.domainAxisCoordinateTwo]);

		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculateBarDimensionTwo = (d: (string | number)) => { return Math.max(this.heightScale(scoreFunction.getScore('' + d)), this.labelOffset); };


		this.utilityBars
			.attr(this.dimensionOne, barWidth)
			.attr(this.dimensionTwo, calculateBarDimensionTwo)
			.attr(this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo, (d: (string | number)) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo;
			})
			.style('stroke', objective.getColor());

		this.barLabels
			.text((d: any, i: number) => { return Math.round(100 * scoreFunction.getScore(d)) / 100; })
			.attr(this.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + barWidth + 2; })
			.attr(this.coordinateTwo, (d: (string | number)) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : calculateBarDimensionTwo(d) + 30;
			})
			.style('font-size', 8);


		this.barTops
			.attr(this.dimensionTwo, this.labelOffset)
			.attr(this.dimensionOne, barWidth)
			.attr(this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo, (d: (string | number)) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo + calculateBarDimensionTwo(d) - this.labelOffset;
			})
			.style('fill', objective.getColor())
			.style('cursor', () => {
				return (viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			});

		var dragToChangeScore = d3.behavior.drag();

		// Save the old ScoreFunction 
		this.barTops.call(dragToChangeScore.on('dragstart', (d: any, i: number) => {
			// Save the current state of the ScoreFunction.
			this.chartUndoRedoService.saveScoreFunctionRecord(scoreFunction, objective);
		}));

		
		// Assign the callback function for when the bar tops are dragged. Note that this must be done inside a anonymous function because we require
		// access to the scope defined by the renderDiscretePlot method.
		this.barTops.call(dragToChangeScore.on('drag', (d: any, i: number) => {

			var score: number;
			// Convert the y position of the mouse into a score by using the inverse of the scale used to convert scores into y positions:
			if (viewOrientation === 'vertical') {
				// Subtract the event y form the offset to obtain the y value measured from the bottom of the plot.
				score = this.heightScale.invert(this.domainAxisCoordinateTwo - (<any>d3.event)[this.coordinateTwo]);
			} else {
				// No need to do anything with offsets here because x is already left to right.
				score = this.heightScale.invert((<any>d3.event)[this.coordinateTwo]);
			}
			score = Math.max(0, Math.min(score, 1));	// Make sure the score is between 0 and 1.

			// Run inside the angular zone. Angular is not necessarily aware of this function executing because it is triggered by a d3 event, which 
			// exists outside of angular. In order to make sure that change detection is triggered, we must do the value assignment inside the "Angular Zone".
			this.ngZone.run(() => { scoreFunction.setElementScore(d, score) });

		}));
	}

	toggleValueLabels(displayScoreFunctionValueLabels: boolean): void {
		if (displayScoreFunctionValueLabels) {
			this.barLabelContainer.style('display', 'block');
		} else {
			this.barLabelContainer.style('display', 'none');
		}
	}

}

