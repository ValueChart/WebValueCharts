/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-05 19:47:33
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

	private valueChart: ValueChart;

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
		return this.currentUserService.getUsername() === this.valueChart.getCreator();
	}

	currentUserIsMember(): boolean {
		return _.findIndex(this.valueChart.getUsers(), (user: User) => { return user.getUsername() === this.currentUserService.getUsername(); } ) !== -1;
	}


	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	getPrimitiveObjectives(): PrimitiveObjective[] {
		return this.primitiveObjectives;
	}

	getPrimitiveObjectivesByName(): string[] {
		return this.valueChart.getAllPrimitiveObjectivesByName();
	}

	resetPrimitiveObjectives() {
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	getObjectiveByName(name: string): Objective {
		for (let obj of this.valueChart.getAllObjectives()) {
			if (obj.getName() === name) {
				return obj;
			}
		}
		throw "Objective not found";
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
}