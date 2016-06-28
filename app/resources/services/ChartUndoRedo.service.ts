/*
* @Author: aaronpmishkin
* @Date:   2016-06-21 13:40:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 12:12:06
*/


import { Injectable } 					from '@angular/core';

// Application Classes
import { ChartDataService }				from './ChartData.service';
import { ChangeDetectionService }		from './ChangeDetection.service';

// Model Classes
import { ValueChart }					from '../model/ValueChart';
import { Alternative }					from '../model/Alternative';
import { IndividualValueChart }			from '../model/IndividualValueChart';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { WeightMap }					from '../model/WeightMap';
import { ScoreFunctionMap }				from '../model/ScoreFunctionMap';
import { ScoreFunction }				from '../model/ScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';

import { Memento }						from '../model/Memento';

class AlternativeOrderRecord implements Memento {

	public alternativeIndexMap: any;

	constructor(alternatives: Alternative[]) {
		this.alternativeIndexMap = {};

		alternatives.forEach((alternative: Alternative, index: number) => {
			this.alternativeIndexMap[alternative.getName()] = index;
		});
	}

	getMemento(): Memento {
		return this;
	}
} 

class ScoreFunctionRecord implements Memento {
	public objectiveName: string;
	public scoreFunction: ScoreFunction;

	constructor(objectiveName: string, scoreFunction: ScoreFunction) {
		this.objectiveName = objectiveName;
		this.scoreFunction = scoreFunction;
	}

	getMemento(): ScoreFunctionRecord {
		return new ScoreFunctionRecord(this.objectiveName, this.scoreFunction.getMemento());
	}
}


@Injectable()
export class ChartUndoRedoService {

	private SCORE_FUNCTION_CHANGE = 'scoreFunctionChange';
	private WEIGHT_MAP_CHANGE = 'weightMapChange';
	private ALTERNATIVE_ORDER_CHANGE = 'alternativeOrderChange';

	private undoChangeTypes: string[];
	private redoChangeTypes: string[];

	private undoStateRecords: Memento[];
	private redoStateRecords: Memento[];


	constructor(
		private chartDataService: ChartDataService,
		private changeDetectionService: ChangeDetectionService) {
		this.undoChangeTypes = [];
		this.redoChangeTypes = [];
		this.undoStateRecords = [];
		this.redoStateRecords = [];
	}

	clearRedo(): void {
		this.redoChangeTypes = [];
		this.redoStateRecords = [];
	}

	saveScoreFunctionRecord(scoreFunction: ScoreFunction, objective: PrimitiveObjective): void {
		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		// Record the type of change has been made.
		this.undoChangeTypes.push(this.SCORE_FUNCTION_CHANGE);

		var scoreFunctionRecord: ScoreFunctionRecord = new ScoreFunctionRecord(objective.getName(), scoreFunction).getMemento();

		// Save the copy that was just created, along with the name of the objective that it maps to.
		this.undoStateRecords.push(scoreFunctionRecord);
	}

	saveWeightMapRecord(weightMap: WeightMap): void {
		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		// Record the type of change that has been made.
		this.undoChangeTypes.push(this.WEIGHT_MAP_CHANGE);

		var weightMapRecord: WeightMap = weightMap.getMemento();

		// Save the copy that was just created.
		this.undoStateRecords.push(weightMapRecord);
	}

	saveAlternativeOrderRecord(alternatives: Alternative[]): void {
		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();

		this.undoChangeTypes.push(this.ALTERNATIVE_ORDER_CHANGE);

		var alternativeOrderRecord: AlternativeOrderRecord = new AlternativeOrderRecord(alternatives);

		this.undoStateRecords.push(alternativeOrderRecord);
	}

	canUndo(): boolean {
		return this.undoChangeTypes.length !== 0;
	}

	canRedo(): boolean {
		return this.redoChangeTypes.length !== 0;
	}

	undo(): void {
		if (!this.canUndo())
			return;

		var changeType: string = this.undoChangeTypes.pop();
		this.redoChangeTypes.push(changeType);
		var stateRecord: Memento = this.undoStateRecords.pop();
		(<any> this)[changeType](stateRecord, this.redoStateRecords);

	}

	redo(): void {
		if (!this.canRedo()) 
			return;

		var changeType = this.redoChangeTypes.pop();
		this.undoChangeTypes.push(changeType);
		var stateRecord: Memento = this.redoStateRecords.pop();
		(<any> this)[changeType](stateRecord, this.undoStateRecords);
	}

	weightMapChange(weightMapRecord: WeightMap, stateRecords: Memento[]): void {
		var currentWeightMap: WeightMap = this.chartDataService.weightMap;
		stateRecords.push(currentWeightMap);
		// TODO: Why isn't this.chartDataService.weightMap the same reference as chartDataService.valueChart.user.weightMap?
		this.chartDataService.weightMap = weightMapRecord;
		(<IndividualValueChart> this.chartDataService.getValueChart()).getUser().setWeightMap(weightMapRecord);
	}

	scoreFunctionChange(scoreFunctionRecord: ScoreFunctionRecord, stateRecords: Memento[]): void {
		var currentScoreFunction: ScoreFunction = this.chartDataService.scoreFunctionMap.getObjectiveScoreFunction(scoreFunctionRecord.objectiveName);
		stateRecords.push(new ScoreFunctionRecord(scoreFunctionRecord.objectiveName, currentScoreFunction));

		this.chartDataService.scoreFunctionMap.setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
	}

	alternativeOrderChange(alternativeOrderRecord: AlternativeOrderRecord, stateRecords: Memento[]): void {
		var alternatives: Alternative[] = this.chartDataService.alternatives;
		stateRecords.push(new AlternativeOrderRecord(alternatives));

		var cellIndices: number[] = [];

		alternatives.forEach((alternative: Alternative, index: number) => {
			cellIndices[alternativeOrderRecord.alternativeIndexMap[alternative.getName()]] = index;
		});

		this.chartDataService.reorderAllCells(cellIndices);
		this.changeDetectionService.alternativeOrderChanged = true;
	}

}

