/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-03 17:03:27
*/

import { Injectable } 					from '@angular/core';

// Model Classes
import { ValueChart }					from '../model/ValueChart';
import { IndividualValueChart }			from '../model/IndividualValueChart';
import { GroupValueChart }				from '../model/GroupValueChart';
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { AbstractObjective }			from '../model/AbstractObjective';
import { User }							from '../model/User';	
import { Alternative }					from '../model/Alternative';
import { WeightMap }					from '../model/WeightMap';


export interface VCRowData {
	objective: PrimitiveObjective;
	cells: VCCellData[];
}

export interface VCCellData {
	alternative: Alternative;
	value: (string | number);
	userScores: {
		user: User,
		y: number
	}[];
}


@Injectable()
export class ChartDataService {

	private valueChart: ValueChart;

	constructor() { }

	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	// Uses average weight for GroupValueCharts
	getAbstractObjectiveWeight(objective: AbstractObjective): number {
		var weight: number = 0;
		var weightMap: WeightMap;

		if (this.valueChart.type === 'group') {
			weightMap = (<GroupValueChart> this.valueChart).calculateAverageWeightMap();
		} else {
			weightMap = (<IndividualValueChart> this.valueChart).getUser().getWeightMap();
		}

		(<AbstractObjective>objective).getAllPrimitiveSubObjectives().forEach((objective: PrimitiveObjective) => {
			weight += weightMap.getObjectiveWeight(objective);
		});

		return weight;
	}

	getCellData(objective: PrimitiveObjective): VCCellData[] {
		var users: User[];

		if (this.valueChart.type === 'group') {
			users = (<GroupValueChart>this.valueChart).getUsers();
		} else {
			users = [(<IndividualValueChart>this.valueChart).getUser()];
		}

		var objectiveValues: any[] = this.valueChart.getAlternativeValuesforObjective(objective);

		objectiveValues.forEach((objectiveValue: any) => {
			objectiveValue.userScores = [];
			for (var i: number; i < users.length; i++) {
				objectiveValue.userScores[i] = {};
				objectiveValue.userScores[i].user = users[i];
				objectiveValue.userScores[i].y = users[i].getScoreFunctionMap().getObjectiveScoreFunction(objectiveValue.objective).getScore(objectiveValue.value);
			}
		});	

		return objectiveValues;
	}

	getRowData(valueChart: ValueChart): VCRowData[] {
		var objectivesData: any[] = [];

		valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective) => {
			objectivesData.push({
				objective: objective,
				objectiveValues: this.getCellData(objective)
			});
		});

		return objectivesData;
	}


}

