/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-10 17:31:46
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Libraries:
import * as d3 												from 'd3';
import * as _												from 'lodash';

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

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() {	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================



		// TODO <@aaron>: update this output type of this method.

	produceRowData = (u: RendererUpdate) => {
		if (!this.rowData || u.valueChart.getUsers().length != this.rowData.length ) {
			this.generateRowData(u.valueChart);
		}

		this.updateWeightOffsets(u.valueChart);
		this.updateStackedBarOffsets(u.viewConfig.viewOrientation);

		u.rowData = this.rowData;
		console.log(u);
		return u;
	}

	produceLabelData = (u: RendererUpdate) => {
		if (!this.labelData) {
			this.generateLabelData(u.valueChart);
		}

		this.labelData.forEach((labelDatum: LabelData) => {
			this.updateLabelDataWeights(u.valueChart, labelDatum);
		});

		u.labelData = this.labelData;
		return u;
	}

	// ================================  Getters ====================================
	

	// ================================ Data Creation and Update Methods  ====================================

	/*
		@returns {void} 
		@description	Generates the LabelData from the active ValueChart in the ValueChartService and assigns it to the rowData field. This method can be used
						to either generate the LabelData for the first time or to handle structural change to the ValueChart (adding/deleting objectives, alternatives, users)
						by regenerating the data.
	*/
	public generateLabelData(valueChart: ValueChart): void {
		this.labelData = [];

		valueChart.getRootObjectives().forEach((objective: Objective) => {
			this.labelData.push(this.getLabelDatum(valueChart, objective, 0));
		});
	}

	/*
		@returns {void} 
		@description	Generates the RowData from the active ValueChart in the ValueChartService and assigns it to the labelData field. This method can be used
						to either generate the RowData for the first time or to handle structural change to the ValueChart (adding/deleting objectives, alternatives, users)
						by regenerating the data.
	*/
	public generateRowData(valueChart: ValueChart): void {
		this.rowData = [];

		valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.rowData.push({
				objective: objective,
				weightOffset: 0,
				cells: this.getCellData(valueChart, objective)
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
	public updateWeightOffsets(valueChart: ValueChart): void {
		var weightOffset: number = 0;

		for (var i = 0; i < this.rowData.length; i++) {
			this.rowData[i].weightOffset = weightOffset;
			weightOffset += valueChart.getMaximumWeightMap().getObjectiveWeight(this.rowData[i].objective.getName());
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

	private getLabelDatum(valueChart: ValueChart, objective: Objective, depth: number): LabelData {
		var labelData: LabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: LabelData[] = [];
			var maxDepthOfChildren: number = 0;

			(<AbstractObjective>objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let labelDatum: LabelData = this.getLabelDatum(valueChart, subObjective, depth + 1);
				weight += labelDatum.weight;
				if (labelDatum.depthOfChildren > maxDepthOfChildren)
					maxDepthOfChildren = labelDatum.depthOfChildren;
				children.push(labelDatum);
			});

			labelData = { 'objective': objective, 'weight': weight, 'subLabelData': children, 'depth': depth, 'depthOfChildren': maxDepthOfChildren + 1 };
		} else if (objective.objectiveType === 'primitive') {
			labelData = { 'objective': objective, 'weight': valueChart.getMaximumWeightMap().getObjectiveWeight(objective.getName()), 'depth': depth, 'depthOfChildren': 0 };
		}

		return labelData;
	}

	private updateLabelDataWeights(valueChart: ValueChart, labelDatum: LabelData): void {
		if (labelDatum.depthOfChildren !== 0) {
			labelDatum.weight = 0;
			labelDatum.subLabelData.forEach((subLabelDatum: LabelData) => {
				this.updateLabelDataWeights(valueChart, subLabelDatum);
				labelDatum.weight += subLabelDatum.weight;
			});
		} else {
			labelDatum.weight = valueChart.getMaximumWeightMap().getObjectiveWeight(labelDatum.objective.getName());
		}
	}

	private updateLabelData(valueChart: ValueChart): void {
		// Use splice so as to avoid changing the array reference.
		valueChart.getRootObjectives().forEach((objective: Objective, index: number) => {
			this.labelData[index] = this.getLabelDatum(valueChart, objective, 0);
		});
	}

	private getCellData(valueChart: ValueChart, objective: PrimitiveObjective): CellData[] {
		var users: User[];
		users = valueChart.getUsers();

		var objectiveValues: any[] = valueChart.getAlternativeValuesforObjective(objective);

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
}

