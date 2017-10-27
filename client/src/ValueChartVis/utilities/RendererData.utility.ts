/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-08 16:13:51
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Libraries:
import * as d3 												from 'd3';
import * as _												from 'lodash';
// Import Model Classes:
import { ValueChart }										from '../../model';
import { Objective }										from '../../model';
import { PrimitiveObjective }								from '../../model';
import { AbstractObjective }								from '../../model';
import { User }												from '../../model';
import { Alternative }										from '../../model';
import { WeightMap }										from '../../model';
import { ScoreFunctionMap }									from '../../model';
import { ScoreFunction }									from '../../model';

// Import Type Definitions:
import { RowData, CellData, UserScoreData, LabelData }		from '../../types';
import { RendererUpdate }									from '../../types';

import { ChartOrientation }									from '../../types';
/*
	This class contains methods for converting a RendererUpdate message into a format suitable for d3.
	The produceMaximumWeightMap, produceRowData, and produceLabelData methods provide a mechanism for creating
	and attachning maximumWieightMaps, RowData, and LabelData from and to RendererUpdate objects. These method are 
	usually not called manually; instead they are used as a part of a rendering pipeline that is created in ValueChartDirective.
*/

@Injectable()
export class RendererDataUtility {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private labelData: LabelData[];			// Data from the active ValueChart formatted to work with the LabelRenderer classes.
											// The labelData are cached here in order to improve rendering performance.

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
	
	/*
		@param u - the RendererUpdate object used to produce a maximumWeightMap.
		@returns {RendererUpdate}
		@description Produces a WeightMap made up of the maximum user assigned weights for each PrimitiveObjective.
					 This maximum WeightMap is then attached the input RendererUpdate, u, which is returned.
					 This method is generally used as a part of the rendering pipeline created in ValueChartDirective.
	*/
	public produceMaximumWeightMap = (u: RendererUpdate): RendererUpdate => {
		if (u.reducedInformation) {
			u.maximumWeightMap = u.valueChart.getDefaultWeightMap();
			let objectives = u.valueChart.getAllPrimitiveObjectives();
			objectives.forEach((objective: PrimitiveObjective) => {
				u.maximumWeightMap.setObjectiveWeight(objective.getId(), 1 / objectives.length);
			});
		}
		// Return the default WeightMap if there are no users.
		else if (u.usersToDisplay.length == 0)
			u.maximumWeightMap = u.valueChart.getDefaultWeightMap();
		// If there is only one user then the maximum WeightMap is that user's WeightMap
		else if (u.usersToDisplay.length == 1) {
			u.maximumWeightMap = u.usersToDisplay[0].getWeightMap();
		}
		else 
		// There is more than one user and the maximum weight must be calculated.
			u.maximumWeightMap = this.generateMaximumWeightMap(u);

		return u;
	}

	/*
		@param u - the RendererUpdate object used to produce rowData.
		@returns {RendererUpdate}
		@description Produces rowData using the input RendererUpdate object.
					 The rowData is then attached to the the input RendererUpdate, u, which is returned.
					 This method is generally used as a part of the rendering pipeline created in ValueChartDirective.
	*/
	public produceRowData = (u: RendererUpdate) => {
		u.rowData = this.generateRowData(u);;
		this.computeStackedBarOffsets(u);
		return u;
	}

	/*
		@param u - the RendererUpdate object used to produce labelData.
		@returns {RendererUpdate}
		@description Produces labelData using the input RendererUpdate object.
					 The labelData is then attached to the the input RendererUpdate, u, which is returned.
					 This method is generally used as a part of the rendering pipeline created in ValueChartDirective.
	*/
	public produceLabelData = (u: RendererUpdate) => {
		// Re-generate the label data if it is undefined, or if the root labelDatum is undefined.
		if (!this.labelData || !this.labelData[0] || u.structuralUpdate) {
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
		@param u - THe rendererUpdate object from which to generate the maximumWeightMap.
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

		if (u.usersToDisplay) {
			u.usersToDisplay.forEach((user: User) => {
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
				maximumWeightMap.setObjectiveWeight(primitiveObjectives[i].getId(), combinedWeights[i]);
			}
		}

		return maximumWeightMap;
	}


	/*
		@param u - The rendererUpdate object from which to generate the LabelData.
		@returns {void} 
		@description	Generates the LabelData from the input RendererUpdate object and assigns it to the labelData field of the service.
	*/
	private generateLabelData(u: RendererUpdate): void {
		this.labelData = [];

		u.valueChart.getRootObjectives().forEach((objective: Objective) => {
			this.labelData.push(this.getLabelDatum(u, objective, 0));
		});
	}

	/*
		@param u - The rendererUpdate object from which to generate the RowData.
		@returns {rowData}
		@description	Generates the RowData from the input RendererUpdate object and returns it. 
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
			weightOffset += u.maximumWeightMap.getObjectiveWeight(objective.getId());
		});

		return rowData;
	}

	/*
		@param u - The rendererUpdate object from which to generate the CellData.
		@param objective - the objective for which the cell data is to be created.
		@returns {void} 
		@description	Generates the CellData for the given objective and from the input RendererUpdate object and then returns it.
	*/
	private generateCellData(u: RendererUpdate, objective: PrimitiveObjective): CellData[] {
		var users: User[] = u.usersToDisplay;

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
			labelData = { 'objective': objective, 'weight': u.maximumWeightMap.getObjectiveWeight(objective.getId()), 'depth': depth, 'depthOfChildren': 0 };
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
	private computeStackedBarOffsets(u: RendererUpdate) {

		var rowDataCopy: RowData[] = u.rowData.slice(0, u.rowData.length);

		// In the vertical orientation rows are rendered going to down; rows with smaller indices are rendered above those with larger indices. 
		// This means that rows with smaller indices must be stacked above rows with larger indices in the stacked bar chart. So in the vertical
		// orientation we must reverse the order in which we calculate offsets. Otherwise, the earlier rows will have smaller offsets and the
		// stacked bar chart will be rendered in reverse. This is not a problem in the horizontal orientation since rows are rendered left to right
		// in that configuration, meaning that the default row order can be used to calculate offsets.
		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
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
						let scoreFunction: ScoreFunction = previousUserScore.user.getScoreFunctionMap().getObjectiveScoreFunction(previousUserScore.objective.getId());
						previousWeightedScore = scoreFunction.getScore(previousUserScore.value) * previousUserScore.user.getWeightMap().getObjectiveWeight(previousUserScore.objective.getId());
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
			labelDatum.weight = u.maximumWeightMap.getObjectiveWeight(labelDatum.objective.getId());
		}
	}
}

