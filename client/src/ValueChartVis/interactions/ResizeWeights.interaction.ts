/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 13:30:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-20 10:32:24
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';
import * as _														from 'lodash';
import { Subject }													from 'rxjs/Subject';
import { Observable }												from 'rxjs/Observable';
import { Subscription } 											from 'rxjs/Subscription';
import '../../app/utilities/rxjs-operators';

// Import Application Classes
import { ChartUndoRedoService }										from '../services';

import { LabelDefinitions }											from '../definitions';

// Import Model Classes:
import { Objective }												from '../../model';
import { PrimitiveObjective }										from '../../model';
import { AbstractObjective }										from '../../model';
import { ScoreFunctionMap }											from '../../model';
import { ScoreFunction }											from '../../model';
import { WeightMap }												from '../../model';

import { RowData, CellData, LabelData, RendererConfig }				from '../../types';
import { RendererUpdate }											from '../../types';
import { WeightResizeType, PumpType, ChartOrientation }				from '../../types';

/*
	This class implements the two different user interactions which allow user weights assigned to PrimitiveObjectives to be resized.
	
	The first interaction is the Pump Tool. The Pump Tool allows user to increase or decrease an objective's weight by one percent by
	clicking on that objectives label in the ValueChart. The Pump Tool can also be turned off. The Pump Tool can ONLY be used to change
	the weights of primitive objectives.

	The second interaction is the Drag Tool. The Drag Tool allows users to drag the divider between two objective labels in the label
	area of the ValueChart to  either resize the weights of JUST those two objectives, or to resize the weights of ALL their siblings.
	Siblings refers to all objectives at the same level of the hierarchy that have the same parent as those being dragged. 
	The weights of both Primitive and Abstract objectives can be changed by the Drag Tool. Weight changes will be propagated down the
	objective hierarchy to the terminal Primitive Objectives if when an Abstract Objective's label is dragged. Note that objectives
	which do NOT have the same parent cannot be used with the Drag Tool.
*/


@Injectable()
export class ResizeWeightsInteraction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================
	public lastRendererUpdate: RendererUpdate;		// The most recent RendererUpdate message; obtained from the LabelRenderer when toggles weight resizing/pump on and off.
													// It is crucial that this field remain in sync with the RendererUpdate field in the LabelRenderer class.  

	private resizeType: WeightResizeType; // The type of Weight Resizing that is currently enabled. 

	private labelRootContainer: d3.Selection<any,any,any,any>;
	private clicks: Observable<Event>;
	private onClick: Subscription;
	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private chartUndoRedoService: ChartUndoRedoService) { 
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param pumpType - The type of pump interaction. Must be one of: 'increase', 'decrease', or 'none'.
		@param primitiveObjectiveLabels - the list of label elements for which pump is to be toggled.
		@param RendererUpdate - the most recent RendererUpdate message. 
		@returns {void}
		@description 	Toggles the Pump interaction for modifying user assigned weights. A pumpType of 'increase' turns on
						clicking on primitive objective labels to increase the objective's weight by one percent. A pumpType of 
						'decrease' turns on clicking PrimitiveObjective labels to increase the objective's weight by one percent.
						A pumpType of 'none' turns off the pump interaction.
	*/
	public togglePump(pumpType: PumpType, primitiveObjectiveLabels: NodeListOf<Element>, rendererUpdate: RendererUpdate): void {
		this.lastRendererUpdate = rendererUpdate;
		// Initialize the observable that is used to detect clicks and notifies handlers.
		this.clicks = Observable.fromEvent(primitiveObjectiveLabels, 'click');

		if (this.onClick != undefined)
			this.onClick.unsubscribe();

		if (pumpType !== PumpType.None) {
			this.onClick = this.clicks
				.map((eventObject: Event) => { (<any> eventObject).pumpType = pumpType; return eventObject; })		// Attach the pumpType to the event.
				.subscribe(this.onPump);
		}
	}

	/*
		@param eventObject - The click event generated by a user click on an objective label. The click event should be "augmented"
							with a pump type field.
		@returns {void}
		@description 	Helper function that is the callback for when the onClick observable detects a click event and then pushes it to all observables.
						This is where the actual updating of the user's weights as a result of "pumping" is accomplished.
	*/
	private onPump = (eventObject: Event) => {
		var currentUser = this.lastRendererUpdate.valueChart.getUsers()[0];
		// Save the current state of the Weight Map.
		this.chartUndoRedoService.saveWeightMapRecord(currentUser.getWeightMap());

		// Calculate the correct weight increment.
		var totalWeight: number = currentUser.getWeightMap().getWeightTotal();
		var labelDatum: LabelData = <any> d3.select(<any> eventObject.target).datum();
		var previousWeight: number = currentUser.getWeightMap().getObjectiveWeight(labelDatum.objective.getId());
		
		if ((<any>eventObject).pumpType === PumpType.Increase) {
			let pumpAmount = (0.01 * totalWeight) / ((1 - 0.01) - (previousWeight / totalWeight));

			var newWeight: number = previousWeight + pumpAmount;
			this.incrementObjectiveWeight(labelDatum, currentUser.getWeightMap(),newWeight , pumpAmount, newWeight);	// Update Children's weights.
		} else {
			let decrimentAmount = -0.01
			if (previousWeight - decrimentAmount < 0) {
				decrimentAmount = 0 - previousWeight;
			}
			let primitiveObjectives = this.lastRendererUpdate.valueChart.getAllPrimitiveObjectives();
			let incrementAmount = (-1 * decrimentAmount) / (primitiveObjectives.length - 1);

			primitiveObjectives.forEach((objective: PrimitiveObjective) => {
				if (objective.getId() === labelDatum.objective.getId())
					currentUser.getWeightMap().setObjectiveWeight(objective.getId(), previousWeight + decrimentAmount);
				else {
					let oldWeight = currentUser.getWeightMap().getObjectiveWeight(objective.getId());
					currentUser.getWeightMap().setObjectiveWeight(objective.getId(), oldWeight + incrementAmount);
				}					
			});

		}

		currentUser.getWeightMap().normalize();
	}

	/*
		@param resizeType - The type of weight resize interaction. Must be one of: 'neighbor', 'siblings', or 'none'.
		@param labelRootContainer - A d3 selection of the label root container from the label renderer. 
									This is used to access the label divides for which weight resizing is to be toggled.
		@rendererUpdate - The most recent RendererUpdate. 
		@returns {void}
		@description 	Toggles the drag interaction for modifying use assigned objective weights. A resizeType of 'neighbor' turns on
						dragging the divider between two objective labels to modify the weights of ONLY those objectives. A 
						resizeType of 'siblings' turns on dragging the divider between two objective labels to modify the weights of ALL
						siblings of the two objectives (ie, labels at the same level of the hierarchy with the same parents).
	*/
	public toggleDragToResizeWeights(resizeType: WeightResizeType, labelRootContainer: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate): void {		
		this.labelRootContainer = labelRootContainer;
		this.lastRendererUpdate = rendererUpdate;

		var dragToResizeWeights: d3.DragBehavior<any, any, any> = d3.drag();
		this.resizeType = resizeType;
		if (resizeType !== WeightResizeType.None) {
			dragToResizeWeights
				.on('start', this.resizeWeightsStart)
				.on('drag', this.resizeWeights)
				.on('end', this.resizeWeightsEnd);
		}

		if (labelRootContainer) {
			var labelSpaces = labelRootContainer.selectAll('g[parent="' + LabelDefinitions.ROOT_CONTAINER_NAME + '"]');
			this.toggleResizingForSublabels(labelSpaces, dragToResizeWeights, resizeType);
		}
	}

	/*
		@param labelSpaces - A d3 selection of the labels for which the interaction is to be set.
		@param dragToResizeWeights - The drag controller that is to be set on the label dividers of the labelSpaces providers.
		@param resizeType - The type of weight resize interaction. Must be one of: 'neighbor', 'siblings', or 'none'.
		@returns {void}
		@description 	Helper function for toggleDragToResizeWeights that uses a recursive strategy to turn on the 
						desired type of dragging to resize weights for all labels in the label area.
	*/
	private toggleResizingForSublabels(labelSpaces: d3.Selection<any, any, any, any>, dragToResizeWeights: d3.DragBehavior<any, any, any>, resizeType: WeightResizeType) {
		var labelDividers: d3.Selection<any, any, any, any> = labelSpaces.select('.' + LabelDefinitions.SUBCONTAINER_DIVIDER);

		labelDividers.style('cursor', () => {
			return (resizeType !== WeightResizeType.None) ? (this.lastRendererUpdate.viewConfig.viewOrientation === ChartOrientation.Vertical) ? 'ns-resize' : 'ew-resize' : '';
		});

		labelDividers.call(dragToResizeWeights);

		labelSpaces.data().forEach((labelDatum: LabelData, index: number) => {
			if (labelDatum.depthOfChildren === 0)	// This label has no child labels.
				return;

			let subLabelSpaces: d3.Selection<any, any, any, any> = labelSpaces
				.selectAll('g[parent="' + labelDatum.objective.getId() + '"]');	// Get all sub label containers whose parent is the current label

			this.toggleResizingForSublabels(subLabelSpaces, dragToResizeWeights, resizeType);	// Toggle dragging for the sub labels.
		});
	}

	// An anonymous function that is used to handle the event fired when dragging to rearrange weights starts. This event fires BEFORE any of the regular
	// drag events.
	private resizeWeightsStart = (d: any, i: number) => {
		// Save the current state of the Weight Map.
		this.chartUndoRedoService.saveWeightMapRecord(this.lastRendererUpdate.valueChart.getUsers()[0].getWeightMap());
	}

	// An anonymous function that is used to handle the event fired when dragging to rearrange weights ends.
	private resizeWeightsEnd = (d: any, i: number) => {
		// Save the current state of the Weight Map.
		this.lastRendererUpdate.valueChart.getUsers()[0].getWeightMap().normalize();
	}

	// An anonymous function that is used to handle the regular drag events that are fired whenever the user continues to drag label divider.
	// This function is responsible for updating the data behind the display. Change detection in ValueChartDirective automatically updates the display
	// in response to these data changes. 
	private resizeWeights = (d: LabelData, i: number) => {
		var weightMap: WeightMap = this.lastRendererUpdate.valueChart.getUsers()[0].getWeightMap();
		
		// Use the dimensionTwo scale to convert the drag distance to a change in weight.
		var deltaWeight: number = this.lastRendererUpdate.rendererConfig.dimensionTwoScale.invert(-1 * (<any>d3.event)['d' + this.lastRendererUpdate.rendererConfig.coordinateTwo]);

		var container: d3.Selection<any, any, any, any> = this.labelRootContainer.select('#label-' + d.objective.getId() + '-container');
		var parentName = (<Element>container.node()).getAttribute('parent');
		var parentContainer: d3.Selection<any, any, any, any> = this.labelRootContainer.select('#label-' + parentName + '-container');
		var siblings: LabelData[] = (<LabelData>parentContainer.datum()).subLabelData;
		var combinedWeight: number = (<LabelData>parentContainer.datum()).weight;

		// Run inside the angular zone so that change detection is triggered.
		if (this.resizeType === WeightResizeType.Neighbors) {	// Neighbor resizing:
			this.resizeNeighbors(d, i, deltaWeight, weightMap, siblings);
		} else {	// Sibling resizing:
			this.resizeSiblings(d, i, deltaWeight, combinedWeight, weightMap, siblings);
		}
	};

	private resizeNeighbors = (d: LabelData, i: number, deltaWeight: number, weightMap: WeightMap, siblings: LabelData[]) => {
		let combinedWeight: number = d.weight + siblings[i - 1].weight;

		// Determine the weights of the two siblings based on the weight change, and the total prior weight. Note that neither objective can have a weight greater than the total prior weight.
		let siblingWeight: number = _.clamp(siblings[i - 1].weight - deltaWeight, 0, combinedWeight);
		let currentWeight: number = _.clamp(d.weight + deltaWeight, 0, combinedWeight);

		// It is important to realize that the objective label that contains the divider is ALWAYS below the label. This means that the neighbor being
		// changed by dragging is ALWAYS the sibling directly before the current label (i - 1).
		
		// Update the objective's weights, or update the weights of their children if they AbstractObjectives.
		this.incrementObjectiveWeight(d, weightMap, currentWeight, deltaWeight, combinedWeight);	// Update Children's weights.
		this.incrementObjectiveWeight(siblings[i - 1], weightMap, siblingWeight, -deltaWeight, combinedWeight); // Update Children's weights.

	}

	private resizeSiblings = (d: LabelData, i: number, deltaWeight: number, combinedWeight: number, weightMap: WeightMap, siblings: LabelData[]) => {
		let siblingsToIncrease: LabelData[] = [];
		let siblingsToDecrease: LabelData[] = [];

		// If deltaWeight is negative, then the user is dragging the divider down, and the set of labels whose weights should increase are all those
		// siblings ABOVE the label that contains the divider being dragged. If deltaWeight is positive, then the user is dragging the divider up and the set
		// of labels whose weights should increase are the label containing the divider and ALL the siblings below it. 

		var siblingsAbove = siblings.slice(0, i);	// All the siblings above the divider.
		var siblingsBelow = siblings.slice(i);		// The label containing the divider and all siblings those below it.

		this.incrementChildrenWeights(siblingsAbove, weightMap, -deltaWeight, combinedWeight);
		this.incrementChildrenWeights(siblingsBelow, weightMap, deltaWeight, combinedWeight);
	}



	/*
		@param labelDatum - The labelData object corresponding to the Objective whose weight should be incremented.
		@param weightMap - The current user's WeightMap.
		@param newWeight - The new weight for the Objective.
		@param WeightIncrement - The amount that the Objective's weight has been incremented by.
		@param maxWeight - The maximum allowed weight for the Objective. The incremented will be truncated if would cause this value to be exceeded.
		@returns {void} 
		@description	Updates the weight of an Objective by weightIncrement to be newWeight. PrimitiveObjective's are updated directly.
						If the Objective is Abstract, then IncrementChildWeights is used to update the sub-objectives.
	*/
	private incrementObjectiveWeight(labelDatum: LabelData, weightMap: WeightMap, newWeight: number, weightIncrement: number, maxWeight: number): void {
		if (labelDatum.objective.objectiveType === 'primitive') {
			weightMap.setObjectiveWeight(labelDatum.objective.getId(), newWeight);		
		} else {
			var labelData = labelDatum.subLabelData;
			this.incrementChildrenWeights(labelData, weightMap, weightIncrement, maxWeight);
		}
	}

	/*
		@param labelData - The array of labelData objects whose weight should be incremented.
		@param weightMap - The current user's WeightMap.
		@param WeightIncrement - The amount that the Objective's weight has been incremented by.
		@param maxWeight - The maximum allowed weight for the Objective. The incremented will be truncated if would cause this value to be exceeded.
		@returns {void} 
		@description	Updates the weight of a set of objectives by distributing a weightIncrement amongst them. 
	*/
	private incrementChildrenWeights(labelData: LabelData[], weightMap: WeightMap, weightIncrement: number, maxWeight: number) {
		var weightTotal: number = 0;
		var nonZeroWeights: number = 0;

		labelData.forEach((child: LabelData) => {
			if (child.weight !== 0) {
				weightTotal += child.weight;
				nonZeroWeights++;
			}
		});

		if (nonZeroWeights && weightIncrement < 0) {		// If there are objectives with non-zero weights and the weight increment is negative:

			weightIncrement = weightIncrement / nonZeroWeights;	// Then, divide the weight increment amongst the objectives with non-zero weights.
		} else {
			weightIncrement = weightIncrement / labelData.length; // Otherwise, just divide the weight increment evenly amongst the objectives.
		}

		labelData.forEach((labelDatum: LabelData) => {
			let labelDatumMax: number = maxWeight;
			if (weightTotal !== 0 && labelDatum.weight !== 0) {
				// Compute the maximum allowed weight for the current objective. This is calculated to be proportional to its 
				// current percentage of the total weight.
				labelDatumMax = maxWeight * (labelDatum.weight / weightTotal);	
			}
			let newWeight = _.clamp(labelDatum.weight + weightIncrement, 0, labelDatumMax); // The new weight must be within [0, labelDatumMax]
			this.incrementObjectiveWeight(labelDatum, weightMap, newWeight, weightIncrement, labelDatumMax);
		});
	}

}