/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 12:11:12
*/

import { Injectable } 										from '@angular/core';

// d3
import * as d3 												from 'd3';

// Application Classes:
import { AlternativeOrderRecord }							from '../model/Records';
import { CurrentUserService }								from './CurrentUser.service';

// Model Classes
import { ValueChart }										from '../model/ValueChart';
import { Objective }										from '../model/Objective';
import { PrimitiveObjective }								from '../model/PrimitiveObjective';
import { AbstractObjective }								from '../model/AbstractObjective';
import { User }												from '../model/User';	
import { Alternative }										from '../model/Alternative';
import { WeightMap }										from '../model/WeightMap';
import { CategoricalDomain }								from '../model/CategoricalDomain';
import { IntervalDomain }									from '../model/IntervalDomain';
import { ContinuousDomain }									from '../model/ContinuousDomain';
import { ScoreFunctionMap }									from '../model/ScoreFunctionMap';
import { ScoreFunction }									from '../model/ScoreFunction';

import {RowData, CellData, UserScoreData, LabelData}		from '../model/ChartDataTypes';
	
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

	// This is either: a - the current user's WeightMap if the ValueChart has one user; b - a WeightMap where each objective weight is the maximum weight assigned to the objective by a user.
	public maximumWeightMap: WeightMap;

	public alternatives: Alternative[];
	public numAlternatives: number;

	private rowData: RowData[];
	private labelData: LabelData[];

	private originalAlternativeOrder: AlternativeOrderRecord;

	constructor(private currentUserService: CurrentUserService) { }

	// Initialize Service fields based on the passed-in ValueChart.
	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;

		this.users = this.valueChart.getUsers();
		this.currentUser = this.getCurrentUser();
		this.numUsers = this.valueChart.getUsers().length;

		this.updateMaximumWeightMap();

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

	getCurrentUser(): User {
		// Obviously we should have it so that two usernames are never the same.
		var user: User = this.valueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.currentUserService.getUsername();
		})[0];

		if (!user)
			user = this.valueChart.getUsers()[0];

		return user;
	}
	
	updateMaximumWeightMap(): void {
		this.maximumWeightMap = this.valueChart.getMaximumWeightMap();
	}

	updateAllChartData(viewOrientation: string): void {
		this.updateMaximumWeightMap();
		this.updateWeightOffsets();
		this.updateStackedBarOffsets(viewOrientation);
		
		this.getLabelData().forEach((labelDatum: LabelData) => {
			this.updateLabelDataWeights(labelDatum);
		});
	}

	getLabelDatum(objective: Objective, depth: number): LabelData {
		var labelData: LabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: LabelData[] = [];
			var maxDepthOfChildren: number = 0;

			(<AbstractObjective> objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let labelDatum: LabelData = this.getLabelDatum(subObjective, depth + 1);
				weight += labelDatum.weight;
				if (labelDatum.depthOfChildren > maxDepthOfChildren)
					maxDepthOfChildren = labelDatum.depthOfChildren;
				children.push(labelDatum);
			});

			labelData = { 'objective': objective, 'weight': weight, 'subLabelData': children, 'depth': depth, 'depthOfChildren': maxDepthOfChildren + 1};
		} else if (objective.objectiveType === 'primitive') {
			labelData =  { 'objective': objective, 'weight': this.maximumWeightMap.getObjectiveWeight(objective.getId()), 'depth': depth, 'depthOfChildren': 0};
		}

		return labelData;
	}

	getLabelData(): LabelData[] {
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

	updateLabelDataWeights(labelDatum: LabelData): void {
		if (labelDatum.depthOfChildren !== 0) {
			labelDatum.weight = 0;
			labelDatum.subLabelData.forEach((subLabelDatum: LabelData) => {
				this.updateLabelDataWeights(subLabelDatum);
				labelDatum.weight += subLabelDatum.weight;
			});
		} else {
			labelDatum.weight = this.maximumWeightMap.getObjectiveWeight(labelDatum.objective.getId());
		}
	}

	updateLabelData(): void {
		// Use splice so as to avoid changing the array reference.
		this.valueChart.getRootObjectives().forEach((objective: Objective, index: number) => {
			this.labelData[index] = this.getLabelDatum(objective, 0);
		});
	}

	getCellData(objective: PrimitiveObjective): CellData[] {
		var users: User[];
		users = this.valueChart.getUsers();

		var objectiveValues: any[] = this.valueChart.getAlternativeValuesforObjective(objective);

		objectiveValues.forEach((objectiveValue: any) => {
			objectiveValue.userScores = [];
			for (var i: number = 0; i < users.length; i++) {

				var userScore: UserScoreData = {
					objective: objective,
					user: users[i],
					value: objectiveValue.value
				}

				objectiveValue.userScores.push(userScore);
			}
		});	

		return objectiveValues;
	}

	getRowData(): RowData[] {
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
			weightOffset += this.maximumWeightMap.getObjectiveWeight(this.rowData[i].objective.getId());
		}
	}

	updateStackedBarOffsets(viewOrientation: string) {

		var rowDataCopy: RowData[] = this.rowData.slice(0, this.rowData.length);

		// In the vertical orientation rows are rendered going to down; rows with smaller indices are rendered above those with larger indices. 
		// This means that rows with smaller indices must be stacked above rows with larger indices in the stacked bar chart. So in the vertical
		// orientation we must reverse the order in which we calculate offsets. Otherwise, the earlier rows will have smaller offsets and the
		// stacked bar chart will be rendered in reverse. This is not a problem in the horizontal orientation since rows are rendered left to right
		// in that configuration, meaning that the default row order can be used to calculate offsets.
		if (viewOrientation === 'vertical') {
			rowDataCopy.reverse();
		}

		for (var i = 0; i < rowDataCopy.length; i++) {
			var currentRow: RowData = rowDataCopy[i];

			for (var j = 0; j < currentRow.cells.length; j++) {
				var currentCell: CellData = currentRow.cells[j];

				for (var k = 0; k < currentCell.userScores.length; k++) {
					var currentUserScore: UserScoreData = currentCell.userScores[k];
					var previousWeightedScore: number;
					var previousOffset: number;
					if (i === 0) {
						previousOffset = 0;
						previousWeightedScore = 0;
					} else {
						let previousUserScore = rowDataCopy[i-1].cells[j].userScores[k];
						let scoreFunction: ScoreFunction = previousUserScore.user.getScoreFunctionMap().getObjectiveScoreFunction(previousUserScore.objective.getId());
						previousWeightedScore = scoreFunction.getScore(previousUserScore.value) * previousUserScore.user.getWeightMap().getObjectiveWeight(previousUserScore.objective.getId());
						previousOffset = previousUserScore.offset;
					}

					currentUserScore.offset = previousOffset + previousWeightedScore;
				}
			}
		}
	}

	reorderRows(primitiveObjectives: PrimitiveObjective[]): void {
		var desiredIndices: any = {};

		this.rowData.sort((a: RowData, b: RowData) => {
			let aIndex = desiredIndices[a.objective.getId()] || primitiveObjectives.indexOf(a.objective);
			let bIndex = desiredIndices[b.objective.getId()] || primitiveObjectives.indexOf(b.objective);

			desiredIndices[a.objective.getId()] = aIndex;
			desiredIndices[b.objective.getId()] = bIndex;

			if (aIndex < bIndex)
				return -1;
			else
				return 1;
		});
	}

	reorderAllCells(cellIndices: number[]): void {
		this.rowData.forEach((row: RowData, index: number) => {
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

	generateCellOrderByObjectiveScore(rowsToReorder: RowData[], objectivesToReorderBy: PrimitiveObjective[]): number[] {
		// Generate an array of indexes according to the number of cells in each row.
		var cellIndices: number[] = d3.range(rowsToReorder[0].cells.length);
		var alternativeScores: number[] = Array(rowsToReorder[0].cells.length).fill(0);

		for (var i = 0; i < rowsToReorder.length; i++) {
			if (objectivesToReorderBy.indexOf(rowsToReorder[i].objective) !== -1) {
				var scoreFunction = this.currentUser.getScoreFunctionMap().getObjectiveScoreFunction(rowsToReorder[i].objective.getId());
				var weight: number = this.maximumWeightMap.getObjectiveWeight(rowsToReorder[i].objective.getId());
				rowsToReorder[i].cells.forEach((cell: CellData, index: number) => {
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

	calculateMinLabelWidth(labelData: LabelData[], dimensionOneSize: number, displayScoreFunctions: boolean): number {
		var maxDepthOfChildren = 0;
		labelData.forEach((labelDatum: LabelData) => {
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
			domainElements = this.currentUser.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId()).getAllElements();
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

	incrementAbstractObjectiveWeight(labelDatum: LabelData, weightMap: WeightMap, weightIncrement: number, maxWeight: number): void {

		var children: LabelData[] = labelDatum.subLabelData;
		var childrenWeightTotal: number = 0;
		var nonZeroChildren: number = 0;

		children.forEach((child:LabelData) => {
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

		children.forEach((child: LabelData) => {
			let childMax: number = maxWeight;
			if (childrenWeightTotal !== 0 && child.weight !== 0) {
				childMax = maxWeight * (child.weight / childrenWeightTotal);
			}

			if (child.subLabelData === undefined) {
				var newWeight = Math.max(Math.min(child.weight + weightIncrement, childMax), 0);
				weightMap.setObjectiveWeight(child.objective.getId(), newWeight);
			} else {
				this.incrementAbstractObjectiveWeight(child, weightMap, weightIncrement, childMax);
			}
		});
	}

}

