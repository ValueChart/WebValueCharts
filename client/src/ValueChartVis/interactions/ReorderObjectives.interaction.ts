/*
* @Author: aaronpmishkin
* @Date:   2016-06-17 09:05:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-05 17:07:53
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';
import { NgZone }													from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';
import { Subject }													from 'rxjs/Subject';
import '../../app/utilities/rxjs-operators';

// Import Application Classes
import { RendererService } 											from '../services';
import { ChartUndoRedoService }										from '../services';

import { LabelDefinitions }											from '../definitions';

// Import Model Classes:
import { Objective }												from '../../model';
import { PrimitiveObjective }										from '../../model';
import { AbstractObjective }										from '../../model';

import { RowData, CellData, LabelData, RendererConfig }				from '../../types';
import { RendererUpdate }											from '../../types';
import { ObjectivesRecord }											from '../../types';


/*
	This class contains all the logic for dragging objective labels change the order of objectives in the objective and summary charts.
	Any objective label can be dragged within the confines of its parent label's Dimension Two so that it may be reordered with respect 
	to its siblings (ie. the other children of the parent). The rows of the objective and summary charts are reordered to reflect the change
	in the label ordering when a label is released.
*/

@Injectable()
export class ReorderObjectivesInteraction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public lastRendererUpdate: RendererUpdate;			// The most recent RendererUpdate object. It is critical that this field remain
														// synchronized with the RendererUpdate field in the LabelRenderer class.

	private labelRootContainer: d3.Selection<any,any,any,any>;

	private reorderSubject: Subject<boolean>;
	private ignoreReorder: boolean;						// Whether the drag events should be ignored. If true, all dragging of the current label is ignored.

	// Fields used to store information about the active dragging event chain.  

	private reorderObjectiveMouseOffset: number;		// Offset of the mouse from the Coordinate Two position of the label that is to be dragged. This is set when dragging first begins.
	private totalCoordTwoChange: number = 0;			// The Coordinate Two distance that the label has been moved so far.

	private containerToReorder: d3.Selection<any, any, any, any>;		// The the d3 selection of the 'g' element that holds the label being reordered.
	private parentObjectiveName: string;				// The name of the parent objective for the label being reordered.
	private parentContainer: d3.Selection<any, any, any, any>;			// The selection of the container that holds the container for the label being reordered.
	private siblingContainers: d3.Selection<any, any, any, any>;		// The selection of label containers s.t. every label container is at the same level in the label hierarchy as containerToReorder and also has the same parent label.

	private objectiveDimensionTwo: number;				// The Dimension Two (height if vertical, width of horizontal) of the label being dragged.
	private objectiveCoordTwoOffset: number;			// The initial Coordinate Two position (y if vertical, x if horizontal) of the label being reordered.
	private maxCoordinateTwo: number;					// The maximum Coordinate Two that label being reordered can have before it exits the label area.

	private currentObjectiveIndex: number;				// The index of the label being reordered in the list of siblings.
	private newObjectiveIndex: number;					// The new index of the label as a result of the dragging.
	private jumpPoints: number[];						// The list of points that define what position the label being reordered has been moved to.


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private rendererService: RendererService,
		private chartUndoRedoService: ChartUndoRedoService) { 
			this.chartUndoRedoService.undoRedoSubject.subscribe(this.changeRowOrder);
	}


	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param enableReordering - Whether or not to enable dragging to reorder objectives.
		@param labelRootContainer - The root container of the label area; should be obtained from the LabelRenderer.
		@rendererUpdate - the most recent RendererUpdate object.
		@returns {void}
		@description 	Toggles clicking and dragging labels in the label area to reorder objectives. Both abstract and primitive objectives
						can be reordered via label dragging when the user interaction is enabled. Dragging is implemented using d3's dragging 
						system and makes use of all three drag events. 'start' is used to perform setup that is required to for dragging to work 
						properly and is called before the 'drag' events fire. 'drag' is used to implement the visual dragging mechanism. Note that
						the handler for these events, reorderObjectives, only updates the visual display of the objective area. 'end' is used to
						actually reorder the objectives within the objective hierarchy, and then re-render the ValueChart via the ValueChartDirective.
	*/
	public toggleObjectiveReordering(enableReordering: boolean, labelRootContainer: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate): Subject<boolean> {
		this.lastRendererUpdate = rendererUpdate;
		this.labelRootContainer = labelRootContainer;

		var labelOutlines: d3.Selection<any, any, any, any> = labelRootContainer.selectAll('.' + LabelDefinitions.SUBCONTAINER_OUTLINE);
		var labelTexts: d3.Selection<any, any, any, any> = labelRootContainer.selectAll('.' + LabelDefinitions.SUBCONTAINER_TEXT);

		var dragToReorder: d3.DragBehavior<any, any, any> = d3.drag();

		if (enableReordering) {
			dragToReorder
				.on('start', this.startReorderObjectives)
				.on('drag', this.reorderObjectives)
				.on('end', this.endReorderObjectives);
		}

		labelOutlines.call(dragToReorder);
		labelTexts.call(dragToReorder);

		this.reorderSubject = new Subject();
		return this.reorderSubject;
	}

	// This function is called when a user first begins to drag a label to rearrange the ordering of objectives. It contains all the logic required to initialize the drag,
	// including determining the bounds that the label can be dragged in, the points where the label is considered to have switched positions, etc.
	private startReorderObjectives = (d: LabelData, i: number) => {
		// Reset variables.
		this.ignoreReorder = false;							// Whether the drag events should be ignored. If true, all further dragging of the current label will be ignored.
		this.reorderObjectiveMouseOffset = undefined;		// Offset of the mouse from the Coordinate Two position of the label that is to be dragged. 
		this.totalCoordTwoChange = 0;						// The Coordinate Two distance that the label has been moved so far.

		this.containerToReorder = this.labelRootContainer.select('#label-' + d.objective.getId() + '-container');			// The container that holds the label being reordered.
		this.parentObjectiveName = (<Element>this.containerToReorder.node()).getAttribute('parent');	// The name of the parent objective for the label being reordered.

		// If the selected label is the root label, then it is not possible to reorder, and all further drag events for this selection should be ignored.
		if (this.parentObjectiveName === LabelDefinitions.ROOT_CONTAINER_NAME) {
			this.ignoreReorder = true;
			return;
		}

		this.chartUndoRedoService.saveObjectivesRecord(this.lastRendererUpdate.valueChart.getRootObjectives());

		this.parentContainer = this.labelRootContainer.select('#label-' + this.parentObjectiveName + '-container');							// The container that holds the container for the label being reordered.
		this.siblingContainers = this.parentContainer.selectAll('g[parent="' + this.parentObjectiveName + '"]');		// The selection of label containers s.t. every label container is at the same level as containerToReorder, with the same parent.
		// Note: siblingsConatiners includes containerToReorder.
		// Set all the siblings that are NOT being moved to be partially transparent.
		this.siblingContainers.style('opacity', 0.5);
		this.containerToReorder.style('opacity', 1);

		var parentOutline: d3.Selection<any, any, any, any> = this.parentContainer.select('rect'); 		// Select the rect that outlines the parent label of the label being reordered.
		var currentOutline: d3.Selection<any, any, any, any> = this.containerToReorder.select('rect');		// Select the rect that outlines the label being reordered.

		this.objectiveDimensionTwo = +currentOutline.attr(this.lastRendererUpdate.rendererConfig.dimensionTwo);							// Determine the Dimension Two (height if vertical, width of horizontal) of the label being dragged.
		this.maxCoordinateTwo = +parentOutline.attr(this.lastRendererUpdate.rendererConfig.dimensionTwo) - this.objectiveDimensionTwo;	// Determine the maximum Coordinate Two of the label being reordered.
		this.objectiveCoordTwoOffset = +currentOutline.attr(this.lastRendererUpdate.rendererConfig.coordinateTwo);						// Determine the initial Coordinate Two position (y if vertical, x if horizontal) of the label being reordered.

		this.currentObjectiveIndex = this.siblingContainers.nodes().indexOf(this.containerToReorder.node());					// Determine the index of the label being reordered in the list of siblings.
		this.newObjectiveIndex = this.currentObjectiveIndex;
		this.jumpPoints = [0];																								// Initialize the list of points which define what position the label being reordered has been moved to.

		this.siblingContainers.select('rect').nodes().forEach((el: Element) => {
			if (el !== undefined) {
				// For each of the labels that the label being reordered can be switched with, determine its Coordinate Two midpoint. This is used to determine what position the label being reordered has been moved to.
				let selection: d3.Selection<any, any, any, any> = d3.select(el);
				let jumpPoint: number = (+selection.attr(this.lastRendererUpdate.rendererConfig.dimensionTwo) / 2) + +selection.attr(this.lastRendererUpdate.rendererConfig.coordinateTwo);
				this.jumpPoints.push(jumpPoint);
			}
		});

		this.jumpPoints.push(this.lastRendererUpdate.rendererConfig.dimensionTwoSize);
	}

	// This function is called whenever a label that is being reordered is dragged by the user. It contains the logic which updates the
	// position of the label so the user knows where they have dragged it to as well as the code that determines what position the label will be in when dragging ends.
	private reorderObjectives = (d: LabelData, i: number) => {
		// Do nothing if we are ignoring the current dragging of the label.
		if (this.ignoreReorder) {
			return;
		}
		// Get the change in Coordinate Two from the d3 event. Note that although we are getting coordinateTwo, not dCoordinateTwo, this is the still the change.
		// The reason for this is because when a label is dragged, the transform of label container is changed, which can changes cooordinateTwo of the outline rectangle inside the container.
		// THis change is equal to deltaCoordinateTwo, meaning d3.event.cooordinateTwo is reset to 0 at the end of cooordinateTwo drag event, making cooordinateTwo really dCoordinateTwo
		var deltaCoordinateTwo: number = (<any>d3.event)[this.lastRendererUpdate.rendererConfig.coordinateTwo];

		// If we have not yet determined the mouse offset, then this is the first drag event that has been fired, and the mouse offset from 0 should the current mouse position.
		if (this.reorderObjectiveMouseOffset === undefined) {
			this.reorderObjectiveMouseOffset = deltaCoordinateTwo;
		}

		deltaCoordinateTwo = deltaCoordinateTwo - this.reorderObjectiveMouseOffset; // Subtract the mouse offset to get the change in Coordinate Two from the 0 point.

		// Calculate the current Coordinate Two position of the label that is being reordered. 
		// This is the recent change (deltaCoordinateTwo) + the totalChange so far (this.totalCoordTwoChange) + the offset of the label before dragging began (this.objectiveCoordTwoOffset)
		var currentCoordTwoPosition: number = deltaCoordinateTwo + this.totalCoordTwoChange + this.objectiveCoordTwoOffset;

		// Make sure that the label does not exit the bounds of the label area.
		if (currentCoordTwoPosition < 0) {
			deltaCoordinateTwo = 0 - this.totalCoordTwoChange - this.objectiveCoordTwoOffset;
		} else if (currentCoordTwoPosition > this.maxCoordinateTwo) {
			deltaCoordinateTwo = this.maxCoordinateTwo - this.totalCoordTwoChange - this.objectiveCoordTwoOffset;
		}

		// Add the most recent change in Coordinate Two to the total change so far.
		this.totalCoordTwoChange += deltaCoordinateTwo;

		// If we are dragging the label up, then we want to check the current position of the label from its top.
		// If we are dragging the label down, then we want to check the current position of the label form its bottom.
		var labelDimensionTwoOffset: number = (this.totalCoordTwoChange > 0) ? this.objectiveDimensionTwo : 0;
		// Determine which of the two jump points the label is current between, and assigned its new position accordingly.
		for (var i = 0; i < this.jumpPoints.length; i++) {
			if (this.totalCoordTwoChange + labelDimensionTwoOffset > (this.jumpPoints[i] - this.objectiveCoordTwoOffset)
				&& this.totalCoordTwoChange + labelDimensionTwoOffset < (this.jumpPoints[i + 1] - this.objectiveCoordTwoOffset)) {
				this.newObjectiveIndex = i;
				break;
			}
		}
		// If we were dragging down, then the index is one off and must be decremented.
		if (this.totalCoordTwoChange > 0)
			this.newObjectiveIndex--;

		// Retrieved the previous transform of the label we are dragging so that it can be incremented properly.
		var previousTransform: string = this.containerToReorder.attr('transform');

		// Generate the new transform.
		var labelTransform: string = this.rendererService.incrementTransform(this.lastRendererUpdate.viewConfig, previousTransform, 0, deltaCoordinateTwo);

		// Apply the new transformation to the label.
		this.containerToReorder.attr('transform', labelTransform);
	}

	// This function is called when the label that is being reordered is released by the user, and dragging ends. It contains the logic for re-rendering the ValueChart according 
	// to the labels new position.
	private endReorderObjectives = (d: LabelData, i: number) => {
		// Do nothing if we are ignoring the current dragging of the label.
		if (this.ignoreReorder) {
			return;
		}
		// Get the label data for the siblings of the label we arranged. Note that this contains the label data for the label we rearranged.
		var parentData: LabelData = this.parentContainer.datum();


		// Move the label data for the label we rearranged to its new position in the array of labels.
		if (this.newObjectiveIndex !== this.currentObjectiveIndex) {
			// Reorder the label data.
			let temp: LabelData = parentData.subLabelData.splice(this.currentObjectiveIndex, 1)[0];
			parentData.subLabelData.splice(this.newObjectiveIndex, 0, temp);

			// Reorder the Objectives
			let siblingObjectives: Objective[] = (<AbstractObjective>parentData.objective).getDirectSubObjectives()
			let tempObjective: Objective = siblingObjectives.splice(this.currentObjectiveIndex, 1)[0];
			siblingObjectives.splice(this.newObjectiveIndex, 0, tempObjective);
		} else {
			// No changes were made, so delete the change record that was created in startReorderObjectives.
			this.chartUndoRedoService.deleteNewestRecord();
			this.lastRendererUpdate.renderRequired.value = true;
		}

		// Select all the label data, not just the siblings of the label we moved.
		var labelData: LabelData[] = <any> this.labelRootContainer.select('g[parent=' + LabelDefinitions.ROOT_CONTAINER_NAME + ']').data();


		// Re-arrange the rows of the objective and summary charts according to the new objective ordering. Note this triggers change detection in ValueChartDirective that 
		// updates the object and summary charts. This is to avoid making the labelRenderer dependent on the other renderers.
		this.lastRendererUpdate.valueChart.setRootObjectives(this.getOrderedRootObjectives(labelData));

		this.siblingContainers.style('opacity', 1);
		this.containerToReorder.style('opacity', 1);

		this.reorderSubject.next(true);
	}

	// This function extracts the ordering of objectives from the ordering of labels.
	private getOrderedRootObjectives(labelData: LabelData[]): Objective[] {
		var rootObjectives: Objective[] = [];
		labelData.forEach((labelDatum: LabelData) => {
			var objective: Objective = labelDatum.objective;
			if (labelDatum.depthOfChildren !== 0) {
				(<AbstractObjective>objective).setDirectSubObjectives(this.getOrderedRootObjectives(labelDatum.subLabelData));
			}
			rootObjectives.push(objective);
		});
		return rootObjectives;
	}

	changeRowOrder = (message: {type: string, data: ObjectivesRecord}) => {
		if (message.type === this.chartUndoRedoService.OBJECTIVES_CHANGE) {
			this.lastRendererUpdate.valueChart.setRootObjectives(message.data.rootObjectives);
			this.lastRendererUpdate.labelData[0] = undefined;

			this.reorderSubject.next(true);
		}
	}

}