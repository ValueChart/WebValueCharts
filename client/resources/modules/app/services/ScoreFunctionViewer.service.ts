/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-01 12:55:30
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
}