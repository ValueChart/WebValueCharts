/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-23 17:44:15
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
import { AdjustScoreFunctionInteraction }				from '../interactions/AdjustScoreFunction.interaction';

// Import Model Classes:
import { ValueChart }									from '../../../model/ValueChart';
import { Objective }									from '../../../model/Objective';
import { PrimitiveObjective }							from '../../../model/PrimitiveObjective';
import { ScoreFunction }								from '../../../model/ScoreFunction';
import { ContinuousScoreFunction }						from '../../../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }						from '../../../model/DiscreteScoreFunction';

// Import Types:
import { DomainElement, ScoreFunctionData } 			from '../../../types/RendererData.types';
import { ScoreFunctionUpdate, ScoreFunctionConfig }		from '../../../types/RendererData.types';


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
	constructor(chartUndoRedoService: ChartUndoRedoService, 
		expandScoreFunctionInteraction: ExpandScoreFunctionInteraction) {
		super(chartUndoRedoService, expandScoreFunctionInteraction);
	}


	interactionConfigChanged = (interactionConfig: any) => {
		this.expandScoreFunctionInteraction.toggleExpandScoreFunction(interactionConfig.expandScoreFunctions, this.rootContainer.node().querySelectorAll('.' + ScoreFunctionRenderer.defs.PLOT_OUTLINE), this.lastRendererUpdate);
		this.adjustScoreFunctionInteraction.toggleDragToChangeScore(interactionConfig.adjustScoreFunctions, this.barTops, this.lastRendererUpdate)
	}


	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param plotElementsContainer - The 'g' element that is intended to contain the user containers. The user containers are the 'g' elements that will contain the parts of each users plot (bars/points).
		@param domainLabelContainer - The 'g' element that is intended to contain the labels for the domain (x) axis. 
		@param objective - The objective for which the score function plot is going to be created.
		@param scoreFunctionData - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@returns {void}
		@description 	This method overrides the createPlot method in ScoreFunctionRenderer in order to create DiscreteScoreFunction specific elements, 
						like bars for the bar chart that is used to represent element scores. This method should NOT be called manually. Instead, 
						the createScoreFunction method that this class inherits from ScoreFunctionRenderer should be used. That method will call createPlot method after
						doing the necessary construction of base containers and elements. 
	*/
	createPlot(u: ScoreFunctionUpdate, plotElementsContainer: d3.Selection<any, any, any, any>, domainLabelContainer: d3.Selection<any, any, any, any>): void {
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
	createDiscretePlotElements(u: ScoreFunctionUpdate, barsContainer: d3.Selection<any, any, any, any>, labelsContainer: d3.Selection<any, any, any, any>) {
		// Create a bar for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		var updateUtilityBars = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR)
			.data((d: ScoreFunctionData) => { return d.elements; });

		updateUtilityBars.exit().remove();

		updateUtilityBars
			.enter().append('rect')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + '-bar';
			});

		this.utilityBars = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR);

		var updateBarLabels = labelsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_LABEL)
			.data((d: ScoreFunctionData) => { return d.elements; })

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
			.data((d: ScoreFunctionData) => { return d.elements; })

		updateBarTops.exit().remove();

		updateBarTops
			.enter().append('rect')
			.classed(DiscreteScoreFunctionRenderer.defs.BAR_TOP, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + '-bartop';
			});

		this.barTops = barsContainer.selectAll('.' + DiscreteScoreFunctionRenderer.defs.BAR_TOP);
	}

	renderAxesDimensionOne(u: ScoreFunctionUpdate): void {
		super.renderAxesDimensionOne(u);

		// Fix domain labels positions specifically for the discrete plot.
		var labelCoordinateOneOffset: number;
		if (u.viewOrientation === 'vertical') {
			labelCoordinateOneOffset = u.rendererConfig.labelOffset + 5;
		} else {
			labelCoordinateOneOffset = (1.5 * u.rendererConfig.labelOffset) + 5;
		}

		this.domainLabels.attr(u.rendererConfig.coordinateOne, (d: DomainElement, i: number) => { return (((u.rendererConfig.domainAxisMaxCoordinateOne - u.rendererConfig.utilityAxisCoordinateOne) / this.domainSize) * i) + labelCoordinateOneOffset; }) // Position the domain labels at even intervals along the axis.
	}

	/*
		@param objective - The objective for which the score function plot is being rendered.
		@param scoreFunctionData - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method positions and styles the DiscreteScoreFunction specific elements of the score function plot. Specifically, it renders the bars, bar tops, and bar labels
						of the bar chart. This method should NOT be called manually. Instead it should be used as a part of calling renderScoreFunction to re-render
						the entire score function plot.
	*/
	renderPlot(u: ScoreFunctionUpdate, updateDimensionOne: boolean): void {
		this.userContainers.data(u.scoreFunctionData);

		this.barContainer.data((d,i) =>{ return [d]; });

		this.utilityBars.data((d: ScoreFunctionData) => { return d.elements; });
		this.barTops.data((d: ScoreFunctionData) => { return d.elements; });

		this.renderDiscretePlotDimensionTwo(u);
		if (updateDimensionOne) {
			this.renderDiscretePlotDimensionOne(u);
		}
	}

	renderDiscretePlotDimensionOne(u: ScoreFunctionUpdate): void {
		var barWidth: number = ((u.rendererConfig.dimensionOneSize / this.domainSize) / u.scoreFunctionData.length) / 2;

		// Position each users' container so theirs bars are properly offset from each other.
		this.userContainers
			.attr('transform', (d: ScoreFunctionData, i: number) => {
				return 'translate(' + ((u.viewOrientation === 'vertical') ? ((barWidth * i) + ',0)') : ('0,' + (barWidth * i) + ')'))
			});

		// Render the utility bars.
		this.utilityBars
			.attr(u.rendererConfig.dimensionOne, barWidth)
			.attr(u.rendererConfig.coordinateOne, this.calculatePlotElementCoordinateOne);
		// Render the bar labels.
		this.barLabels
			.attr(u.rendererConfig.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + (barWidth / 3); });

		// Render the bar tops.
		this.barTops
			.attr(u.rendererConfig.dimensionOne, barWidth)
			.attr(u.rendererConfig.coordinateOne, this.calculatePlotElementCoordinateOne);
	}

	renderDiscretePlotDimensionTwo(u: ScoreFunctionUpdate): void {
		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculateBarDimensionTwo = (d: DomainElement) => {
			return Math.max(u.heightScale(d.scoreFunction.getScore('' + d.element)), u.rendererConfig.labelOffset);
		};

		this.utilityBars
			.attr(u.rendererConfig.dimensionTwo, calculateBarDimensionTwo)
			.attr(u.rendererConfig.coordinateTwo, (d: DomainElement) => {
				return (u.viewOrientation === 'vertical') ? u.rendererConfig.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : u.rendererConfig.domainAxisCoordinateTwo;
			});

		this.barLabels
			.text((d: any, i: number) => {
				return Math.round(100 * d.scoreFunction.getScore(d.element)) / 100;
			}).attr(u.rendererConfig.coordinateTwo, (d: DomainElement) => {
				return (u.viewOrientation === 'vertical') ? (u.rendererConfig.domainAxisCoordinateTwo - calculateBarDimensionTwo(d)) - 2 : calculateBarDimensionTwo(d) + 30;
			});

		this.barTops
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.labelOffset)
			.attr(u.rendererConfig.coordinateTwo, (d: DomainElement) => {
				return (u.viewOrientation === 'vertical') ? u.rendererConfig.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : u.rendererConfig.domainAxisCoordinateTwo + calculateBarDimensionTwo(d) - u.rendererConfig.labelOffset;
			});

	}

	applyStyles(u: ScoreFunctionUpdate): void {
		super.applyStyles(u);

		this.utilityBars.style('stroke', (d: DomainElement) => { return ((u.scoreFunctionData.length === 1) ? u.objective.getColor() : d.color); })
		this.barLabels.style('font-size', 8);
		this.barTops.style('fill', (d: DomainElement) => { return ((u.scoreFunctionData.length === 1) ? u.objective.getColor() : d.color); });
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

