/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-25 14:05:50
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';
import * as _																	from 'lodash';

// Import Model Classes:
import { PrimitiveObjective }													from '../../../model/PrimitiveObjective';
import { User }																	from '../../../model/User';
import { CategoricalDomain }													from '../../../model/CategoricalDomain';
import { IntervalDomain }														from '../../../model/IntervalDomain';
import { ScoreFunction }														from '../../../model/ScoreFunction';

// Import Type Definitions:
import { DomainElement, ScoreFunctionData, ScoreFunctionDataSummary }			from '../../../types/RendererData.types';
import { ScoreFunctionUpdate, ScoreFunctionConfig }								from '../../../types/RendererData.types';


/*
	This class contains methods for formatting data from the active ValueChart object in the ValueChartService
	to be suitable for the ScoreFunctionRenderer classes and the ScoreDistributionChartRenderer class.
*/

@Injectable()
export class RendererScoreFunctionUtility {

	// TODO <@aaron> : Speed up getAllScoreFunctionData by caching the result.

	// ========================================================================================
	// 									Fields
	// ========================================================================================


	private scoreFunctionData: any = {};
	private colors: string[];

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

	// TODO <@aaron> : Add type annotations 

	produceViewConfig = (u: ScoreFunctionUpdate): ScoreFunctionUpdate => {
		u.rendererConfig = <any>{};
		u.rendererConfig.labelOffset = 25;

				// Initialize the view configuration. This code is very similar to that in RendererService, but is duplicated here to avoid a dependency on that class.
		if (u.viewOrientation === 'vertical') {
			u.rendererConfig.dimensionOne = 'width';
			u.rendererConfig.dimensionTwo = 'height';
			u.rendererConfig.coordinateOne = 'x';
			u.rendererConfig.coordinateTwo = 'y';

			u.rendererConfig.dimensionOneSize = u.width;
			u.rendererConfig.dimensionTwoSize = u.height;

			// Determine the positions of the two axes.
			u.rendererConfig.domainAxisCoordinateTwo = Math.min((19 / 20) * u.rendererConfig.dimensionTwoSize, u.rendererConfig.dimensionTwoSize - u.rendererConfig.labelOffset);

			u.rendererConfig.utilityAxisMaxCoordinateTwo = Math.max(u.rendererConfig.dimensionTwoSize / 20, 5);
			u.rendererConfig.utilityAxisCoordinateOne = u.rendererConfig.labelOffset;

		} else {
			u.rendererConfig.dimensionOne = 'height';
			u.rendererConfig.dimensionTwo = 'width';
			u.rendererConfig.coordinateOne = 'y';
			u.rendererConfig.coordinateTwo = 'x';

			u.rendererConfig.dimensionOneSize = u.height;
			u.rendererConfig.dimensionTwoSize = u.width;

			// Determine the positions of the two axes.
			u.rendererConfig.domainAxisCoordinateTwo = Math.max((1 / 20) * u.rendererConfig.dimensionTwoSize, u.rendererConfig.labelOffset) + 10;

			u.rendererConfig.utilityAxisMaxCoordinateTwo = Math.max(u.rendererConfig.dimensionTwoSize * (19 / 20), 5);
			u.rendererConfig.utilityAxisCoordinateOne = u.rendererConfig.labelOffset;
		}

		u.rendererConfig.domainAxisMaxCoordinateOne = Math.min((19 / 20) * u.rendererConfig.dimensionOneSize, u.rendererConfig.dimensionOneSize - u.rendererConfig.labelOffset);

		// Configure the linear scale that translates scores into pixel units. 
		u.heightScale = d3.scaleLinear()
			.domain([0, 1])

		if (u.viewOrientation === 'vertical') {
			u.heightScale.range([0, (u.rendererConfig.domainAxisCoordinateTwo) - u.rendererConfig.utilityAxisMaxCoordinateTwo]);
		} else {
			u.heightScale.range([u.rendererConfig.domainAxisCoordinateTwo, u.rendererConfig.utilityAxisMaxCoordinateTwo]);
		}

		return u;
	}

	public getAllScoreFunctionDataSummaries(objective: PrimitiveObjective, scoreFunctions: ScoreFunction[]): ScoreFunctionDataSummary[] {
		var elementUserScoresSummaries: ScoreFunctionDataSummary[] = [];

		scoreFunctions[0].getAllElements().forEach((element: (number | string)) => {
			elementUserScoresSummaries.push(this.getScoreFunctionDataSummary(objective.getName(), scoreFunctions, element));
		});

		return elementUserScoresSummaries;
	}


	

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