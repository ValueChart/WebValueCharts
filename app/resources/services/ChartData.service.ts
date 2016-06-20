/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-20 14:49:44
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
		objective: Objective,
		value: (string | number);
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

// This class serves two purposes:
// 		1. It stores the state of a ValueChartDirective's ValueChart, and exposes this state to the renderer classes. Renderer classes are allowed to modify 
//			this state as a way of initiating change detection in ValueChartDirective, thus trigging re-rendering. 
//		2. It contains methods for converting a ValueChartDirective's ValueChart into a format suitable for d3, and for updating this data in response to user actions.

@Injectable()
export class ChartDataService {

	private valueChart: ValueChart;
	public weightMap: WeightMap;
	public scoreFunctionMap: ScoreFunctionMap;
	public primitiveObjectives: PrimitiveObjective[];
	public numUsers: number;
	public alternatives: Alternative[];
	public numAlternatives: number;
	public rows: VCRowData[];
	public labelData: VCLabelData[];


	constructor() { }

	// Initialize Service fields based on the passed in ValueChart.
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
		this.alternatives = this.valueChart.getAlternatives();
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
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
				let labelDatum: VCLabelData = this.calculateAbstractObjectiveWeight(subObjective, depth + 1);
				weight += labelDatum.weight;
				if (labelDatum.depthOfChildren > maxDepthOfChildren)
					maxDepthOfChildren = labelDatum.depthOfChildren;
				children.push(labelDatum);
			});

			labelData = { 'objective': objective, 'weight': weight, 'subLabelData': children, 'depth': depth, 'depthOfChildren': maxDepthOfChildren + 1};
		} else if (objective.objectiveType === 'primitive') {
			labelData =  { 'objective': objective, 'weight': this.weightMap.getObjectiveWeight(objective.getName()), 'depth': depth, 'depthOfChildren': 0};
		}

		return labelData;
	}

	updateLabelData(labelDatum: VCLabelData): void {
		if (labelDatum.depthOfChildren !== 0) {
			labelDatum.weight = 0;
			labelDatum.subLabelData.forEach((subLabelDatum: VCLabelData) => {
				this.updateLabelData(subLabelDatum);
				labelDatum.weight += subLabelDatum.weight;
			});
		} else {
			labelDatum.weight = this.weightMap.getObjectiveWeight(labelDatum.objective.getName());
		}
	}

	getCellData(valueChart: ValueChart, objective: PrimitiveObjective): VCCellData[] {
		var users: User[];

		if (valueChart.type === 'group') {
			users = (<GroupValueChart>valueChart).getUsers();
		} else {
			users = [(<IndividualValueChart>valueChart).getUser()];
		}

		var objectiveValues: any[] = valueChart.getAlternativeValuesforObjective(objective);

		objectiveValues.forEach((objectiveValue: any) => {
			objectiveValue.userScores = [];
			for (var i: number = 0; i < users.length; i++) {

				var userScore: { user: User; value: string | number; objective: Objective; } = {
					objective: objective,
					user: users[i],
					value: objectiveValue.value
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
				cells: this.getCellData(valueChart, objective)
			});
		});
		return rowData;
	}


	// Methods for manipulating and updating ValueChart data that has been formatted for d3: 

	// Calculate the weight offset for each row. The weight offset for one row is the combined weights of all rows
	// prior in the row ordering. This is needed to determine the y (or x if in vertical orientation) position for each row,
	// seeing as the weight of the previous rows depends on the their weights.
	calculateWeightOffsets(rows: VCRowData[]): VCRowData[] {
		var weightOffset: number = 0;

		for (var i = 0; i < rows.length; i++) {
			rows[i].weightOffset = weightOffset;
			weightOffset += this.weightMap.getObjectiveWeight(rows[i].objective.getName());
		}

		return rows;
	}

	calculateStackedBarOffsets(rows: VCRowData[], viewOrientation: string): VCRowData[] {
		var stack = d3.layout.stack()
			.x((d: any, i: number) => { return i; })
			.y((d: any) => { 
				var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
				return (score * this.weightMap.getObjectiveWeight(d.objective.getName())); })
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

	calculateMinLabelWidth(labelData: VCLabelData[], dimensionOneSize: number, displayScoreFunctions: boolean): number {
		var maxDepthOfChildren = 0;
		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.depthOfChildren > maxDepthOfChildren)
				maxDepthOfChildren = labelDatum.depthOfChildren;
		});

		maxDepthOfChildren += ((displayScoreFunctions) ? 2 : 1);

		return dimensionOneSize / maxDepthOfChildren;
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

	incrementAbstractObjectiveWeight(labelDatum: VCLabelData, weightMap: WeightMap, weightIncrement: number, maxWeight: number): void {

		var children: VCLabelData[] = labelDatum.subLabelData;
		var childrenWeightTotal: number = 0;
		var nonZeroChildren: number = 0;

		children.forEach((child:VCLabelData) => {
			if (child.weight !== 0) {
				childrenWeightTotal += child.weight;
				nonZeroChildren++;
			}
		});

		if (nonZeroChildren && weightIncrement < 0) {
			weightIncrement = weightIncrement / nonZeroChildren;
		} else {
			weightIncrement = weightIncrement / children.length;
		}

		children.forEach((child: VCLabelData) => {
			let childMax: number = maxWeight;
			if (childrenWeightTotal !== 0 && child.weight !== 0) {
				childMax = maxWeight * (child.weight / childrenWeightTotal);
			}

			if (child.subLabelData === undefined) {
				var newWeight = Math.max(Math.min(child.weight + weightIncrement, childMax), 0);
				weightMap.setObjectiveWeight(child.objective.getName(), newWeight);
			} else {
				this.incrementAbstractObjectiveWeight(child, weightMap, weightIncrement, childMax);
			}
		});
	}

	reorderRows(primitiveObjectives: PrimitiveObjective[]): void {
		var desiredIndices: any = {};

		this.rows.sort((a: VCRowData, b: VCRowData) => {
			let aIndex = desiredIndices[a.objective.getName()] || primitiveObjectives.indexOf(a.objective);
			let bIndex = desiredIndices[b.objective.getName()] || primitiveObjectives.indexOf(b.objective);

			desiredIndices[a.objective.getName()] = aIndex;
			desiredIndices[b.objective.getName()] = bIndex;

			if (aIndex < bIndex)
				return -1;
			else
				return 1;
		});
	}

	reorderCellsByScore(objectiveToReorderBy: PrimitiveObjective): void {
		var reorderedRow: VCRowData;
		var reorderedRowIndex: number;
		var cellIndices: any = {};

		for (var i = 0; i < this.rows.length; i++) {
			if (this.rows[i].objective.getName() === objectiveToReorderBy.getName()) {
				this.rows[i].cells.sort((a: VCCellData, b: VCCellData) => {
					var scoreFunction = this.scoreFunctionMap.getObjectiveScoreFunction(objectiveToReorderBy.getName());

					if (scoreFunction.getScore(a.value) === scoreFunction.getScore(b.value)) {
						return (a.alternative.getName() > b.alternative.getName()) ? -1 : 1;
					} else if (scoreFunction.getScore(a.value) > scoreFunction.getScore(b.value)) {
						return -1;
					} else {
						return 1;
					}
				});
				reorderedRowIndex = i;
				reorderedRow = this.rows[i];
				break;	
			}
		}

		reorderedRow.cells.forEach((cell: VCCellData, index: number) => {
			cellIndices[cell.alternative.getName()] = index;
		});

		var sortCells = (a: VCCellData, b: VCCellData) => {
			if (cellIndices[a.alternative.getName()] < cellIndices[b.alternative.getName()]) {
				return -1;
			} else {
				return 1;
			}
		}

		this.rows.forEach((row: VCRowData, index: number) => {
			if (index === reorderedRowIndex)
				return;
			row.cells.sort(sortCells);
		});

		this.alternatives.sort((a: Alternative, b: Alternative) => {
			if (cellIndices[a.getName()] < cellIndices[b.getName()]) {
				return -1;
			} else {
				return 1;
			}
		})

	}

}

