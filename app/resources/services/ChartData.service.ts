/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-08 16:51:13
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
import { CategoricalDomain }			from '../model/CategoricalDomain';
import { IntervalDomain }				from '../model/IntervalDomain';
import { ContinuousDomain }				from '../model/ContinuousDomain';
import { ScoreFunctionMap }				from '../model/ScoreFunctionMap';

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
	public weightMap: WeightMap;
	public scoreFunctionMap: ScoreFunctionMap;
	public numUsers: number;
	public numAlternatives: number;


	constructor() { }

	// Methods for formatting data for rendering using d3

	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;

		if (this.valueChart.type === 'individual') {
			this.weightMap = (<IndividualValueChart>this.valueChart).getUser().getWeightMap();
			this.scoreFunctionMap = (<IndividualValueChart>this.valueChart).getUser().getScoreFunctionMap();
			this.numUsers = 1;
		} else {
			this.weightMap = (<GroupValueChart>this.valueChart).calculateAverageWeightMap();
			this.numUsers = (<GroupValueChart>this.valueChart).getUsers().length;
		}
		this.numAlternatives = this.valueChart.getAlternatives().length;
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	getLabelData(valueChart: ValueChart): VCLabelData[] {
		var labelData: VCLabelData[] = [];

		valueChart.getRootObjectives().forEach((objective: Objective) => {
			labelData.push(this.calculateAbstractObjectiveWeight(objective, 0));
		})

		return labelData; 
	} 

	calculateAbstractObjectiveWeight(objective: Objective, depth: number): VCLabelData {
		var labelData: VCLabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: VCLabelData[] = [];
			var maxDepthOfChildren: number = 0;

			(<AbstractObjective> objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let lableDatum: VCLabelData = this.calculateAbstractObjectiveWeight(subObjective, depth + 1);
				weight += lableDatum.weight;
				if (lableDatum.depthOfChildren > maxDepthOfChildren)
					maxDepthOfChildren = lableDatum.depthOfChildren;
				children.push(lableDatum);
			});

			labelData = { 'objective': objective, 'weight': weight, 'subLabelData': children, 'depth': depth, 'depthOfChildren': maxDepthOfChildren + 1};
		} else if (objective.objectiveType === 'primitive') {
			labelData =  { 'objective': objective, 'weight': this.weightMap.getNormalizedObjectiveWeight(objective.getName()), 'depth': depth, 'depthOfChildren': 0};
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


	// Methods for manipulating and updating ValueChart data that has been formatted for d3

	// Calculate the weight offset for each row. The weight offset for one row is the combined weights of all rows
	// prior in the row ordering. This is needed to determine the y (or x if in vertical orientation) position for each row,
	// seeing as the weight of the previous rows depends on the their weights.
	calculateWeightOffsets(rows: VCRowData[]): VCRowData[] {
		var weightOffset: number = 0;

		for (var i = 0; i < rows.length; i++) {
			rows[i].weightOffset = weightOffset;
			weightOffset += this.weightMap.getNormalizedObjectiveWeight(rows[i].objective.getName());
		}

		return rows;
	}

	calculateStackedBarOffsets(rows: VCRowData[], viewOrientation: string): VCRowData[] {
		var stack = d3.layout.stack()
			.x((d: any, i: number) => { return i; })
			.y((d: any) => { return (d.score * this.weightMap.getNormalizedObjectiveWeight(d.objective.getName())); })
			.out((d: any, y0: number) => {
				d.offset = y0;
			});

		if (viewOrientation === 'vertical') {
			stack.order('reverse');
		}

		for (var i: number = 0; i < rows[0].cells.length; i++) {
			stack.values((d: any) => { return d.cells[i].userScores; })
			stack(<any>rows);
		}

		return rows;
	}

	calculateMinLabelWidth(labelData: VCLabelData[], dimensionOneSize: number): number {
		var maxDepthOfChildren = 0;
		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.depthOfChildren > maxDepthOfChildren)
				maxDepthOfChildren = labelDatum.depthOfChildren;
		});
		return dimensionOneSize / (maxDepthOfChildren + 2);
	}

	getDomainElements(objective: PrimitiveObjective): (string | number)[] {
		var domainElements: (string | number)[];

		if (objective.getDomainType() === 'categorical') {
			domainElements = (<CategoricalDomain> objective.getDomain()).getElements();
		} else if (objective.getDomainType() === 'interval') {
			domainElements = (<IntervalDomain> objective.getDomain()).getElements();
		} else {
			domainElements = this.getElementsFromContinuousDomain((<ContinuousDomain> objective.getDomain()))
		}

		return domainElements;
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

}

