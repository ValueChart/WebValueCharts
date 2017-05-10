/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-09 16:18:32
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Libraries:
import * as d3 												from 'd3';
import * as _												from 'lodash';

// Import Application Classes:
import { ValueChartService }								from './ValueChart.service';
import { ChartUndoRedoService }								from './ChartUndoRedo.service';

// Import Model Classes:
import { ValueChart }										from '../../../model/ValueChart';
import { Objective }										from '../../../model/Objective';
import { PrimitiveObjective }								from '../../../model/PrimitiveObjective';
import { AbstractObjective }								from '../../../model/AbstractObjective';
import { User }												from '../../../model/User';
import { Alternative }										from '../../../model/Alternative';
import { WeightMap }										from '../../../model/WeightMap';
import { ScoreFunctionMap }									from '../../../model/ScoreFunctionMap';
import { ScoreFunction }									from '../../../model/ScoreFunction';

// Import Type Definitions:
import { RowData, CellData, UserScoreData, LabelData }		from '../../../types/RendererData.types';
import { RendererUpdate }									from '../../../types/RendererData.types';
import { ObjectivesRecord }									from '../../../types/Record.types';
import { AlternativeOrderRecord }							from '../../../types/Record.types';


/*
	This class contains and exposes ValueChart data formatted to work with the ValueChartDirective's 
	renderer classes. It contains methods for converting the active ValueChart into a format suitable for d3, 
	and for updating this data in response to user actions. Special care must be taken when using this class to insure
	that the formatted information in rowData and labelData fields is kept consistent with the active ValueChart stored
	in ValueChartService. Unexpected and undefined behavior can happen if rowData or labelData ceases to share the
	same User, ScoreFunction, or WeightMap references as the ValueChartService's active ValueChart object. 

	The data in this class should NOT be exposed to any classes outside of the ValueChartDirective's "environment" of
	services, renderers, and interactions. It is specifically intended expose the ValueChartDirective's active ValueChart to
	these classes to ease creation and rendering of a ValueChart visualization.
*/

@Injectable()
export class RendererDataService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private rowData: RowData[];				// Data from the active ValueChart formatted to work with the ObjectiveChartRenderer and the SummaryChartRenderer classes.
	private labelData: LabelData[];			// Data from the active ValueChart formatted to work with the LabelRenderer classes.

	private originalAlternativeOrder: AlternativeOrderRecord;	// A record of the original alternative order. This is used by the SortAlternativesInteraction
																// class to reset the alternative order.

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
		private valueChartService: ValueChartService,
		private chartUndoRedoService: ChartUndoRedoService) {

		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.ALTERNATIVE_ORDER_CHANGE, this.changeAlternativesOrder);
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.OBJECTIVES_CHANGE, this.changeRowOrder);
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================



		// TODO <@aaron>: update this output type of this method.

	produceRowData = (u: RendererUpdate) => {
		if (!this.rowData || u.valueChart.getUsers().length != this.rowData.length) {
			this.generateRowData();
		}

		this.updateWeightOffsets();
		this.updateStackedBarOffsets(u.viewConfig.viewOrientation);		// TODO <@aaron>: Remove hard-coded "vertical" orientation.

		u.rowData = this.rowData;
		return u;
	}

	produceLabelData = (u: RendererUpdate) => {
		if (!this.labelData) {
			this.generateLabelData();
		}

		this.getLabelData().forEach((labelDatum: LabelData) => {
			this.updateLabelDataWeights(labelDatum);
		});

		u.labelData = this.labelData;
		return u;
	}

	// ================================  Getters ====================================
	
	/*
		@returns {RowData[]} - The RowData stored by this class for use with the ObjectiveChartRenderer and SummaryChartRenderer classes.
		@description	Gets the RowData for the active ValueChart. This method ONLY creates the row data for the active ValueChart if
						it has not yet been done. This should NEVER be the case as the initialize() method should ALWAYS be called before
						renderer data is retrieved.
	*/
	public getRowData(): RowData[] {
		if (this.rowData) {
			return this.rowData;
		}

		this.generateRowData();
		return this.rowData;
	}

	/*
		@returns {LabelData[]} - The LabelData stored by this class for use with the LabelRenderer.
		@description	Gets the LabelData for the active ValueChart. This method ONLY creates the label data for the active ValueChart if
						it has not yet been done. This should NEVER be the case as the initialize() method should ALWAYS be called before
						renderer data is retrieved.
	*/
	public getLabelData(): LabelData[] {
		if (this.labelData) {
			return this.labelData;
		}

		this.generateLabelData();
		return this.labelData;
	}



	// ================================ Data Creation and Update Methods  ====================================

	/*
		@returns {void} 
		@description	Generates the LabelData from the active ValueChart in the ValueChartService and assigns it to the rowData field. This method can be used
						to either generate the LabelData for the first time or to handle structural change to the ValueChart (adding/deleting objectives, alternatives, users)
						by regenerating the data.
	*/
	public generateLabelData(): void {
		this.labelData = [];

		this.valueChartService.getRootObjectives().forEach((objective: Objective) => {
			this.labelData.push(this.getLabelDatum(objective, 0));
		});
	}

	/*
		@returns {void} 
		@description	Generates the RowData from the active ValueChart in the ValueChartService and assigns it to the labelData field. This method can be used
						to either generate the RowData for the first time or to handle structural change to the ValueChart (adding/deleting objectives, alternatives, users)
						by regenerating the data.
	*/
	public generateRowData(): void {
		this.rowData = [];

		this.valueChartService.getPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.rowData.push({
				objective: objective,
				weightOffset: 0,
				cells: this.getCellData(objective)
			});
		});
	}

	/*
		@returns {void} 
		@description	Updates the weight offsets assigned to each row in the rowData field. These offsets are required to position
						the rows in the correct order in the objective chart as each rows position is dependent on weight assigned 
						row above it. Recall that these weights are converted into heights by the ObjectiveChartRenderer.
						This method should usually be called via the updateAllValueChartData instead of being used directly.
	*/
	public updateWeightOffsets(): void {
		var weightOffset: number = 0;

		for (var i = 0; i < this.rowData.length; i++) {
			this.rowData[i].weightOffset = weightOffset;
			weightOffset += this.valueChartService.getValueChart().getMaximumWeightMap().getObjectiveWeight(this.rowData[i].objective.getName());
		}
	}

	/*
		@param viewOrientation - The view orientation that the ValueChart is going to be displayed in.
		@returns {void} 
		@description	Updates the weight score offset assigned to each cell in each row of the rowData field. These offsets are required to position
						the cells each column of the summary chart so that they appear to be stacked upon each other. This method should usually be called
						via the updateAllValueChartData instead of being used directly.
	*/
	public updateStackedBarOffsets(viewOrientation: string) {

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
						let previousUserScore = rowDataCopy[i - 1].cells[j].userScores[k];
						let scoreFunction: ScoreFunction = previousUserScore.user.getScoreFunctionMap().getObjectiveScoreFunction(previousUserScore.objective.getName());
						previousWeightedScore = scoreFunction.getScore(previousUserScore.value) * previousUserScore.user.getWeightMap().getObjectiveWeight(previousUserScore.objective.getName());
						previousOffset = previousUserScore.offset;
					}

					currentUserScore.offset = previousOffset + previousWeightedScore;
				}
			}
		}
	}

	// ================================ Private Helpers Creating/Updating Data ====================================

	private getLabelDatum(objective: Objective, depth: number): LabelData {
		var labelData: LabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: LabelData[] = [];
			var maxDepthOfChildren: number = 0;

			(<AbstractObjective>objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let labelDatum: LabelData = this.getLabelDatum(subObjective, depth + 1);
				weight += labelDatum.weight;
				if (labelDatum.depthOfChildren > maxDepthOfChildren)
					maxDepthOfChildren = labelDatum.depthOfChildren;
				children.push(labelDatum);
			});

			labelData = { 'objective': objective, 'weight': weight, 'subLabelData': children, 'depth': depth, 'depthOfChildren': maxDepthOfChildren + 1 };
		} else if (objective.objectiveType === 'primitive') {
			labelData = { 'objective': objective, 'weight': this.valueChartService.getValueChart().getMaximumWeightMap().getObjectiveWeight(objective.getName()), 'depth': depth, 'depthOfChildren': 0 };
		}

		return labelData;
	}

	private updateLabelDataWeights(labelDatum: LabelData): void {
		if (labelDatum.depthOfChildren !== 0) {
			labelDatum.weight = 0;
			labelDatum.subLabelData.forEach((subLabelDatum: LabelData) => {
				this.updateLabelDataWeights(subLabelDatum);
				labelDatum.weight += subLabelDatum.weight;
			});
		} else {
			labelDatum.weight = this.valueChartService.getValueChart().getMaximumWeightMap().getObjectiveWeight(labelDatum.objective.getName());
		}
	}

	private updateLabelData(): void {
		// Use splice so as to avoid changing the array reference.
		this.valueChartService.getRootObjectives().forEach((objective: Objective, index: number) => {
			this.labelData[index] = this.getLabelDatum(objective, 0);
		});
	}

	private getCellData(objective: PrimitiveObjective): CellData[] {
		var users: User[];
		users = this.valueChartService.getUsers();

		var objectiveValues: any[] = this.valueChartService.getAlternativeValuesforObjective(objective);

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

	// ================================ Public Methods for Reordering Rows and Columns ====================================

	public reorderRows(primitiveObjectives: PrimitiveObjective[]): void {
		var desiredIndices: any = {};

		this.rowData.sort((a: RowData, b: RowData) => {
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

	public reorderAllCells(cellIndices: number[]): void {
		this.rowData.forEach((row: RowData, index: number) => {
			row.cells = d3.permute(row.cells, cellIndices);
		});

		this.valueChartService.setAlternatives(d3.permute(this.valueChartService.getAlternatives(), cellIndices));
	}

	public resetCellOrder(): void {
		var cellIndices: number[] = [];

		this.valueChartService.getAlternatives().forEach((alternative: Alternative, index: number) => {
			cellIndices[this.originalAlternativeOrder.alternativeIndexMap[alternative.getName()]] = index;
		});

		this.reorderAllCells(cellIndices);
	}

	public recordOriginalAlternativeOrder(valueChart: ValueChart) {
		this.originalAlternativeOrder = new AlternativeOrderRecord(valueChart.getAlternatives());
	}

	// ================================ Public Methods Generating Row Orders ====================================

	public generateCellOrderByObjectiveScore(rowsToReorder: RowData[], objectivesToReorderBy: PrimitiveObjective[]): number[] {
		// Generate an array of indexes according to the number of cells in each row.
		var cellIndices: number[] = d3.range(rowsToReorder[0].cells.length);
		var alternativeScores: number[] = Array(rowsToReorder[0].cells.length).fill(0);

		for (var i = 0; i < rowsToReorder.length; i++) {
			if (objectivesToReorderBy.indexOf(rowsToReorder[i].objective) !== -1) {
				var scoreFunction = this.valueChartService.getCurrentUser().getScoreFunctionMap().getObjectiveScoreFunction(rowsToReorder[i].objective.getName());
				var weight: number = this.valueChartService.getValueChart().getMaximumWeightMap().getObjectiveWeight(rowsToReorder[i].objective.getName());
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

	public generateCellOrderAlphabetically(): number[] {
		// Generate an array of indexes according to the number of cells in each row.
		var cellIndices: number[] = d3.range(this.valueChartService.getNumAlternatives());

		cellIndices.sort((a: number, b: number) => {

			var aName: string = this.valueChartService.getAlternatives()[a].getName().toLowerCase();
			var bName: string = this.valueChartService.getAlternatives()[b].getName().toLowerCase();

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

	changeAlternativesOrder = (cellIndices: number[]) => {
		this.reorderAllCells(cellIndices);
	}

	changeRowOrder = (objectivesRecord: ObjectivesRecord) => {
		this.valueChartService.getValueChart().setRootObjectives(objectivesRecord.rootObjectives);
		this.updateLabelData();
		this.valueChartService.resetPrimitiveObjectives();
		this.generateRowData();
	}



}

