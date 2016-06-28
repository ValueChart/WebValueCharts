/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 15:53:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-27 22:37:05
*/

import { Injectable } 															from '@angular/core';
import { KeyValueDiffers, KeyValueDiffer }										from '@angular/core';

// Model Classes: 
import { ValueChart } 															from '../model/ValueChart';
import { IndividualValueChart } 												from '../model/IndividualValueChart';
import { ScoreFunction } 														from '../model/ScoreFunction';


@Injectable()
export class ChangeDetectionService { 

	// Public flags that can be set to notify the ValueChart directive about changes.
	public rowOrderChanged: boolean;
	public cellOrderChanged: boolean;
	public alternativeOrderChanged: boolean;
	public colorsHaveChanged: boolean;

	public previousViewConfig: any = {};
	public previousInteractionConfig: any = {};

	// Differs:
	public valueChartDiffer: KeyValueDiffer;
	public userDiffer: KeyValueDiffer;
	public weightMapDiffer: KeyValueDiffer;
	public scoreFunctionMapDiffer: KeyValueDiffer;
	public scoreFunctionDiffer: KeyValueDiffer;
	public scoreFunctionDiffers: KeyValueDiffer[];

	// Interaction Toggles

	constructor(private objectDiffers: KeyValueDiffers) { }

	initDiffers(valueChart: ValueChart): void {
		this.valueChartDiffer = this.objectDiffers.find({}).create(null);
		this.userDiffer = this.objectDiffers.find({}).create(null);
		this.weightMapDiffer = this.objectDiffers.find({}).create(null);
		this.scoreFunctionMapDiffer = this.objectDiffers.find({}).create(null);

		var user = (<IndividualValueChart>valueChart).getUser();
		var scoreFunctionMap = user.getScoreFunctionMap();
		var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();

		this.scoreFunctionDiffers = [];

		scoreFunctions.forEach((scoreFunction: ScoreFunction) => {
			let scoreFunctionDiffer = this.objectDiffers.find({}).create(null);
			this.scoreFunctionDiffers.push(scoreFunctionDiffer);
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
		this.previousInteractionConfig.reorderObjectives = interactionConfig.reorderObjectives;
		this.previousInteractionConfig.sortAlternatives = interactionConfig.sortAlternatives;
		this.previousInteractionConfig.pumpWeights = interactionConfig.pumpWeights; 
		this.previousInteractionConfig.setObjectiveColors = interactionConfig.setObjectiveColors;
	}

}