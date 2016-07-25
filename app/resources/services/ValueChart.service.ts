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
import { PrimitiveObjective }								from '../model/PrimitiveObjective';
import { User }												from '../model/User';	
import { ScoreFunction }									from '../model/ScoreFunction';	
import { Alternative }										from '../model/Alternative';
import { WeightMap }										from '../model/WeightMap';
import { ContinuousDomain }									from '../model/ContinuousDomain';

// Type Definitions:
import { ValueChartStateContainer }							from '../types/StateContainer.types';
import { ScoreFunctionRecord }								from '../types/Record.types';
	
// This class stores the state of a ValueChart and exposes this state to the renderer classes. Renderer classes are allowed to modify 
// this state as a way of initiating change detection. 

@Injectable()
export class ValueChartService implements ValueChartStateContainer {

	private valueChart: ValueChart;
	public primitiveObjectives: PrimitiveObjective[];

	public users: User[];
	public currentUser: User;
	public numUsers: number;

	// This is either: a - the current user's WeightMap if the ValueChart has one user; b - a WeightMap where each objective weight is the maximum weight assigned to the objective by a user.
	public maximumWeightMap: WeightMap;

	public alternatives: Alternative[];
	public numAlternatives: number;

	constructor(
		private currentUserService: CurrentUserService,
		private chartUndoRedoService: ChartUndoRedoService) {

		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SCORE_FUNCTION_CHANGE, this.currentUserScoreFunctionChange);
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.WEIGHT_MAP_CHANGE, this.currentUserWeightMapChange);
	}

	// Initialize Service fields based on the passed-in ValueChart.
	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;

		this.users = this.valueChart.getUsers();
		this.currentUser = this.getCurrentUser();
		this.numUsers = this.valueChart.getUsers().length;

		this.updateMaximumWeightMap();

		this.numAlternatives = this.valueChart.getAlternatives().length;
		this.alternatives = this.valueChart.getAlternatives();
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	currentUserIsDefined(): boolean {
		return this.currentUser !== undefined;
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
		if (this.currentUser)
			return this.currentUser.getScoreFunctionMap().getObjectiveScoreFunction(objectiveName);
	}

	getCurrentUserWeightMap(): WeightMap {
		if (this.currentUser)
			return this.currentUser.getWeightMap();
	}

	getAlternatives(): Alternative[] {
		return this.alternatives;
	}

	getRootObjectives(): Objective[] {
		return this.valueChart.getRootObjectives();
	}
	
	updateMaximumWeightMap(): void {
		this.maximumWeightMap = this.valueChart.getMaximumWeightMap();
	}

	getElementsFromContinuousDomain(continouousDomain: ContinuousDomain): number[] {
		var range: number[] = continouousDomain.getRange()
		var increment = (range[1] - range[0]) / 4;
		var element = range[0];

		var elements: number[] = [];

		while (element <= range[1]) {

			elements.push(Math.round(element * 100) / 100);
			element += increment;
		}

		return elements;
	}

	currentUserScoreFunctionChange = (scoreFunctionRecord: ScoreFunctionRecord) => {
		this.getCurrentUser().getScoreFunctionMap().setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
	}

	currentUserWeightMapChange = (weightMapRecord: WeightMap) => {
		this.currentUser.setWeightMap(weightMapRecord);
	}
}