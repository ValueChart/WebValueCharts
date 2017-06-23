/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-23 16:24:33
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Libraries:	
import * as _ 												from 'lodash';

// Import Application Classes:
import { CurrentUserService }								from './CurrentUser.service';

// Import Model Classes:
import { ValueChart, ChartType }							from '../../../model/ValueChart';
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

/*
	This class stores the state of the active ValueChart and exposes this state to any component, directive, or service in the application
	that requires it. It also provides utility methods for retrieving specific data from a ValueChart object.
*/

@Injectable()
export class ValueChartService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private currentType: string;
	private individualValueChart: ValueChart;
	private groupValueChart: ValueChart;
	private activeValueChart: ValueChart;

	private primitiveObjectives: PrimitiveObjective[];	// The list of PrimitiveObjective objects in the current ValueChart. This is saved to avoid
														// re-traversing the objective hierarchy, which is costly.

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
		private currentUserService: CurrentUserService) {
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	setActiveChart(chartType: string): void {
		this.currentType = chartType;
		if (chartType === 'group') {
			this.activeValueChart = this.groupValueChart;
		} else {
			this.activeValueChart = this.individualValueChart;
		}
	}

	// Initialize Service fields based on the passed-in ValueChart.
	setValueChart(valueChart: ValueChart): void {
		if (valueChart.isIndividual()) {
			this.individualValueChart = valueChart;
			this.groupValueChart = _.clone(this.individualValueChart);
			this.groupValueChart.setUsers(_.clone(this.groupValueChart.getUsers()));
		} else {
			this.groupValueChart = valueChart;
			this.individualValueChart = _.clone(this.groupValueChart);

			var user: User[] = this.groupValueChart.getUsers().filter((user: User) => {
				return user.getUsername() === this.currentUserService.getUsername();
			});

			this.individualValueChart.setUsers(user);
		}

		this.groupValueChart.setType(ChartType.Group);
		this.individualValueChart.setType(ChartType.Individual);

		if (this.currentType === 'group')
			this.activeValueChart = this.groupValueChart;
		else 
			this.activeValueChart = this.individualValueChart;

		this.primitiveObjectives = this.activeValueChart.getAllPrimitiveObjectives();
	}

	isGroupChart(): boolean {
		return this.groupValueChart && this.groupValueChart.getUsers().length > 1;
	}

	getGroupChart(): ValueChart {
		return this.groupValueChart;
	}

	getIndividualChart(): ValueChart {
		return this.individualValueChart;
	}

	getValueChart(): ValueChart {
		return this.activeValueChart;
	}

	getPrimitiveObjectives(): PrimitiveObjective[] {
		return this.primitiveObjectives;
	}

	getPrimitiveObjectivesByName(): string[] {
		return this.activeValueChart.getAllPrimitiveObjectivesByName();
	}

	resetPrimitiveObjectives() {
		this.primitiveObjectives = this.activeValueChart.getAllPrimitiveObjectives();
	}

	getObjectiveByName(name: string): Objective {
		for (let obj of this.getValueChart().getAllObjectives()) {
			if (obj.getName() === name) {
				return obj;
			}
		}
		throw "Objective not found";
	}

	isIndividual(): boolean {
		if (this.activeValueChart) {
			return this.activeValueChart.isIndividual();
		}
		return false;
	}

	currentUserIsCreator(): boolean {
		return this.currentUserService.getUsername() === this.activeValueChart.getCreator();
	}

	currentUserIsMember(): boolean {
		return _.findIndex(this.activeValueChart.getUsers(), (user: User) => { return user.getUsername() === this.currentUserService.getUsername(); } ) !== -1;
	}

	getCurrentUser(): User {
		// Obviously we should have it so that two usernames are never the same.
		var user: User = this.activeValueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.currentUserService.getUsername();
		})[0];

		if (!user) {
			throw "Current user is not in the chart";
		}

		return user;
	}

	getDefaultWeightMap(): WeightMap {
		return this.activeValueChart.getDefaultWeightMap();
	}

	setWeightMap(user: User, weightMap: WeightMap) {
		user.setWeightMap(weightMap);
	}
}