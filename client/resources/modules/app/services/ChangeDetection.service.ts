/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 15:53:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-01 15:08:12
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';
import { KeyValueDiffers, KeyValueDiffer }										from '@angular/core';

// Import Application Classes:
import { ChartUndoRedoService }													from './ChartUndoRedo.service';

// Import Model Classes: 
import { ValueChart } 															from '../../../model/ValueChart';
import { ScoreFunction } 														from '../../../model/ScoreFunction';
import { User }																	from '../../../model/User';

// Import Types:
import { InteractionConfig, ViewConfig }										from '../../../types/Config.types';

@Injectable()
export class ChangeDetectionService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public previousValueChart: ValueChart;

	// Public flags that can be set to notify the ValueChartDirective about changes.
	public objectiveOrderChanged: boolean;						// whether the objective order been changed or not. Set this to be true when you do something that changes the objective order.
	public alternativeOrderChanged: boolean;					// Whether the alternative order been changed or not. Set this to be true when you do something that changes the alternative order.
	public colorsHaveChanged: boolean;							// Whether the objective colors have been changed or not. Set this to be true when you do something that changes the objective colors.

	// Old input values to the ValueChartDirective. Used for comparison purposes.
	public previousViewConfig: ViewConfig = <any>{};				// Old values of the view config. Its fields should equal those of the viewConfig object in RenderConfigService unless a change has taken place.
	public previousInteractionConfig: InteractionConfig = <any>{};	// Old values of the interaction config. Its fields should equal those of the interactionConfig object in ValueChartDirective unless a change has taken place.
	public previousWidth: number;									// The old width. Its should equal the width in ValueChartDirective unless a change has taken place.
	public previousHeight: number;									// The old height. Its should equal the height in ValueChartDirective unless a change has taken place.
	public previousNumUsers: number;								// The old number of users. Its should equal the number of users in the ValueChart in the ValueChartDirective unless a change has taken place.

	// Differ classes for checking the data inputs for changes:
	public userDiffers: KeyValueDiffer<any, any>[];
	public weightMapDiffers: KeyValueDiffer<any, any>[];
	public scoreFunctionMapDiffers: KeyValueDiffer<any, any>[];
	public scoreFunctionDiffers: KeyValueDiffer<any, any>[];

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description	Used for Angular's dependency injection and initializing event listeners for the chartUndoRedoService.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this service when it is injected.
	*/
	constructor(
		private objectDiffers: KeyValueDiffers,
		private chartUndoRedoService: ChartUndoRedoService) {
		// Listen to undo-redo events notifying of changes to the alternative ordering.
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_ALTERNATIVE_ORDER_CHANGED, () => { this.alternativeOrderChanged = true; });
		// Listen to undo-redo events notifying of changes to the objective ordering.
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_OBJECTIVES_CHANGED, () => { this.objectiveOrderChanged = true; });
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param valueChart - The valueChart that differ classes should be initialized for. This is usually the ValueChart input the ValueChartDirective.
		@returns {void}
		@description	Initialize differ classes for use in detecting changes to a ValueChart. This should be called whenever a new ValueChart is input to
						the ValueChartDirective, or when the number of users changes. 
	*/
	initDiffers(valueChart: ValueChart): void {
		this.previousValueChart = valueChart;
		var users = valueChart.getUsers();

		this.userDiffers = [];
		this.weightMapDiffers = [];
		this.scoreFunctionMapDiffers = [];
		this.scoreFunctionDiffers = [];

		this.previousNumUsers = users.length;

		users.forEach((user: User) => {
			let userDiffer = this.objectDiffers.find({}).create(null);
			this.userDiffers.push(userDiffer);

			let weightMapDiffer = this.objectDiffers.find({}).create(null);
			this.weightMapDiffers.push(weightMapDiffer);

			let scoreFunctionMapDiffer = this.objectDiffers.find({}).create(null);
			this.scoreFunctionMapDiffers.push(scoreFunctionMapDiffer);

			var scoreFunctions: ScoreFunction[] = user.getScoreFunctionMap().getAllScoreFunctions();
			scoreFunctions.forEach((scoreFunction: ScoreFunction) => {
				let scoreFunctionDiffer = this.objectDiffers.find({}).create(null);
				this.scoreFunctionDiffers.push(scoreFunctionDiffer);
			});
		});
	}

	/*
		@param viewConfig - The current viewConfig object for the ValueChartDirective. Usually the viewConfig object in RenderConfigService.
		@returns {void}
		@description	Initialize the previousViewConfig object.
	*/
	initPreviousViewConfig(viewConfig: ViewConfig): void {
		this.previousViewConfig.viewOrientation = viewConfig.viewOrientation;
		this.previousViewConfig.displayScoreFunctions = viewConfig.displayScoreFunctions;
		this.previousViewConfig.displayDomainValues = viewConfig.displayDomainValues;
		this.previousViewConfig.displayScales = viewConfig.displayScales;
		this.previousViewConfig.displayTotalScores = viewConfig.displayTotalScores;
		this.previousViewConfig.displayScoreFunctionValueLabels = viewConfig.displayScoreFunctionValueLabels;
		this.previousViewConfig.displayAverageScoreLines = viewConfig.displayAverageScoreLines;
	}

	/*
		@param interactionConfig - The current interactionConfig object for the ValueChartDirective. Usually the interactionConfig object in ValueChartDirective.
		@returns {void}
		@description	Initialize the previousInteractionConfig object.
	*/
	initPreviousInteractionConfig(interactionConfig: any) {
		this.previousInteractionConfig.weightResizeType = interactionConfig.weightResizeType;
		this.previousInteractionConfig.reorderObjectives = interactionConfig.reorderObjectives;
		this.previousInteractionConfig.sortAlternatives = interactionConfig.sortAlternatives;
		this.previousInteractionConfig.pumpWeights = interactionConfig.pumpWeights;
		this.previousInteractionConfig.setObjectiveColors = interactionConfig.setObjectiveColors;
	}

}