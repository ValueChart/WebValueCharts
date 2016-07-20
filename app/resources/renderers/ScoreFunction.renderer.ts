/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 15:34:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-19 22:21:38
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService }											from '../services/ChartData.service';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

// Model Classes
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { ScoreFunction }											from '../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../model/DiscreteScoreFunction';

import { DomainElement, UserDomainElements } 						from '../model/ChartDataTypes';

// This class is the base class for DiscreteScoreFuntionRenderer, and ContinuousScoreFunctionRenderer. It contains the logic for creating and rendering the 
// axis, labels, and base containers of a ScoreFunction.

@Injectable()
export abstract class ScoreFunctionRenderer {

	protected domainSize: number;					// The number of domain elements the score function needs to plot.

	// d3 Selections saved as fields to avoid parsing the DOM when unnecessary. 

	public rootContainer: d3.Selection<any>;						// The 'g' element that is the root container of the score function plot.
	public plotOutline: d3.Selection<any>;						// The 'rect' element that is used to outline the score function plot
	public plotContainer: d3.Selection<any>;						// The 'g' element that contains the plot itself.
	public domainLabelContainer: d3.Selection<any>;				// The 'g' element that contains the labels for each domain element. 
	public domainLabels: d3.Selection<any>;						// The collection of 'text' elements s.t. each element is a label for one domain element.
	public plotElementsContainer: d3.Selection<any>;				// The 'g' element that holds the elements making up the plot, like points and fit lines, or bars.
	public axisContainer: d3.Selection<any>;						// The 'g' element that conntains the y and x axis.
	public utilityLabelContainer: d3.Selection<any>;				// The 'g' element that contains the labels for utility axis.
	public userContainers: d3.Selection<any>;



	protected utilityAxisCoordinateOne: number;				// The x coordinate of the y-axis in the plot.
	protected domainAxisCoordinateTwo: number;				// The y coordinate of the x-axis in the plot
	protected utilityAxisMaxCoordinateTwo: number;			// The y coordinate of the top of the y-axis
	protected domainAxisMaxCoordinateOne: number;			// The x coordinate of the rightmost end of the x-axis.

	protected labelOffset: number = 15;	// Minimum offset of the x and y axis from the edge of the container in a score function plot.

	protected dimensionOne: string;
	protected dimensionTwo: string;
	protected coordinateOne: string;
	protected coordinateTwo: string;
	protected dimensionOneSize: number;
	protected dimensionTwoSize: number;

	protected objective: PrimitiveObjective;
	protected usersDomainElements: any;


	public static defs: any = {
		OUTLINE_CONTAINER: 'scorefunction-outline-container',
		PLOT_OUTLINE: 'scorefunction-plot-outline',

		PLOT_CONTAINER: 'scorefunction-plot-container',

		USER_CONTAINER: 'scorefunction-user-container',

		DOMAIN_LABELS_CONTAINER: 'scorefunction-plot-domain-labels-container',
		DOMAIN_LABEL: 'scorefunction-domain-labels',

		PLOT_ELEMENTS_CONTAINER: 'scorefunction-plot-elements-container',

		AXES_CONTAINER: 'scorefunction-axes-container',
		UTILITY_AXIS_CONTAINER: 'scorefunction-utility-axis',
		DOMAIN_AXIS: 'scorefunction-domain-axis'

	};


	constructor(
			protected chartDataService: ChartDataService, 
			protected chartUndoRedoService: ChartUndoRedoService) { }

	// This function creates the base containers and elements for a score function plot.s
	createScoreFunction(el: d3.Selection<any>, objective: PrimitiveObjective): void {
		var objectiveId: string = objective.getId();
		this.objective = objective;

		// The root container is passed in.
		this.rootContainer = el;

		// Create the a container for the plot outlines, and the plot outlines itself.
		this.plotOutline = el.append('g')
			.classed(ScoreFunctionRenderer.defs.OUTLINE_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-outline-container')
			.append('rect')
				.classed(ScoreFunctionRenderer.defs.PLOT_OUTLINE, true)
				.attr('id', 'scorefunction-' + objectiveId + '-outline')
				.classed('valuechart-outline', true);

		// Create a container to hold all the elements of the plot.
		this.plotContainer = el.append('g')
			.classed(ScoreFunctionRenderer.defs.PLOT_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-plot-container');

		this.createScoreFunctionAxis(this.plotContainer, objectiveId);

		var usersDomainElements: UserDomainElements[] = this.chartDataService.getAllUsersDomainElements(objective);
		this.usersDomainElements = usersDomainElements.slice();

		this.domainLabelContainer = this.plotContainer.append('g')								// Create a container to hold the domain axis labels.
			.classed(ScoreFunctionRenderer.defs.DOMAIN_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-domain-labels-container');

		this.plotElementsContainer = this.plotContainer.append('g')								// create a container to hold all the elements of the plot, like points, lines, bars, etc.
			.classed(ScoreFunctionRenderer.defs.PLOT_ELEMENTS_CONTAINER, true)
			.classed('scorefunction-' + objectiveId + '-plot-elements-container', true);

		this.createPlot(this.plotElementsContainer, this.domainLabelContainer, objective, usersDomainElements);
	}

	// This function creates the axis of a score function plot, both x and y, and creates the utility axis labels.
	// Note that the domain labels are created in createPlot, because they are data dependent.
	createScoreFunctionAxis(plotContainer: d3.Selection<any>, objectiveId: string): void {
		
		this.axisContainer = plotContainer.append('g')
			.classed(ScoreFunctionRenderer.defs.AXES_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-axes-container');

		this.axisContainer.append('line')
			.classed(ScoreFunctionRenderer.defs.DOMAIN_AXIS, true)
			.attr('id', 'scorefunction-' + objectiveId + '-domain-axis')
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.axisContainer.append('g')
			.classed(ScoreFunctionRenderer.defs.UTILITY_AXIS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-utility-axis-container'); 
	}

	// This function creates the domain labels for the domain element axis. DiscreteScoreFunction and ContinuousScoreFunction extend this method in order
	// to create the specific elements they need.
	createPlot(plotElementsContainer: d3.Selection<any>, domainLabelContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {
		var objectiveId = objective.getId();

		this.userContainers = plotElementsContainer.selectAll('.' + ScoreFunctionRenderer.defs.USER_CONTAINER)
			.data(usersDomainElements)
			.enter().append('g')
				.classed(ScoreFunctionRenderer.defs.USER_CONTAINER, true)
				.attr('id', (d: UserDomainElements) => { return 'scorefunction-' + d.user.getUsername().replace(/\s+/g, '') + '-container'; });

		// Create one label for each element of the PrimitiveObjective's domain.
		domainLabelContainer.selectAll('.' + ScoreFunctionRenderer.defs.DOMAIN_LABEL)
			.data(usersDomainElements[0].elements)
			.enter().append('text')
				.classed(ScoreFunctionRenderer.defs.DOMAIN_LABEL, true)
				.attr('id', (d: DomainElement) => {
					return 'scorefunction-' + objectiveId + '-' + d.element + '-label';
				});

		this.domainLabels = domainLabelContainer.selectAll('.' + ScoreFunctionRenderer.defs.DOMAIN_LABEL);
	}

	// This function renders the elements created by createScoreFunction
	renderScoreFunction(el: d3.Selection<any>, objective: PrimitiveObjective, width: number, height: number, viewOrientation: string): void {
		var objectiveId: string = objective.getId();

		if (viewOrientation === 'vertical') {
			this.dimensionOne = 'width';
			this.dimensionTwo = 'height';
			this.coordinateOne = 'x';
			this.coordinateTwo = 'y';

			this.dimensionOneSize = width;
			this.dimensionTwoSize = height;

			this.domainAxisCoordinateTwo = Math.min((19 / 20) * this.dimensionTwoSize, this.dimensionTwoSize - this.labelOffset);

			this.utilityAxisMaxCoordinateTwo = Math.max(this.dimensionTwoSize / 20, 5);
			this.utilityAxisCoordinateOne = Math.max(this.dimensionOneSize / 20, this.labelOffset);
			
		} else {
			this.dimensionOne = 'height';
			this.dimensionTwo = 'width';
			this.coordinateOne = 'y';
			this.coordinateTwo = 'x';

			this.dimensionOneSize = height;
			this.dimensionTwoSize = width;

			this.domainAxisCoordinateTwo = Math.max((1 / 20) * this.dimensionTwoSize, this.labelOffset) + 10;

			this.utilityAxisMaxCoordinateTwo = Math.max(this.dimensionTwoSize * (19 / 20), 5);
			this.utilityAxisCoordinateOne = Math.max(this.dimensionOneSize / 20, this.labelOffset);
		}

		this.domainAxisMaxCoordinateOne = Math.min((19 / 20) * this.dimensionOneSize, this.dimensionOneSize - this.labelOffset);



		this.plotOutline
			.attr(this.dimensionOne, this.dimensionOneSize - 1)
			.attr(this.dimensionTwo, this.dimensionTwoSize);


		this.renderScoreFunctionAxis(this.axisContainer, this.utilityLabelContainer, objectiveId, viewOrientation);

		this.renderPlot(this.domainLabels, this.plotElementsContainer, objective, this.usersDomainElements, viewOrientation);			
	}

	// This function renders the elements created by createScoreFunctionAxis
	renderScoreFunctionAxis(axisContainer: d3.Selection<any>, utilityLabelContainer: d3.Selection<any>, objectiveId: string, viewOrientation: string): void {

		axisContainer.select('.' + ScoreFunctionRenderer.defs.DOMAIN_AXIS)
			.attr(this.coordinateOne + '1', this.utilityAxisCoordinateOne)
			.attr(this.coordinateTwo + '1', this.domainAxisCoordinateTwo)
			.attr(this.coordinateOne + '2', this.domainAxisMaxCoordinateOne)
			.attr(this.coordinateTwo + '2', this.domainAxisCoordinateTwo);


		// Delete the elements of the previous scale:
		var elements: any = (<any> axisContainer.select('.' + ScoreFunctionRenderer.defs.UTILITY_AXIS_CONTAINER).node()).children;
		for (var i = 0; i < elements.length; i++) {
			elements[i].remove();
		}

		// Create the new Scale:
		var uilityScale: d3.Linear<number, number> = d3.scaleLinear()
			.domain([0, 1])

		var utilityScaleHeight: number = (viewOrientation === 'vertical') ? (this.domainAxisCoordinateTwo - this.utilityAxisMaxCoordinateTwo) : (this.utilityAxisMaxCoordinateTwo - this.domainAxisCoordinateTwo);

		var utilityAxis: any;

		if (viewOrientation === 'vertical') {
			uilityScale.range([utilityScaleHeight, 0]);
			utilityAxis = d3.axisLeft(uilityScale);
		} else {
			uilityScale.range([0, utilityScaleHeight]);
			utilityAxis = d3.axisTop(uilityScale);
		}

		utilityAxis.ticks(1);

		axisContainer.select('.' + ScoreFunctionRenderer.defs.UTILITY_AXIS_CONTAINER)
			.attr('transform', () => { 
				return 'translate(' + ((viewOrientation === 'vertical') ? ((this.utilityAxisCoordinateOne + 4) + ',' + (this.utilityAxisMaxCoordinateTwo - .5) +')') : ((this.domainAxisCoordinateTwo - .5) + ', ' + (this.utilityAxisCoordinateOne + 4) + ')'));
			})
			.call(utilityAxis)
			.style('font-size', 8);
	}

	// This function renders the elements created by createPlot. Like createPlot, it is extended by DiscreteScoreFunction and ContinuousScoreFunction in order
	// to render their specific elements.
	renderPlot(domainLabels: d3.Selection<any>, plotElementsContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[], viewOrientation: string): void {

		this.domainSize = usersDomainElements[0].elements.length;

		var labelCoordinateOneOffset: number;
		var labelCoordinateTwo: number;

		if (viewOrientation === 'vertical') {
			labelCoordinateOneOffset = this.labelOffset;
			labelCoordinateTwo = this.domainAxisCoordinateTwo + this.labelOffset - 2;
		} else {
			labelCoordinateOneOffset = (1.5 * this.labelOffset);
			labelCoordinateTwo = this.domainAxisCoordinateTwo - (this.labelOffset);
		}

		domainLabels
			.attr(this.coordinateOne, (d: DomainElement, i: number) => { return (((this.domainAxisMaxCoordinateOne - this.utilityAxisCoordinateOne) / this.domainSize) * i) + labelCoordinateOneOffset; }) // Position the domain labels at even intervals along the axis.
			.attr(this.coordinateTwo, labelCoordinateTwo)
			.text((d: DomainElement) => { return d.element; })
			.style('font-size', '9px');
	}

	abstract toggleValueLabels(displayScoreFunctionValueLabels: boolean): void;



	// Anonymous functions that are used often enough to be made class fields:

	calculatePlotElementCoordinateOne = (d: DomainElement, i: number) => { return (((this.domainAxisMaxCoordinateOne - this.utilityAxisCoordinateOne) / this.domainSize) * i) + this.labelOffset * 1.5; }

}
