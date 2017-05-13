/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:41:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-12 18:35:15
*/

// Import Angular Classes:
import { Injectable } 									from '@angular/core';
import { NgZone }										from '@angular/core';

// Import Libraries:
import * as d3 											from 'd3';

// Import Application Classes:
import { ScoreFunctionRenderer }						from './ScoreFunction.renderer';
import { ChartUndoRedoService }							from '../services/ChartUndoRedo.service';

import { ExpandScoreFunctionInteraction }				from '../interactions/ExpandScoreFunction.interaction';
import { AdjustScoreFunctionInteraction }				from '../interactions/AdjustScoreFunction.interaction';

// Import Model Classes:
import { Objective }									from '../../../model/Objective';
import { PrimitiveObjective }							from '../../../model/PrimitiveObjective';
import { ScoreFunction }								from '../../../model/ScoreFunction';
import { ContinuousScoreFunction }						from '../../../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }						from '../../../model/DiscreteScoreFunction';

// Import Types:
import { DomainElement, ScoreFunctionData } 			from '../../../types/RendererData.types';

// This class contains the logic for creating and rendering multiple users' ContinuousScoreFunctions for a single objective with a continuous 
// (either categorical or interval) domain. The score functions are rendered as scatter plots where the points are the elements in the objective's 
// domain to which the users have assigned scores. Each user has one point indicating score per domain element in the objective.
@Injectable()
export class ContinuousScoreFunctionRenderer extends ScoreFunctionRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// d3 Selections:
	public pointsContainer: d3.Selection<any, any, any, any>;				// The 'g' element that contains the 'circle' elements used as points in the scatter plot.
	public plottedPoints: d3.Selection<any, any, any, any>;				// The 'circle' elements used as points in the scatter plot.
	public linesContainer: d3.Selection<any, any, any, any>;				// The 'g' element that contains the 'line' elements used as fitlines between points in the scatter plot. 
	public fitLines: d3.Selection<any, any, any, any>;						// The 'line' elements used as fitlines between points in the scatter plot. 
	public pointLabelContainer: d3.Selection<any, any, any, any>;			// The 'g' element that contains the 'text' elements used to labels points in the scatter plot with their scores.
	public pointLabels: d3.Selection<any, any, any, any>;					// The 'text' elements used to labels points in the scatter plot with their scores.


	// class name definitions for SVG elements that are created by this renderer.
	public static defs: any = {
		FITLINES_CONTAINER: 'scorefunction-fitlines-container',
		FITLINE: 'scorefunction-fitline',

		POINTS_CONTAINER: 'scorefunction-points-container',
		POINT: 'scorefunction-point',

		POINT_LABELS_CONTAINER: 'scorefunction-point-labels-container',
		POINT_LABEL: 'scorefunction-point-label',

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

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	interactionConfigChanged = (interactionConfig: any) => {
		this.expandScoreFunctionInteraction.toggleExpandScoreFunction(interactionConfig.expandScoreFunctions, $(this.rootContainer.node().querySelectorAll('.' + ScoreFunctionRenderer.defs.PLOT_OUTLINE)), this.lastRendererUpdate);
		this.adjustScoreFunctionInteraction.toggleDragToChangeScore(interactionConfig.adjustScoreFunctions, this.plottedPoints, this.lastRendererUpdate)
	}

	/*
		@param plotElementsContainer - The 'g' element that is intended to contain the user containers. The user containers are the 'g' elements that will contain the parts of each users plot (bars/points).
		@param domainLabelContainer - The 'g' element that is intended to contain the labels for the domain (x) axis. 
		@param objective - The objective for which the score function plot is going to be created.
		@param usersDomainElements - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@returns {void}
		@description 	This method overrides the createPlot method in ScoreFunctionRenderer in order to create ContinuousScoreFunction specific elements, 
						like points and fitlines for the scatter plot that is used to represent element scores. This method should NOT be called manually. Instead, 
						the createScoreFunction method that this class inherits from ScoreFunctionRenderer should be used. That method will call createPlot method after
						doing the necessary construction of base containers and elements. 
	*/
	createPlot(u: any, plotElementsContainer: d3.Selection<any, any, any, any>, domainLabelContainer: d3.Selection<any, any, any, any>): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(u, plotElementsContainer, domainLabelContainer);

		// Create the continuous score function specific element containers:

		// Create the fitline container.
		var updateLinesContainer = this.userContainers.selectAll('.' + ContinuousScoreFunctionRenderer.defs.FITLINES_CONTAINER)
			.data((d, i) => { return [d]; });

		updateLinesContainer.exit().remove();

		updateLinesContainer.enter().append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.FITLINES_CONTAINER, true)
			.attr('id', 'scorefunction-' + u.objective.getId() + '-fitlines-container');

		this.linesContainer = this.userContainers.selectAll('.' + ContinuousScoreFunctionRenderer.defs.FITLINES_CONTAINER);


		// Create the points container.
		var updatePointsContainer = this.userContainers.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINTS_CONTAINER)
			.data((d,i) => { return [d]; });

		updatePointsContainer.exit().remove();

		updatePointsContainer.enter()
			.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.POINTS_CONTAINER, true)
			.attr('id', 'scorefunction-' + u.objective.getId() + '-points-container');

		this.pointsContainer = this.userContainers.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINTS_CONTAINER);


		// Create the point labels container.
		var updatePointLabelContainer = this.userContainers.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT_LABELS_CONTAINER)
			.data((d,i) => { return [d]; });

		updatePointLabelContainer.exit().remove();

		updatePointLabelContainer.enter()
			.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.POINT_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + u.objective.getId() + '-point-labels-container');

		this.pointLabelContainer = this.userContainers.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT_LABELS_CONTAINER)

		this.createContinuousPlotElements(u, this.pointsContainer, this.linesContainer, this.pointLabelContainer);
	}

	/*
		@param pointsContainer - The 'g' element that is intended to contain the 'circle' elements used as points in the scatter plot.
		@oaram linesContainer - The 'g' element that is intended to contain the 'line' elements used as fitlines in the scatter plot.
		@param labelsContainer - The 'g' element that is intended to contain the labels for the bars. 
		@param objective - The objective for which the score function plot is going to be created.
		@returns {void}
		@description 	Creates the SVG elements and containers specific to a discrete score function plot. This is mainly the bars, bar tops, and bar labels of the bar graph.
						This method should NOT be called manually. Use createScoreFunction to create the entire plot instead.
	*/
	createContinuousPlotElements(u: any, pointsContainer: d3.Selection<any, any, any, any>, linesContainer: d3.Selection<any, any, any, any>, labelsContainer: d3.Selection<any, any, any, any>): void {
		// Create a point for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		var updatePlottedPoints = pointsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT)
			.data((d: ScoreFunctionData) => { return d.elements; });

		updatePlottedPoints.exit().remove();

		updatePlottedPoints
			.enter().append('circle')
			.classed(ContinuousScoreFunctionRenderer.defs.POINT, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + '-point';
			});

		this.plottedPoints = pointsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT);

		var updatePointLabels = labelsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT_LABEL)
			.data((d: ScoreFunctionData) => { return d.elements; });

		updatePointLabels.exit().remove();

		updatePointLabels
			.enter().append('text')
			.classed(ContinuousScoreFunctionRenderer.defs.POINT_LABEL, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + 'point-label';
			});

		this.pointLabels = labelsContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.POINT_LABEL);

		// Create a slope line for each new adjacent pair of elements in the Objective's domain. Note that this is all elements when the plot is first created.
		var updateFitLines = linesContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.FITLINE)
			.data((d: ScoreFunctionData) => {
				// Each fit line connects domain element i to i + 1 in the plot. This means that we need to create one fewer lines than domain elements.
				// To do this, we simply remove the last domain element from the list before we create the lines.
				var temp = d.elements.pop();	// Remove the last domain element.
				var data = d.elements.slice();	// Copy the array.
				d.elements.push(temp);			// Add the domain element back.
				return data;
			});

		updateFitLines.exit().remove();

		updateFitLines
			.enter().append('line')
			.classed(ContinuousScoreFunctionRenderer.defs.FITLINE, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + u.objective.getId() + '-' + d.element + '-fitline';
			});

		this.fitLines = linesContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.FITLINE);
	}

	/*
		@param domainLabels - The selection 'text' elements used to label the domain axis.
		@param plotElementsContainer - The 'g' element that contains the userContainers elements.
		@param objective - The objective for which the score function plot is being rendered.
		@param usersDomainElements - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Positions and styles the elements created by createPlot.  This method overrides the createPlot method in ScoreFunctionRenderer in order to render ContinuousScoreFunction 
						specific elements (via renderDiscretePlot), like points and fitlines for the scatter plot that is used to represent element scores. It does this via a call to renderContinuousPlot.
						This method should NOT be called manually. Instead it should be used as a part of calling renderScoreFunction to re-render
						the entire score function plot.
	*/
	renderPlot(u: any, domainLabels: d3.Selection<any, any, any, any>, plotElementsContainer: d3.Selection<any, any, any, any>): void {
		super.renderPlot(u, domainLabels, plotElementsContainer);

		this.renderContinuousPlot(u);

	}

	/*
		@param objective - The objective for which the score function plot is being rendered.
		@param usersDomainElements - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method positions and styles the ContinuousScoreFunction specific elements of the score function plot. Specifically, it renders the points, fitlines, and point labels
						of the scatter plot.nThis method should NOT be called manually. Instead it should be used as a part of calling renderScoreFunction to re-render the entire score function plot.
	*/
	renderContinuousPlot(u: any): void {
		var pointRadius = u.rendererConfig.labelOffset / 2.5;
		var pointOffset = 3;

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculatePointCoordinateTwo = (d: DomainElement) => {
			return (u.viewOrientation === 'vertical') ? (u.rendererConfig.domainAxisCoordinateTwo) - u.heightScale(d.scoreFunction.getScore(+d.element)) : u.heightScale(d.scoreFunction.getScore(+d.element));
		};

		// Render the scatter plot points for each user.
		this.plottedPoints
			.attr('c' + u.rendererConfig.coordinateOne, (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) - pointOffset })
			.attr('c' + u.rendererConfig.coordinateTwo, calculatePointCoordinateTwo)
			.attr('r', pointRadius);

		// Render the point labels for each user.
		this.pointLabels
			.text((d: any, i: number) => {
				return Math.round(100 * d.scoreFunction.getScore(+d.element)) / 100;
			})
			.attr(u.rendererConfig.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + pointRadius + 1; })
			.attr(u.rendererConfig.coordinateTwo, calculatePointCoordinateTwo);

		// Render the fitlines for each user.
		this.fitLines
			.attr(u.rendererConfig.coordinateOne + '1', (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) - pointOffset })
			.attr(u.rendererConfig.coordinateTwo + '1', calculatePointCoordinateTwo)
			.attr(u.rendererConfig.coordinateOne + '2', (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d, i + 1) - pointOffset; })
			.attr(u.rendererConfig.coordinateTwo + '2', (d: DomainElement, i: number) => {
				var userElements = u.usersDomainElements.find((userElements: ScoreFunctionData) => {
					return userElements.color === d.color;
				});
				return calculatePointCoordinateTwo(userElements.elements[i + 1]);
			});
	}

	applyStyles(u: any): void {
		this.plottedPoints.style('fill', (d: DomainElement) => { return ((u.usersDomainElements.length === 1) ? u.objective.getColor() : d.color); })
			.style('fill-opacity', 0.5)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.pointLabels.style('font-size', 8);
	}

	/*
		@param enableDragging - A boolean value indicating whether or not to display the  score labels.
		@returns {void}
		@description	This method toggles the visibility of score labels next to the bars in the bar chart.
	*/
	toggleValueLabels(displayScoreFunctionValueLabels: boolean): void {
		if (!this.pointLabelContainer)
			return;

		if (displayScoreFunctionValueLabels) {
			// Display the labels.
			this.pointLabelContainer.style('display', 'block');
		} else {
			// Hide the labels by hiding their container.
			this.pointLabelContainer.style('display', 'none');
		}
	}
}





