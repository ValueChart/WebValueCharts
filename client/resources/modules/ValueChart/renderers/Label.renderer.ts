/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:39:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-06 14:46:55
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import libraries:
import * as d3 														from 'd3';
import { Subject }													from 'rxjs/Subject';
import '../../utilities/rxjs-operators';

// Import Application Classes:
import { RenderEventsService }										from '../services/RenderEvents.service';
import { RendererService } 											from '../services/Renderer.service';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';
import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }							from '../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }							from '../renderers/ContinuousScoreFunction.renderer';

import { LabelDefinitions }											from '../definitions/Label.definitions';

import { RendererScoreFunctionUtility }								from '../utilities/RendererScoreFunction.utility';

import { ResizeWeightsInteraction }									from '../interactions/ResizeWeights.interaction';
import { SetObjectiveColorsInteraction }							from '../interactions/SetObjectiveColors.interaction';
import { ReorderObjectivesInteraction }								from '../interactions/ReorderObjectives.interaction';
import { ExpandScoreFunctionInteraction }							from '../interactions/ExpandScoreFunction.interaction';
import { SortAlternativesInteraction }								from '../interactions/SortAlternatives.interaction';

// Import Model Classes:
import { User }														from '../../../model/User';
import { Objective }												from '../../../model/Objective';
import { PrimitiveObjective }										from '../../../model/PrimitiveObjective';
import { AbstractObjective }										from '../../../model/AbstractObjective';
import { ScoreFunctionMap }											from '../../../model/ScoreFunctionMap';
import { ScoreFunction }											from '../../../model/ScoreFunction';
import { WeightMap }												from '../../../model/WeightMap';

// Import Types:
import {RowData, CellData, LabelData, RendererConfig }				from '../../../types/RendererData.types';
import { RendererUpdate }											from '../../../types/RendererData.types';
import { DomainElement, ScoreFunctionData } 						from '../../../types/RendererData.types';
import { InteractionConfig, ViewConfig }							from '../../../types/Config.types'
import { ScoreFunctionUpdate, ScoreFunctionConfig }					from '../../../types/RendererData.types';

import { SortAlternativesType, ChartOrientation }					from '../../../types/Config.types';

// This class renders a ValueChart's hierarchical objective structure into labels for an objective chart. Each objective is rendered into a 
// rectangle whose width (or height depending on the orientation) is proportional to its weight. The rectangles are positioned in such a
// way that they act as labels for the objectives in the objective chart. It uses the ScoreFunctionRenderer class and its subclasses to render
// a plot of each primitive objective's score function with the label area.

@Injectable()
export class LabelRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public lastRendererUpdate: RendererUpdate;
	public reordered: boolean = false; 

	// d3 Selections. Note that that not many are saved because of the recursive creation and rendering strategy that this class uses.
	public rootContainer: d3.Selection<any, any, any, any>;				// The 'g' element that is the root container of the Label area.
	public labelSpaceOutline: d3.Selection<any, any, any, any>;			// The 'rect' element that is the outline of the label area.
	public labelContainer: d3.Selection<any, any, any, any>;				// The 'g' element that contains the hierarchical label structure.
	public labelSelections: any = {};

	private labelWidth: number;								// The min of the labels, calculated based on the maximum depth of the objective hierarchy and the amount of 
															// space that the label area is rendered in.

	private scoreFunctionSubjects: any = {};
	private scoreFunctionViewSubject: Subject<boolean> = new Subject();
	private scoreFunctionInteractionSubject: Subject<any> = new Subject();

	private numUsers: number;
	private viewOrientation: ChartOrientation;


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this directive when it is used.
	*/
	constructor(
		private rendererScoreFunctionUtility: RendererScoreFunctionUtility,
		private rendererService: RendererService,
		private renderEventsService: RenderEventsService,
		private chartUndoRedoService: ChartUndoRedoService,
		private resizeWeightsInteraction: ResizeWeightsInteraction,
		private setObjectiveColorsInteraction: SetObjectiveColorsInteraction,
		private reorderObjectivesInteraction: ReorderObjectivesInteraction,
		private sortAlternativesInteraction: SortAlternativesInteraction) {
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	public valueChartChanged = (update: RendererUpdate) => {		
		this.lastRendererUpdate = update;

		if (this.rootContainer == undefined) {
			this.createLabelSpace(update);
		}

		if (this.reordered) {
			this.createLabels(update, update.labelData, this.labelContainer);
		}

		this.updateInteractions(update);
		this.renderLabelSpace(update, update.labelData);
		this.applyStyles(update);

		if (this.reordered || this.viewOrientation != update.viewConfig.viewOrientation) {
			this.interactionsChanged(update.interactionConfig);
			this.reordered = false;
			this.viewOrientation = update.viewConfig.viewOrientation;

		}
	}

	public interactionsChanged = (interactionConfig: InteractionConfig) => {
		this.resizeWeightsInteraction.togglePump(interactionConfig.pumpWeights, this.rootContainer.node().querySelectorAll('.' + LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL), this.lastRendererUpdate);
		this.resizeWeightsInteraction.toggleDragToResizeWeights(interactionConfig.weightResizeType, this.rootContainer, this.lastRendererUpdate);
		this.setObjectiveColorsInteraction.toggleSettingObjectiveColors(interactionConfig.setObjectiveColors, this.rootContainer.node());
		this.reorderObjectivesInteraction.toggleObjectiveReordering(interactionConfig.reorderObjectives, this.rootContainer, this.lastRendererUpdate)
			.subscribe(this.handleObjectivesReordered)
		this.sortAlternativesInteraction.toggleSortAlternativesByObjectiveScore(interactionConfig.sortAlternatives == SortAlternativesType.ByObjectiveScore, this.rootContainer.node(), this.lastRendererUpdate);

		this.scoreFunctionInteractionSubject.next({ expandScoreFunctions: true, adjustScoreFunctions: this.lastRendererUpdate.interactionConfig.adjustScoreFunctions });
	}

	public viewConfigChanged = (viewConfig: ViewConfig) => {
		this.scoreFunctionViewSubject.next(viewConfig.displayScoreFunctionValueLabels);
		this.toggleDisplayScoreFunctions(viewConfig.displayScoreFunctions);
		this.renderLabelSpace(this.lastRendererUpdate, this.lastRendererUpdate.labelData);
	}

	public handleObjectivesReordered = (reordered: boolean) => {
		this.reordered = reordered;
	}

	public updateInteractions = (u: RendererUpdate) => {
		this.resizeWeightsInteraction.lastRendererUpdate = u;
		this.reorderObjectivesInteraction.lastRendererUpdate = u;
		this.sortAlternativesInteraction.lastRendererUpdate = u;
	}

	/*
		@param el - The element that is will be used as the parent of the summary chart.
		@param labelData - The data that labels are going to represent. Note that this data has a recursive (or nested) structure.
		@param objectiveData - The list of primitive objectives in the ValueChart. This is used to render the score function plots.
		@param enableInteraction - 
		@returns {void}
		@description 	Creates the base containers and all elements for the labels of a ValueChart. It should be called when creating the labels for the first time
						and when rebuilding them. The label area's recursive structure means that when objectives are added/deleted, or the order of objectives is changed,
						the label area must be destroyed and reconstructed. This is partly because assigning different data to a label may change the number of children it has,
						which requires a complete change in the structure of SVG elements.
	*/
	private createLabelSpace(u: RendererUpdate): void {
		// Indicate that rendering of the label area is just starting.
		this.renderEventsService.labelsDispatcher.next(0);
		// Create the root container which will hold all label related SVG elements.
		this.rootContainer = u.el.append('g')
			.classed(LabelDefinitions.ROOT_CONTAINER, true)

		// Create the outline box for the label area. Append the styles here because they will not change.
		this.labelSpaceOutline = this.rootContainer.append('g')
			.classed(LabelDefinitions.OUTLINE_CONTAINER, true)
			.append('rect')
			.classed(LabelDefinitions.OUTLINE, true)
			.classed('valuechart-outline', true);

		// Create the container which will hold all labels.
		this.labelContainer = this.rootContainer.append('g')
			.classed(LabelDefinitions.LABELS_CONTAINER, true);

		// Recursively create the labels based on the Objective structure.
		this.labelWidth = this.calculateMinLabelWidth(u.labelData, u.rendererConfig.dimensionOneSize, u.viewConfig.displayScoreFunctions);
		this.createLabels(u, u.labelData, this.labelContainer);
	}


	/*
		@param el - The root container for the entire label area.
		@param labelContainer - The container for the labels to be created. It is either: 1) this.labelContainer, or 2) The container of an already created label.
		@param labelData - The data for the new labels to create. Note that this data has a recursive (or nested) structure.
		@param parentName - Either the name of the parent objective of the label to be created, or LabelDefinitions.ROOT_CONTAINER_NAME if the objective is the root objective.
		@returns {void}
		@description 	Recursively creates labels for an array of Objectives that have been put into labelData format. Unlike other renderers, this method cannot 
						be used to update the existing label area to have a different structure. Instead, the label area must be deleted and rebuilt using createLabelSpace.
						This method should NOT be called manually.
	*/
	private createLabels(u: RendererUpdate, labelData: LabelData[], labelContainer: d3.Selection<any, any, any, any>, parentName: string = LabelDefinitions.ROOT_CONTAINER_NAME): void {
		this.labelSelections[parentName] = {};

		// Create a new container for each element in labelData.
		var updateLabelContainers: d3.Selection<any, any, any, any> = labelContainer.selectAll('.' + LabelDefinitions.LABEL_SUBCONTAINER).filter(function() {
			return (<Element> this).parentElement == labelContainer.node();
		}).data(labelData);

		updateLabelContainers.exit().remove();

		var newLabelContainers = updateLabelContainers.enter().append('g')
			.attr('parent', parentName)	// Set the name parent objective on the 'g', or LabelDefinitions.ROOT_CONTAINER_NAME if it has not parent objective. 
			.classed(LabelDefinitions.LABEL_SUBCONTAINER, true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-container' });

		updateLabelContainers
			.attr('parent', parentName)	// Set the name parent objective on the 'g', or LabelDefinitions.ROOT_CONTAINER_NAME if it has not parent objective. 
			.classed(LabelDefinitions.LABEL_SUBCONTAINER, true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-container' });

		this.labelSelections[parentName].labelContainers = labelContainer.selectAll('g[parent=' + parentName + ']');

		// Append an outline rectangle for label container that was just created.
		newLabelContainers.append('rect');

		this.labelSelections[parentName].labelContainers.select('rect')		
			.classed(LabelDefinitions.SUBCONTAINER_OUTLINE, true)
			.classed('valuechart-label-outline', true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-outline' })
			.attr('parent', parentName);

		this.labelSelections[parentName].subContainerOutlines = this.labelSelections[parentName].labelContainers.select('.' + LabelDefinitions.SUBCONTAINER_OUTLINE);

		// Append the dividing line. This is what users are actually clicking on when they click and drag to change objective weights.
		newLabelContainers.append('line');
		this.labelSelections[parentName].labelContainers.select('line')
			.classed(LabelDefinitions.SUBCONTAINER_DIVIDER, true)
			.classed('valuechart-label-divider', true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-divider' });

		this.labelSelections[parentName].dividers = this.labelSelections[parentName].labelContainers.select('.' + LabelDefinitions.SUBCONTAINER_DIVIDER);

		// Append a text element for each label container that was just created. These text elements will be the labels themselves.
		var updateLabelText = newLabelContainers.append('text');
		this.labelSelections[parentName].labelContainers.select('text')
			.classed(LabelDefinitions.SUBCONTAINER_TEXT, true)
			.classed('valuechart-label-text', true)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-text' });

		this.labelSelections[parentName].labelText = this.labelSelections[parentName].labelContainers.select('.' + LabelDefinitions.SUBCONTAINER_TEXT);

		// Append a tspan element to contain the objective's name, and weight.
		updateLabelText.append('tspan')
			.classed(LabelDefinitions.SUBCONTAINER_NAME, true);
		this.labelSelections[parentName].labelText.select('.' + LabelDefinitions.SUBCONTAINER_NAME)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-name' });

		this.labelSelections[parentName].nameText = this.labelSelections[parentName].labelText.select('.' + LabelDefinitions.SUBCONTAINER_NAME);

		// Append a tspan element to contain the objective's best and worst elements.
		updateLabelText.append('tspan')
			.classed(LabelDefinitions.SUBCONTAINER_BEST_WORST, true);
		this.labelSelections[parentName].labelText.select('.' + LabelDefinitions.SUBCONTAINER_BEST_WORST)
			.attr('id', (d: LabelData) => { return 'label-' + d.objective.getId() + '-best-worst' });

		this.labelSelections[parentName].bestWorstText = this.labelSelections[parentName].labelText.select('.' + LabelDefinitions.SUBCONTAINER_BEST_WORST);

		// Call createLabels on the children of each AbstractObjective in labelData. This is how the hierarchical structure is "parsed".
		labelData.forEach((labelDatum: LabelData) => {
				var container = u.el.select('#label-' + labelDatum.objective.getId() + '-container');
			if (labelDatum.subLabelData) {
				container.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).remove();								// Delete any score functions attached to this container.
				this.createLabels(u, labelDatum.subLabelData,container , labelDatum.objective.getId());
			} else {
				container.selectAll('.' + LabelDefinitions.LABEL_SUBCONTAINER).remove();
								
				u.el.select('#label-' + labelDatum.objective.getId() + '-outline')
					.classed(LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL, true);

				u.el.select('#label-' + labelDatum.objective.getId() + '-text')
					.classed(LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL, true);
				
				this.createScoreFunction(u, container, <PrimitiveObjective> labelDatum.objective);
			}

		});

		this.toggleDisplayScoreFunctions(this.lastRendererUpdate.viewConfig.displayScoreFunctions);
	}


	// TODO <@aaron>: update this methods description.
	/*
		@param width - The width of the area to render the label space in. This is NOT the width of the label to be rendered.
		@param height - The height of the area to render the label space in. This is NOT the height of the label to be rendered.
		@param labelData - The data for the labels to be updated and then displayed. Note that this data has a recursive (or nested) structure.
		@param parentName - The name of the label root container. Should almost alway be LabelDefinitions.ROOT_CONTAINER_NAME.
		@param viewConfig - The view configuration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@param objectives - The collection of primitive objectives in the ValueChart. Used for rendering score function plots.
		@returns {void}
		@description 	Updates the data behind the labels using the renderLabels method. This method is mainly used to handle changes to user assigned objective weights.
						It should NOT be used to render the label space for the first time, or to render it in a different orientation. This is what renderLabelSpace is for.
	*/

	renderLabelSpace(u: RendererUpdate, labelData: LabelData[], parentName: string = LabelDefinitions.ROOT_CONTAINER_NAME) {
		// Calculate the width of the labels that are going to be created based on width of the area available, and the greatest depth of the Objective Hierarchy
		this.labelWidth = this.calculateMinLabelWidth(labelData, u.rendererConfig.dimensionOneSize, u.viewConfig.displayScoreFunctions);
		// Position the root container for the label area. This positions all of its child elements as well.
		// Unfortunately, we cannot use the generateTransformTranslation method here because positioning the labels does not merely involve a switch of x an y coordinates.
		this.rootContainer
			.attr('transform', () => {
				if (u.viewConfig.viewOrientation === ChartOrientation.Vertical)
					return 'translate(0,' + (u.rendererConfig.dimensionTwoSize + 10) + ')';
				else
					return 'translate(0,0)';
			});


		this.renderLabels(u, labelData, parentName);

		// Indicate that rendering of the label area is complete.
		this.renderEventsService.labelsDispatcher.next(1);
	}

	/*
		@param labelSpaces - The containers ('g' elements) of the labels to be rendered. These labels should be siblings (ie. child labels of the same parent).
		@param labelData - The data for the labels that are being rendered.
		@param viewConfig - The view configuration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@param isDataUpdate - Whether the method should update the data underlying the labels. If true, this method will update each label's data before rendering it. This allows the weights of labels to be updated in response to user changes.
		@returns {void}
		@description 	Recursively positions and styles labels and their child labels until the hierarchy is fully parsed. This method can be used to update the data behind the
						labels as well, allowing it to either update, or simply render the a label and its children. Note that this method should generally NOT
						be called manually. Use updateLabelSpace if the goal is to update all labels, or renderLabelSpace if the label space must be rendered.
	*/
	private renderLabels(u: RendererUpdate, labelData: LabelData[], parentName: string): void {
		this.labelSelections[parentName].labelContainers.data(labelData);
		// Calculate the weight offsets for this level of the Objective hierarchy, NOT counting children of other Abstract objectives at the same level.
		var weightOffsets: number[] = [];
		var weightSum: number = 0;	// The weight offset for the first objective at this level is 0.
		for (var i: number = 0; i < labelData.length; i++) {
			weightOffsets[i] = weightSum;
			weightSum += labelData[i].weight;
		}

		this.renderLabelOutline(u, this.labelSelections[parentName].subContainerOutlines, weightOffsets);	// Render the outlining rectangle.

		this.renderLabelText(u, this.labelSelections[parentName].labelText, weightOffsets, parentName)	// Render the text within the label

		this.renderLabelDividers(u, this.labelSelections[parentName].dividers, weightOffsets);


		// Recursively render the labels that are children of this label (ie. the labels of the objectives that are children of those objectives in labelData)
		labelData.forEach((labelDatum: LabelData, index: number) => {
			let scaledWeightOffset: number = u.rendererConfig.dimensionTwoScale(weightOffsets[index]); // Determine the y (or x) offset for this label's children based on its weight offset.
			
			if (labelDatum.depthOfChildren === 0) {	// This label has no child labels.
				let labelTransform: string = this.rendererService.generateTransformTranslation(u.viewConfig.viewOrientation, this.determineLabelWidth(labelDatum, u), scaledWeightOffset); // Generate the transformation.
				this.labelSelections[labelDatum.objective.getId()].scoreFunction.attr('transform', labelTransform)
			
				// ONLY render the Score Functions if they are being displayed.
				if (u.viewConfig.displayScoreFunctions)
					this.renderScoreFunction(u, <PrimitiveObjective> labelDatum.objective, this.scoreFunctionSubjects[labelDatum.objective.getId()], this.labelSelections[labelDatum.objective.getId()].scoreFunction);

			} else {
				let labelTransform: string = this.rendererService.generateTransformTranslation(u.viewConfig.viewOrientation, this.labelWidth, scaledWeightOffset); // Generate the transformation.
				this.labelSelections[labelDatum.objective.getId()].labelContainers.attr('transform', labelTransform); // Apply the transformation to the sub label containers who are children of this label so that they inherit its position.
				
				this.renderLabels(u, labelDatum.subLabelData, labelDatum.objective.getId());	// Render the sub labels using the data update selection.
			}
		});
	}

	/*
		@param labelOutlines - The selection of 'rect' elements that act as the outlines for a set of sibling labels.
		@param weightOffsets - An array of weight offsets that map to the elements in the selection of label outlines. This is array is used to determine the position of sibling labels relative to each other.
		@param viewConfig - The view configuration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description 	Positions and styles the outlines of a set of sibling labels. 
	*/
	private renderLabelOutline(u: RendererUpdate, labelOutlines: d3.Selection<any, any, any, any>, weightOffsets: number[]): void {
		labelOutlines
			.attr(u.rendererConfig.dimensionOne, (d, i) => { return this.determineLabelWidth(d, u); })
			.attr(u.rendererConfig.coordinateOne, 0)									// Have to set CoordinateOne to be 0, or when we re-render in a different orientation the switching of the width and height can cause an old value to be retained
			.attr(u.rendererConfig.dimensionTwo, (d: LabelData, i: number) => {
				return Math.max(u.rendererConfig.dimensionTwoScale(d.weight) - 2, 0);					// Determine the height (or width) as a function of the weight
			})
			.attr(u.rendererConfig.coordinateTwo, ((d: LabelData, i: number) => {
				return u.rendererConfig.dimensionTwoScale(weightOffsets[i]);			// Determine the y position (or x) offset from the top of the containing 'g' as function of the combined weights of the previous objectives. 
			}));
	}

	/*
		@param labelTexts - The selection of 'text' elements that act as the label text for a set of sibling labels.
		@param weightOffsets - An array of weight offsets that map to the elements in the selection of label outlines. This is array is used to determine the position of sibling labels relative to each other.
		@param viewConfig - The view configuration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description 	Positions and styles the label text of a set of sibling labels. This includes rendering the name, weight (in percentage points), and best and worst elements.
	*/
	private renderLabelText(u: RendererUpdate, labelTexts: d3.Selection<any, any, any, any>, weightOffsets: number[], parentName: string): void {

		var textOffset: number = 5;
		// Determine the position of the text within the box depending on the orientation
		labelTexts.attr(u.rendererConfig.coordinateOne, () => {
			return (u.viewConfig.viewOrientation === ChartOrientation.Vertical) ? 10 : (this.labelWidth / 2);
		})
			.attr(u.rendererConfig.coordinateTwo, (d: LabelData, i: number) => {
				return (u.viewConfig.viewOrientation === ChartOrientation.Vertical) ?
					u.rendererConfig.dimensionTwoScale(weightOffsets[i]) + (u.rendererConfig.dimensionTwoScale(d.weight) / 2) + textOffset
					:
					u.rendererConfig.dimensionTwoScale(weightOffsets[i]) + (u.rendererConfig.dimensionTwoScale(d.weight) / 5) + textOffset;
			});

		this.labelSelections[parentName].nameText
			.text((d: LabelData) => {
				// Round the weight number to have 2 decimal places only.
				return d.objective.getName() + ' (' + (Math.round((d.weight / u.maximumWeightMap.getWeightTotal()) * 1000) / 10) + '%)';
			});

		this.labelSelections[parentName].bestWorstText
			.attr('x', (d: LabelData, i: number) => { return (u.viewConfig.viewOrientation === ChartOrientation.Vertical) ? 10 : u.rendererConfig.dimensionTwoScale(weightOffsets[i]) + (u.rendererConfig.dimensionTwoScale(d.weight) / 5) + textOffset })
			.attr('dy', '1.2em')
			.text((d: LabelData) => {
				var bestWorstText = '';
				if (d.objective.objectiveType === 'primitive' && u.valueChart.getUsers().length > 0) {
					var scoreFunction = u.valueChart.getUsers()[0].getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName());
					bestWorstText = '\n [ best: ' + scoreFunction.bestElement + ', worst: ' + scoreFunction.worstElement + ' ]';
				}
				return bestWorstText;
			});
	}

	/*
		@param labelTexts - The selection of 'line' elements that act as the dividers between a set of sibling labels.
		@param weightOffsets - An array of weight offsets that map to the elements in the selection of label outlines. This is array is used to determine the position of sibling labels relative to each other.
		@param viewConfig - The view configuration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description 	Positions and styles the dividers between a set of sibling labels. These dividers are used to implement clicking and dragging to change objective weights, and are the click targets.
	*/
	private renderLabelDividers(u: RendererUpdate, labelDividers: d3.Selection<any, any, any, any>, weightOffsets: number[]): void {

		var calculateDimensionTwoOffset = (d: LabelData, i: number) => {
			return u.rendererConfig.dimensionTwoScale(weightOffsets[i]) - 2;					// Determine the height (or width) as a function of the weight
		};

		labelDividers
			.attr(u.rendererConfig.coordinateOne + '1', 0)
			.attr(u.rendererConfig.coordinateOne + '2', (d: LabelData, i: number) => {		 // Expand the last label to fill the rest of the space.
				return (i === 0) ? 0 : this.determineLabelWidth(d, u);
			})
			.attr(u.rendererConfig.coordinateTwo + '1', calculateDimensionTwoOffset)
			.attr(u.rendererConfig.coordinateTwo + '2', calculateDimensionTwoOffset);
	}

	/*
		@param scoreFunctionContainer - The 'g' element that will be used to contain all the score function plots.
		@param data - The collection of primitive objectives in the ValueChart. It is important that the order of this 
					collection is the same as the ordering of primitive objectives in the labelData used to construct 
					and render the label space to insure that score function plots are matched to correct labels.
		@returns {void}
		@description 	Creates a score function plot for each Primitive Objective in the ValueChart using one ScoreFunctionRenderer for each plot.
	*/
	private createScoreFunction(u: RendererUpdate, labelContainer: d3.Selection<any, any, any, any>, objective: PrimitiveObjective): void {
		this.labelSelections[objective.getId()] = {};
		
		labelContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).remove();

		var scoreFunction = labelContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION)
			.data([objective]).enter().append('g')
			.classed(LabelDefinitions.SCORE_FUNCTION, true)
			.attr('id', (d: PrimitiveObjective) => { return 'label-' + d.getId() + '-scorefunction'; });

		this.labelSelections[objective.getId()].scoreFunction = scoreFunction;

		var renderer: ScoreFunctionRenderer

		if (objective.getDomainType() === 'categorical' || objective.getDomainType() === 'interval')
			renderer = new DiscreteScoreFunctionRenderer(this.chartUndoRedoService);
		else
			renderer = new ContinuousScoreFunctionRenderer(this.chartUndoRedoService);

		this.labelSelections[objective.getId()].renderer = renderer;

		var scoreFunctionSubject = new Subject();

		scoreFunctionSubject.map((sfU: ScoreFunctionUpdate) => { 
			sfU.el = scoreFunction;
			sfU.objective = objective;
			
			return sfU;
		}).map(this.rendererScoreFunctionUtility.produceScoreFunctionData)
			.map(this.rendererScoreFunctionUtility.produceViewConfig)
			.subscribe(renderer.scoreFunctionChanged);

		this.scoreFunctionSubjects[objective.getId()] = scoreFunctionSubject;
		this.scoreFunctionViewSubject.subscribe(renderer.viewConfigChanged);
		this.scoreFunctionInteractionSubject.subscribe(renderer.interactionConfigChanged);

		this.renderScoreFunction(u, objective, this.scoreFunctionSubjects[objective.getId()], scoreFunction);
	}

	/*
		@param viewConfig - The view configuration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@param scoreFunctionContainer - The 'g' element that contains all the score function plots to be rendered.
		@param data - The collection of primitive objectives in the ValueChart. It is important that the order of this 
					collection is the same as the ordering of primitive objectives in the labelData used to construct 
					and render the label space to insure that score function plots are matched to correct labels.
		@returns {void}
		@description 	Uses the ScoreFunctionRenderer and its subclasses to position and give widths + heights to the score functions created by the createScoreFunctions method.
	*/
	private renderScoreFunction(u: RendererUpdate, objective: PrimitiveObjective, scoreFunctionSubject: Subject<any>, scoreFunctionContainer: d3.Selection<any, any, any, any>): void {
		var data = u.valueChart.getAllPrimitiveObjectives();

		var width: number
		var height: number;
		var weightOffset: number = 0;
		var el: d3.Selection<any, any, any, any>;
		var objective: PrimitiveObjective;
		var objectiveWeight: number;
		var dimensionOneTransform: number;
		var dimensionTwoTransform: number;

		objectiveWeight = u.maximumWeightMap.getObjectiveWeight(objective.getName());

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			width = this.labelWidth;
			height = this.lastRendererUpdate.rendererConfig.dimensionTwoScale(objectiveWeight);
		} else {
			width = this.lastRendererUpdate.rendererConfig.dimensionTwoScale(objectiveWeight);
			height = this.labelWidth;
		}

		var scoreFunctions: ScoreFunction[] = [];
		var colors: string[] = [];

		u.usersToDisplay.forEach((user: User) => {
			scoreFunctions.push(user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName()));
			colors.push(user.color);
		});

		scoreFunctionSubject.next(
		{ 
			width: width,
			height: height, 
			interactionConfig: { adjustScoreFunctions: u.interactionConfig.adjustScoreFunctions, expandScoreFunctions: true },
			scoreFunctions: scoreFunctions,
			colors: colors,
			viewOrientation: u.viewConfig.viewOrientation,
		});


		this.scoreFunctionViewSubject.next(u.viewConfig.displayScoreFunctionValueLabels);
	}

	private applyStyles(u: RendererUpdate): void {
		this.rootContainer.selectAll('.' + LabelDefinitions.SUBCONTAINER_OUTLINE)
			.style('fill', 'white')
			.style('stroke', (d: LabelData) => {
				// PrimitiveObjective's should have their own color unless the ValueChart has multiple users. Abstract Objectives should always be gray.
				return (d.depthOfChildren === 0 && u.valueChart.isIndividual()) ? (<PrimitiveObjective>d.objective).getColor() : 'gray';
			});


		var bestWorstText = this.rootContainer.selectAll('.' + LabelDefinitions.SUBCONTAINER_BEST_WORST)
		if (u.valueChart.isIndividual()) {
			bestWorstText
				.style('display', 'block');
		} else {
			bestWorstText
				.style('display', 'none');
		}
	}

	private toggleDisplayScoreFunctions(displayScoreFunctions: boolean): void {
		if (displayScoreFunctions) {
			this.rootContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).style('display', 'block');
		} else {
			this.rootContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).style('display', 'none');
		}
	}


	// ========================================================================================
	// 				Anonymous functions that are used enough to be made class fields
	// ========================================================================================


	determineLabelWidth = (d: LabelData, u: RendererUpdate) => {		 // Expand the last label to fill the rest of the space.
		var scoreFunctionOffset: number = ((u.viewConfig.displayScoreFunctions) ? this.labelWidth : 0);
		var retValue = (d.depthOfChildren === 0) ?
			(this.lastRendererUpdate.rendererConfig.dimensionOneSize - scoreFunctionOffset) - (d.depth * this.labelWidth)
			:
			this.labelWidth;

		return retValue;
	};

	calculateMinLabelWidth = (labelData: LabelData[], dimensionOneSize: number, displayScoreFunctions: boolean) => {
		var maxDepthOfChildren = 0;
		labelData.forEach((labelDatum: LabelData) => {
			if (labelDatum.depthOfChildren > maxDepthOfChildren)
				maxDepthOfChildren = labelDatum.depthOfChildren;
		});

		maxDepthOfChildren += ((displayScoreFunctions) ? 2 : 1);

		return dimensionOneSize / maxDepthOfChildren;
	}

}