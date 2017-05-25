/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 15:34:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-25 14:07:56
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';

// Import Application Classes:
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

// Import Model Classes:
import { Objective }												from '../../../model/Objective';
import { PrimitiveObjective }										from '../../../model/PrimitiveObjective';
import { ScoreFunction }											from '../../../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../../../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../../../model/DiscreteScoreFunction';
import { ContinuousDomain }											from '../../../model/ContinuousDomain';

import { ExpandScoreFunctionInteraction }							from '../interactions/ExpandScoreFunction.interaction';
import { AdjustScoreFunctionInteraction }							from '../interactions/AdjustScoreFunction.interaction';

import { DomainElement, ScoreFunctionData } 						from '../../../types/RendererData.types';
import { RendererUpdate }											from '../../../types/RendererData.types';
import { InteractionConfig, ViewConfig }							from '../../../types/Config.types'
import { ScoreFunctionUpdate, ScoreFunctionConfig }					from '../../../types/RendererData.types';


// This class is the base class for DiscreteScoreFuntionRenderer, and ContinuousScoreFunctionRenderer. It contains the logic for creating and rendering the 
// axis, labels, and base containers of a ScoreFunction. It is an abstract class and should NOT be instantiated or used for any reason. This class has 
// uses outside of rendering a ValueChart, and as such is decoupled as much as possible from the services associated with the ValueChartDirective.

@Injectable()
export abstract class ScoreFunctionRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	protected domainSize: number;							// The number of domain elements the score function needs to plot.
	protected objective: PrimitiveObjective;				// The primitive objective this renderer is creating a plot for.
	protected scoreFunctionData: ScoreFunctionData[];		// The data that this class is rendering.
	protected enableInteraction: boolean;					// Whether or not the score functions may be adjusted

	// d3 Selections:
	public rootContainer: d3.Selection<any, any, any, any>;				// The 'g' element that is the root container of the score function plot.
	public outlineContainer: d3.Selection<any, any, any, any>;
	public plotOutline: d3.Selection<any, any, any, any>;					// The 'rect' element that is used to outline the score function plot
	public plotContainer: d3.Selection<any, any, any, any>;				// The 'g' element that contains the plot itself.
	public domainLabelContainer: d3.Selection<any, any, any, any>;			// The 'g' element that contains the labels for each domain element. 
	public domainLabels: d3.Selection<any, any, any, any>;					// The selection of 'text' elements s.t. each element is a label for one domain element.
	public plotElementsContainer: d3.Selection<any, any, any, any>;		// The 'g' element that holds the elements making up the plot, like points and fit lines, or bars.
	public userContainers: d3.Selection<any, any, any, any>;				// The selection of 'g' elements s.t. each element is a container for the plot elements of one user.
	public axisContainer: d3.Selection<any, any, any, any>;				// The 'g' element that conntains the y and x axis.

	public domainAxis: d3.Selection<any, any, any, any>;
	public unitsLabel: d3.Selection<any, any, any, any>;
	public utilityAxisContainer: d3.Selection<any, any, any, any>;

	protected lastRendererUpdate: ScoreFunctionUpdate;
	protected numUsers: number;
	protected viewOrientation: string;

	protected adjustScoreFunctionInteraction: AdjustScoreFunctionInteraction;


	// class name definitions for SVG elements that are created by this renderer.
	public static defs = {
		OUTLINE_CONTAINER: 'scorefunction-outline-container',
		PLOT_OUTLINE: 'scorefunction-plot-outline',

		PLOT_CONTAINER: 'scorefunction-plot-container',

		USER_CONTAINER: 'scorefunction-user-container',

		DOMAIN_LABELS_CONTAINER: 'scorefunction-plot-domain-labels-container',
		DOMAIN_LABEL: 'scorefunction-domain-labels',

		PLOT_ELEMENTS_CONTAINER: 'scorefunction-plot-elements-container',

		AXES_CONTAINER: 'scorefunction-axes-container',
		UTILITY_AXIS_CONTAINER: 'scorefunction-utility-axis',
		DOMAIN_AXIS: 'scorefunction-domain-axis',
		UNITS_LABEL: 'scorefunction-units-label'
	};

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection. However, this class is frequently constructed manually unlike the other renderer classes. 
						This constructor should not be used to do any initialization of the class. Note that the dependencies of the class are intentionally being kept to a minimum.
	*/
	constructor(
		protected chartUndoRedoService: ChartUndoRedoService,
		protected expandScoreFunctionInteraction: ExpandScoreFunctionInteraction) {
		this.adjustScoreFunctionInteraction = new AdjustScoreFunctionInteraction(this.chartUndoRedoService);
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	public scoreFunctionChanged = (update: ScoreFunctionUpdate) => {
		this.lastRendererUpdate = update;

		if (this.rootContainer == undefined) {
			this.createScoreFunction(update);
			this.renderScoreFunction(update, (this.numUsers != update.scoreFunctions.length || this.viewOrientation != update.viewOrientation));
			this.applyStyles(update);
			this.numUsers = update.scoreFunctions.length;
			return;
		}

		if (this.numUsers != update.scoreFunctions.length) {
			this.createPlot(update, this.plotElementsContainer, this.domainLabelContainer);
		}

		this.renderScoreFunction(update, (this.numUsers != update.scoreFunctions.length || this.viewOrientation != update.viewOrientation));
		
		if (update.styleUpdate) {
			this.applyStyles(update);
		}

		this.adjustScoreFunctionInteraction.lastRendererUpdate = this.lastRendererUpdate;
		this.numUsers = update.scoreFunctions.length;
		this.viewOrientation = update.viewOrientation;
	}

	public viewConfigChanged = (displayScoreFunctionValueLabels: boolean) => {
		this.toggleValueLabels(displayScoreFunctionValueLabels);		
	}

	public interactionConfigChanged = (interactionConfig: any) => {
		this.expandScoreFunctionInteraction.toggleExpandScoreFunction(interactionConfig.expandScoreFunctions, this.rootContainer.node().querySelectorAll('.' + ScoreFunctionRenderer.defs.PLOT_OUTLINE), this.lastRendererUpdate);
	}

	/*
		@param el - The element that to be used as the parent of the objective chart.
		@param objective - The objective for which the score function plot is going to be created.
		@returns {void}
		@description 	Creates the base containers and elements for a score function plot. It should be called as the first step of creating a score function plot.
						sub classes of this class should call createScoreFunction before creating any of their specific elements.
	*/
	protected createScoreFunction(u: ScoreFunctionUpdate): void {
		var objectiveId: string = u.objective.getId();
		this.objective = u.objective;

		// The root container is passed in.
		this.rootContainer = u.el;

		// Create the a container for the plot outlines, and the plot outlines itself.
		this.outlineContainer = u.el.append('g')
			.classed(ScoreFunctionRenderer.defs.OUTLINE_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-outline-container');

		this.plotOutline = this.outlineContainer
			.append('rect')
			.classed(ScoreFunctionRenderer.defs.PLOT_OUTLINE, true)
			.attr('id', 'scorefunction-' + objectiveId + '-outline')
			.classed('valuechart-outline', true);

		// Create a container to hold all the elements of the plot.
		this.plotContainer = u.el.append('g')
			.classed(ScoreFunctionRenderer.defs.PLOT_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-plot-container');

		this.createScoreFunctionAxis(this.plotContainer, objectiveId);

		this.domainLabelContainer = this.plotContainer.append('g')								// Create a container to hold the domain axis labels.
			.classed(ScoreFunctionRenderer.defs.DOMAIN_LABELS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-domain-labels-container');

		this.plotElementsContainer = this.plotContainer.append('g')								// create a container to hold all the elements of the plot, like points, lines, bars, etc.
			.classed(ScoreFunctionRenderer.defs.PLOT_ELEMENTS_CONTAINER, true)
			.classed('scorefunction-' + objectiveId + '-plot-elements-container', true);

		this.createPlot(u, this.plotElementsContainer, this.domainLabelContainer);
	}

	/*
		@param plotContainer - The 'g' element that is intended to contain the score function plot.
		@param objectiveId - The id of the objective for which this score function plot is being created. This is for use in setting element IDs.
		@returns {void}
		@description 	Creates the axes of a score function plot, both x and y, and creates the utility axis labels. 
						Note that the domain labels are created in createPlot because they are data dependent.
	*/
	protected createScoreFunctionAxis(plotContainer: d3.Selection<any, any, any, any>, objectiveId: string): void {

		this.axisContainer = plotContainer.append('g')
			.classed(ScoreFunctionRenderer.defs.AXES_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-axes-container');

		this.domainAxis = this.axisContainer.append('line')
			.classed(ScoreFunctionRenderer.defs.DOMAIN_AXIS, true)
			.attr('id', 'scorefunction-' + objectiveId + '-domain-axis');

		let unitsText = "";
		let dom = this.objective.getDomain();
		if (dom.type === 'continuous' && (<ContinuousDomain>dom).unit !== undefined ) {
			unitsText = (<ContinuousDomain>dom).unit;
		}

		this.unitsLabel = this.axisContainer.append('text')
			.classed(ScoreFunctionRenderer.defs.UNITS_LABEL, true)
			.attr('id', 'scorefunction-' + objectiveId + '-units-label')			
			.text(unitsText);

		this.utilityAxisContainer = this.axisContainer.append('g')
			.classed(ScoreFunctionRenderer.defs.UTILITY_AXIS_CONTAINER, true)
			.attr('id', 'scorefunction-' + objectiveId + '-utility-axis-container');

	}


	/*
		@param plotElementsContainer - The 'g' element that is intended to contain the user containers. These are 'g' elements that will contain the parts of each users plot (bars/points).
		@param domainLabelContainer - The 'g' element that is intended to contain the labels for the domain (x) axis. 
		@param objective - The objective for which the score function plot is going to be created.
		@param scoreFunctionData - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@returns {void}
		@description 	Creates the user containers, which will contain each user's plot elements, and the domain labels for the domain element axis. 
						DiscreteScoreFunction and ContinuousScoreFunction extend this method in order to create the additional SVG elements they need.
						This method is also used to update a score function plot when the Users change.
	*/
	protected createPlot(u: ScoreFunctionUpdate, plotElementsContainer: d3.Selection<any, any, any, any>, domainLabelContainer: d3.Selection<any, any, any, any>): void {
		var objectiveId = u.objective.getId();
		// Create the user containers. Each user should have one 'g' element that will hold the elements of its plot. Elements refers to bars, points, fit lines, etc.
		
		var updateUserContainers = plotElementsContainer.selectAll('.' + ScoreFunctionRenderer.defs.USER_CONTAINER)
			.data(u.scoreFunctionData);

		updateUserContainers.exit().remove();
		updateUserContainers.enter().append('g')
			.classed(ScoreFunctionRenderer.defs.USER_CONTAINER, true)
			.attr('id', (d: ScoreFunctionData) => { return 'scorefunction-' + d.color.replace(/\s+/g, '') + '-container'; });

		this.userContainers = plotElementsContainer.selectAll('.' + ScoreFunctionRenderer.defs.USER_CONTAINER)

		var updateDomainLabels = domainLabelContainer.selectAll('.' + ScoreFunctionRenderer.defs.DOMAIN_LABEL)
			.data(u.scoreFunctionData.length > 0 ? u.scoreFunctionData[0].elements : []);

		updateDomainLabels.exit().remove();

		// Create one label for each element of the PrimitiveObjective's domain.
		updateDomainLabels
			.enter().append('text')
			.classed(ScoreFunctionRenderer.defs.DOMAIN_LABEL, true)
			.attr('id', (d: DomainElement) => {
				return 'scorefunction-' + objectiveId + '-' + d.element + '-label';
			});

		this.domainLabels = domainLabelContainer.selectAll('.' + ScoreFunctionRenderer.defs.DOMAIN_LABEL);
	}

	/*
		@param objective - The objective for which the score function plot is going to be created.
		@param width - The width of the area in which to render the score function plot.
		@param height - The height of the area in which to render the score function plot.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Initializes the view configuration for the score function plot, and then positions + styles its elements. This method should be used 
						whenever the score function plot needs to be rendered for the first time, or when updated in response to changes to users' ScoreFunctions.
						View configuration must be done here because this class intentionally avoids using the renderConfigService class. It uses calls to the
						render plot method (which is overwritten by subclasses), and the renderAxesDimensionTwo to render the different parts of the score function plot.
	*/
	protected renderScoreFunction(u: ScoreFunctionUpdate, updateDimensionOne: boolean): void {
		this.domainSize = u.scoreFunctionData.length > 0 ? u.scoreFunctionData[0].elements.length : 0;

		// Give the plot outline the correct dimensions.
		this.plotOutline
			.attr(u.rendererConfig.dimensionOne, u.rendererConfig.dimensionOneSize - 1)
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.dimensionTwoSize);

		this.renderAxesDimensionTwo(u);

		if (updateDimensionOne)
			this.renderAxesDimensionOne(u);

		this.renderPlot(u, updateDimensionOne);
	}

	protected renderAxesDimensionOne(u: ScoreFunctionUpdate): void {
		// Position the domain axis.
		this.domainAxis
			.attr(u.rendererConfig.coordinateOne + '1', u.rendererConfig.utilityAxisCoordinateOne)
			.attr(u.rendererConfig.coordinateOne + '2', u.rendererConfig.domainAxisMaxCoordinateOne);

		this.unitsLabel
			.attr(u.rendererConfig.coordinateOne, u.rendererConfig.domainAxisMaxCoordinateOne / 2);

		var labelCoordinateOneOffset: number;

		if (u.viewOrientation === 'vertical') {
			labelCoordinateOneOffset = u.rendererConfig.labelOffset;
		} else {
			labelCoordinateOneOffset = (1.5 * u.rendererConfig.labelOffset);
		}

		// Position the domain labels along the domain (x) axis.
		this.domainLabels
			.attr(u.rendererConfig.coordinateOne, (d: DomainElement, i: number) => { return (((u.rendererConfig.domainAxisMaxCoordinateOne - u.rendererConfig.utilityAxisCoordinateOne) / this.domainSize) * i) + labelCoordinateOneOffset; }) // Position the domain labels at even intervals along the axis.
			.text((d: DomainElement) => { return d.element; });
	}

	/*
		@param axisContainer - The 'g' element that the axes elements are in.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Positions and styles the elements of both the domain (y) and utility axes (x). This method should NOT be called manually. Rendering
						the axes elements should be done as part of a call to renderScoreFunction instead.
	*/
	protected renderAxesDimensionTwo(u: ScoreFunctionUpdate): void {

		this.domainAxis
			.attr(u.rendererConfig.coordinateTwo + '1', u.rendererConfig.domainAxisCoordinateTwo)
			.attr(u.rendererConfig.coordinateTwo + '2', u.rendererConfig.domainAxisCoordinateTwo);

		this.unitsLabel
			.attr(u.rendererConfig.coordinateTwo,  u.rendererConfig.domainAxisCoordinateTwo + u.rendererConfig.labelOffset - 2);

		var labelCoordinateTwo: number;

		if (u.viewOrientation === 'vertical') {
			labelCoordinateTwo = u.rendererConfig.domainAxisCoordinateTwo + u.rendererConfig.labelOffset - 12;
		} else {
			labelCoordinateTwo = u.rendererConfig.domainAxisCoordinateTwo - (u.rendererConfig.labelOffset);
		}

		this.domainLabels
			.attr(u.rendererConfig.coordinateTwo, labelCoordinateTwo)

		// Delete the elements of the previous utility axis.
		var elements: any = this.utilityAxisContainer.node().children;
		for (var i = 0; i < elements.length; i++) {
			elements[i].remove();
		}

		// Create the new Scale for use creating the utility axis.
		var uilityScale: d3.ScaleLinear<number, number> = d3.scaleLinear()
			.domain([0, 1])

		// Calculate the correct height of the utility axis.
		var utilityScaleHeight: number = (u.viewOrientation === 'vertical') ? (u.rendererConfig.domainAxisCoordinateTwo - u.rendererConfig.utilityAxisMaxCoordinateTwo) : (u.rendererConfig.utilityAxisMaxCoordinateTwo - u.rendererConfig.domainAxisCoordinateTwo);

		var utilityAxis: any;

		// The range of the scale must be inverted for the vertical axis because pixels coordinates set y to increase downwards, rather than upwards as normal.
		if (u.viewOrientation === 'vertical') {
			uilityScale.range([utilityScaleHeight, 0]);
			utilityAxis = d3.axisLeft(uilityScale);
		} else {
			uilityScale.range([0, utilityScaleHeight]);
			utilityAxis = d3.axisTop(uilityScale);
		}

		// The utility axis should have two ticks. For some reason 1 is the way to do this...
		utilityAxis.ticks(1);

		// Position the axis by positioning the axis container and then create it.
		this.utilityAxisContainer
			.attr('transform', () => {
				return 'translate(' + ((u.viewOrientation === 'vertical') ? ((u.rendererConfig.utilityAxisCoordinateOne + 4) + ',' + (u.rendererConfig.utilityAxisMaxCoordinateTwo - .5) + ')') : ((u.rendererConfig.domainAxisCoordinateTwo - .5) + ', ' + (u.rendererConfig.utilityAxisCoordinateOne + 4) + ')'));
			})
			.call(utilityAxis);
	}

	/*
		@param domainLabels - The selection 'text' elements used to label the domain axis.
		@param plotElementsContainer - The 'g' element that contains the userContainers elements.
		@param objective - The objective for which the score function plot is being rendered.
		@param scoreFunctionData - The correctly formatted data for underlying the points/bars of the score function plot. This format allows the plot to show multiple users' score functions.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Positions and styles the elements created by createPlot. Like createPlot, it is extended by DiscreteScoreFunction and ContinuousScoreFunction in order
						to render their specific elements. This method should NOT be called manually. Instead it should be called as a part of calling renderScoreFunction to re-render
						the entire score function plot. Note that parameters not actively used in this method are used in the extended methods of the subclasses.
	*/
	protected abstract renderPlot(u: ScoreFunctionUpdate, updateDimensionOne: boolean): void; 



	protected abstract toggleValueLabels(displayScoreFunctionValueLabels: boolean): void;


	protected applyStyles(u: ScoreFunctionUpdate): void {
		this.domainAxis
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.unitsLabel.style('font-size', '10px');
	
		this.utilityAxisContainer.style('font-size', 8);

		this.domainLabels.style('font-size', '9px');
	}


	// ========================================================================================
	// 			Anonymous functions that are used often enough to be made class fields
	// ========================================================================================

	calculatePlotElementCoordinateOne = (d: DomainElement, i: number) => { return (((this.lastRendererUpdate.rendererConfig.domainAxisMaxCoordinateOne - this.lastRendererUpdate.rendererConfig.utilityAxisCoordinateOne) / this.domainSize) * i) + this.lastRendererUpdate.rendererConfig.labelOffset * 1.5; }
}
