/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-25 14:42:47
*/

import { Injectable } 										from '@angular/core';

// Application Classes:
import { CurrentUserService }								from './CurrentUser.service';
import { ChartUndoRedoService }								from './ChartUndoRedo.service';

// Model Classes
import { ValueChart }										from '../model/ValueChart';
import { Objective }										from '../model/Objective';
import { AbstractObjective }								from '../model/AbstractObjective';
import { PrimitiveObjective }								from '../model/PrimitiveObjective';
import { User }												from '../model/User';
import { Alternative }										from '../model/Alternative';
import { WeightMap }										from '../model/WeightMap';
import { ScoreFunctionMap }									from '../model/ScoreFunctionMap';
import { ScoreFunction }									from '../model/ScoreFunction';

// Type Definitions:
import { ValueChartStateContainer }							from '../types/StateContainer.types';
import { ScoreFunctionRecord }								from '../types/Record.types';

// This class stores the state of a ValueChart and exposes this state to the renderer classes. Renderer classes are allowed to modify 
// this state as a way of initiating change detection. 

@Injectable()
export class ValueChartService implements ValueChartStateContainer {

	private valueChart: ValueChart;
	private primitiveObjectives: PrimitiveObjective[];

	constructor(
		private currentUserService: CurrentUserService,
		private chartUndoRedoService: ChartUndoRedoService) {

		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SCORE_FUNCTION_CHANGE, this.currentUserScoreFunctionChange);
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.WEIGHT_MAP_CHANGE, this.currentUserWeightMapChange);
	}

	// Initialize Service fields based on the passed-in ValueChart.
	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	getUsers(): User[] {
		return this.valueChart.getUsers();
	}

	getNumUsers(): number {
		return this.valueChart.getUsers().length;
	}

	getAlternatives(): Alternative[] {
		return this.valueChart.getAlternatives();
	}

	setAlternatives(alts: Alternative[]): void {
		this.valueChart.setAlternatives(alts);
	}

	getNumAlternatives(): number {
		return this.valueChart.getAlternatives().length;
	}

	getRootObjectives(): Objective[] {
		return this.valueChart.getRootObjectives();
	}

	getAbstractObjectives(): AbstractObjective[] {
		let abstractObjs: AbstractObjective[] = [];
		for (let obj of this.valueChart.getAllObjectives()) {
			if (obj.objectiveType === "abstract") {
				abstractObjs.push(<AbstractObjective>obj);
			}
		}
		return abstractObjs;
	}

	getPrimitiveObjectives(): PrimitiveObjective[] {
		return this.primitiveObjectives;
	}

	setPrimitivesObjectives(objs: PrimitiveObjective[]) {
		this.primitiveObjectives = objs;
	}

	resetPrimitiveObjectives() {
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	// This is either: a - the current user's WeightMap if the ValueChart has one user; b - a WeightMap where each objective weight is the maximum weight assigned to the objective by a user.
	getMaximumWeightMap(): WeightMap {
		return this.valueChart.getMaximumWeightMap();
	}

	getAlternativeValuesforObjective(obj: PrimitiveObjective): { value: (string | number), alternative: Alternative }[] {
		return this.valueChart.getAlternativeValuesforObjective(obj);
	}

	isIndividual() {
		return this.valueChart.isIndividual();
	}

	currentUserIsDefined(): boolean {
		return this.getCurrentUser() !== undefined;
	}

	getCurrentUser(): User {
		// Obviously we should have it so that two usernames are never the same.
		var user: User = this.valueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.currentUserService.getUsername();
		})[0];

		if (!user)
			user = this.valueChart.getUsers()[0];

		return user;
	}

	getCurrentUserScoreFunction(objectiveName: string): ScoreFunction {
		if (this.currentUserIsDefined())
			return this.getCurrentUser().getScoreFunctionMap().getObjectiveScoreFunction(objectiveName);
	}

	getCurrentUserWeightMap(): WeightMap {
		if (this.currentUserIsDefined())
			return this.getCurrentUser().getWeightMap();
	}

	currentUserScoreFunctionChange = (scoreFunctionRecord: ScoreFunctionRecord) => {
		this.getCurrentUser().getScoreFunctionMap().setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
	}

	currentUserWeightMapChange = (weightMapRecord: WeightMap) => {
		this.getCurrentUser().setWeightMap(weightMapRecord);
	}
}