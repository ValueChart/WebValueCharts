/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 21:56:10
*/

// Import Angular Classes:
import { Injectable } 									from '@angular/core';
import { NgZone }										from '@angular/core';

// Import Libraries:
import * as d3 											from 'd3';

// Import Application Classes
import { ValueChartService }							from '../services/ValueChart.service';
import { ChartUndoRedoService }							from '../services/ChartUndoRedo.service';
import { ScoreFunctionRenderer }						from './ScoreFunction.renderer';

// Import Model Classes:
import { ValueChart }									from '../../../model/ValueChart';
import { Objective }									from '../../../model/Objective';
import { PrimitiveObjective }							from '../../../model/PrimitiveObjective';
import { ScoreFunction }								from '../../../model/ScoreFunction';
import { ContinuousScoreFunction }						from '../../../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }						from '../../../model/DiscreteScoreFunction';

// Import Types:
import { DomainElement, UserDomainElements } 			from '../../../types/ScoreFunctionViewer.types';


// This class contains the logic for creating and rendering multiple users' DiscreteScoreFunctions for a single objective with a discrete 
// (either categorical or interval) domain. The score functions are rendered as bar charts. Each user has one bar indicating score per domain 
// element in the objective.

@Injectable()
export class DiscreteScoreFunctionRenderer extends ScoreFunctionRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// d3 Selections:
	public barContainer: d3.Selection<any, any, any, any>;				// The 'g' element that contains the 'rect' elements used as bars in the plot.
	public utilityBars: d3.Selection<any, any, any, any>;				// The selection of 'rect' elements used as bars in the plot. There should be one per user per domain element. 
	public barTops: d3.Selection<any, any, any, any>;					// The selection of 'rect' elements used as the filled tops of bars in the plot. These are for implementing clicking and dragging to change a score function.
	public barLabelContainer: d3.Selection<any, any, any, any>;		// The 'g' element that contains the text labels used to indicate what exact height (score) a bar has.
	public barLabels: d3.Selection<any, any, any, any>;				// The selection of 'text' elements used as score labels for bars.

	// The linear scale used to translate from scores to pixel coordinates. This is used to determine the dimensions of the bars.
	private heightScale: d3.ScaleLinear<number, number>;

	// class name definitions for SVG elements that are created by this renderer.
	public static defs: any = {
		BARS_CONTAINER: 'scorefunction-bars-container',
		BAR: 'scorefunction-bar',
		BAR_TOP: 'scorefunction-bartop',

		BAR_LABELS_CONTAINER: 'scorefunction-bar-labels-container',
		BAR_LABEL: 'scorefunction-bar-label',
	}

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection. However, this class is frequently constructed manually unlike the other renderer classes. It calls the constructor in ScoreFunctionRenderer as 
						all subclasses in TypeScript must do. This constructor should not be used to do any initialization of the class. Note that the dependencies of the class are intentionally being kept to a minimum.
	*/
	constructor(valueChartService: ValueChartService, chartUndoRedoService: ChartUndoRedoService, private ngZone: NgZone) {
		super(valueChartService, chartUndoRedoService);
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param plotElementsContainer - The 'g' element that is intended to contain the user containers. The user containers are the 'g' elements that will contain the parts of each users plot (bars/points).
		@param domainLabelContainer - The 'g' element that is intended to contain the labels for the domain (x) axis. 
		@param objective - The objective for which the score function plot is going to be created.
		@param usersDomainElements - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@returns {void}
		@description 	This method overrides the createPlot method in ScoreFunctionRenderer in order to create DiscreteScoreFunction specific elements, 
						like bars for the bar chart that is used to represent element scores. This method should NOT be called manually. Instead, 
						the createScoreFunction method that this class inherits from ScoreFunctionRenderer should be used. That method will call createPlot method after
						doing the necessary construction of base containers and elements. 
	*/
	createPlot(plotElementsContainer: d3.Selection<any, any, any, any>, domainLabelContainer: d3.Selection<any, any, any, any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {
		// Call the create plot method in ScoreFunctionRenderer. This will create the user containers and create the domain labels.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, usersDomainElements);

		// Create the bar container element.
		this.barContainer = this.userContainers.append('g')
			.classed(DiscreteScoreFunctionRenderer.defs.BARS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-bars-container');

		// Create the bar label container element.
		this.barLabelContainer = this.userContainers.append('g')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-pointlabels-container');

		// Create the bars, bar tops, and bar labels.
		this.createDiscretePlotElements(this.barContainer, this.barLabelContainer, objective);
	}

	/*
		@param barsContainer - The 'g' element that is intended to contain the 'rect' elements that are bars in the plot.
		@param labelsContainer - The 'g' element that is intended to contain the labels for the bars. 
		@param objective - The objective for which the score function plot is going to be created.
		@returns {void}
		@description 	Creates the SVG elements and containers specific to a discrete score function plot. This is mainly the bars, bar tops, and bar labels of the bar graph.
						This method should NOT be called manually. Use createScoreFunction to create the entire plot instead.
	*/
	createDiscretePlotElements(barsContainer: d3.Selection<any, any, any, any>, labelsContainer: d3.Selection<any, any, any, any>, objective: PrimitiveObjective) {
		// Create a bar for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('rect')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + objective.getId() + '-' + d.element + '-bar';
			});

		this.utilityBars = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR);

		labelsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_LABEL)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('text')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR_LABEL, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + objective.getId() + '-' + d.element + '-label';
			});

		this.barLabels = labelsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_LABEL);

		// Create a selectable bar top for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_TOP)
			.data((d: UserDomainElements) => { return d.elements; })
			.enter().append('rect')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR_TOP, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + objective.getId() + '-' + d.element + '-bartop';
			});

		this.barTops = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_TOP);

	}

	/*
		@param domainLabels - The selection 'text' elements used to label the domain axis.
		@param plotElementsContainer - The 'g' element that contains the userContainers elements.
		@param objective - The objective for which the score function plot is being rendered.
		@param usersDomainElements - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Positions and styles the elements created by createPlot.  This method overrides the createPlot method in ScoreFunctionRenderer in order to render DiscreteScoreFunction 
						specific elements (via renderDiscretePlot), like bars for the bar chart that is used to represent element scores.
						This method should NOT be called manually. Instead it should be used as a part of calling renderScoreFunction to re-render
						the entire score function plot.
	*/
	renderPlot(domainLabels: d3.Selection<any, any, any, any>, plotElementsContainer: d3.Selection<any, any, any, any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		// Use the super class' method to render position domain labels.
		super.renderPlot(domainLabels, plotElementsContainer, objective, usersDomainElements, viewOrientation);

		var labelCoordinateOneOffset: number;
		if (viewOrientation === 'vertical') {
			labelCoordinateOneOffset = this.labelOffset + 5;
		} else {
			labelCoordinateOneOffset = (1.5 * this.labelOffset) + 5;
		}
		// Fix domain labels positions specifically for the discrete plot.
		domainLabels.attr(this.viewConfig.coordinateOne, (d: DomainElement, i: number) => { return (((this.domainAxisMaxCoordinateOne - this.utilityAxisCoordinateOne) / this.domainSize) * i) + labelCoordinateOneOffset; }) // Position the domain labels at even intervals along the axis.

		// Render the discrete plot elements.
		this.renderDiscretePlot(objective, usersDomainElements, viewOrientation);
	}

	/*
		@param objective - The objective for which the score function plot is being rendered.
		@param usersDomainElements - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method positions and styles the DiscreteScoreFunction specific elements of the score function plot. Specifically, it renders the bars, bar tops, and bar labels
						of the bar chart. This method should NOT be called manually. Instead it should be used as a part of calling renderScoreFunction to re-render
						the entire score function plot.
	*/
	renderDiscretePlot(objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		var barWidth: number = ((this.viewConfig.dimensionOneSize / this.domainSize) / usersDomainElements.length) / 2;

		// Position each users' container so theirs bars are properly offset from each other.
		this.userContainers
			.attr('transform', (d: UserDomainElements, i: number) => {
				return 'translate(' + ((viewOrientation === 'vertical') ? ((barWidth * i) + ',0)') : ('0,' + (barWidth * i) + ')'))
			});

		// Configure the linear scale that translates scores into pixel units.
		this.heightScale = d3.scaleLinear()
			.domain([0, 1]);
		if (viewOrientation === 'vertical') {
			this.heightScale.range([0, this.domainAxisCoordinateTwo - this.utilityAxisMaxCoordinateTwo]);
		} else {
			this.heightScale.range([0, this.utilityAxisMaxCoordinateTwo - this.domainAxisCoordinateTwo]);

		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculateBarDimensionTwo = (d: DomainElement) => {
			let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
			return Math.max(this.heightScale(scoreFunction.getScore('' + d.element)), this.labelOffset);
		};

		// Render the utility bars.
		this.utilityBars
			.attr(this.viewConfig.dimensionOne, barWidth)
			.attr(this.viewConfig.dimensionTwo, calculateBarDimensionTwo)
			.attr(this.viewConfig.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.viewConfig.coordinateTwo, (d: DomainElement) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo;
			})
			.style('stroke', (d: DomainElement) => { return ((usersDomainElements.length === 1) ? objective.getColor() : d.user.color); })

		// Render the bar labels.
		this.barLabels
			.text((d: any, i: number) => {
				let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				return Math.round(100 * scoreFunction.getScore(d.element)) / 100;
			})
			.attr(this.viewConfig.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + (barWidth / 3); })
			.attr(this.viewConfig.coordinateTwo, (d: DomainElement) => {
				return (viewOrientation === 'vertical') ? (this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d)) - 2 : calculateBarDimensionTwo(d) + 30;
			})
			.style('font-size', 8);

		// Render the bar tops.
		this.barTops
			.attr(this.viewConfig.dimensionOne, barWidth)
			.attr(this.viewConfig.dimensionTwo, this.labelOffset)
			.attr(this.viewConfig.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.viewConfig.coordinateTwo, (d: DomainElement) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo + calculateBarDimensionTwo(d) - this.labelOffset;
			})
			.style('fill', (d: DomainElement) => { return ((usersDomainElements.length === 1) ? objective.getColor() : d.user.color); });

		// Enable or disable dragging to change user score functions depending on whether interaction is enabled
		this.toggleDragToChangeScore(this.enableInteraction, objective, viewOrientation);
	}

	/*
		@param enableDragging - Whether dragging to alter a user's score function should be enabled. 
		@param objective - The objective for which the score function plot is being rendered.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method toggles the interaction that allows clicking and dragging on bar tops to alter a user's score function.
	*/
	toggleDragToChangeScore(enableDragging: boolean, objective: PrimitiveObjective, viewOrientation: string): void {
		var dragToChangeScore = d3.drag();

		if (enableDragging) {
			dragToChangeScore.on('start', (d: DomainElement, i: number) => {
				let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				// Save the current state of the ScoreFunction.
				this.chartUndoRedoService.saveScoreFunctionRecord(scoreFunction, objective);
			});

			dragToChangeScore.on('drag', (d: DomainElement, i: number) => {
				let scoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				var score: number;
				// Convert the y position of the mouse into a score by using the inverse of the scale used to convert scores into y positions:
				if (viewOrientation === 'vertical') {
					// Subtract the event y form the offset to obtain the y value measured from the bottom of the plot.
					score = this.heightScale.invert(this.domainAxisCoordinateTwo - (<any>d3.event)[this.viewConfig.coordinateTwo]);
				} else {
					// No need to do anything with offsets here because x is already left to right.
					score = this.heightScale.invert((<any>d3.event)[this.viewConfig.coordinateTwo]);
				}
				score = Math.max(0, Math.min(score, 1));	// Make sure the score is between 0 and 1.

				// Run inside the angular zone. Angular is not necessarily aware of this function executing because it is triggered by a d3 event, which 
				// exists outside of angular. In order to make sure that change detection is triggered, we must do the value assignment inside the "Angular Zone".
				this.ngZone.run(() => { scoreFunction.setElementScore(<string>d.element, score) });
			});
		}

		// Set the drag listeners on the bar top elements.
		this.barTops.call(dragToChangeScore);

		// Set the cursor style for the bar tops to indicate that they are drag-able (if dragging was enabled).
		this.barTops.style('cursor', () => {
			if (!enableDragging) {
				return 'auto';
			} else {
				return (viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			}
		});
	}

	/*
		@param enableDragging - A boolean value indicating whether or not to display the  score labels.
		@returns {void}
		@description	This method toggles the visibility of score labels next to the bars in the bar chart.
	*/
	toggleValueLabels(displayScoreFunctionValueLabels: boolean): void {
		if (displayScoreFunctionValueLabels) {
			// Display the labels.
			this.barLabelContainer.style('display', 'block');
		} else {
			// Hide the labels by hiding their container.
			this.barLabelContainer.style('display', 'none');
		}
	}

}

