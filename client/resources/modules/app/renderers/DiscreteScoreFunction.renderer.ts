/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-10 13:44:24
*/

// Import Angular Classes:
import { Injectable } 									from '@angular/core';
import { NgZone }										from '@angular/core';

// Import Libraries:
import * as d3 											from 'd3';
import * as _											from 'lodash';

// Import Application Classes
import { ChartUndoRedoService }							from '../services/ChartUndoRedo.service';
import { ScoreFunctionRenderer }						from './ScoreFunction.renderer';

import { ExpandScoreFunctionInteraction }				from '../interactions/ExpandScoreFunction.interaction';

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
	constructor(chartUndoRedoService: ChartUndoRedoService, expandScoreFunctionInteraction: ExpandScoreFunctionInteraction) {
		super(chartUndoRedoService, expandScoreFunctionInteraction);
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
	createPlot(u: any, plotElementsContainer: d3.Selection<any, any, any, any>, domainLabelContainer: d3.Selection<any, any, any, any>): void {
		// Call the create plot method in ScoreFunctionRenderer. This will create the user containers and create the domain labels.
		super.createPlot(u, plotElementsContainer, domainLabelContainer);

		// Create the bar container element.

		var updateBarContainers = this.userContainers.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BARS_CONTAINER)
									.data((d,i) =>{ return [d]; });

		updateBarContainers.exit().remove();

		updateBarContainers.enter().append('g')
			.classed(DiscreteScoreFunctionRenderer.defs.BARS_CONTAINER, true)
			.attr('id', 'scorefunction-' + u.objective.getId() + '-bars-container');

		this.barContainer = this.userContainers.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BARS_CONTAINER)


		var updateBarLabelsContainer = this.userContainers.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_LABELS_CONTAINER)
			.data((d,i) =>{ return [d]; });

		updateBarLabelsContainer.exit().remove();

		updateBarLabelsContainer.enter().append('g')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + u.objective.getId() + '-pointlabels-container');

		// Create the bar label container element.
		this.barLabelContainer = this.userContainers.select('.' + DiscreteScoreFunctionRenderer.defs.BAR_LABELS_CONTAINER);

		// Create the bars, bar tops, and bar labels.
		this.createDiscretePlotElements(u, this.barContainer, this.barLabelContainer);
	}

	/*
		@param barsContainer - The 'g' element that is intended to contain the 'rect' elements that are bars in the plot.
		@param labelsContainer - The 'g' element that is intended to contain the labels for the bars. 
		@param objective - The objective for which the score function plot is going to be created.
		@returns {void}
		@description 	Creates the SVG elements and containers specific to a discrete score function plot. This is mainly the bars, bar tops, and bar labels of the bar graph.
						This method should NOT be called manually. Use createScoreFunction to create the entire plot instead.
	*/
	createDiscretePlotElements(u: any, barsContainer: d3.Selection<any, any, any, any>, labelsContainer: d3.Selection<any, any, any, any>) {
		// Create a bar for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		var updateUtilityBars = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR)
			.data((d: UserDomainElements) => { return d.elements; });

		updateUtilityBars.exit().remove();

		updateUtilityBars
			.enter().append('rect')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + '-bar';
			});

		this.utilityBars = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR);

		var updateBarLabels = labelsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_LABEL)
			.data((d: UserDomainElements) => { return d.elements; })

		updateBarLabels.exit().remove();

		updateBarLabels
			.enter().append('text')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR_LABEL, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + '-label';
			});

		this.barLabels = labelsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_LABEL);

		// Create a selectable bar top for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		var updateBarTops = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_TOP)
			.data((d: UserDomainElements) => { return d.elements; })

		updateBarTops.exit().remove();

		updateBarTops
			.enter().append('rect')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR_TOP, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + '-bartop';
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
	renderPlot(u: any, domainLabels: d3.Selection<any, any, any, any>, plotElementsContainer: d3.Selection<any, any, any, any>): void {
		// Use the super class' method to render position domain labels.
		super.renderPlot(u, domainLabels, plotElementsContainer);

		var labelCoordinateOneOffset: number;
		if (u.viewOrientation === 'vertical') {
			labelCoordinateOneOffset = u.rendererConfig.labelOffset + 5;
		} else {
			labelCoordinateOneOffset = (1.5 * u.rendererConfig.labelOffset) + 5;
		}
		// Fix domain labels positions specifically for the discrete plot.
		domainLabels.attr(u.rendererConfig.coordinateOne, (d: DomainElement, i: number) => { return (((u.rendererConfig.domainAxisMaxCoordinateOne - u.rendererConfig.utilityAxisCoordinateOne) / this.domainSize) * i) + labelCoordinateOneOffset; }) // Position the domain labels at even intervals along the axis.

		// Render the discrete plot elements.
		this.renderDiscretePlot(u);
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
	renderDiscretePlot(u: any): void {
		var barWidth: number = ((u.rendererConfig.dimensionOneSize / this.domainSize) / u.usersDomainElements.length) / 2;

		// Position each users' container so theirs bars are properly offset from each other.
		this.userContainers
			.attr('transform', (d: UserDomainElements, i: number) => {
				return 'translate(' + ((u.viewOrientation === 'vertical') ? ((barWidth * i) + ',0)') : ('0,' + (barWidth * i) + ')'))
			});

		// Configure the linear scale that translates scores into pixel units.
		this.heightScale = d3.scaleLinear()
			.domain([0, 1]);
		if (u.viewOrientation === 'vertical') {
			this.heightScale.range([0, u.rendererConfig.domainAxisCoordinateTwo - u.rendererConfig.utilityAxisMaxCoordinateTwo]);
		} else {
			this.heightScale.range([0, u.rendererConfig.utilityAxisMaxCoordinateTwo - u.rendererConfig.domainAxisCoordinateTwo]);

		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculateBarDimensionTwo = (d: DomainElement) => {
			return Math.max(this.heightScale(d.scoreFunction.getScore('' + d.element)), u.rendererConfig.labelOffset);
		};

		// Render the utility bars.
		this.utilityBars
			.attr(u.rendererConfig.dimensionOne, barWidth)
			.attr(u.rendererConfig.dimensionTwo, calculateBarDimensionTwo)
			.attr(u.rendererConfig.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(u.rendererConfig.coordinateTwo, (d: DomainElement) => {
				return (u.viewOrientation === 'vertical') ? u.rendererConfig.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : u.rendererConfig.domainAxisCoordinateTwo;
			})
			.style('stroke', (d: DomainElement) => { return ((u.usersDomainElements.length === 1) ? u.objective.getColor() : d.color); })

		// Render the bar labels.
		this.barLabels
			.text((d: any, i: number) => {
				return Math.round(100 * d.scoreFunction.getScore(d.element)) / 100;
			})
			.attr(u.rendererConfig.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + (barWidth / 3); })
			.attr(u.rendererConfig.coordinateTwo, (d: DomainElement) => {
				return (u.viewOrientation === 'vertical') ? (u.rendererConfig.domainAxisCoordinateTwo - calculateBarDimensionTwo(d)) - 2 : calculateBarDimensionTwo(d) + 30;
			})
			.style('font-size', 8);

		// Render the bar tops.
		this.barTops
			.attr(u.rendererConfig.dimensionOne, barWidth)
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.labelOffset)
			.attr(u.rendererConfig.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(u.rendererConfig.coordinateTwo, (d: DomainElement) => {
				return (u.viewOrientation === 'vertical') ? u.rendererConfig.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : u.rendererConfig.domainAxisCoordinateTwo + calculateBarDimensionTwo(d) - u.rendererConfig.labelOffset;
			})
			.style('fill', (d: DomainElement) => { return ((u.usersDomainElements.length === 1) ? u.objective.getColor() : d.color); });

		// Enable or disable dragging to change user score functions depending on whether interaction is enabled
		this.toggleDragToChangeScore(u);
	}

	/*
		@param enableDragging - Whether dragging to alter a user's score function should be enabled. 
		@param objective - The objective for which the score function plot is being rendered.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method toggles the interaction that allows clicking and dragging on bar tops to alter a user's score function.
	*/
	toggleDragToChangeScore(u: any): void {
		var dragToChangeScore = d3.drag();

		if (u.interactive) {
			dragToChangeScore.on('start', (d: DomainElement, i: number) => {
				this.chartUndoRedoService.saveScoreFunctionRecord(d.scoreFunction, u.objective);
			});

			dragToChangeScore.on('drag', (d: DomainElement, i: number) => {
				var score: number;
				// Convert the y position of the mouse into a score by using the inverse of the scale used to convert scores into y positions:
				if (u.viewOrientation === 'vertical') {
					// Subtract the event y form the offset to obtain the y value measured from the bottom of the plot.
					score = this.heightScale.invert(u.rendererConfig.domainAxisCoordinateTwo - (<any>d3.event)[u.rendererConfig.coordinateTwo]);
				} else {
					// No need to do anything with offsets here because x is already left to right.
					score = this.heightScale.invert((<any>d3.event)[u.rendererConfig.coordinateTwo]);
				}
				score = _.clamp(score, 0, 1);	// Make sure the score is between 0 and 1.

				d.scoreFunction.setElementScore(<string>d.element, score);
			});
		}

		// Set the drag listeners on the bar top elements.
		this.barTops.call(dragToChangeScore);

		// Set the cursor style for the bar tops to indicate that they are drag-able (if dragging was enabled).
		this.barTops.style('cursor', () => {
			if (!u.interactive) {
				return 'auto';
			} else {
				return (u.viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			}
		});
	}

	/*
		@param enableDragging - A boolean value indicating whether or not to display the  score labels.
		@returns {void}
		@description	This method toggles the visibility of score labels next to the bars in the bar chart.
	*/
	toggleValueLabels(displayScoreFunctionValueLabels: boolean): void {
		if (!this.barLabelContainer)
			return;
		if (displayScoreFunctionValueLabels) {
			// Display the labels.
			this.barLabelContainer.style('display', 'block');
		} else {
			// Hide the labels by hiding their container.
			this.barLabelContainer.style('display', 'none');
		}
	}

}

