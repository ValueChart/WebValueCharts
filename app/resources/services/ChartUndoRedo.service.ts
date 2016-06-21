/*
* @Author: aaronpmishkin
* @Date:   2016-06-21 13:40:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-21 16:16:43
*/


import { Injectable } 					from '@angular/core';

// Application Classes
import { ChartDataService }				from './ChartData.service';

// Model Classes
import { ValueChart }					from '../model/ValueChart';
import { IndividualValueChart }			from '../model/IndividualValueChart';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { WeightMap }					from '../model/WeightMap';
import { ScoreFunctionMap }				from '../model/ScoreFunctionMap';
import { ScoreFunction }				from '../model/ScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';


@Injectable()
export class ChartUndoRedoService {

	private SCORE_FUNCTION_CHANGE = 'scorefunction';
	private WEIGHT_MAP_CHANGE = 'weightmap';

	private undoChanges: string[];
	private redoChanges: string[];

	private undoWeightMapStates: WeightMap[];
	private redoWeightMapStates: WeightMap[];

	private undoScoreFunctionStates: { 'scoreFunction': ScoreFunction, 'objectiveName': string }[];
	private redoScoreFunctionStates: { 'scoreFunction': ScoreFunction, 'objectiveName': string }[];


	constructor(private chartDataService: ChartDataService) {
		this.undoChanges = [];
		this.redoChanges = [];
		this.undoWeightMapStates = [];
		this.redoWeightMapStates = [];
		this.undoScoreFunctionStates = [];
		this.redoScoreFunctionStates = [];
	}

	clearRedo(): void {
		this.redoChanges = [];
		this.redoWeightMapStates = [];
		this.redoScoreFunctionStates = [];
	}

	saveScoreFunctionState(scoreFunction: ScoreFunction, objective: PrimitiveObjective): void {
		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		// Record the type of change has been made.
		this.undoChanges.push(this.SCORE_FUNCTION_CHANGE);

		var scoreFunctionCopy: ScoreFunction = this.copyScoreFunction(scoreFunction);

		// Save the copy that was just created, along with the name of the objective that it maps to.
		this.undoScoreFunctionStates.push({ 'scoreFunction': scoreFunctionCopy, 'objectiveName': objective.getName() });
	}

	saveWeightMapState(weightMap: WeightMap): void {
		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		// Record the type of change that has been made.
		this.undoChanges.push(this.WEIGHT_MAP_CHANGE);

		var weightMapCopy: WeightMap = this.copyWeightMap(weightMap);

		// Save the copy that was just created.
		this.undoWeightMapStates.push(weightMapCopy);
	}

	canUndo(): boolean {
		return this.undoChanges.length !== 0;
	}

	canRedo(): boolean {
		return this.redoChanges.length !== 0;
	}

	undo(): void {
		if (!this.canUndo())
			return;

		var changeType = this.undoChanges.pop();
		this.redoChanges.push(changeType);

		if (changeType === this.SCORE_FUNCTION_CHANGE) {
			var scoreFunctionRecord = this.undoScoreFunctionStates.pop();
			var currentScoreFunction: ScoreFunction = this.chartDataService.scoreFunctionMap.getObjectiveScoreFunction(scoreFunctionRecord.objectiveName);
			this.redoScoreFunctionStates.push({ 'scoreFunction': currentScoreFunction, 'objectiveName': scoreFunctionRecord.objectiveName });

			this.chartDataService.scoreFunctionMap.setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
		} else if (changeType === this.WEIGHT_MAP_CHANGE) {
			var savedWeightMap = this.undoWeightMapStates.pop();
			var currentWeightMap: WeightMap = this.chartDataService.weightMap;
			this.redoWeightMapStates.push(currentWeightMap);

			this.chartDataService.weightMap = savedWeightMap;
			// TODO: This will need to be changed because it assumes an IndividualValueChart...
			(<IndividualValueChart> this.chartDataService.getValueChart()).getUser().setWeightMap(savedWeightMap);
		}
	}

	redo(): void {
		if (!this.canRedo()) 
			return;

		var changeType = this.redoChanges.pop();
		this.undoChanges.push(changeType);

		if (changeType === this.SCORE_FUNCTION_CHANGE) {
			var scoreFunctionRecord = this.redoScoreFunctionStates.pop();
			var currentScoreFunction: ScoreFunction = this.chartDataService.scoreFunctionMap.getObjectiveScoreFunction(scoreFunctionRecord.objectiveName);
			this.undoScoreFunctionStates.push({ 'scoreFunction': currentScoreFunction, 'objectiveName': scoreFunctionRecord.objectiveName });

			this.chartDataService.scoreFunctionMap.setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
		} else if (changeType === this.WEIGHT_MAP_CHANGE) {
			var savedWeightMap = this.redoWeightMapStates.pop();
			var currentWeightMap: WeightMap = this.chartDataService.weightMap;
			this.undoWeightMapStates.push(currentWeightMap);

			this.chartDataService.weightMap = savedWeightMap;
			// TODO: This will need to be changed because it assumes an IndividualValueChart...
			(<IndividualValueChart>this.chartDataService.getValueChart()).getUser().setWeightMap(savedWeightMap);
		}
	}

	// TODO: Decide if these methods should be pushed to the Model Classes.

	copyScoreFunction(scoreFunction: ScoreFunction): ScoreFunction {
		var scoreFunctionCopy: ScoreFunction;

		// Create a new ScoreFunction object
		if (scoreFunction.type === 'discrete') {
			scoreFunctionCopy = new DiscreteScoreFunction();
		} else if (scoreFunction.type === 'continuous') {
			scoreFunctionCopy = new ContinuousScoreFunction();
		}
		// Copy over the properties from the ScoreFunction that is being saved.
		Object.assign(scoreFunctionCopy, scoreFunction);

		// Create a new internal map object.
		var internalMapCopy = new Map<string | number, number>();

		// Copy the internal map values we want to save to the new internal map.
		scoreFunction.getElementScoreMap().forEach((value: number, key: string | number) => {
			internalMapCopy.set(key, value);
		});

		// Set the internal map to be the copy we just made. This is important, as otherwise the internal map in the new ScoreFunction will be
		// a reference to the internal map in the in-use ScoreFunction. This means that any further changes could overwrite our saved copy.
		scoreFunctionCopy.setElementScoreMap(internalMapCopy);

		return scoreFunctionCopy;
	}

	copyWeightMap(weightMap: WeightMap): WeightMap {
		// Create a new WeightMap object.
		var weightMapCopy: WeightMap = new WeightMap();
		// COpy over all the properties from the WeightMap that is being saved.
		Object.assign(weightMapCopy, weightMap);
		// Create a new internal map object.
		var internalMapCopy = new Map<string, number>();

		// Copy the internal map values we want to save to the new internal map.
		weightMap.getInternalWeightMap().forEach((value: number, key: string) => {
			internalMapCopy.set(key, value);
		});

		// Set the internal map of the WeightMap to the copy we just made. This is important, as otherwise the internal map in the new WeightMap will be
		// a reference to the internal map in the in-use WeightMap. This means that any further changes could overwrite our saved copy.
		weightMapCopy.setInternalWeightMap(internalMapCopy);

		return weightMapCopy;
	}


}

