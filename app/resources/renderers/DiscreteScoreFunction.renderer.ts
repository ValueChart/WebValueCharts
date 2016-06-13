/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-13 15:49:23
*/

import { Injectable } 					from '@angular/core';
import { NgZone }						from '@angular/core';
// d3
import * as d3 							from 'd3';

// Application Classes
import { ChartDataService }				from '../services/ChartData.service';
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

	public barContainer: any;
	public utilityBars: any;
	public barTops: any;

	private heightScale: any;
	private domainElements: any;

	constructor(chartDataService: ChartDataService, private ngZone: NgZone) {
		super(chartDataService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create DiscreteScoreFunction specific elements, 
	// like bars for the bar chart that is used to represent element scores.
	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);

		this.domainElements = domainElements;

		// Create the discrete score function specific elements (e.g. the bars for the bar graph)
		this.barContainer = plotElementsContainer.append('g')
			.classed('scorefunction-bars-container', true)
			.attr('id', 'scorefunction-' + objective.getName() + '-bars-container');

		this.createDiscretePlotElements(this.barContainer, objective, domainElements);
	}

	createDiscretePlotElements(barContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]) {
		// Create a bar for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barContainer.selectAll('.scorefunction-bar')
			.data(domainElements)
			.enter().append('rect')
			.classed('scorefunction-bar', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-bar';
			});


		this.utilityBars = barContainer.selectAll('.scorefunction-bar');

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
	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, viewOrientation);

		this.renderDiscretePlot(plotElementsContainer, objective, (<DiscreteScoreFunction> scoreFunction), viewOrientation);
	}

	renderDiscretePlot(plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: DiscreteScoreFunction, viewOrientation: string): void {
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

		
		// Assign the callback function for when the bar tops are dragged. Note that this must be done inside a anonymous function because we require
		// access to the scope defined by the renderDiscretePlot method.
		this.barTops.call(d3.behavior.drag().on('drag', (d: any, i: number) => {

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

}

