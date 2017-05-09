/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-09 12:22:58
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Application Classes:
import { CurrentUserService }								from './CurrentUser.service';
import { ChartUndoRedoService }								from './ChartUndoRedo.service';

// Import Model Classes:
import { ValueChart }										from '../../../model/ValueChart';
import { Objective }										from '../../../model/Objective';
import { AbstractObjective }								from '../../../model/AbstractObjective';
import { PrimitiveObjective }								from '../../../model/PrimitiveObjective';
import { User }												from '../../../model/User';
import { Alternative }										from '../../../model/Alternative';
import { WeightMap }										from '../../../model/WeightMap';
import { ScoreFunctionMap }									from '../../../model/ScoreFunctionMap';
import { ScoreFunction }									from '../../../model/ScoreFunction';
import { DiscreteScoreFunction }							from '../../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }							from '../../../model/ContinuousScoreFunction';
import { CategoricalDomain }								from '../../../model/CategoricalDomain';
import { ContinuousDomain }									from '../../../model/ContinuousDomain';

// Import Type Definitions:
import { ValueChartStateContainer }							from '../../../types/StateContainer.types';
import { ScoreFunctionRecord }								from '../../../types/Record.types';

/*
	This class stores the state of the active ValueChart and exposes this state to any component, directive, or service in the application
	that requires it. It also provides utility methods for retrieving specific data from a ValueChart object.
*/

@Injectable()
export class ValueChartService implements ValueChartStateContainer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private valueChart: ValueChart;

	private primitiveObjectives: PrimitiveObjective[];	// The list of PrimitiveObjective objects in the current ValueChart. This is saved to avoid
														// re-traversing the objective hierarchy, which is costly.

	private maximumWeightMap: WeightMap;				// The WeightMap composed of maximum user assigned weights. This means that each
														// objective weight is the largest weight assigned by any user in the active ValueChart
														// to that objective. If ValueChart has only one user, the maximum WeightMap is equal to 
														// that user's WeightMap. The main use of this WeightMap is to determine label heights in the 
														// ValueChart visualization for group charts.

	private weightMapReset: { [userName: string]: boolean }; // Indicates whether or not a User's WeightMap
															 // has been reset since they last did SMARTER


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private currentUserService: CurrentUserService,
		private chartUndoRedoService: ChartUndoRedoService) {

		// Assign handlers to update the active ValueChart when the ChartUndoRedoService fires undo/redo events.
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SCORE_FUNCTION_CHANGE, this.currentUserScoreFunctionChange);
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.WEIGHT_MAP_CHANGE, this.currentUserWeightMapChange);

		this.weightMapReset = {};
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

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

	addCurrentUser() {
		this.addUser(new User(this.currentUserService.getUsername()));
	}

	getValueChartName() {
		return this.valueChart.getName();
	}

	getUsers(): User[] {
		return this.valueChart.getUsers();
	}

	getGroupValueChartUsers(): User[] {
		return this.getUsers();	
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

	getPrimitiveObjectivesByName(): string[] {
		return this.valueChart.getAllPrimitiveObjectivesByName();
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

	getAlternativeValuesforObjective(obj: PrimitiveObjective): { value: (string | number), alternative: Alternative }[] {
		return this.valueChart.getAlternativeValuesforObjective(obj);
	}

	isIndividual(): boolean {
		if (this.valueChart) {
			return this.valueChart.isIndividual();
		}
		return false;
	}

	currentUserIsDefined(): boolean {
		return this.valueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.currentUserService.getUsername();
		}).length > 0;
	}

	getCurrentUser(): User {
		// Obviously we should have it so that two usernames are never the same.
		var user: User = this.valueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.currentUserService.getUsername();
		})[0];

		if (!user) {
			throw "Current user is not in the chart";
		}

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

	getDefaultWeightMap(): WeightMap {
		return this.valueChart.getDefaultWeightMap();
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

	// TODO: All of these methods should be moved. This class is NOT for containing ValueChart creation code.
	// Keeping these here until we decide how to adjust users' preferences in response to structural changes.

	wasWeightMapReset(user: User) {
		return this.weightMapReset[user.getUsername()];
	}

	// Set User's WeightMap to default
	resetWeightMap(user: User, weightMap: WeightMap) {
		user.setWeightMap(weightMap);
		this.weightMapReset[user.getUsername()] = true;
	}

	// Set up initial ScoreFunctions
	// Scores for categorical variables are evenly spaced between 0 and 1
	getInitialScoreFunctionMap(): ScoreFunctionMap {
		let scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();
		for (let obj of this.getPrimitiveObjectives()) {
			scoreFunctionMap.setObjectiveScoreFunction(obj.getName(), obj.getDefaultScoreFunction().getMemento());
		}
		return scoreFunctionMap;
	}
}