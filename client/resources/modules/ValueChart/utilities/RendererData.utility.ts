/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-19 17:42:56
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Libraries:
import * as d3 												from 'd3';

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
export class RendererDataUtility {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

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

	
	/*
		@returns {RendererUpdate} 
		@description	
	*/
	produceMaximumWeightMap = (u: RendererUpdate): RendererUpdate => {
		// Return the default WeightMap if there are no users.
		if (u.valueChart.getUsers().length == 0)
			u.maximumWeightMap = u.valueChart.getDefaultWeightMap();
		// If there is only one user then the maximum WeightMap is that user's WeightMap
		else if (u.valueChart.getUsers().length == 1) {
			u.maximumWeightMap = u.valueChart.getUsers()[0].getWeightMap();
		}
		else 
		// There is more than one user and the maximum weight must be calculated.
			u.maximumWeightMap = this.generateMaximumWeightMap(u);

		return u;
	}

	produceRowData = (u: RendererUpdate) => {
		u.rowData = this.generateRowData(u);;
		this.computeStackedBarOffsets(u);
		return u;
	}

	produceLabelData = (u: RendererUpdate) => {
		// Re-generate the label data if it is undefined, or if the root labelDatum is undefined.
		if (!this.labelData || !this.labelData[0]) {
			this.generateLabelData(u);
		}

		this.labelData.forEach((labelDatum: LabelData) => {
			this.updateLabelDataWeights(u, labelDatum);
		});

		u.labelData = this.labelData;
		return u;
	}
	

	// ================================ Data Creation and Update Methods  ====================================
	/*
		@returns {WeightMap} - A WeightMap where each objective weight is the maximum weight assigned to that objective by any user in chart.
		@description	Iterates over the ValueChart's collection of users to determine the maximum weight assigned to each primitive objective
						by any user. These maximum weights are then inserted into a new WeightMap, the so called maximum WeightMap. If there is only
						one user the in ValueChart, that user's weight map is simply returned. If there are no users, the default weight map is returned.
						The maximum weight map is to determine label heights by the LabelRenderer, and row heights by the objective chart renderer.
	*/
	private generateMaximumWeightMap(u: RendererUpdate): WeightMap {
		var maximumWeightMap: WeightMap = new WeightMap();

		var primitiveObjectives: PrimitiveObjective[] = u.valueChart.getAllPrimitiveObjectives();
		var combinedWeights: number[] = Array(primitiveObjectives.length).fill(0);

		if (u.valueChart.getUsers()) {
			u.valueChart.getUsers().forEach((user: User) => {
				if (user.getWeightMap()) {
				let objectiveWeights = user.getWeightMap().getObjectiveWeights(primitiveObjectives);
					for (var i = 0; i < objectiveWeights.length; i++) {
						if (combinedWeights[i] < objectiveWeights[i]) {
							combinedWeights[i] = objectiveWeights[i];
						}
					}
				}
			});


			for (var i = 0; i < primitiveObjectives.length; i++) {
				maximumWeightMap.setObjectiveWeight(primitiveObjectives[i].getName(), combinedWeights[i]);
			}
		}

		return maximumWeightMap;
	}


	/*
		@returns {void} 
		@description	Generates the LabelData from the active ValueChart in the ValueChartService and assigns it to the rowData field. This method can be used
						to either generate the LabelData for the first time or to handle structural change to the ValueChart (adding/deleting objectives, alternatives, users)
						by regenerating the data.
	*/
	private generateLabelData(u: RendererUpdate): void {
		this.labelData = [];

		u.valueChart.getRootObjectives().forEach((objective: Objective) => {
			this.labelData.push(this.getLabelDatum(u, objective, 0));
		});
	}

	/*
		@returns {void} 
		@description	Generates the RowData from the active ValueChart in the ValueChartService and assigns it to the labelData field. This method can be used
						to either generate the RowData for the first time or to handle structural change to the ValueChart (adding/deleting objectives, alternatives, users)
						by regenerating the data.
	*/
	private generateRowData(u: RendererUpdate): RowData[] {
		var weightOffset: number = 0;
		var rowData: RowData[] = [];

		u.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			rowData.push({
				objective: objective,
				weightOffset: weightOffset,
				cells: this.generateCellData(u, objective)
			});
			weightOffset += u.maximumWeightMap.getObjectiveWeight(objective.getName());
		});

		return rowData;
	}

	private generateCellData(u: RendererUpdate, objective: PrimitiveObjective): CellData[] {
		var users: User[] = u.valueChart.getUsers();

		var cellData: CellData[] = <any[]> u.valueChart.getAlternativeValuesforObjective(objective);

		cellData.forEach((objectiveValue: CellData) => {
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

		return cellData;
	}

	private getLabelDatum(u: RendererUpdate, objective: Objective, depth: number): LabelData {
		var labelData: LabelData;

		if (objective.objectiveType === 'abstract') {
			var weight = 0;
			var children: LabelData[] = [];
			var maxDepthOfChildren: number = 0;

			(<AbstractObjective>objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				let labelDatum: LabelData = this.getLabelDatum(u, subObjective, depth + 1);
				weight += labelDatum.weight;
				if (labelDatum.depthOfChildren > maxDepthOfChildren)
					maxDepthOfChildren = labelDatum.depthOfChildren;
				children.push(labelDatum);
			});

			labelData = { 'objective': objective, 'weight': weight, 'subLabelData': children, 'depth': depth, 'depthOfChildren': maxDepthOfChildren + 1 };
		} else if (objective.objectiveType === 'primitive') {
			labelData = { 'objective': objective, 'weight': u.maximumWeightMap.getObjectiveWeight(objective.getName()), 'depth': depth, 'depthOfChildren': 0 };
		}

		return labelData;
	}

// ================================ Private Helpers for Updating Data ====================================

	// Note that the following methods perform IN-PLACE updates.


	/*
		@returns {void} 
		@description	Updates the weight score offset assigned to each cell in each row of the rowData field. These offsets are required to position
						the cells each column of the summary chart so that they appear to be stacked upon each other. This method should usually be called
						via the updateAllValueChartData instead of being used directly.
	*/
	public computeStackedBarOffsets(u: RendererUpdate) {

		var rowDataCopy: RowData[] = u.rowData.slice(0, u.rowData.length);

		// In the vertical orientation rows are rendered going to down; rows with smaller indices are rendered above those with larger indices. 
		// This means that rows with smaller indices must be stacked above rows with larger indices in the stacked bar chart. So in the vertical
		// orientation we must reverse the order in which we calculate offsets. Otherwise, the earlier rows will have smaller offsets and the
		// stacked bar chart will be rendered in reverse. This is not a problem in the horizontal orientation since rows are rendered left to right
		// in that configuration, meaning that the default row order can be used to calculate offsets.
		if (u.viewConfig.viewOrientation === 'vertical') {
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

	private updateLabelDataWeights(u: RendererUpdate, labelDatum: LabelData): void {
		if (labelDatum.depthOfChildren !== 0) {
			labelDatum.weight = 0;
			labelDatum.subLabelData.forEach((subLabelDatum: LabelData) => {
				this.updateLabelDataWeights(u, subLabelDatum);
				labelDatum.weight += subLabelDatum.weight;
			});
		} else {
			labelDatum.weight = u.maximumWeightMap.getObjectiveWeight(labelDatum.objective.getName());
		}
	}
}

