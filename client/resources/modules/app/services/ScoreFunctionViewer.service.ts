/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-09 21:07:07
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';

// Import Application Classes:
import { ValueChartService }													from './ValueChart.service';

// Import Model Classes:
import { PrimitiveObjective }													from '../../../model/PrimitiveObjective';
import { User }																	from '../../../model/User';
import { CategoricalDomain }													from '../../../model/CategoricalDomain';
import { IntervalDomain }														from '../../../model/IntervalDomain';
import { ScoreFunction }														from '../../../model/ScoreFunction';

// Import Type Definitions:
import { DomainElement, UserDomainElements, ElementUserScoresSummary }			from '../../../types/ScoreFunctionViewer.types';


/*
	This class contains methods for formatting data from the active ValueChart object in the ValueChartService
	to be suitable for the ScoreFunctionRenderer classes and the ScoreDistributionChartRenderer class.
*/

@Injectable()
export class ScoreFunctionViewerService {

	// TODO <@aaron> : Speed up getAllUsersDomainElements by caching the result.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private valueChartService: ValueChartService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	produceUsersDomainElements = (u: any) => {
		u.usersDomainElements = this.getAllUsersDomainElements(u.objective, u.valueChart.getUsers());

		return u;
	}


	getAllUsersDomainElements(objective: PrimitiveObjective, users: User[]): UserDomainElements[] {
		var allUsersDomainElements: UserDomainElements[] = [];
		var domainElements: (string | number)[] = [];

		users.forEach((user: User) => {
			var userDomainElements: UserDomainElements = { user: user, elements: [] };

			domainElements = user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName()).getAllElements();

			domainElements.forEach((domainElement: string | number) => {
				userDomainElements.elements.push({ user: user, element: domainElement });
			});

			allUsersDomainElements.push(userDomainElements);
		});

		return allUsersDomainElements;
	}

	getElementUserScoresSummary(objectiveName: string, element: (number | string)): ElementUserScoresSummary {
		var userScores: number[] = [];

		this.valueChartService.getUsers().forEach((user: User) => {
			let scoreFunction: ScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(objectiveName);
			userScores.push(scoreFunction.getScore(element));
		});

		userScores.sort((a: number, b: number) => {
			if (a < b)
				return -1;
			else
				return 1;
		});

		var elementScoresSummary: ElementUserScoresSummary = {
			element: element,

			min: d3.min(userScores),
			firstQuartile: d3.quantile(userScores, 0.25),
			median: d3.median(userScores),
			thirdQuartile: d3.quantile(userScores, 0.75),
			max: d3.max(userScores),
		};

		return elementScoresSummary;
	}

	getAllElementUserScoresSummaries(objective: PrimitiveObjective): ElementUserScoresSummary[] {
		var elementUserScoresSummaries: ElementUserScoresSummary[] = [];

		var scoreFunction: ScoreFunction = this.valueChartService.getUsers()[0].getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
		scoreFunction.getAllElements().forEach((element: (number | string)) => {
			elementUserScoresSummaries.push(this.getElementUserScoresSummary(objective.getName(), element));
		});

		return elementUserScoresSummaries;
	}

	// TODO <@aaron> : Add type annotations 

	produceViewConfig = (u: any) => {
		u.rendererConfig = <any>{};
		u.rendererConfig.labelOffset = 25;

				// Initialize the view configuration. This code is very similar to that in RenderConfigService, but is duplicated here to avoid a dependency on that class.
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


		return u;
	}
}