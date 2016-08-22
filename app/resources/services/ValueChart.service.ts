/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-19 21:24:50
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
import { DiscreteScoreFunction }							from '../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }							from '../model/ContinuousScoreFunction';
import { CategoricalDomain }								from '../model/CategoricalDomain';
import { ContinuousDomain }									from '../model/ContinuousDomain';

// Type Definitions:
import { ValueChartStateContainer }							from '../types/StateContainer.types';
import { ScoreFunctionRecord }								from '../types/Record.types';

// This class stores the state of a ValueChart and exposes this state to the renderer classes. Renderer classes are allowed to modify 
// this state as a way of initiating change detection. 

@Injectable()
export class ValueChartService implements ValueChartStateContainer {

	private valueChart: ValueChart;
	private primitiveObjectives: PrimitiveObjective[];

	private maximumWeightMap: WeightMap;

	private weightMapReset: { [userName: string]: boolean }; // Indicates whether or not a User's WeightMap
	// has been reset since they last did SMARTER

	constructor(
		private currentUserService: CurrentUserService,
		private chartUndoRedoService: ChartUndoRedoService) {

		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SCORE_FUNCTION_CHANGE, this.currentUserScoreFunctionChange);
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.WEIGHT_MAP_CHANGE, this.currentUserWeightMapChange);

		this.weightMapReset = {};
	}

	// Initialize Service fields based on the passed-in ValueChart.
	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	addUser(user: User) {
		this.valueChart.addUser(user);
		this.weightMapReset[user.getUsername()] = false;
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

	getObjectiveByName(name: string): Objective {
		for (let obj of this.getValueChart().getAllObjectives()) {
			if (obj.getName() === name) {
				return obj;
			}
		}
		throw "Objective not found";
	}

	// This is either: a - the current user's WeightMap if the ValueChart has one user; b - a WeightMap where each objective weight is the maximum weight assigned to the objective by a user.
	getMaximumWeightMap(): WeightMap {
		if (this.maximumWeightMap === undefined)
			this.updateMaximumWeightMap();
		return this.maximumWeightMap;
	}

	updateMaximumWeightMap(): WeightMap {
		return this.maximumWeightMap = this.valueChart.getMaximumWeightMap();
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

	setWeightMap(user: User, weightMap: WeightMap) {
		user.setWeightMap(weightMap);
		this.weightMapReset[user.getUsername()] = false;
	}

	wasWeightMapReset(user: User) {
		return this.weightMapReset[user.getUsername()];
	}

	// Set User's WeightMaps to default
	resetWeightMap(user: User, weightMap: WeightMap) {
		user.setWeightMap(weightMap);
		this.weightMapReset[user.getUsername()] = true;
	}

	// Create initial weight map for the Objective hierarchy with evenly distributed weights
	getDefaultWeightMap(): WeightMap {
		let weightMap: WeightMap = new WeightMap();
		this.initializeDefaultWeightMap(this.getRootObjectives(), weightMap, 1);
		return weightMap;
	}

	// Recursively add entries to weight map
	private initializeDefaultWeightMap(objectives: Objective[], weightMap: WeightMap, parentWeight: number) {
		let weight = parentWeight * 1.0 / objectives.length;
		for (let obj of objectives) {
			weightMap.setObjectiveWeight(obj.getName(), weight);
			if (obj.objectiveType === 'abstract') {
				this.initializeDefaultWeightMap((<AbstractObjective>obj).getDirectSubObjectives(), weightMap, weight);
			}
		}
	}

	// Set up initial ScoreFunctions
	// Scores for categorical variables are evenly spaced between 0 and 1
	getInitialScoreFunctionMap(): ScoreFunctionMap {
		let scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();
		for (let obj of this.getPrimitiveObjectives()) {
			let scoreFunction = this.getInitialScoreFunction(obj);
			scoreFunctionMap.setObjectiveScoreFunction(obj.getName(), scoreFunction);
		}
		return scoreFunctionMap;
	}

	getInitialScoreFunction(obj: PrimitiveObjective): ScoreFunction {
		let scoreFunction: ScoreFunction;
		if (obj.getDomainType() === 'categorical' || obj.getDomainType() === 'interval') {
			scoreFunction = new DiscreteScoreFunction();
			let dom = (<CategoricalDomain>obj.getDomain()).getElements();
			let increment = 1.0 / (dom.length - 1);
			let currentScore = 0;
			for (let item of dom) {
				scoreFunction.setElementScore(item, currentScore);
				currentScore += increment;
			}
		}
		else {
			let min: number = (<ContinuousDomain>obj.getDomain()).getMinValue();
			let max: number = (<ContinuousDomain>obj.getDomain()).getMaxValue();
			scoreFunction = new ContinuousScoreFunction(min, max);
			// Add three evenly-spaced points between min and max
			let increment = (max - min) / 4.0;
			let slope = 1.0 / (max - min);
			scoreFunction.setElementScore(min, 0);
			scoreFunction.setElementScore(min + increment, slope * increment);
			scoreFunction.setElementScore(min + 2 * increment, slope * 2 * increment);
			scoreFunction.setElementScore(min + 3 * increment, slope * 3 * increment);
			scoreFunction.setElementScore(max, 1);
		}
		return scoreFunction;
	}
}