/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-25 14:43:13
*/

import { Injectable } 										from '@angular/core';

// d3
import * as d3 												from 'd3';

// Application Classes:
import { ValueChartService }								from './ValueChart.service';
import { ChartUndoRedoService }								from './ChartUndoRedo.service';

// Model Classes
import { ValueChart }										from '../model/ValueChart';
import { Objective }										from '../model/Objective';
import { PrimitiveObjective }								from '../model/PrimitiveObjective';
import { AbstractObjective }								from '../model/AbstractObjective';
import { User }												from '../model/User';	
import { Alternative }										from '../model/Alternative';
import { WeightMap }										from '../model/WeightMap';
import { ScoreFunctionMap }									from '../model/ScoreFunctionMap';
import { ScoreFunction }									from '../model/ScoreFunction';

import { RowData, CellData, UserScoreData, LabelData}		from '../types/ValueChartViewer.types.ts';

// Types:
import { ObjectivesRecord }									from '../types/Record.types';
import { AlternativeOrderRecord }							from '../types/Record.types';

	
// This class contains methods for converting a ValueChartDirective's ValueChart into a format suitable for d3, 
// and for updating this data in response to user actions.

@Injectable()
export class ValueChartViewerService {

	private originalAlternativeOrder: AlternativeOrderRecord;
	private rowData: RowData[];
	private labelData: LabelData[];

	constructor(
		private valueChartService: ValueChartService,
		private chartUndoRedoService: ChartUndoRedoService) {
			
			this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.ALTERNATIVE_ORDER_CHANGE, this.changeAlternativesOrder);
			this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.OBJECTIVES_CHANGE, this.changeRowOrder);	
		}



	initialize() {
		this.originalAlternativeOrder = new AlternativeOrderRecord(this.valueChartService.alternatives);
		this.generateLabelData();
		this.generateRowData();
	}

	updateAllValueChartData(viewOrientation: string): void {
		this.valueChartService.updateMaximumWeightMap();
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
			labelData =  { 'objective': objective, 'weight': this.valueChartService.maximumWeightMap.getObjectiveWeight(objective.getId()), 'depth': depth, 'depthOfChildren': 0};
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

		this.valueChartService.getValueChart().getRootObjectives().forEach((objective: Objective) => {
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
			labelDatum.weight = this.valueChartService.maximumWeightMap.getObjectiveWeight(labelDatum.objective.getId());
		}
	}

	updateLabelData(): void {
		// Use splice so as to avoid changing the array reference.
		this.valueChartService.getValueChart().getRootObjectives().forEach((objective: Objective, index: number) => {
			this.labelData[index] = this.getLabelDatum(objective, 0);
		});
	}

	getCellData(objective: PrimitiveObjective): CellData[] {
		var users: User[];
		users = this.valueChartService.getValueChart().getUsers();

		var objectiveValues: any[] = this.valueChartService.getValueChart().getAlternativeValuesforObjective(objective);

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

		this.valueChartService.getValueChart().getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
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
			weightOffset += this.valueChartService.maximumWeightMap.getObjectiveWeight(this.rowData[i].objective.getId());
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

		this.valueChartService.alternatives = d3.permute(this.valueChartService.alternatives, cellIndices);
	}

	resetCellOrder(): void {
		var cellIndices: number[] = [];

		this.valueChartService.alternatives.forEach((alternative: Alternative, index: number) => {
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
				var scoreFunction = this.valueChartService.currentUser.getScoreFunctionMap().getObjectiveScoreFunction(rowsToReorder[i].objective.getId());
				var weight: number = this.valueChartService.maximumWeightMap.getObjectiveWeight(rowsToReorder[i].objective.getId());
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
		var cellIndices: number[] = d3.range(this.valueChartService.numAlternatives);

		cellIndices.sort((a: number, b: number) => {

			var aName: string = this.valueChartService.alternatives[a].getName().toLowerCase();
			var bName: string = this.valueChartService.alternatives[b].getName().toLowerCase();

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

	incrementObjectivesWeights(labelData: LabelData[], weightMap: WeightMap, weightIncrement: number, maxWeight: number): void {

		var weightTotal: number = 0;
		var nonZeroWeights: number = 0;

		labelData.forEach((child:LabelData) => {
			if (child.weight !== 0) {
				weightTotal += child.weight;
				nonZeroWeights++;
			}
		});

		if (nonZeroWeights && weightIncrement < 0) {
			weightIncrement = weightIncrement / nonZeroWeights;
		} else {
			weightIncrement = weightIncrement / labelData.length;
		}

		labelData.forEach((labelDatum: LabelData) => {
			let labelDatumMax: number = maxWeight;
			if (weightTotal !== 0 && labelDatum.weight !== 0) {
				labelDatumMax = maxWeight * (labelDatum.weight / weightTotal);
			}

			if (labelDatum.subLabelData === undefined) {
				var newWeight = Math.max(Math.min(labelDatum.weight + weightIncrement, labelDatumMax), 0);
				weightMap.setObjectiveWeight(labelDatum.objective.getId(), newWeight);
			} else {
				this.incrementObjectivesWeights(labelDatum.subLabelData, weightMap, weightIncrement, labelDatumMax);
			}
		});
	}

	changeAlternativesOrder = (cellIndices: number[]) => {
		this.reorderAllCells(cellIndices);
	}

	changeRowOrder = (objectivesRecord: ObjectivesRecord) => {
		this.valueChartService.getValueChart().setRootObjectives(objectivesRecord.rootObjectives);
		this.updateLabelData();
		this.valueChartService.primitiveObjectives = this.valueChartService.getValueChart().getAllPrimitiveObjectives();
		this.generateRowData();
	}



}

