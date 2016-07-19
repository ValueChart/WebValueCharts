/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-19 10:40:25
*/

import { Injectable } 									from '@angular/core';
import { NgZone }										from '@angular/core';
// d3
import * as d3 											from 'd3';

// Application Classes
import { ChartDataService }								from '../services/ChartData.service';
import { ChartUndoRedoService }							from '../services/ChartUndoRedo.service';
import { ScoreFunctionRenderer }						from './ScoreFunction.renderer';

// Model Classes
import { ValueChart }									from '../model/ValueChart';
import { Objective }									from '../model/Objective';
import { PrimitiveObjective }							from '../model/PrimitiveObjective';
import { ScoreFunction }								from '../model/ScoreFunction';
import { ContinuousScoreFunction }						from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }						from '../model/DiscreteScoreFunction';

import { DomainElement, UserDomainElements } 			from '../model/ChartDataTypes';


// This class contains the logic for creating and rendering the a DiscreteScoreFunction for an Objective as a bar chart. 

@Injectable()
export class DiscreteScoreFunctionRenderer extends ScoreFunctionRenderer {

	public barContainer: d3.Selection<any>;
	public utilityBars: d3.Selection<any>;
	public barTops: d3.Selection<any>;
	public barLabelContainer: d3.Selection<any>;
	public barLabels: d3.Selection<any>;

	private heightScale: d3.Linear<number, number>;

	public static defs: any = {
		BARS_CONTAINER: 'scorefunction-bars-container',
		BAR: 'scorefunction-bar',
		BAR_TOP: 'scorefunction-bartop', 

		POINT_LABELS_CONTAINER: 'scorefunction-point-labels-container',
		POINT_LABEL: 'scorefunction-point-label',
	}

	constructor(chartDataService: ChartDataService, chartUndoRedoService: ChartUndoRedoService, private ngZone: NgZone) {
		super(chartDataService, chartUndoRedoService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create DiscreteScoreFunction specific elements, 
	// like bars for the bar chart that is used to represent element scores.
	createPlot(plotElementsContainer: d3.Selection<any>, domainLabelContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, usersDomainElements);

		// Create the discrete score function specific elements (e.g. the bars for the bar graph)
		this.barContainer = this.userContainers.append('g')
			.classed(DiscreteScoreFunctionRenderer.defs.BARS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-bars-container');

		this.barLabelContainer = this.userContainers.append('g')
			.classed(DiscreteScoreFunctionRenderer.defs.POINT_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-pointlabels-container');

		this.createDiscretePlotElements(this.barContainer, this.barLabelContainer, objective, usersDomainElements);
	}

	createDiscretePlotElements(barContainer: d3.Selection<any>, labelContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]) {
		// Create a bar for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('rect')
				.classed(DiscreteScoreFunctionRenderer.defs.BAR, true)
				.attr('id', (d: DomainElement) => {
					return 'scorefunction-' + objective.getId() + '-' + d.element + '-bar';
				});

		this.utilityBars = barContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR);

		labelContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.POINT_LABEL)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('text')
				.classed(DiscreteScoreFunctionRenderer.defs.POINT_LABEL, true)
				.attr('id', (d: DomainElement) => {
					return 'scorefunction-' + objective.getId() + '-' + d.element + '-label';
				});

		this.barLabels = labelContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.POINT_LABEL);

		// Create a selectable bar top for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_TOP)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('rect')
				.classed(DiscreteScoreFunctionRenderer.defs.BAR_TOP, true)
				.attr('id', (d: DomainElement) => {
					return 'scorefunction-' + objective.getId() + '-' + d.element + '-bartop';
				});

		this.barTops = barContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_TOP);

	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to render DiscreteScoreFunction specific elements, 
	// like bars for the bar chart that is used to represent element scores.
	renderPlot(domainLabels: d3.Selection<any>, plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, usersDomainElements, viewOrientation);
		
		var labelCoordinateOneOffset: number;
		if (viewOrientation === 'vertical') {
			labelCoordinateOneOffset = this.labelOffset + 5;
		} else {
			labelCoordinateOneOffset = (1.5 * this.labelOffset) + 5;
		}

		domainLabels.attr(this.coordinateOne, (d: DomainElement, i: number) => { return (((this.domainAxisMaxCoordinateOne - this.utilityAxisCoordinateOne) / this.domainSize) * i) + labelCoordinateOneOffset; }) // Position the domain labels at even intervals along the axis.
		
		this.renderDiscretePlot(plotElementsContainer, objective, usersDomainElements, viewOrientation);
	}

	renderDiscretePlot(plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		var barWidth: number = ((this.dimensionOneSize / this.domainSize) / usersDomainElements.length) / 2;

		this.userContainers
			.attr('transform', (d: UserDomainElements, i: number) => {
				return 'translate(' + ((viewOrientation === 'vertical') ? ((barWidth * i) + ',0)') : ('0,' + (barWidth * i)  + ')'))
			});


		this.heightScale = d3.scaleLinear()
			.domain([0, 1]);
		if (viewOrientation === 'vertical') {
			this.heightScale.range([0, this.domainAxisCoordinateTwo - this.utilityAxisMaxCoordinateTwo]);
		} else {
			this.heightScale.range([0, this.utilityAxisMaxCoordinateTwo - this.domainAxisCoordinateTwo]);

		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculateBarDimensionTwo = (d: DomainElement) => { 
			let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
			return Math.max(this.heightScale(scoreFunction.getScore('' + d.element)), this.labelOffset); 
		};


		this.utilityBars
			.attr(this.dimensionOne, barWidth)
			.attr(this.dimensionTwo, calculateBarDimensionTwo)
			.attr(this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo, (d: DomainElement) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo;
			})
			.style('stroke', (d: DomainElement) => { return ((usersDomainElements.length === 1) ? objective.getColor() : d.user.color); } )

		this.barLabels
			.text((d: any, i: number) => { 
				let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				return Math.round(100 * scoreFunction.getScore(d.element)) / 100; 
			})
			.attr(this.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + (barWidth / 3); })
			.attr(this.coordinateTwo, (d: DomainElement) => {
				return (viewOrientation === 'vertical') ? (this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d)) - 2 : calculateBarDimensionTwo(d) + 30;
			})
			.style('font-size', 8);


		this.barTops
			.attr(this.dimensionOne, barWidth)
			.attr(this.dimensionTwo, this.labelOffset)
			.attr(this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo, (d: DomainElement) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo + calculateBarDimensionTwo(d) - this.labelOffset;
			})
			.style('fill', (d: DomainElement) => { return ((usersDomainElements.length === 1) ? objective.getColor() : d.user.color); } );

		this.toggleDragToChangeScore(this.chartDataService.getValueChart().isIndividual(), objective, viewOrientation);
	}

	toggleDragToChangeScore(enableDragging: boolean, objective: PrimitiveObjective, viewOrientation: string): void {
		var dragToChangeScore = d3.drag();

		if (enableDragging) {
			dragToChangeScore.on('start', (d: DomainElement, i: number) => {
				let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				// Save the current state of the ScoreFunction.
				this.chartUndoRedoService.saveScoreFunctionRecord(scoreFunction, objective);
			});

			dragToChangeScore.on('drag', (d: DomainElement, i: number) => {
				let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction> d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
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
				this.ngZone.run(() => { scoreFunction.setElementScore(<string> d.element, score) });
			});
		}

		this.barTops.call(dragToChangeScore);

		this.barTops.style('cursor', () => {
			if (!enableDragging) {
				return 'auto';
			} else {
				return (viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			}
		});
	}

	toggleValueLabels(displayScoreFunctionValueLabels: boolean): void {
		if (displayScoreFunctionValueLabels) {
			this.barLabelContainer.style('display', 'block');
		} else {
			this.barLabelContainer.style('display', 'none');
		}
	}

}

