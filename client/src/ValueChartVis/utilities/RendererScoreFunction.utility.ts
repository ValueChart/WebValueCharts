/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-01 14:02:50
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';
import * as _																	from 'lodash';

// Import Model Classes:
import { PrimitiveObjective }													from '../../model';
import { User }																	from '../../model';
import { CategoricalDomain }													from '../../model';
import { IntervalDomain }														from '../../model';
import { ScoreFunction }														from '../../model';

// Import Type Definitions:
import { DomainElement, ScoreFunctionData, ScoreFunctionDataSummary }			from '../../types';
import { ScoreFunctionUpdate, ScoreFunctionConfig }								from '../../types';

import { ChartOrientation }														from '../../types';

/*
	This class contains methods for formatting data from the active ValueChart object in the ValueChartService
	to be suitable for the ScoreFunctionRenderer classes and the ScoreDistributionChartRenderer class.
*/

@Injectable()
export class RendererScoreFunctionUtility {


	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private scoreFunctionData: any = {}; 		// A dictionary style object of cached ScoreFunctionData for each PrimitiveObjective in the ValueChart.
												// The indices of the cache are the Objective IDs. This data is cached to improve the performance of the 
												// ScoreFunctionRenderer and its subclasses.
	
	private colors: string[];					// A saved copy of the current user colors. This is used to determine if the user colors have changed.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	public produceWeightDistributionData = (u: any): any => {
		u.weights = [];
		u.maxWeight = 0;
		u.minWeight = 1;

		u.users.forEach((user: User) => {
			let weight = user.getWeightMap().getObjectiveWeight(u.objective.getId());

			u.weights.push(weight);
			if (weight > u.maxWeight) 
				u.maxWeight = weight;

			if (weight < u.minWeight)
				u.minWeight = weight;
		});

		u.weights.sort((a:number, b:number) => a - b);

		u.medianWeight = d3.median(u.weights);
		u.firstQuartile = d3.quantile(u.weights, 0.25);
		u.thirdQuartile = d3.quantile(u.weights, 0.75);

		return u;
	}
	
	/*
		@param u - The ScoreFunctionUpdate update to which the appropriate ScoreFunctionData will be attached.
		@returns {ScoreFunctionUpdate}
		@description 	This method attaches either cached or new ScoreFunctionData to the input ScoreFunctionUpdate object. The ScoreFunctionData attached
						corresponds to the PrimitiveObjective object that the ScoreFunctionUpdate is associated with.
						This method does some basic change detection to determine if the cached copy of the ScoreFunctionData may be used. If "structural" changes 
						- changes that require re-generating the data - are detected, then the cached copy is updated before being attached to the ScoreFunctionUpdate.
						This method is generally called as a part of the ScoreFunctionRenderer rendering pipeline that is created either in the ScoreFunctionDirective or
						the LabelRenderer.
	*/
	public produceScoreFunctionData = (u: ScoreFunctionUpdate): ScoreFunctionUpdate => {

		if (!this.scoreFunctionData[u.objective.getId()] || this.scoreFunctionData[u.objective.getId()].length != u.scoreFunctions.length || !_.isEqual(this.colors, u.colors)) {
			this.scoreFunctionData = {};
			this.colors = _.cloneDeep(u.colors);
			u.styleUpdate = true;
			
			this.scoreFunctionData[u.objective.getId()] = this.getAllScoreFunctionData(u.objective, u.scoreFunctions, u.colors);
		}


		u.scoreFunctionData = this.scoreFunctionData[u.objective.getId()];

		return u;
	}

	/*
		@param u - The ScoreFunctionUpdate update to which the ScoreFunction renderer configuration object will be attached.
		@returns {ScoreFunctionUpdate}
		@description 	This method attaches creates a renderer configuration object for a ScoreFunctionRenderer and attaches it to the provided ScoreFunctionUpdate 
						object.
	*/
	public produceViewConfig = (u: ScoreFunctionUpdate): ScoreFunctionUpdate => {
		u.rendererConfig = <any>{};
		u.rendererConfig.labelOffset = 25;

		// Initialize the view configuration. This code is very similar to that in RendererService, but is duplicated here to avoid a dependency on that class.
		if (u.viewOrientation === ChartOrientation.Vertical) {
			u.rendererConfig.dimensionOne = 'width';
			u.rendererConfig.dimensionTwo = 'height';
			u.rendererConfig.coordinateOne = 'x';
			u.rendererConfig.coordinateTwo = 'y';

			u.rendererConfig.dimensionOneSize = u.width;
			u.rendererConfig.dimensionTwoSize = u.height;

			// Determine the positions of the two axes.
			u.rendererConfig.independentAxisCoordinateTwo = Math.min((19 / 20) * u.rendererConfig.dimensionTwoSize, u.rendererConfig.dimensionTwoSize - u.rendererConfig.labelOffset);

			u.rendererConfig.dependentAxisCoordinateTwo = Math.max(u.rendererConfig.dimensionTwoSize / 20, 5);
			u.rendererConfig.dependentAxisCoordinateOne = u.rendererConfig.labelOffset;

		} else {
			u.rendererConfig.dimensionOne = 'height';
			u.rendererConfig.dimensionTwo = 'width';
			u.rendererConfig.coordinateOne = 'y';
			u.rendererConfig.coordinateTwo = 'x';

			u.rendererConfig.dimensionOneSize = u.height;
			u.rendererConfig.dimensionTwoSize = u.width;

			// Determine the positions of the two axes.
			u.rendererConfig.independentAxisCoordinateTwo = Math.max((1 / 20) * u.rendererConfig.dimensionTwoSize, u.rendererConfig.labelOffset) + 10;

			u.rendererConfig.dependentAxisCoordinateTwo = Math.max(u.rendererConfig.dimensionTwoSize * (19 / 20), 5);
			u.rendererConfig.dependentAxisCoordinateOne = u.rendererConfig.labelOffset;
		}

		u.rendererConfig.independentAxisCoordinateOne = Math.min((19 / 20) * u.rendererConfig.dimensionOneSize, u.rendererConfig.dimensionOneSize - u.rendererConfig.labelOffset);

		// Configure the linear scale that translates scores into pixel units. 
		u.heightScale = d3.scaleLinear()
			.domain([0, 1])

		if (u.viewOrientation === ChartOrientation.Vertical) {
			u.heightScale.range([0, (u.rendererConfig.independentAxisCoordinateTwo) - u.rendererConfig.dependentAxisCoordinateTwo]);
		} else {
			u.heightScale.range([u.rendererConfig.independentAxisCoordinateTwo, u.rendererConfig.dependentAxisCoordinateTwo]);
		}

		return u;
	}


	/*
		@param objective - The PrimitiveObjective for which to generate the list of the ScoreFunctionData objects.
		@param scoreFunctions - The list of ScoreFunctions (one for each user in the ScoreFunctionPlot) used to generate the ScoreFunctionData.
		@returns {ScoreFunctionData[]}
		@description 	This method creates and returns a list of ScoreFunctionData objects for the given objective and using the list of provided ScoreFunctions.
						The ScoreFunctionData objects are formatted for use in rendering a ScoreFunctionPlot using the ScoreFunctionRenderer and its subclasses.
	*/
	private getAllScoreFunctionData(objective: PrimitiveObjective, scoreFunctions: ScoreFunction[], colors: string[]): ScoreFunctionData[] {
		var allScoreFunctionData: ScoreFunctionData[] = [];
		var domainElements: (string | number)[] = [];

		for (var i = 0; i < scoreFunctions.length; i++) {
			if (!colors[i])
				colors[i] = "#000000";

			var scoreFunctionData: ScoreFunctionData = { scoreFunction: scoreFunctions[i], color: colors[i], elements: [] };
			domainElements = scoreFunctions[i].getAllElements();

			domainElements.forEach((domainElement: string | number) => {
				scoreFunctionData.elements.push({ scoreFunction: scoreFunctions[i], color: colors[i],  element: domainElement });
			});
			
			allScoreFunctionData.push(scoreFunctionData);
		}

		return allScoreFunctionData;
	}

	/*
		@param objective - The objective for which to generate the list of the ScoreFunctionDataSummary objects.
		@param scoreFunctions - The list of ScoreFunctions (one for each user in the ScoreFunctionPlot) used to generate the summary objects.
		@returns {ScoreFunctionDataSummary[]}
		@description 	This method creates and returns a list of ScoreFunctionDataSummary objects for the given objective and from the list of provided
						ScoreFunctions. Each ScoreFunctionDataSummary object corresponds to one element in the Objective's domain and contains
						summary statistics for the scores assigned to that element by the list of ScoreFunctions. The summary statistics include
								1) minimum score assigned;
								2) maximum score assigned;
								3) median score assigned;
								4) first quartile of assigned scores;
								5) third quartile of assigned scores;
						Notice that this is exactly the information required to generate a box plot for the distribution of scores.
	*/
	public getAllScoreFunctionDataSummaries(objective: PrimitiveObjective, scoreFunctions: ScoreFunction[]): ScoreFunctionDataSummary[] {
		var scoreFunctionDataSummaries: ScoreFunctionDataSummary[] = [];

		if (scoreFunctions.length == 0)
			return scoreFunctionDataSummaries;

		scoreFunctions[0].getAllElements().forEach((element: (number | string)) => {
			scoreFunctionDataSummaries.push(this.getScoreFunctionDataSummary(objective.getName(), scoreFunctions, element));
		});

		return scoreFunctionDataSummaries;
	}

	/*
		@param objectiveName - The name of the PrimitiveObjective for which to generate the ScoreFunctionDataSummary object.
		@param scoreFunctions - The list of ScoreFunctions (one for each user in the ScoreFunctionPlot) used to generate the summary object.
		@param element - The element from the domain of the PrimitiveObjective for which to generate the ScoreFunctionDataSummary.
		@returns {ScoreFunctionDataSummary}
		@description 	This method creates a ScoreFunctionDataSummary for the given element using the list of ScoreFunctions provided.
	*/
	private getScoreFunctionDataSummary(objectiveName: string, scoreFunctions: ScoreFunction[], element: (number | string)): ScoreFunctionDataSummary {
		var userScores: number[] = [];

		scoreFunctions.forEach((scoreFunction: ScoreFunction) => {
			userScores.push(scoreFunction.getScore(element));
		});

		userScores.sort((a: number, b: number) => {
			if (a < b)
				return -1;
			else
				return 1;
		});

		var elementScoresSummary: ScoreFunctionDataSummary = {
			element: element,

			min: d3.min(userScores),
			firstQuartile: d3.quantile(userScores, 0.25),
			median: d3.median(userScores),
			thirdQuartile: d3.quantile(userScores, 0.75),
			max: d3.max(userScores),
		};

		return elementScoresSummary;
	}
}