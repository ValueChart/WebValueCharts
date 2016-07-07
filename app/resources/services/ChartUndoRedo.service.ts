/*
* @Author: aaronpmishkin
* @Date:   2016-06-21 13:40:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-07 14:30:36
*/


import { Injectable } 														from '@angular/core';

// Application Classes
import { ChartDataService }													from './ChartData.service';
import { ChangeDetectionService }											from './ChangeDetection.service';

// Model Classes
import { ValueChart }														from '../model/ValueChart';
import { Alternative }														from '../model/Alternative';
import { Objective }														from '../model/Objective';
import { PrimitiveObjective }												from '../model/PrimitiveObjective';
import { WeightMap }														from '../model/WeightMap';
import { ScoreFunction }													from '../model/ScoreFunction';

import { Memento }															from '../model/Memento';
import { AlternativeOrderRecord }											from '../model/Records';
import { ScoreFunctionRecord }												from '../model/Records';
import { ObjectivesRecord }													from '../model/Records';


@Injectable()
export class ChartUndoRedoService {

	private SCORE_FUNCTION_CHANGE = 'scoreFunctionChange';
	private WEIGHT_MAP_CHANGE = 'weightMapChange';
	private ALTERNATIVE_ORDER_CHANGE = 'alternativeOrderChange';
	private OBJECTIVES_CHANGE = 'objectivesChange';

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

	clearUndo(): void {
		this.undoChangeTypes = [];
		this.undoStateRecords = [];
	}

	deleteNewestRecord(): void {
		this.undoChangeTypes.pop();
		this.undoStateRecords.pop();
	}

	saveScoreFunctionRecord(scoreFunction: ScoreFunction, objective: PrimitiveObjective): void {
		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		// Record the type of change has been made.
		this.undoChangeTypes.push(this.SCORE_FUNCTION_CHANGE);

		var scoreFunctionRecord: ScoreFunctionRecord = new ScoreFunctionRecord(objective.getName(), scoreFunction);

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

	saveObjectivesRecord(objectives: Objective[]): void {
		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();

		this.undoChangeTypes.push(this.OBJECTIVES_CHANGE);

		var objectivesRecord: ObjectivesRecord = new ObjectivesRecord(objectives);

		this.undoStateRecords.push(objectivesRecord);
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
		if (!this.chartDataService.currentUser)
			return;

		var currentWeightMap: WeightMap = this.chartDataService.currentUser.getWeightMap();
		stateRecords.push(currentWeightMap);
		this.chartDataService.currentUser.setWeightMap(weightMapRecord);
	}

	scoreFunctionChange(scoreFunctionRecord: ScoreFunctionRecord, stateRecords: Memento[]): void {
		if (!this.chartDataService.currentUser)
			return;

		var currentScoreFunction: ScoreFunction = this.chartDataService.currentUser.getScoreFunctionMap().getObjectiveScoreFunction(scoreFunctionRecord.objectiveName);
		stateRecords.push(new ScoreFunctionRecord(scoreFunctionRecord.objectiveName, currentScoreFunction));

		this.chartDataService.currentUser.getScoreFunctionMap().setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
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

	objectivesChange(objectivesRecord: ObjectivesRecord, stateRecords: Memento[]): void {
		var currentObjectives: Objective[] = this.chartDataService.getValueChart().getRootObjectives();

		stateRecords.push(new ObjectivesRecord(currentObjectives));

		this.chartDataService.getValueChart().setRootObjectives(objectivesRecord.rootObjectives);
		this.chartDataService.updateLabelData();
		this.chartDataService.primitiveObjectives = this.chartDataService.getValueChart().getAllPrimitiveObjectives();

		this.changeDetectionService.rowOrderChanged = true;

	}

}

