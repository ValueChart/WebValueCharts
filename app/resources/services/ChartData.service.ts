/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-06 16:34:28
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
	weightOffset: number;
	cells: VCCellData[];
}

export interface VCCellData {
	alternative: Alternative;
	value: (string | number);
	userScores: {
		user: User,
		score: number
		objective: Objective,
		offset?: number
	}[];
}

export interface VCLabelData {
	objective: Objective;
	weight: number;
	subLabelData?: VCLabelData[]
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

	getLabelData(valueChart: ValueChart, weightMap: WeightMap): VCLabelData[] {
		var labelData: VCLabelData[] = [];

		valueChart.getRootObjectives().forEach((objective: Objective) => {
			labelData.push(this.calculateAbstractObjectiveWeight(objective, weightMap));
		})

		return labelData; 
	} 

	calculateAbstractObjectiveWeight(objective: Objective, weightMap: WeightMap): VCLabelData {
		var lableData: VCLabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: VCLabelData[] = [];

			(<AbstractObjective> objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let lableDatum: VCLabelData = this.calculateAbstractObjectiveWeight(subObjective, weightMap);
				weight += lableDatum.weight;
				children.push(lableDatum);
			});

			lableData = { 'objective': objective, 'weight': weight, subLabelData: children };
		} else if (objective.objectiveType === 'primitive') {
			lableData =  { 'objective': objective, 'weight': weightMap.getNormalizedObjectiveWeight(objective.getName()) };
		}

		return lableData;
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
			for (var i: number = 0; i < users.length; i++) {
				var userScore: { user: User; score: number; objective: Objective } = {
					objective: objective,
					user: users[i],
					score: users[i].getScoreFunctionMap().getObjectiveScoreFunction(objective.getName()).getScore(objectiveValue.value)
				}

				objectiveValue.userScores.push(userScore);
			}
		});	

		return objectiveValues;
	}

	getRowData(valueChart: ValueChart): VCRowData[] {
		var rowData: VCRowData[] = [];

		valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			rowData.push({
				objective: objective,
				weightOffset: 0,
				cells: this.getCellData(objective)
			});
		});

		return rowData;
	}


}

