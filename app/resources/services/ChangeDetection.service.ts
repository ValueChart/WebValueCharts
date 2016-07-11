/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 15:53:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 13:00:30
*/

import { Injectable } 															from '@angular/core';
import { KeyValueDiffers, KeyValueDiffer }										from '@angular/core';

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

	// Differs:
	public userDiffers: KeyValueDiffer[];
	public weightMapDiffers: KeyValueDiffer[];
	public scoreFunctionMapDiffers: KeyValueDiffer[];
	public scoreFunctionDiffers: KeyValueDiffer[];

	// Interaction Toggles

	constructor(private objectDiffers: KeyValueDiffers) { }

	initDiffers(valueChart: ValueChart): void {
		this.previousValueChart = valueChart;
		var users = valueChart.getUsers();

		this.userDiffers = [];
		this.weightMapDiffers = [];
		this.scoreFunctionMapDiffers = [];
		this.scoreFunctionDiffers = [];
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