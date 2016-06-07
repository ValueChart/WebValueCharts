/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-07 10:36:16
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
	depth: number;
	depthOfChildren: number;
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
			labelData.push(this.calculateAbstractObjectiveWeight(objective, weightMap, 0));
		})

		return labelData; 
	} 

	calculateAbstractObjectiveWeight(objective: Objective, weightMap: WeightMap, depth: number): VCLabelData {
		var labelData: VCLabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: VCLabelData[] = [];
			var maxDepthOfChildren: number = 0;

			(<AbstractObjective> objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let lableDatum: VCLabelData = this.calculateAbstractObjectiveWeight(subObjective, weightMap, depth + 1);
				weight += lableDatum.weight;
				if (lableDatum.depthOfChildren > maxDepthOfChildren)
					maxDepthOfChildren = lableDatum.depthOfChildren;
				children.push(lableDatum);
			});

			labelData = { 'objective': objective, 'weight': weight, 'subLabelData': children, 'depth': depth, 'depthOfChildren': maxDepthOfChildren + 1};
		} else if (objective.objectiveType === 'primitive') {
			labelData =  { 'objective': objective, 'weight': weightMap.getNormalizedObjectiveWeight(objective.getName()), 'depth': depth, 'depthOfChildren': 0};
		}

		return labelData;
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

