/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 12:26:30
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 21:42:14
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';


// Import Application Classes
import { ValueChartService }										from '../services/ValueChart.service';
import { RendererDataService }										from '../services/RendererData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';
import { ChangeDetectionService}									from '../services/ChangeDetection.service';

import { SummaryChartRenderer }										from '../renderers/SummaryChart.renderer';

import { SummaryChartDefinitions }									from '../services/SummaryChartDefinitions.service';
import { ObjectiveChartDefinitions }								from '../services/ObjectiveChartDefinitions.service';
import { LabelDefinitions }											from '../services/LabelDefinitions.service';

// Import Model Classes:
import { Objective }												from '../../../model/Objective';
import { PrimitiveObjective }										from '../../../model/PrimitiveObjective';
import { AbstractObjective }										from '../../../model/AbstractObjective';
import { Alternative }												from '../../../model/Alternative';

import {RowData, CellData, LabelData}								from '../../../types/RendererData.types';



/*
	This class implements the User interaction for sorting a ValueChart's alternatives. It allows users to sort Alternatives 
	by an Objective's score, alphabetically by alternative name, and manually by clicking and dragging. It also gives
	users the ability to undo any sorting they have done via a reset sorting type. 

	Sorting by Objective Score: Enables clicking on an objective's label in the label area to sort alternatives according to the
	score assigned to their consequences for that objective. The score that is used to sort will be the total of the weighted scores for all 
	Primitive Objective children if the objective clicked is abstract. This allows users to sort Alternatives based on total score by 
	clicking on a ValueChart's root objective.

	Sorting by Alternative Name: Immediately sorts alternatives lexicographically based on the characters in their names.

	Sorting Manually: Enables manual sorting of alternatives by clicking and dragging them to different positions in the ordering. Most of this class
	is dedicated to implementing this type of sorting. Please see the ReorderObjectivesInteraction class for a heavily commented implementation of 
	clicking and dragging that is very similar to that in this class.

	Reset Sorting: Resets the alternative order to be the original, default order. This order is determine by the order in which alternatives were specified
	during ValueChart creation.
*/

@Injectable()
export class SortAlternativesInteraction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Constants for the types of alternative sorting.
	SORT_BY_OBJECTIVE: string = 'objective';			// Sort Alternatives by objective score.
	SORT_ALPHABETICALLY: string = 'alphabet';			// Sort Alternatives alphabetically by name.
	SORT_MANUALLY: string = 'manual';					// Sort Alternatives manually by clicking and dragging.
	RESET_SORT: string = 'reset';						// Reset the Alternative order to be the original, default order (based on creation order).
	SORT_OFF: string = 'none';							// No form of Alternative sorting is enabled.


	// Fields for sorting alternatives manually - Please see ReorderObjectivesInteraction for more information.
	private cellsToMove: d3.Selection<any, any, any, any>;
	private alternativeBox: d3.Selection<any, any, any, any>;
	private alternativeLabelToMove: d3.Selection<any, any, any, any>;
	private totalScoreLabelToMove: d3.Selection<any, any, any, any>;

	private alternativeDimensionOneSize: number;
	private minCoordOne: number;
	private maxCoordOne: number;
	private totalCoordOneChange: number;
	private siblingBoxes: d3.Selection<any, any, any, any>;

	private currentAlternativeIndex: number;
	private newAlternativeIndex: number;
	private jumpPoints: number[];

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private summaryChartRenderer: SummaryChartRenderer,
		private renderConfigService: RenderConfigService,
		private valueChartService: ValueChartService,
		private rendererDataService: RendererDataService,
		private chartUndoRedoService: ChartUndoRedoService,
		private changeDetectionService: ChangeDetectionService,
		private summaryChartDefinitions: SummaryChartDefinitions,
		private objectiveChartDefinitions: ObjectiveChartDefinitions,
		private labelDefinitions: LabelDefinitions) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param sortingType - The type of sorting to enable. Must be one of 'objective', 'alphabet', 'manual', 'reset', or 'none'.
		@returns {void}
		@description 	Toggles the active type of alternative sorting. Sorting types 'alphabet', and 'reset' immediate sort the
						alternative order while 'objective', and 'manual' are user drive. Type 'none' simply turns off all sorting.
	*/
	public toggleAlternativeSorting(sortingType: string): void {
		// Toggle Dragging to sort objectives:
		if (sortingType === this.SORT_BY_OBJECTIVE) {
			this.sortAlternativesByObjective(true);

		} else if (sortingType === this.SORT_ALPHABETICALLY) {
			this.chartUndoRedoService.saveAlternativeOrderRecord(this.valueChartService.getAlternatives());

			this.rendererDataService.reorderAllCells(this.rendererDataService.generateCellOrderAlphabetically());
			this.changeDetectionService.alternativeOrderChanged = true;

		} else if (sortingType === this.SORT_MANUALLY) {
			this.sortAlternativesManually(true);

		} else if (sortingType === this.RESET_SORT) {
			this.chartUndoRedoService.saveAlternativeOrderRecord(this.valueChartService.getAlternatives());

			this.rendererDataService.resetCellOrder();
			this.changeDetectionService.alternativeOrderChanged = true;

		} else if (sortingType === this.SORT_OFF) {
			this.sortAlternativesByObjective(false);
			this.sortAlternativesManually(false);
		}

	}

	/*
		@param enable - Whether or not to enable clicking on objective labels to sort alternatives by the scores assigned to their consequences for that objective.
		@returns {void}
		@description 	Toggles the clicking on objective labels to sort alternatives by the scores assigned to their consequences for that objective. This method
						uses the sortByObjective anonymous function defined below to handle the actual sorting.
	*/
	private sortAlternativesByObjective(enableSorting: boolean): void {
		var objectiveLabels: JQuery = $('.' + this.labelDefinitions.SUBCONTAINER_OUTLINE);
		var objectiveText: JQuery = $('.' + this.labelDefinitions.SUBCONTAINER_TEXT);

		objectiveLabels.off('dblclick');
		objectiveText.off('dblclick');

		if (enableSorting) {
			objectiveLabels.dblclick(this.sortByObjective);
			objectiveText.dblclick(this.sortByObjective);
		}
	}

	/*
		@param enable - Whether or not to enable clicking and dragging alternatives to change their order.
		@returns {void}
		@description 	Toggles the clicking and dragging alternatives to change their order. Please see ReorderObjectivesInteraction
						for a well commented implementation of clicking and dragging.
	*/
	private sortAlternativesManually(enableSorting: boolean): void {
		var alternativeBoxes = d3.selectAll('.' + this.summaryChartDefinitions.CHART_ALTERNATIVE);

		var dragToSort = d3.drag();

		if (enableSorting) {
			dragToSort
				.on('start', this.startSortAlternatives)
				.on('drag', this.sortAlternatives)
				.on('end', this.endSortAlternatives);
		}

		alternativeBoxes.call(dragToSort);
	}

	// This function handles user clicks on objective labels by sorting the alternatives by their score for that objective.
	private sortByObjective = (eventObject: Event) => {
		this.chartUndoRedoService.saveAlternativeOrderRecord(this.valueChartService.getAlternatives());

		var objective: Objective = (<any> d3.select(<any> eventObject.target).datum()).objective;
		var objectivesToReorderBy: PrimitiveObjective[];
		if (objective.objectiveType === 'abstract') {
			objectivesToReorderBy = (<AbstractObjective>objective).getAllPrimitiveSubObjectives();
		} else {
			objectivesToReorderBy = [<PrimitiveObjective>objective];
		}
		var cellIndices: number[] = this.rendererDataService.generateCellOrderByObjectiveScore(this.rendererDataService.getRowData(), objectivesToReorderBy)
		this.rendererDataService.reorderAllCells(cellIndices);
		this.changeDetectionService.alternativeOrderChanged = true;
	}

	// This function is called when a user first begins to drag an alternative to alter its position in the alternative order.
	private startSortAlternatives = (d: Alternative, i: number) => {
		this.chartUndoRedoService.saveAlternativeOrderRecord(this.valueChartService.getAlternatives());

		this.minCoordOne = 0;
		this.maxCoordOne = this.summaryChartRenderer.viewConfig.dimensionOneSize;
		this.totalCoordOneChange = 0;

		this.alternativeBox = d3.select((<any>d3.event).sourceEvent.target)
		this.alternativeDimensionOneSize = +this.alternativeBox.attr(this.summaryChartRenderer.viewConfig.dimensionOne);

		this.siblingBoxes = d3.selectAll('.' + this.summaryChartDefinitions.CHART_ALTERNATIVE);

		this.cellsToMove = d3.selectAll('.' + this.objectiveChartDefinitions.CHART_CELL + '[alternative="' + d.getId() + '"]');
		this.alternativeLabelToMove = d3.select('.' + this.objectiveChartDefinitions.ALTERNATIVE_LABEL + '[alternative="' + d.getId() + '"]');
		this.totalScoreLabelToMove = d3.select('.' + this.summaryChartDefinitions.SCORE_TOTAL_SUBCONTAINER + '[alternative="' + d.getId() + '"]');

		d3.selectAll('.' + this.objectiveChartDefinitions.CHART_CELL).style('opacity', 0.25);
		this.cellsToMove.style('opacity', 1);

		for (var i = 0; i < this.valueChartService.getAlternatives().length; i++) {
			if (this.valueChartService.getAlternatives()[i].getName() === d.getName()) {
				this.currentAlternativeIndex = i;
				break;
			}
		}

		this.newAlternativeIndex = this.currentAlternativeIndex;
		this.jumpPoints = [0];

		this.siblingBoxes.nodes().forEach((alternativeBox: Element) => {
			if (alternativeBox !== undefined) {
				let selection: d3.Selection<any, any, any, any> = d3.select(alternativeBox);
				let jumpPoint: number = (+selection.attr(this.summaryChartRenderer.viewConfig.dimensionOne) / 2) + +selection.attr(this.summaryChartRenderer.viewConfig.coordinateOne);
				this.jumpPoints.push(jumpPoint);
			}
		});

		this.jumpPoints.push(this.summaryChartRenderer.viewConfig.dimensionOneSize);
	}

	// This function is called whenever an alternative that is being reordered is dragged any distance by the user. 
	private sortAlternatives = (d: Alternative, i: number) => {
		var deltaCoordOne: number = (<any>d3.event)['d' + this.summaryChartRenderer.viewConfig.coordinateOne];
		var currentCoordOne: number = +this.alternativeBox.attr(this.summaryChartRenderer.viewConfig.coordinateOne);

		if (currentCoordOne + deltaCoordOne < 0) {
			deltaCoordOne = 0 - currentCoordOne;
		} else if (currentCoordOne + this.alternativeDimensionOneSize + deltaCoordOne > this.maxCoordOne) {
			deltaCoordOne = this.maxCoordOne - (currentCoordOne + this.alternativeDimensionOneSize);
		}

		this.totalCoordOneChange += deltaCoordOne;

		var dimensionOneOffset: number = (this.totalCoordOneChange > 0) ? this.alternativeDimensionOneSize : 0;
		// Determine which of the two jump points the label is current between, and assign its new position accordingly.
		for (var i = 0; i < this.jumpPoints.length; i++) {
			if (currentCoordOne + dimensionOneOffset > (this.jumpPoints[i])
				&& currentCoordOne + dimensionOneOffset <= (this.jumpPoints[i + 1])) {
				this.newAlternativeIndex = i;
				break;
			}
		}
		// If we were dragging right, then the index is one off and must be decremented.
		if (this.totalCoordOneChange > 0)
			this.newAlternativeIndex--;

		d3.selectAll('.' + this.summaryChartDefinitions.CHART_ALTERNATIVE + '[alternative="' + d.getId() + '"]').attr(this.summaryChartRenderer.viewConfig.coordinateOne, currentCoordOne + deltaCoordOne);

		this.cellsToMove.nodes().forEach((cell: Element) => {
			var cellSelection: d3.Selection<any, any, any, any> = d3.select(cell);
			var previousTransform: string = cellSelection.attr('transform');
			cellSelection.attr('transform', this.renderConfigService.incrementTransform(previousTransform, deltaCoordOne, 0));
		});

		if (this.alternativeLabelToMove)
			this.alternativeLabelToMove.attr(this.summaryChartRenderer.viewConfig.coordinateOne, +this.alternativeLabelToMove.attr(this.summaryChartRenderer.viewConfig.coordinateOne) + deltaCoordOne);

		if (this.totalScoreLabelToMove)
			this.totalScoreLabelToMove.attr('transform', this.renderConfigService.incrementTransform(this.totalScoreLabelToMove.attr('transform'), deltaCoordOne, 0));

	}

	// This function is called when the user releases the alternative that is being dragged.
	private endSortAlternatives = (d: Alternative, i: number) => {
		var alternatives = this.valueChartService.getAlternatives();

		if (this.newAlternativeIndex !== this.currentAlternativeIndex) {
			var temp: Alternative = alternatives.splice(this.currentAlternativeIndex, 1)[0];
			alternatives.splice(this.newAlternativeIndex, 0, temp);


			this.rendererDataService.getRowData().forEach((row: RowData) => {
				var temp: CellData = row.cells.splice(this.currentAlternativeIndex, 1)[0];
				row.cells.splice(this.newAlternativeIndex, 0, temp);
			});
		} else {
			// No changes were made, so delete the undo/redo record that was created when dragging started. State should not be 
			// saved when no changes are made.
			this.chartUndoRedoService.deleteNewestRecord();
		}

		d3.selectAll('.' + this.objectiveChartDefinitions.CHART_CELL).style('opacity', 1);
		this.changeDetectionService.alternativeOrderChanged = true;
	}

}