/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-04 22:35:46
*/

import { Injectable } 							from '@angular/core';

// d3
import * as d3 									from 'd3';

// Application Classes:
import { AlternativeOrderRecord }				from '../model/Records';
import { CurrentUserService }					from './CurrentUser.service';

// Model Classes
import { ValueChart }							from '../model/ValueChart';
import { Objective }							from '../model/Objective';
import { PrimitiveObjective }					from '../model/PrimitiveObjective';
import { AbstractObjective }					from '../model/AbstractObjective';
import { User }									from '../model/User';	
import { Alternative }							from '../model/Alternative';
import { WeightMap }							from '../model/WeightMap';
import { CategoricalDomain }					from '../model/CategoricalDomain';
import { IntervalDomain }						from '../model/IntervalDomain';
import { ContinuousDomain }						from '../model/ContinuousDomain';
import { ScoreFunctionMap }						from '../model/ScoreFunctionMap';
import { ScoreFunction }						from '../model/ScoreFunction';

import {VCRowData, VCCellData, VCLabelData}		from '../model/ChartDataTypes';
	
// This class serves two purposes:
// 		1. It stores the state of a ValueChartDirective's ValueChart, and exposes this state to the renderer classes. Renderer classes are allowed to modify 
//			this state as a way of initiating change detection in ValueChartDirective, thus trigging re-rendering. 
//		2. It contains methods for converting a ValueChartDirective's ValueChart into a format suitable for d3, and for updating this data in response to user actions.

@Injectable()
export class ChartDataService {

	private valueChart: ValueChart;
	public primitiveObjectives: PrimitiveObjective[];

	public users: User[];
	public currentUser: User;
	public numUsers: number;

	public weightMap: WeightMap;
	public scoreFunctionMap: ScoreFunctionMap;

	public alternatives: Alternative[];
	public numAlternatives: number;

	private rowData: VCRowData[];
	private labelData: VCLabelData[];

	private originalAlternativeOrder: AlternativeOrderRecord;

	constructor(private currentUserService: CurrentUserService) { }

	// Initialize Service fields based on the passed-in ValueChart.
	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;

		this.users = this.valueChart.getUsers();
		this.currentUser = this.currentUserService.user;
		this.numUsers = this.valueChart.getUsers().length;

		this.weightMap = this.currentUser.getWeightMap();
		this.scoreFunctionMap = this.currentUser.getScoreFunctionMap();

		this.numAlternatives = this.valueChart.getAlternatives().length;
		this.alternatives = this.valueChart.getAlternatives();
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();

		this.originalAlternativeOrder = new AlternativeOrderRecord(this.alternatives);

		this.generateLabelData();
		this.generateRowData();
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	getLabelDatum(objective: Objective, depth: number): VCLabelData {
		var labelData: VCLabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: VCLabelData[] = [];
			var maxDepthOfChildren: number = 0;

			(<AbstractObjective> objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let labelDatum: VCLabelData = this.getLabelDatum(subObjective, depth + 1);
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

	getLabelData(): VCLabelData[] {
		if (this.labelData) {
			return this.labelData;
		}
		this.generateLabelData();
		return this.labelData; 
	}

	generateLabelData(): void {
		this.labelData = [];

		this.valueChart.getRootObjectives().forEach((objective: Objective) => {
			this.labelData.push(this.getLabelDatum(objective, 0));
		});
	}

	updateLabelDataWeights(labelDatum: VCLabelData): void {
		if (labelDatum.depthOfChildren !== 0) {
			labelDatum.weight = 0;
			labelDatum.subLabelData.forEach((subLabelDatum: VCLabelData) => {
				this.updateLabelDataWeights(subLabelDatum);
				labelDatum.weight += subLabelDatum.weight;
			});
		} else {
			labelDatum.weight = this.weightMap.getObjectiveWeight(labelDatum.objective.getName());
		}
	}

	updateLabelData(): void {
		// Use splice so as to avoid changing the array reference.
		this.valueChart.getRootObjectives().forEach((objective: Objective, index: number) => {
			this.labelData[index] = this.getLabelDatum(objective, 0);
		});
	}

	getCellData(objective: PrimitiveObjective): VCCellData[] {
		var users: User[];
		users = this.valueChart.getUsers();

		var objectiveValues: any[] = this.valueChart.getAlternativeValuesforObjective(objective);

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

	getRowData(): VCRowData[] {
		if (this.rowData) {
			return this.rowData;
		}

		this.generateRowData();
		return this.rowData;
	}

	generateRowData(): void {
		this.rowData = [];

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.rowData.push({
				objective: objective,
				weightOffset: 0,
				cells: this.getCellData(objective)
			});
		});
	}

	updateWeightOffsets(): void {
		var weightOffset: number = 0;

		for (var i = 0; i < this.rowData.length; i++) {
			this.rowData[i].weightOffset = weightOffset;
			weightOffset += this.weightMap.getObjectiveWeight(this.rowData[i].objective.getName());
		}
	}

	updateStackedBarOffsets(viewOrientation: string) {

		var rowDataCopy: VCRowData[] = this.rowData.slice(0, this.rowData.length);

		// In the vertical orientation rows are rendered going to down; rows with smaller indices are rendered above those with larger indices. 
		// This means that rows with smaller indices must be stacked above rows with larger indices in the stacked bar chart. So in the vertical
		// orientation we must reverse the order in which we calculate offsets. Otherwise, the earlier rows will have smaller offsets and the
		// stacked bar chart will be rendered in reverse. This is not a problem in the horizontal orientation since rows are rendered left to right
		// in that configuration, meaning that the default row order can be used to calculate offsets.
		if (viewOrientation === 'vertical') {
			rowDataCopy.reverse();
		}

		for (var i = 0; i < rowDataCopy.length; i++) {
			var currentRow: VCRowData = rowDataCopy[i];

			for (var j = 0; j < currentRow.cells.length; j++) {
				var currentCell: VCCellData = currentRow.cells[j];

				for (var k = 0; k < currentCell.userScores.length; k++) {
					var currentUserScore = currentCell.userScores[k];
					var previousWeightedScore: number;
					var previousOffset: number;
					if (i === 0) {
						previousOffset = 0;
						previousWeightedScore = 0;
					} else {
						let previousUserScore = rowDataCopy[i-1].cells[j].userScores[k];
						let scoreFunction: ScoreFunction = previousUserScore.user.getScoreFunctionMap().getObjectiveScoreFunction(previousUserScore.objective.getName());
						previousWeightedScore = scoreFunction.getScore(previousUserScore.value) * this.weightMap.getObjectiveWeight(previousUserScore.objective.getName());
						previousOffset = previousUserScore.offset;
					}

					currentUserScore.offset = previousOffset + previousWeightedScore;
				}
			}
		}
	}

	reorderRows(primitiveObjectives: PrimitiveObjective[]): void {
		var desiredIndices: any = {};

		this.rowData.sort((a: VCRowData, b: VCRowData) => {
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

	reorderAllCells(cellIndices: number[]): void {
		this.rowData.forEach((row: VCRowData, index: number) => {
			row.cells = d3.permute(row.cells, cellIndices);
		});

		this.alternatives = d3.permute(this.alternatives, cellIndices);
	}

	resetCellOrder(): void {
		var cellIndices: number[] = [];

		this.alternatives.forEach((alternative: Alternative, index: number) => {
			cellIndices[this.originalAlternativeOrder.alternativeIndexMap[alternative.getName()]] = index;
		});

		this.reorderAllCells(cellIndices);
	}


	// Methods for manipulating and updating ValueChart data that has been formatted for d3: 

	// Calculate the weight offset for each row. The weight offset for one row is the combined weights of all rows
	// prior in the row ordering. This is needed to determine the y (or x if in vertical orientation) position for each row,
	// seeing as the weight of the previous rows depends on the their weights.

	generateCellOrderByObjectiveScore(rowsToReorder: VCRowData[], objectivesToReorderBy: PrimitiveObjective[]): number[] {
		// Generate an array of indexes according to the number of cells in each row.
		var cellIndices: number[] = d3.range(rowsToReorder[0].cells.length);
		var alternativeScores: number[] = Array(rowsToReorder[0].cells.length).fill(0);

		for (var i = 0; i < rowsToReorder.length; i++) {
			if (objectivesToReorderBy.indexOf(rowsToReorder[i].objective) !== -1) {
				var scoreFunction = this.scoreFunctionMap.getObjectiveScoreFunction(rowsToReorder[i].objective.getName());
				var weight: number = this.weightMap.getObjectiveWeight(rowsToReorder[i].objective.getName());
				rowsToReorder[i].cells.forEach((cell: VCCellData, index: number) => {
					alternativeScores[index] += (scoreFunction.getScore(cell.value) * weight);
				});
			}
		}
		
		cellIndices.sort((a: number, b: number) => {
			var aScore: number = alternativeScores[a];		// This is the sum of a's score for each of the objectivesToReorderBy. 
			var bScore: number = alternativeScores[b];		// This is the sum of b's score for each of the objectivesToReorderBy.

			if (aScore === bScore) {
				return 0;						// Do not change the ordering of a and b.
			} else if (aScore > bScore) {		// If a has a higher score it should come before b in the ordering.
				return -1;						// a should come before b in the ordering
			} else {
				return 1;						// b should come before a in the ordering.
			}
		});
		
		return cellIndices;
	}

	generateCellOrderAlphabetically(): number[] {
		// Generate an array of indexes according to the number of cells in each row.
		var cellIndices: number[] = d3.range(this.numAlternatives);

		cellIndices.sort((a: number, b: number) => {

			var aName: string = this.alternatives[a].getName().toLowerCase();
			var bName: string = this.alternatives[b].getName().toLowerCase();

			if (aName === bName) {
				return 0;						// Do not change the ordering of a and b.
			} else if (aName < bName) {			// The earlier the letter in the alphabet, the smaller its character code.
				return -1;						// a should come before b in the ordering
			} else {
				return 1;						// b should come before a in the ordering.
			}
		});

		return cellIndices; 
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
			domainElements = this.scoreFunctionMap.getObjectiveScoreFunction(objective.getName()).getAllElements();
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

}

