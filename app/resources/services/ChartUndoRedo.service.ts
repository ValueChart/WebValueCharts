/*
* @Author: aaronpmishkin
* @Date:   2016-06-21 13:40:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-12 14:11:41
*/


import { Injectable } 														from '@angular/core';

// d3
import * as d3 																	from 'd3';

// Model Classes
import { ValueChart }														from '../model/ValueChart';
import { Alternative }														from '../model/Alternative';
import { Objective }														from '../model/Objective';
import { PrimitiveObjective }												from '../model/PrimitiveObjective';
import { WeightMap }														from '../model/WeightMap';
import { ScoreFunction }													from '../model/ScoreFunction';

import { Memento }															from '../model/Memento';

// Types:
import { ValueChartStateContainer }											from '../types/StateContainer.types';
import { AlternativeOrderRecord }											from '../types/Record.types';
import { ScoreFunctionRecord }												from '../types/Record.types';
import { ObjectivesRecord }													from '../types/Record.types';


@Injectable()
export class ChartUndoRedoService {

	public SCORE_FUNCTION_CHANGE: string = 'scoreFunctionChange';
	public WEIGHT_MAP_CHANGE: string = 'weightMapChange';
	public ALTERNATIVE_ORDER_CHANGE: string = 'alternativeOrderChange';
	public OBJECTIVES_CHANGE: string = 'objectivesChange';

	public SET_ALTERNATIVE_ORDER_CHANGED: string = 'setAlternativeOrderChanged';
	public SET_OBJECTIVES_CHANGED: string = 'setObjectivesChanged';

	private undoChangeTypes: string[];
	private redoChangeTypes: string[];

	private undoStateRecords: Memento[];
	private redoStateRecords: Memento[];

	public undoRedoDispatcher: d3.Dispatch;

	constructor() {
		this.undoChangeTypes = [];
		this.redoChangeTypes = [];
		this.undoStateRecords = [];
		this.redoStateRecords = [];

		// Create a custom event dispatcher, with one event for each kind of change.
		this.undoRedoDispatcher = d3.dispatch(
			this.SCORE_FUNCTION_CHANGE,
			this.WEIGHT_MAP_CHANGE,
			this.ALTERNATIVE_ORDER_CHANGE,
			this.OBJECTIVES_CHANGE,
			this.SET_ALTERNATIVE_ORDER_CHANGED,
			this.SET_OBJECTIVES_CHANGED);
	}

	clearRedo(): void {
		this.redoChangeTypes = [];
		this.redoStateRecords = [];
	}

	clearUndo(): void {
		this.undoChangeTypes = [];
		this.undoStateRecords = [];
	}

	resetUndoRedo() {
		this.clearUndo();
		this.clearRedo();
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

		var scoreFunctionRecord: ScoreFunctionRecord = new ScoreFunctionRecord(objective.getId(), scoreFunction);

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

	undo(currentStateContainer: ValueChartStateContainer): void {
		if (!this.canUndo())
			return;

		var changeType: string = this.undoChangeTypes.pop();
		this.redoChangeTypes.push(changeType);
		var stateRecord: Memento = this.undoStateRecords.pop();
		(<any>this)[changeType](stateRecord, currentStateContainer, this.redoStateRecords);
		if ((<any>window).childWindows.scoreFunctionViewer)
			(<any>window).childWindows.scoreFunctionViewer.angularAppRef.tick();
	}

	redo(currentStateContainer: ValueChartStateContainer): void {
		if (!this.canRedo())
			return;

		var changeType = this.redoChangeTypes.pop();
		this.undoChangeTypes.push(changeType);
		var stateRecord: Memento = this.redoStateRecords.pop();
		(<any>this)[changeType](stateRecord, currentStateContainer, this.undoStateRecords);
		if ((<any>window).childWindows.scoreFunctionViewer)
			(<any>window).childWindows.scoreFunctionViewer.angularAppRef.tick();
	}

	scoreFunctionChange(scoreFunctionRecord: ScoreFunctionRecord, currentStateContainer: ValueChartStateContainer, stateRecords: Memento[]): void {
		if (!currentStateContainer.currentUserIsDefined())
			return;

		var currentScoreFunction: ScoreFunction = currentStateContainer.getCurrentUserScoreFunction(scoreFunctionRecord.objectiveName);
		stateRecords.push(new ScoreFunctionRecord(scoreFunctionRecord.objectiveName, currentScoreFunction));

		// Dispatch the ScoreFunctionChange event, notifying any listeners and passing the scoreFunctionRecord as a parameter.
		(<any>this.undoRedoDispatcher).call(this.SCORE_FUNCTION_CHANGE, {}, scoreFunctionRecord);
	}

	weightMapChange(weightMapRecord: WeightMap, currentStateContainer: ValueChartStateContainer, stateRecords: Memento[]): void {
		if (!currentStateContainer.currentUserIsDefined())
			return;

		var currentWeightMap: WeightMap = currentStateContainer.getCurrentUserWeightMap();
		stateRecords.push(currentWeightMap);

		(<any>this.undoRedoDispatcher).call(this.WEIGHT_MAP_CHANGE, {}, weightMapRecord);
	}

	alternativeOrderChange(alternativeOrderRecord: AlternativeOrderRecord, currentStateContainer: ValueChartStateContainer, stateRecords: Memento[]): void {
		var alternatives: Alternative[] = currentStateContainer.getAlternatives();
		stateRecords.push(new AlternativeOrderRecord(alternatives));

		var cellIndices: number[] = [];

		alternatives.forEach((alternative: Alternative, index: number) => {
			cellIndices[alternativeOrderRecord.alternativeIndexMap[alternative.getName()]] = index;
		});

		(<any>this.undoRedoDispatcher).call(this.ALTERNATIVE_ORDER_CHANGE, {}, cellIndices);
		(<any>this.undoRedoDispatcher).call(this.SET_ALTERNATIVE_ORDER_CHANGED);
	}

	objectivesChange(objectivesRecord: ObjectivesRecord, currentStateContainer: ValueChartStateContainer, stateRecords: Memento[]): void {
		var currentObjectives: Objective[] = currentStateContainer.getRootObjectives();

		stateRecords.push(new ObjectivesRecord(currentObjectives));

		(<any>this.undoRedoDispatcher).call(this.OBJECTIVES_CHANGE, {}, objectivesRecord);
		(<any>this.undoRedoDispatcher).call(this.SET_OBJECTIVES_CHANGED);
	}

}

