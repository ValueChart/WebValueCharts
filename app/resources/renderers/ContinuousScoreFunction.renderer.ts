/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:41:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-16 21:30:33
*/

// Import Angular classes:
import { Injectable } 									from '@angular/core';
import { NgZone }										from '@angular/core';


// Import Libraries:
import * as d3 											from 'd3';

// Import Application Classes:
import { ValueChartService }							from '../services/ValueChart.service';
import { ScoreFunctionViewerService }					from '../services/ScoreFunctionViewer.service';
import { ScoreFunctionRenderer }						from './ScoreFunction.renderer';
import { ChartUndoRedoService }							from '../services/ChartUndoRedo.service';


// Import Model Classes:
import { Objective }									from '../model/Objective';
import { PrimitiveObjective }							from '../model/PrimitiveObjective';
import { ScoreFunction }								from '../model/ScoreFunction';
import { ContinuousScoreFunction }						from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }						from '../model/DiscreteScoreFunction';

// Import Types:
import { DomainElement, UserDomainElements } 			from '../types/ScoreFunctionViewer.types';

// This class contains the logic for creating and rendering multiple users' ContinuousScoreFunctions for a single objective with a continuous 
// (either categorical or interval) domain. The score functions are rendered as scatter plots where the points are the elements in the objective's 
// domain to which the users have assigned scores. Each user has one point indicating score per domain element in the objective.
@Injectable()
export class ContinuousScoreFunctionRenderer extends ScoreFunctionRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// d3 Selections:
	public pointsContainer: d3.Selection<any>;				// The 'g' element that contains the 'circle' elements used as points in the scatter plot.
	public plottedPoints: d3.Selection<any>;				// The 'circle' elements used as points in the scatter plot.
	public linesContainer: d3.Selection<any>;				// The 'g' element that contains the 'line' elements used as fitlines between points in the scatter plot. 
	public fitLines: d3.Selection<any>;						// The 'line' elements used as fitlines between points in the scatter plot. 
	public pointLabelContainer: d3.Selection<any>;			// The 'g' element that contains the 'text' elements used to labels points in the scatter plot with their scores.
	public pointLabels: d3.Selection<any>;					// The 'text' elements used to labels points in the scatter plot with their scores.

	// The linear scale used to translate from scores to pixel coordinates. This is used to determine the locations of the points and fitlines.
	private heightScale: d3.Linear<number, number>;

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
	constructor(valueChartService: ValueChartService, scoreFunctionViewerService: ScoreFunctionViewerService, chartUndoRedoService: ChartUndoRedoService, private ngZone: NgZone) {
		super(valueChartService, scoreFunctionViewerService, chartUndoRedoService);
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
		@description 	This method overrides the createPlot method in ScoreFunctionRenderer in order to create ContinuousScoreFunction specific elements, 
						like points and fitlines for the scatter plot that is used to represent element scores. This method should NOT be called manually. Instead, 
						the createScoreFunction method that this class inherits from ScoreFunctionRenderer should be used. That method will call createPlot method after
						doing the necessary construction of base containers and elements. 
	*/
	createPlot(plotElementsContainer: d3.Selection<any>, domainLabelContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, usersDomainElements);

		// Create the continuous score function specific element containers:

		// Create the fitline container.
		this.linesContainer = this.userContainers.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.FITLINES_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-fitlines-container');

		// Create the points container.
		this.pointsContainer = this.userContainers.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.POINTS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-points-container');

		// Create the point labels container.
		this.pointLabelContainer = this.userContainers.append('g')
			.classed(ContinuousScoreFunctionRenderer.defs.POINT_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objective.getId() + '-point-labels-container');


		this.createContinuousPlotElements(this.pointsContainer, this.linesContainer, this.pointLabelContainer, objective);
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
	createContinuousPlotElements(pointsContainer: d3.Selection<any>, linesContainer: d3.Selection<any>, labelsContainer: d3.Selection<any>, objective: PrimitiveObjective): void {
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

		// Create a slope line for each new adjacent pair of elements in the Objective's domain. Note that this is all elements when the plot is first created.
		linesContainer.selectAll('.' + ContinuousScoreFunctionRenderer.defs.FITLINE)
			.data((d: UserDomainElements) => {
				// Each fit line connects domain element i to i + 1 in the plot. This means that we need to create one fewer lines than domain elements.
				// To do this, we simply remove the last domain element from the list before we create the lines.
				var temp = d.elements.pop();	// Remove the last domain element.
				var data = d.elements.slice();	// Copy the array.
				d.elements.push(temp);			// Add the domain element back.
				return data;
			})
			.enter().append('line')
			.classed(ContinuousScoreFunctionRenderer.defs.FITLINE, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + objective.getId() + '-' + d.element + '-fitline';
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
	renderPlot(domainLabels: d3.Selection<any>, plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, usersDomainElements, viewOrientation);

		this.renderContinuousPlot(objective, usersDomainElements, viewOrientation);

	}

	/*
		@param objective - The objective for which the score function plot is being rendered.
		@param usersDomainElements - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method positions and styles the ContinuousScoreFunction specific elements of the score function plot. Specifically, it renders the points, fitlines, and point labels
						of the scatter plot.nThis method should NOT be called manually. Instead it should be used as a part of calling renderScoreFunction to re-render the entire score function plot.
	*/
	renderContinuousPlot(objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {
		var pointRadius = this.labelOffset / 2.5;
		var pointOffset = 3;

		// Configure the linear scale that translates scores into pixel units. 
		this.heightScale = d3.scaleLinear()
			.domain([0, 1])

		if (viewOrientation === 'vertical') {
			this.heightScale.range([0, (this.domainAxisCoordinateTwo) - this.utilityAxisMaxCoordinateTwo]);
		} else {
			this.heightScale.range([this.domainAxisCoordinateTwo, this.utilityAxisMaxCoordinateTwo]);
		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculatePointCoordinateTwo = (d: DomainElement) => {
			let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
			return (viewOrientation === 'vertical') ? (this.domainAxisCoordinateTwo) - this.heightScale(scoreFunction.getScore(+d.element)) : this.heightScale(scoreFunction.getScore(+d.element));
		};

		// Render the scatter plot points for each user.
		this.plottedPoints
			.attr('c' + this.viewConfig.coordinateOne, (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) - pointOffset })
			.attr('c' + this.viewConfig.coordinateTwo, calculatePointCoordinateTwo)
			.attr('r', pointRadius)
			.style('fill', (d: DomainElement) => { return ((usersDomainElements.length === 1) ? objective.getColor() : d.user.color); })
			.style('fill-opacity', 0.5)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		// Render the point labels for each user.
		this.pointLabels
			.text((d: any, i: number) => {
				let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				return Math.round(100 * scoreFunction.getScore(+d.element)) / 100;
			})
			.attr(this.viewConfig.coordinateOne, (d: any, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) + pointRadius + 1; })
			.attr(this.viewConfig.coordinateTwo, calculatePointCoordinateTwo)
			.style('font-size', 8);

		// Render the fitlines for each user.
		this.fitLines
			.attr(this.viewConfig.coordinateOne + '1', (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d, i) - pointOffset })
			.attr(this.viewConfig.coordinateTwo + '1', calculatePointCoordinateTwo)
			.attr(this.viewConfig.coordinateOne + '2', (d: DomainElement, i: number) => { return this.calculatePlotElementCoordinateOne(d, i + 1) - pointOffset; })
			.attr(this.viewConfig.coordinateTwo + '2', (d: DomainElement, i: number) => {
				var userElements = usersDomainElements.find((userElements: UserDomainElements) => {
					return userElements.user.getUsername() === d.user.getUsername();
				});
				return calculatePointCoordinateTwo(userElements.elements[i + 1]);
			});

		// Enable or disable dragging to change user score functions depending on whether the ValueChart is has multiple users (should be disabled) or has one user (should be enabled).
		this.toggleDragToChangeScore(this.valueChartService.isIndividual(), objective, viewOrientation);
	}

	/*
		@param enableDragging - Whether dragging to alter a user's score function should be enabled. 
		@param objective - The objective for which the score function plot is being rendered.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method toggles the interaction that allows clicking and dragging on scatter plot points to alter a user's score function.
	*/
	toggleDragToChangeScore(enableDragging: boolean, objective: PrimitiveObjective, viewOrientation: string): void {
		var dragToResizeScores = d3.drag();

		if (enableDragging) {
			dragToResizeScores.on('start', (d: DomainElement, i: number) => {
				let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				// Save the current state of the ScoreFunction.
				this.chartUndoRedoService.saveScoreFunctionRecord(scoreFunction, objective);
			});

			dragToResizeScores.on('drag', (d: DomainElement, i: number) => {
				let scoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction>d.user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				var score: number;
				// Convert the y position of the mouse into a score by using the inverse of the scale used to convert scores into y positions:
				if (viewOrientation === 'vertical') {
					// Subtract the event y form the offset to obtain the y value measured from the bottom of the plot.
					score = this.heightScale.invert(this.domainAxisCoordinateTwo - (<any>d3.event)[this.viewConfig.coordinateTwo]);
				} else {
					// No need to do anything with offsets here because x is already left to right.
					score = this.heightScale.invert((<any>d3.event)[this.viewConfig.coordinateTwo]);
				}
				score = Math.max(0, Math.min(score, 1)); // Normalize the score to be between 0 and 1.

				// Run inside the angular zone. Angular is not necessarily aware of this function executing because it is triggered by a d3 event, which 
				// exists outside of angular. In order to make sure that change detection is triggered, we must do the value assignment inside the "Angular Zone".
				this.ngZone.run(() => { scoreFunction.setElementScore(<number>d.element, score) });
			});
		}

		// Set the drag listeners on the point elements.
		this.plottedPoints.call(dragToResizeScores);

		// Set the cursor style for the points to indicate that they are drag-able (if dragging was enabled).
		this.plottedPoints.style('cursor', () => {
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
			this.pointLabelContainer.style('display', 'block');
		} else {
			// Hide the labels by hiding their container.
			this.pointLabelContainer.style('display', 'none');
		}
	}
}





