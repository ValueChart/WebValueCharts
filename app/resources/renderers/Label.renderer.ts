/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:39:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-20 12:32:38
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';
import { NgZone }													from '@angular/core';

// Import libraries:
import * as d3 														from 'd3';


// Import Application Classes:
import { ValueChartService }										from '../services/ValueChart.service';
import { RendererDataService }										from '../services/RendererData.service';
import { ScoreFunctionViewerService }								from '../services/ScoreFunctionViewer.service';
import { RenderEventsService }										from '../services/RenderEvents.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }							from '../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }							from '../renderers/ContinuousScoreFunction.renderer';
import { ReorderObjectivesInteraction }								from '../interactions/ReorderObjectives.interaction';

import { LabelDefinitions }											from '../services/LabelDefinitions.service';


// Import Model Classes:
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { AbstractObjective }										from '../model/AbstractObjective';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';
import { WeightMap }												from '../model/WeightMap';

// Import Types:
import {RowData, CellData, LabelData, ViewConfig}					from '../types/RendererData.types';
import { DomainElement, UserDomainElements } 						from '../types/ScoreFunctionViewer.types';



// This class renders a ValueChart's hierarchical objective structure into labels for an objective chart. Each objective is rendered into a 
// rectangle whose width (or height depending on the orientation) is proportional to its weight. The rectangles are positioned in such a
// way that they act as labels for the objectives in the objective chart. It uses the ScoreFunctionRenderer class and its subclasses to render
// a plot of each primitive objective's score function with the label area.

@Injectable()
export class LabelRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// The viewConfig object for this renderer. It is configured using the renderConfigService.
	public viewConfig: ViewConfig = <ViewConfig>{};

	// d3 Selections. Note that that not many are saved because of the recursive creation and rendering strategy that this class uses.
	public rootContainer: d3.Selection<any>;				// The 'g' element that is the root container of the Label area.
	public labelSpaceOutline: d3.Selection<any>;			// The 'rect' element that is the outline of the label area.
	public labelContainer: d3.Selection<any>;				// The 'g' element that contains the hierarchical label structure.
	public scoreFunctionContainer: d3.Selection<any>;		// the 'g' element that contains the score function plots for each PrimitiveObjective in the ValueChart.

	private labelWidth: number;								// The min of the labels, calculated based on the maximum depth of the objective hierarchy and the amount of 
	// space that the label area is rendered in.
	private displayScoreFunctions: boolean;					// Should score function plots be displayed? 

	public scoreFunctionRenderers: any;						// A JS object literal used as a map to store instances of score function renderers.  Its field names are the names of primitive objectives,
	// and the values are score function renderers.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this directive when it is used.
	*/
	constructor(
		private renderConfigService: RenderConfigService,
		private renderEventsService: RenderEventsService,
		private valueChartService: ValueChartService,
		private rendererDataService: RendererDataService,
		private scoreFunctionViewerService: ScoreFunctionViewerService,
		private chartUndoRedoService: ChartUndoRedoService,
		private defs: LabelDefinitions,
		private ngZone: NgZone) {
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param el - The element that is will be used as the parent of the summary chart.
		@param labelData - The data that labels are going to represent. Note that this data has a recursive (or nested) structure.
		@param objectiveData - The list of primitive objectives in the ValueChart. This is used to render the score function plots.
		@returns {void}
		@description 	Creates the base containers and all elements for the labels of a ValueChart. It should be called when creating the labels for the first time
						and when rebuilding them. The label area's recursive structure means that when objectives are added/deleted, or the order of objectives is changed,
						the label area must be destroyed and reconstructed. This is partly because assigning different data to a label may change the number of children it has,
						which requires a complete change in the structure of SVG elements.
	*/
	createLabelSpace(el: d3.Selection<any>, labelData: LabelData[], objectiveData: PrimitiveObjective[]): void {
		// Create the root container which will hold all label related SVG elements.
		this.rootContainer = el.append('g')
			.classed(this.defs.ROOT_CONTAINER, true)

		// Create the outline box for the label area. Append the styles here because they will not change.
		this.labelSpaceOutline = this.rootContainer.append('g')
			.classed(this.defs.OUTLINE_CONTAINER, true)
			.append('rect')
			.classed(this.defs.OUTLINE, true)
			.classed('valuechart-outline', true);

		// Create the container which will hold all labels.
		this.labelContainer = this.rootContainer.append('g')
			.classed(this.defs.LABELS_CONTAINER, true);

		// Create the container which will the hold Score Functions plots for each PrimitiveObjective.
		this.scoreFunctionContainer = this.rootContainer.append('g')
			.classed('' + this.defs.SCORE_FUNCTIONS_CONTAINER, true);

		// Recursively create the labels based on the Objective structure.
		this.createLabels(el, this.labelContainer, labelData, this.defs.ROOT_CONTAINER_NAME);

		// Create the score Functions.
		this.createScoreFunctions(this.scoreFunctionContainer, objectiveData);
	
		// Fire the Construction Over event on completion of construction.
		(<any>this.renderEventsService.labelsDispatcher).call('Construction-Over');
	}


	/*
		@param el - The root container for the entire label area.
		@param labelContainer - The container for the labels to be created. It is either: 1) this.labelContainer, or 2) The container of an already created label.
		@param labelData - The data for the new labels to create. Note that this data has a recursive (or nested) structure.
		@param parentName - Either the name of the parent objective of the label to be created, or this.defs.ROOT_CONTAINER_NAME if the objective is the root objective.
		@returns {void}
		@description 	Recursively creates labels for an array of Objectives that have been put into labelData format. Unlike other renderers, this method cannot 
						be used to update the existing label area to have a different structure. Instead, the label area must be deleted and rebuilt using createLabelSpace.
						This method should NOT be called manually.
	*/
	createLabels(el: d3.Selection<any>, labelContainer: d3.Selection<any>, labelData: LabelData[], parentName: string): void {
		// Create a new container for each element in labelData.
		var newLabelContainers: d3.Selection<any> = labelContainer.selectAll('g[parent=' + parentName + ']')
			.data(labelData)
			.enter().append('g')
			.classed(this.defs.LABEL_SUBCONTAINER, true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-container' })
			.attr('parent', parentName);	// Set the name parent objective on the 'g', or this.defs.ROOT_CONTAINER_NAME if it has not parent objective. 

		// Append an outline rectangle for label container that was just created.
		newLabelContainers.append('rect')
			.classed(this.defs.SUBCONTAINER_OUTLINE, true)
			.classed('valuechart-label-outline', true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-outline' });

		// Append a text element for each label container that was just created. These text elements will be the labels themselves.
		var labelText = newLabelContainers.append('text')
			.classed(this.defs.SUBCONTAINER_TEXT, true)
			.classed('valuechart-label-text', true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-text' });

		// Append a tspan element to contain the objective's name, and weight.
		labelText.append('tspan')
			.classed(this.defs.SUBCONTAINER_NAME, true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-name' });

		// Append a tspan element to contain the objective's best and worst elements.
		labelText.append('tspan')
			.classed(this.defs.SUBCONTAINER_BEST_WORST, true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-best-worst' });

		// Append the dividing line. This is what users are actually clicking on when they click and drag to change objective weights.
		newLabelContainers.append('line')
			.classed(this.defs.SUBCONTAINER_DIVIDER, true)
			.classed('valuechart-label-divider', true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-divider' });


		// Call createLabels on the children of each AbstractObjective in labelData. This is how the hierarchical structure is "parsed".
		labelData.forEach((labelDatum: LabelData) => {
			if (labelDatum.subLabelData === undefined) {
				el.select('#label-' + labelDatum.objective.getId() + '-outline')
					.classed(this.defs.PRIMITIVE_OBJECTIVE_LABEL, true);

				el.select('#label-' + labelDatum.objective.getId() + '-text')
					.classed(this.defs.PRIMITIVE_OBJECTIVE_LABEL, true);
				return;
			}

			this.createLabels(el, el.select('#label-' + labelDatum.objective.getId() + '-container'), labelDatum.subLabelData, labelDatum.objective.getId());
		});
	}

	/*
		@param width - The width of the area to render the label space in. This is NOT the width of the label to be rendered.
		@param height - The height of the area to render the label space in. This is NOT the height of the label to be rendered.
		@param labelData - The data for the labels to be updated and then displayed. Note that this data has a recursive (or nested) structure.
		@param parentName - The name of the label root container. Should almost alway be this.defs.ROOT_CONTAINER_NAME.
		@param viewOrientation - The view orientation that the label space is to be displayed in. Either 'vertical' or 'horizontal'.
		@param objectives - The collection of primitive objectives in the ValueChart. Used for rendering score function plots.
		@returns {void}
		@description 	Updates the data behind the labels using the renderLabels method. This method is mainly used to handle changes to user assigned objective weights.
						It should NOT be used to render the label space for the first time, or to render it in a different orientation. This is what renderLabelSpace is for.
	*/
	updateLabelSpace(width: number, height: number, labelData: LabelData[], parentName: string, viewOrientation: string, objectives: PrimitiveObjective[]) {
		// Update the label area view configuration with the new width, height, and orientation. This method modifies this.viewConfig in place.
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		// Calculate the width of the labels that are going to be created based on width of the area available, and the greatest depth of the Objective Hierarchy
		this.displayScoreFunctions = this.renderConfigService.viewConfig.displayScoreFunctions;
		var labelSpaces = this.rootContainer.selectAll('g[parent="' + parentName + '"]').data(labelData).order();
		this.renderLabels(labelSpaces, labelData, viewOrientation, true);

		var scoreFunctionContainer: d3.Selection<any> = this.rootContainer.select('.' + this.defs.SCORE_FUNCTIONS_CONTAINER);

		if (this.displayScoreFunctions) {
			// Render the score function plots.
			scoreFunctionContainer.style('display', 'block');
			this.renderScoreFunctions(viewOrientation, scoreFunctionContainer, objectives);
		} else {
			scoreFunctionContainer.style('display', 'none');
		}

		// Fire the Rendering Over event on completion of rendering.
		(<any>this.renderEventsService.labelsDispatcher).call('Rendering-Over');
	}

	/*
		@param width - The width of the area to render the label space in. This is NOT the width of the label to be rendered.
		@param height - The height of the area to render the label space in. This is NOT the height of the label to be rendered.
		@param labelData - The data for the labels to be updated and then displayed. Note that this data has a recursive (or nested) structure.
		@param viewOrientation - The view orientation that the label space is to be displayed in. Either 'vertical' or 'horizontal'.
		@param objectives - The collection of primitive objectives in the ValueChart. Used for rendering score function plots.
		@returns {void}
		@description 	Positions and gives widths + heights to the elements created by the createLabelSpace method. This method should be used to render the label space
						for the first time, or to change the view orientation of the labels. It should NOT be used to update the data behind the labels; this is what updateLabelSpace is for.
	*/
	renderLabelSpace(width: number, height: number, labelData: LabelData[], viewOrientation: string, objectives: PrimitiveObjective[]): void {
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		// Calculate the width of the labels that are going to be created based on width of the area available, and the greatest depth of the Objective Hierarchy
		this.displayScoreFunctions = this.renderConfigService.viewConfig.displayScoreFunctions;
		this.labelWidth = this.rendererDataService.calculateMinLabelWidth(labelData, this.viewConfig.dimensionOneSize, this.displayScoreFunctions);
		// Position the root container for the label area. This positions all of its child elements as well.
		// Unfortunately, we cannot use the generateTransformTranslation method here because positioning the labels does not merely involve a switch of x an y coordinates.
		this.rootContainer
			.attr('transform', () => {
				if (viewOrientation === 'vertical')
					return 'translate(0,' + (this.viewConfig.dimensionTwoSize + 10) + ')';
				else
					return 'translate(0,0)';
			});

		// Set the width and height of labelSpaceOutline 'rect' to the width and hight of the label area.
		this.labelSpaceOutline
			.attr(this.viewConfig.dimensionOne, this.viewConfig.dimensionOneSize)
			.attr(this.viewConfig.dimensionTwo, this.viewConfig.dimensionTwoSize);

		// Render the labels, starting with the labels for the highest level AbstractObjectives, which are in the 'g' directly under the root container.
		var labelSpaces = this.rootContainer.selectAll('g[parent="' + this.defs.ROOT_CONTAINER_NAME + '"]');
		this.renderLabels(labelSpaces, labelData, viewOrientation, false);

		var scoreFunctionContainer: d3.Selection<any> = this.rootContainer.select('.' + this.defs.SCORE_FUNCTIONS_CONTAINER);

		// Render or hide the score function pots depending on the value of the displayScoreFunctions attribute on the ValueChartDirective.
		if (this.displayScoreFunctions) {
			// Render the score function plots.
			scoreFunctionContainer.style('display', 'block');
			this.renderScoreFunctions(viewOrientation, scoreFunctionContainer, objectives);
		} else {
			scoreFunctionContainer.style('display', 'none');
		}

		// Fire the Rendering Over event on completion of rendering.
		(<any>this.renderEventsService.labelsDispatcher).call('Rendering-Over');
	}

	/*
		@param labelSpaces - The containers ('g' elements) of the labels to be rendered. These labels should be siblings (ie. child labels of the same parent).
		@param labelData - The data for the labels that are being rendered.
		@param viewOrientation - The view orientation that the label space is to be displayed in. Either 'vertical' or 'horizontal'.
		@param isDataUpdate - Whether the method should update the data underlying the labels. If true, this method will update each label's data before rendering it. This allows the weights of labels to be updated in response to user changes.
		@returns {void}
		@description 	Recursively positions and styles labels and their child labels until the hierarchy is fully parsed. This method can be used to update the data behind the
						labels as well, allowing it to either update, or simply render the a label and its children. Note that this method should generally NOT
						be called manually. Use updateLabelSpace if the goal is to update all labels, or renderLabelSpace if the label space must be rendered.
	*/
	renderLabels(labelSpaces: d3.Selection<any>, labelData: LabelData[], viewOrientation: string, isDataUpdate: boolean): void {
		// Calculate the weight offsets for this level of the Objective hierarchy, NOT counting children of other Abstract objectives at the same level.
		var weightOffsets: number[] = [];
		var weightSum: number = 0;	// The weight offset for the first objective at this level is 0.
		for (var i: number = 0; i < labelData.length; i++) {
			weightOffsets[i] = weightSum;
			weightSum += labelData[i].weight;
		}

		this.renderLabelOutline(labelSpaces.select('.' + this.defs.SUBCONTAINER_OUTLINE), weightOffsets, viewOrientation);	// Render the outlining rectangle.

		this.renderLabelText(labelSpaces.select('.' + this.defs.SUBCONTAINER_TEXT), weightOffsets, viewOrientation)	// Render the text within the label

		this.renderLabelDividers(labelSpaces.select('.' + this.defs.SUBCONTAINER_DIVIDER), weightOffsets, viewOrientation);


		// Recursively render the labels that are children of this label (ie. the labels of the objectives that are children of those objectives in labelData)
		labelData.forEach((labelDatum: LabelData, index: number) => {
			if (labelDatum.depthOfChildren === 0)	// This label has no child labels.
				return;
			let subLabelSpaces: d3.Selection<any> = this.rootContainer.selectAll('g[parent="' + labelDatum.objective.getId() + '"]');	// Get all sub label containers whose parent is the current label

			let scaledWeightOffset: number = this.viewConfig.dimensionTwoScale(weightOffsets[index]); // Determine the y (or x) offset for this label's children based on its weight offset.
			let labelTransform: string = this.renderConfigService.generateTransformTranslation(viewOrientation, this.labelWidth, scaledWeightOffset); // Generate the transformation.
			subLabelSpaces.attr('transform', labelTransform); // Apply the transformation to the sub label containers who are children of this label so that they inherit its position.
			if (isDataUpdate)
				this.renderLabels(subLabelSpaces.data(labelDatum.subLabelData), labelDatum.subLabelData, viewOrientation, true);	// Render the sub labels using the data update selection.
			else
				this.renderLabels(subLabelSpaces, labelDatum.subLabelData, viewOrientation, false);	// Render the sub labels.

		});
	}

	/*
		@param labelOutlines - The selection of 'rect' elements that act as the outlines for a set of sibling labels.
		@param weightOffsets - An array of weight offsets that map to the elements in the selection of label outlines. This is array is used to determine the position of sibling labels relative to each other.
		@param viewOrientation - The view orientation that the label space is to be displayed in. Either 'vertical' or 'horizontal'.
		@returns {void}
		@description 	Positions and styles the outlines of a set of sibling labels. 
	*/
	renderLabelOutline(labelOutlines: d3.Selection<any>, weightOffsets: number[], viewOrientation: string): void {
		// Render the styles of the outline rectangle.

		labelOutlines.style('fill', 'white')
			.style('stroke', (d: LabelData) => {
				// PrimitiveObjective's should have their own color unless the ValueChart has multiple users. Abstract Objectives should always be gray.
				return (d.depthOfChildren === 0 && this.valueChartService.isIndividual()) ? (<PrimitiveObjective>d.objective).getColor() : 'gray';
			});

		labelOutlines
			.attr(this.viewConfig.dimensionOne, this.determineLabelWidth)
			.attr(this.viewConfig.coordinateOne, 0)									// Have to set CoordinateOne to be 0, or when we re-render in a different orientation the switching of the width and height can cause an old value to be retained
			.attr(this.viewConfig.dimensionTwo, (d: LabelData, i: number) => {
				return Math.max(this.viewConfig.dimensionTwoScale(d.weight) - 2, 0);					// Determine the height (or width) as a function of the weight
			})
			.attr(this.viewConfig.coordinateTwo, ((d: LabelData, i: number) => {
				return this.viewConfig.dimensionTwoScale(weightOffsets[i]);			// Determine the y position (or x) offset from the top of the containing 'g' as function of the combined weights of the previous objectives. 
			}));
	}

	/*
		@param labelTexts - The selection of 'text' elements that act as the label text for a set of sibling labels.
		@param weightOffsets - An array of weight offsets that map to the elements in the selection of label outlines. This is array is used to determine the position of sibling labels relative to each other.
		@param viewOrientation - The view orientation that the label space is to be displayed in. Either 'vertical' or 'horizontal'.
		@returns {void}
		@description 	Positions and styles the label text of a set of sibling labels. This includes rendering the name, weight (in percentage points), and best and worst elements.
	*/
	renderLabelText(labelTexts: d3.Selection<any>, weightOffsets: number[], viewOrientation: string): void {

		var textOffset: number = 5;
		// Determine the position of the text within the box depending on the orientation
		labelTexts.attr(this.viewConfig.coordinateOne, () => {
			return (viewOrientation === 'vertical') ? 10 : (this.labelWidth / 2);
		})
			.attr(this.viewConfig.coordinateTwo, (d: LabelData, i: number) => {
				return (viewOrientation === "vertical") ?
					this.viewConfig.dimensionTwoScale(weightOffsets[i]) + (this.viewConfig.dimensionTwoScale(d.weight) / 2) + textOffset
					:
					this.viewConfig.dimensionTwoScale(weightOffsets[i]) + (this.viewConfig.dimensionTwoScale(d.weight) / 5) + textOffset;
			});

		labelTexts.select('.' + this.defs.SUBCONTAINER_NAME)
			.text((d: LabelData) => {
				// Round the weight number to have 2 decimal places only.
				return d.objective.getName() + ' (' + (Math.round((d.weight / this.valueChartService.getMaximumWeightMap().getWeightTotal()) * 1000) / 10) + '%)';
			});

		labelTexts.select('.' + this.defs.SUBCONTAINER_BEST_WORST)
			.attr('x', (d: LabelData, i: number) => { return (viewOrientation === 'vertical') ? 10 : this.viewConfig.dimensionTwoScale(weightOffsets[i]) + (this.viewConfig.dimensionTwoScale(d.weight) / 5) + textOffset })
			.attr('dy', '1.2em')
			.text((d: LabelData) => {
				var bestWorstText = '';
				if (d.objective.objectiveType === 'primitive') {
					var scoreFunction = this.valueChartService.getCurrentUser().getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId());
					bestWorstText = '\n [ best: ' + scoreFunction.bestElement + ', worst: ' + scoreFunction.worstElement + ' ]';
				}
				return bestWorstText;
			});

		if (this.valueChartService.isIndividual()) {
			labelTexts.select('.' + this.defs.SUBCONTAINER_BEST_WORST)
				.style('display', 'block');
		} else {
			labelTexts.select('.' + this.defs.SUBCONTAINER_BEST_WORST)
				.style('display', 'none');
		}

	}

	/*
		@param labelTexts - The selection of 'line' elements that act as the dividers between a set of sibling labels.
		@param weightOffsets - An array of weight offsets that map to the elements in the selection of label outlines. This is array is used to determine the position of sibling labels relative to each other.
		@param viewOrientation - The view orientation that the label space is to be displayed in. Either 'vertical' or 'horizontal'.
		@returns {void}
		@description 	Positions and styles the dividers between a set of sibling labels. These dividers are used to implement clicking and dragging to change objective weights, and are the click targets.
	*/
	renderLabelDividers(labelDividers: d3.Selection<any>, weightOffsets: number[], viewOrientation: string): void {

		var calculateDimensionTwoOffset = (d: LabelData, i: number) => {
			return this.viewConfig.dimensionTwoScale(weightOffsets[i]) - 2;					// Determine the height (or width) as a function of the weight
		};

		labelDividers
			.attr(this.viewConfig.coordinateOne + '1', 0)
			.attr(this.viewConfig.coordinateOne + '2', (d: LabelData, i: number) => {		 // Expand the last label to fill the rest of the space.
				return (i === 0) ? 0 : this.determineLabelWidth(d);
			})
			.attr(this.viewConfig.coordinateTwo + '1', calculateDimensionTwoOffset)
			.attr(this.viewConfig.coordinateTwo + '2', calculateDimensionTwoOffset);
	}

	/*
		@param scoreFunctionContainer - The 'g' element that will be used to contain all the score function plots.
		@param data - The collection of primitive objectives in the ValueChart. It is important that the order of this 
					collection is the same as the ordering of primitive objectives in the labelData used to construct 
					and render the label space to insure that score function plots are matched to correct labels.
		@returns {void}
		@description 	Creates a score function plot for each Primitive Objective in the ValueChart using one ScoreFunctionRenderer for each plot.
	*/
	createScoreFunctions(scoreFunctionContainer: d3.Selection<any>, data: PrimitiveObjective[]): void {
		this.scoreFunctionRenderers = {}

		var newScoreFunctionPlots: d3.Selection<any> = scoreFunctionContainer.selectAll('.' + this.defs.SCORE_FUNCTION)
			.data(data)
			.enter().append('g')
			.classed(this.defs.SCORE_FUNCTION, true)
			.attr('id', (d: PrimitiveObjective) => { return 'label-' + d.getId() + '-scorefunction'; })

		// Use the ScoreFunctionRenderer to create each score function.
		newScoreFunctionPlots.nodes().forEach((scoreFunctionPlot: Element) => {
			var el: d3.Selection<any> = d3.select(scoreFunctionPlot);
			var datum: PrimitiveObjective = el.data()[0];

			if (datum.getDomainType() === 'categorical' || datum.getDomainType() === 'interval')
				this.scoreFunctionRenderers[datum.getId()] = new DiscreteScoreFunctionRenderer(this.valueChartService, this.scoreFunctionViewerService, this.chartUndoRedoService, this.ngZone);
			else
				this.scoreFunctionRenderers[datum.getId()] = new ContinuousScoreFunctionRenderer(this.valueChartService, this.scoreFunctionViewerService, this.chartUndoRedoService, this.ngZone);

			var usersDomainElements: UserDomainElements[] = this.scoreFunctionViewerService.getAllUsersDomainElements(datum, this.valueChartService.getUsers());

			this.scoreFunctionRenderers[datum.getId()].createScoreFunction(el, datum, usersDomainElements);
		});
	}
	/*
		@param viewOrientation - The view orientation that the label space is to be displayed in. Either 'vertical' or 'horizontal'.
		@param scoreFunctionContainer - The 'g' element that contains all the score function plots to be rendered.
		@param data - The collection of primitive objectives in the ValueChart. It is important that the order of this 
					collection is the same as the ordering of primitive objectives in the labelData used to construct 
					and render the label space to insure that score function plots are matched to correct labels.
		@returns {void}
		@description 	Uses the ScoreFunctionRenderer and its subclasses to position and give widths + heights to the score functions created by the createScoreFunctions method.
	*/
	renderScoreFunctions(viewOrientation: string, scoreFunctionContainer: d3.Selection<any>, data: PrimitiveObjective[]): void {
		var width: number
		var height: number;
		var weightOffset: number = 0;
		var el: d3.Selection<any>;
		var datum: PrimitiveObjective;
		var objectiveWeight: number;
		var dimensionOneTransform: number;
		var dimensionTwoTransform: number;



		// Select all the score function plot containers:
		var scoreFunctionsPlots = scoreFunctionContainer.selectAll('.' + this.defs.SCORE_FUNCTION)
			.data(data);

		scoreFunctionsPlots.nodes().forEach((scoreFunctionPlot: Element) => {
			el = d3.select(scoreFunctionPlot);																// Convert the element into a d3 selection.
			datum = el.data()[0];																			// Get the data for this score function from the selection
			objectiveWeight = this.valueChartService.getMaximumWeightMap().getObjectiveWeight(datum.getId());
			dimensionOneTransform = (this.viewConfig.dimensionOneSize - this.labelWidth) + 1;		// Determine the dimensions the score function will occupy
			dimensionTwoTransform = this.viewConfig.dimensionTwoScale(weightOffset);				// ^^

			// Place the score function plot in the correct location.
			el.attr('transform', this.renderConfigService.generateTransformTranslation(viewOrientation, dimensionOneTransform, dimensionTwoTransform));

			if (viewOrientation === 'vertical') {
				width = this.labelWidth;
				height = this.viewConfig.dimensionTwoScale(objectiveWeight);
			} else {
				width = this.viewConfig.dimensionTwoScale(objectiveWeight);
				height = this.labelWidth;
			}

			this.scoreFunctionRenderers[datum.getId()].renderScoreFunction(datum, width, height, viewOrientation);
			this.scoreFunctionRenderers[datum.getId()].toggleValueLabels(this.renderConfigService.viewConfig.displayScoreFunctionValueLabels);

			weightOffset += objectiveWeight;
		});
	}


	/*
		@returns {void}
		@description	Display or hide the utility labels on the score function plot's points/bars depending on the value of the displayTotalScores attribute on the ValueChartDirective.
	*/
	toggleScoreFunctionValueLabels(): void {
		for (var field in this.scoreFunctionRenderers) {
			this.scoreFunctionRenderers[field].toggleValueLabels(this.renderConfigService.viewConfig.displayScoreFunctionValueLabels);
		}
	}

	// ========================================================================================
	// 				Anonymous functions that are used enough to be made class fields
	// ========================================================================================

	determineLabelWidth = (d: LabelData) => {		 // Expand the last label to fill the rest of the space.
		var scoreFunctionOffset: number = ((this.displayScoreFunctions) ? this.labelWidth : 0);
		var retValue = (d.depthOfChildren === 0) ?
			(this.viewConfig.dimensionOneSize - scoreFunctionOffset) - (d.depth * this.labelWidth)
			:
			this.labelWidth;

		return retValue;
	};

}