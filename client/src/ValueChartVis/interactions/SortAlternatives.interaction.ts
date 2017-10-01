/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 12:26:30
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-18 14:23:26
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';
import * as _ 														from 'lodash';

import { Subject }													from 'rxjs/Subject';
import { Observable }												from 'rxjs/Observable';
import { Subscription }												from 'rxjs/Subscription';
import '../../app/utilities/rxjs-operators';

// Import Application Classes
import { RendererService } 											from '../services';
import { ChartUndoRedoService }										from '../services';

import { SummaryChartDefinitions }									from '../definitions';
import { ObjectiveChartDefinitions }								from '../definitions';
import { LabelDefinitions }											from '../definitions';

// Import Model Classes:
import { Objective, PrimitiveObjective, AbstractObjective }			from '../../model';
import { User }														from '../../model';
import { Alternative }												from '../../model';

import { RowData, CellData, LabelData, RendererConfig }				from '../../types';
import { RendererUpdate }											from '../../types';
import { AlternativesRecord }										from '../../types';

import { SortAlternativesType, ChartOrientation }					from '../../types';

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

	public lastRendererUpdate: RendererUpdate;				// The most recent RendererUpdate message sent to either the SummaryChartRenderer or the ObjectiveChartRenderer.
	private originalAlternativeOrder: AlternativesRecord;	// A record of the original alternative order. This is used by the SortAlternativesInteraction
															// class to reset the alternative order.

	private clicks: Observable<any>;
	private onClick: Subscription;

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
		private rendererService: RendererService,
		private chartUndoRedoService: ChartUndoRedoService) { 
			this.chartUndoRedoService.undoRedoSubject.subscribe(this.changeAlternativesOrder);
 	}	

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	public initialize(u: RendererUpdate): void {
		if (!this.originalAlternativeOrder && u)
			this.originalAlternativeOrder = new AlternativesRecord(u.valueChart.getAlternatives());

		this.lastRendererUpdate = u;
	}

	/*
		@param sortingType - The type of sorting to enable. Must be one of 'objective', 'alphabet', 'manual', 'reset', or 'none'.
		@param alternativeBoxes - The selection of alternative boxes from either the summary chart or the objective chart. These boxes
								 are the receivers of the click and drag events used to manually sort alternatives.
		@param rendererUpdate - The most recent RendererUpdate message.
		@returns {void}
		@description 	Toggles the active type of alternative sorting. Sorting types 'alphabet', and 'reset' immediate sort the
						alternative order while 'objective', and 'manual' are user drive. Type 'none' simply turns off all sorting.
						Alternative sorting (with the exception of by objective score) is managed by the ObjectiveChart and SummaryChart renderers.
	*/
	public toggleAlternativeSorting(sortingType: SortAlternativesType, alternativeBoxes: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate): void {
		this.initialize(rendererUpdate);

		if (sortingType === SortAlternativesType.Alphabetically) {
			this.chartUndoRedoService.saveAlternativesRecord(this.lastRendererUpdate.valueChart.getAlternatives());

			this.lastRendererUpdate.valueChart.setAlternatives(this.sortAlternativesAlphabetically(this.lastRendererUpdate.valueChart.getAlternatives()));

		} else if (sortingType === SortAlternativesType.Manually) {
			this.sortAlternativesManually(true, alternativeBoxes);

		} else if (sortingType === SortAlternativesType.Default) {
			this.chartUndoRedoService.saveAlternativesRecord(this.lastRendererUpdate.valueChart.getAlternatives());
			this.lastRendererUpdate.valueChart.setAlternatives(this.originalAlternativeOrder.alternatives);

		} else if (sortingType === SortAlternativesType.None) {
			this.sortAlternativesManually(false, alternativeBoxes);
		}

		this.removeUnnecessaryRecords()
	}

	/*
		@param enableSorting - Whether or not to enable clicking on objective labels to sort alternatives by the scores assigned to their consequences for that objective.
		@param labelRootContainer - The root container of the label area. This should be obtained from the LabelRenderer.
		@param rendererUpdate - The most recent renderer update message.
		@returns {void}
		@description 	Toggles the clicking on objective labels to sort alternatives by the scores assigned to their consequences for that objective. This method
						uses the sortByObjective anonymous function defined below to handle the actual sorting. Sorting by objectives is managed by the LabelRenderer.
	*/
	public toggleSortAlternativesByObjectiveScore(enableSorting: boolean, labelRootContainer: Element, rendererUpdate: RendererUpdate): void {
		this.initialize(rendererUpdate);

		var objectiveLabels: NodeListOf<Element> = labelRootContainer.querySelectorAll('.' + LabelDefinitions.SUBCONTAINER_OUTLINE);
		var objectiveText: NodeListOf<Element> = labelRootContainer.querySelectorAll('.' + LabelDefinitions.SUBCONTAINER_TEXT);

		if (!this.clicks) {	
			var clicksLabels = Observable.fromEvent(objectiveLabels, 'click');
			var clicksText =  Observable.fromEvent(objectiveText, 'click');
		
			this.clicks = Observable.merge(clicksLabels, clicksText);
		}

		if (this.onClick != undefined)
			this.onClick.unsubscribe();
		
		// Attach the click listener to the labels if enableSorting is true. The body of this listener will be executed whenever a user
		// clicks on one of the labels.
		if (enableSorting) {
			this.onClick = this.clicks.subscribe(this.sortByObjective);
		}
	}

	/*
		@param enableSorting - Whether or not to enable clicking and dragging alternatives to change their order.
		@param alternativeBoxes - The selection of alternative boxes from either the summary chart or the objective chart. These boxes
								 are the receivers of the click and drag events used to manually sort alternatives.
		@returns {void}
		@description 	Toggles the clicking and dragging alternatives to change their order. Please see ReorderObjectivesInteraction
						for a well commented implementation of clicking and dragging.
	*/
	private sortAlternativesManually(enableSorting: boolean, alternativeBoxes: d3.Selection<any, any, any, any>): void {
		var dragToSort = d3.drag();

		if (enableSorting) {
			dragToSort
				.on('start', this.startSortAlternatives)
				.on('drag', this.sortAlternatives)
				.on('end', this.endSortAlternatives);
		}
		if (alternativeBoxes)
			alternativeBoxes.call(dragToSort);
	}


	// This function handles user clicks on objective labels by sorting the alternatives by their score for that objective.
	private sortByObjective = (eventObject: Event) => {
		this.chartUndoRedoService.saveAlternativesRecord(this.lastRendererUpdate.valueChart.getAlternatives());

		var objective: Objective = (<any> d3.select(<any> eventObject.target).datum()).objective;
		var objectivesToReorderBy: PrimitiveObjective[];
		if (objective.objectiveType === 'abstract') {
			objectivesToReorderBy = (<AbstractObjective>objective).getAllPrimitiveSubObjectives();
		} else {
			objectivesToReorderBy = [<PrimitiveObjective>objective];
		}
		
		this.lastRendererUpdate.valueChart.setAlternatives(this.sortAlternativesByObjective(this.lastRendererUpdate.valueChart.getAlternatives(), objectivesToReorderBy));
		this.removeUnnecessaryRecords()
	}

	// This function is called when a user first begins to drag an alternative to alter its position in the alternative order.
	private startSortAlternatives = (d: Alternative, i: number) => {
		this.chartUndoRedoService.saveAlternativesRecord(this.lastRendererUpdate.valueChart.getAlternatives());

		this.minCoordOne = 0;
		this.maxCoordOne = this.lastRendererUpdate.rendererConfig.dimensionOneSize;
		this.totalCoordOneChange = 0;

		this.alternativeBox = d3.select((<any>d3.event).sourceEvent.target)
		this.alternativeDimensionOneSize = +this.alternativeBox.attr(this.lastRendererUpdate.rendererConfig.dimensionOne);

		this.siblingBoxes = this.lastRendererUpdate.el.selectAll('.' + SummaryChartDefinitions.CHART_ALTERNATIVE);

		this.cellsToMove = this.lastRendererUpdate.el.selectAll('.' + ObjectiveChartDefinitions.CHART_CELL + '[alternative="' + d.getId() + '"]');
		this.alternativeLabelToMove = this.lastRendererUpdate.el.select('.' + ObjectiveChartDefinitions.ALTERNATIVE_LABEL + '[alternative="' + d.getId() + '"]');
		this.totalScoreLabelToMove = this.lastRendererUpdate.el.select('.' + SummaryChartDefinitions.SCORE_TOTAL_SUBCONTAINER + '[alternative="' + d.getId() + '"]');

		this.lastRendererUpdate.el.selectAll('.' + ObjectiveChartDefinitions.CHART_CELL).style('opacity', 0.25);
		this.cellsToMove.style('opacity', 1);

		for (var i = 0; i < this.lastRendererUpdate.valueChart.getAlternatives().length; i++) {
			if (this.lastRendererUpdate.valueChart.getAlternatives()[i].getName() === d.getName()) {
				this.currentAlternativeIndex = i;
				break;
			}
		}

		this.newAlternativeIndex = this.currentAlternativeIndex;
		this.jumpPoints = [0];

		this.siblingBoxes.nodes().forEach((alternativeBox: Element) => {
			if (alternativeBox !== undefined) {
				let selection: d3.Selection<any, any, any, any> = d3.select(alternativeBox);
				let jumpPoint: number = (+selection.attr(this.lastRendererUpdate.rendererConfig.dimensionOne) / 2) + +selection.attr(this.lastRendererUpdate.rendererConfig.coordinateOne);
				this.jumpPoints.push(jumpPoint);
			}
		});

		this.jumpPoints.push(this.lastRendererUpdate.rendererConfig.dimensionOneSize);
	}

	// This function is called whenever an alternative that is being reordered is dragged any distance by the user. 
	private sortAlternatives = (d: Alternative, i: number) => {
		var deltaCoordOne: number = (<any>d3.event)['d' + this.lastRendererUpdate.rendererConfig.coordinateOne];
		var currentCoordOne: number = +this.alternativeBox.attr(this.lastRendererUpdate.rendererConfig.coordinateOne);

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

		this.lastRendererUpdate.el.selectAll('.' + SummaryChartDefinitions.CHART_ALTERNATIVE + '[alternative="' + d.getId() + '"]').attr(this.lastRendererUpdate.rendererConfig.coordinateOne, currentCoordOne + deltaCoordOne);

		this.cellsToMove.nodes().forEach((cell: Element) => {
			var cellSelection: d3.Selection<any, any, any, any> = d3.select(cell);
			var previousTransform: string = cellSelection.attr('transform');
			cellSelection.attr('transform', this.rendererService.incrementTransform(this.lastRendererUpdate.viewConfig, previousTransform, deltaCoordOne, 0));
		});

		if (this.alternativeLabelToMove)
			this.alternativeLabelToMove.attr(this.lastRendererUpdate.rendererConfig.coordinateOne, +this.alternativeLabelToMove.attr(this.lastRendererUpdate.rendererConfig.coordinateOne) + deltaCoordOne);

		if (this.totalScoreLabelToMove)
			this.totalScoreLabelToMove.attr('transform', this.rendererService.incrementTransform(this.lastRendererUpdate.viewConfig, this.totalScoreLabelToMove.attr('transform'), deltaCoordOne, 0));

	}

	// This function is called when the user releases the alternative that is being dragged.
	private endSortAlternatives = (d: Alternative, i: number) => {
		var alternatives = this.lastRendererUpdate.valueChart.getAlternatives();

		if (this.newAlternativeIndex !== this.currentAlternativeIndex) {
			var temp: Alternative = alternatives.splice(this.currentAlternativeIndex, 1)[0];
			alternatives.splice(this.newAlternativeIndex, 0, temp);

		} else {
			this.chartUndoRedoService.deleteNewestRecord();
			this.lastRendererUpdate.renderRequired.value = true;
		}

		this.lastRendererUpdate.el.selectAll('.' + ObjectiveChartDefinitions.CHART_CELL).style('opacity', 1);
	}


	// ================================ Public Methods for Reordering Rows and Columns ====================================

	private sortAlternativesByObjective(alternatives: Alternative[], objectivesToReorderBy: PrimitiveObjective[]): Alternative[] {
		// Generate an array of indexes according to the number of cells in each row.
		var alternativeScores: any = {};

		this.lastRendererUpdate.usersToDisplay.forEach((user: User) => {
			objectivesToReorderBy.forEach((objective: Objective) => {
				var scoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId());
				var weight: number = user.getWeightMap().getObjectiveWeight(objective.getId());
				
				alternatives.forEach((alternative: Alternative) => {
					if (alternativeScores[alternative.getName()] == undefined) 
						alternativeScores[alternative.getName()] = 0;

					alternativeScores[alternative.getName()] += (scoreFunction.getScore(alternative.getObjectiveValue(objective.getId())) * weight);
				});
			});
		});

		return alternatives.sort((a: Alternative, b: Alternative) => {
			var aScore: number = alternativeScores[a.getName()];		// This is the sum of a's score for each of the objectivesToReorderBy. 
			var bScore: number = alternativeScores[b.getName()];		// This is the sum of b's score for each of the objectivesToReorderBy.

			if (aScore === bScore) {
				return 0;						// Do not change the ordering of a and b.
			} else if (aScore > bScore) {		// If a has a higher score it should come before b in the ordering.
				return -1;						// a should come before b in the ordering
			} else {
				return 1;						// b should come before a in the ordering.
			}
		});
	}

	private sortAlternativesAlphabetically(alternatives: Alternative[]): Alternative[] {
		// Generate an array of indexes according to the number of cells in each row.
		return alternatives.sort((a: Alternative, b: Alternative) => {

			var aName: string = a.getName().toLowerCase();
			var bName: string = b.getName().toLowerCase();

			if (aName === bName) {
				return 0;						// Do not change the ordering of a and b.
			} else if (aName < bName) {			// The earlier the letter in the alphabet, the smaller its character code.
				return -1;						// a should come before b in the ordering
			} else {
				return 1;						// b should come before a in the ordering.
			}
		});
	}

	// The method insures that only one Alternative record is created per Sorting action. This is necessary since the SortAlternativesInteraction
	// is attached to multiple Renderer classes and its event handlers can be triggered more than once for the same action.
	removeUnnecessaryRecords = () => {
		var lastRecord = (<AlternativesRecord> this.chartUndoRedoService.getNewestRecord());

		if (lastRecord && lastRecord.alternatives && _.isEqual(lastRecord.alternatives, this.lastRendererUpdate.valueChart.getAlternatives())) {
			this.chartUndoRedoService.deleteNewestRecord();
		}
	}

	changeAlternativesOrder = (message: {type: string, data: AlternativesRecord}) => {
		if (message.type === this.chartUndoRedoService.ALTERNATIVE_ORDER_CHANGE)
			this.lastRendererUpdate.valueChart.setAlternatives(message.data.alternatives);
	}
}