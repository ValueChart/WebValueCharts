/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 15:53:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-10 20:39:26
*/

import { Injectable } 															from '@angular/core';
import { KeyValueDiffers, KeyValueDiffer }										from '@angular/core';

// Application Classes:
import { ChartUndoRedoService }													from './ChartUndoRedo.service';


// Model Classes: 
import { ValueChart } 															from '../model/ValueChart';
import { ScoreFunction } 														from '../model/ScoreFunction';
import { User }																	from '../model/User';

@Injectable()
export class ChangeDetectionService { 

	// Public flags that can be set to notify the ValueChart directive about changes.
	public previousValueChart: ValueChart;

	public rowOrderChanged: boolean;
	public alternativeOrderChanged: boolean;
	public colorsHaveChanged: boolean;

	public previousViewConfig: any = {};
	public previousInteractionConfig: any = {};

	public previousWidth: number;
	public previousHeight: number;

	// Differs:
	public previousNumUsers: number;
	public userDiffers: KeyValueDiffer[];
	public weightMapDiffers: KeyValueDiffer[];
	public scoreFunctionMapDiffers: KeyValueDiffer[];
	public scoreFunctionDiffers: KeyValueDiffer[];

	// Interaction Toggles

	constructor(
		private objectDiffers: KeyValueDiffers,
		private chartUndoRedoService: ChartUndoRedoService) {

			this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_ALTERNATIVE_ORDER_CHANGED, () => { this.alternativeOrderChanged = true; });
			this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_OBJECTIVES_CHANGED, 		() => { this.rowOrderChanged = true; });
		}

	initDiffers(valueChart: ValueChart): void {
		this.previousValueChart = valueChart;
		var users = valueChart.getUsers();

		this.userDiffers = [];
		this.weightMapDiffers = [];
		this.scoreFunctionMapDiffers = [];
		this.scoreFunctionDiffers = [];

		this.previousNumUsers = users.length;

		// Initialize Differs for 
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

	initPreviousViewConfig(viewConfig: any): void {
		this.previousViewConfig.displayScoreFunctions			= viewConfig.displayScoreFunctions;
		this.previousViewConfig.displayDomainValues 				= viewConfig.displayDomainValues;
		this.previousViewConfig.displayScales 					= viewConfig.displayScales;
		this.previousViewConfig.displayTotalScores 				= viewConfig.displayTotalScores;
		this.previousViewConfig.displayScoreFunctionValueLabels 	= viewConfig.displayScoreFunctionValueLabels
	}

	initPreviousInteractionConfig(interactionConfig: any) {
		this.previousInteractionConfig.weightResizeType = interactionConfig.weightResizeType;
		this.previousInteractionConfig.reorderObjectives = interactionConfig.reorderObjectives;
		this.previousInteractionConfig.sortAlternatives = interactionConfig.sortAlternatives;
		this.previousInteractionConfig.pumpWeights = interactionConfig.pumpWeights; 
		this.previousInteractionConfig.setObjectiveColors = interactionConfig.setObjectiveColors;
	}

}