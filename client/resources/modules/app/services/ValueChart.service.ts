/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-29 17:47:02
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

	private activeChartType: string;
	private baseValueChart: ValueChart;
	private individualValueChart: ValueChart;
	private activeValueChart: ValueChart; // Chart currently active in ValueChartViewer
										  // (Either baseValueChart or individualValueChart)

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

	currentUserIsCreator(): boolean {
		return this.currentUserService.getUsername() === this.baseValueChart.getCreator();
	}

	currentUserIsMember(): boolean {
		return _.findIndex(this.baseValueChart.getUsers(), (user: User) => { return user.getUsername() === this.currentUserService.getUsername(); } ) !== -1;
	}

	setActiveChart(chartType: string): void {
		this.activeChartType = chartType;
		if (chartType === 'group') {
			this.activeValueChart = this.baseValueChart;
		} else {
			this.activeValueChart = this.individualValueChart;
		}
	}

	setBaseValueChart(valueChart: ValueChart): void {
		this.baseValueChart = valueChart;
		this.initializeIndividualChart();
		this.primitiveObjectives = this.baseValueChart.getAllPrimitiveObjectives();
	}

	initializeIndividualChart(): void {
		this.individualValueChart = _.clone(this.baseValueChart);
		if (!this.baseValueChart.isIndividual()) {
			var user: User[] = this.baseValueChart.getUsers().filter((user: User) => {
				return user.getUsername() === this.currentUserService.getUsername();
			});
			this.individualValueChart.setUsers(user);
		}
		this.individualValueChart.setType(ChartType.Individual);
	}

	getBaseValueChart(): ValueChart {
		return this.baseValueChart;
	}

	getIndividualChart(): ValueChart {
		return this.individualValueChart;
	}

	getActiveValueChart(): ValueChart {
		return this.activeValueChart;
	}

	getPrimitiveObjectives(): PrimitiveObjective[] {
		return this.primitiveObjectives;
	}

	getPrimitiveObjectivesByName(): string[] {
		return this.baseValueChart.getAllPrimitiveObjectivesByName();
	}

	resetPrimitiveObjectives() {
		this.primitiveObjectives = this.baseValueChart.getAllPrimitiveObjectives();
	}

	getObjectiveByName(name: string): Objective {
		for (let obj of this.baseValueChart.getAllObjectives()) {
			if (obj.getName() === name) {
				return obj;
			}
		}
		throw "Objective not found";
	}

	getCurrentUser(): User {
		// Obviously we should have it so that two usernames are never the same.
		var user: User = this.baseValueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.currentUserService.getUsername();
		})[0];

		if (!user) {
			throw "Current user is not in the chart";
		}

		return user;
	}
}