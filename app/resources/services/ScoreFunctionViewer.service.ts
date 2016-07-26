/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-20 14:10:35
*/

import { Injectable } 															from '@angular/core';

// d3
import * as d3 																	from 'd3';

// Application Classes:
import { ValueChartService }													from './ValueChart.service';

// Model Classes
import { PrimitiveObjective }													from '../model/PrimitiveObjective';
import { User }																	from '../model/User';	
import { CategoricalDomain }													from '../model/CategoricalDomain';
import { IntervalDomain }														from '../model/IntervalDomain';
import { ScoreFunction }														from '../model/ScoreFunction';

import { DomainElement, UserDomainElements, ElementUserScoresSummary }			from '../types/ScoreFunctionViewer.types.ts';
	
// This class stores the state of a ValueChart and exposes this state to the renderer classes. Renderer classes are allowed to modify 
// this state as a way of initiating change detection. 

@Injectable()
export class ScoreFunctionViewerService {

	constructor(private valueChartService: ValueChartService) { }

	getAllUsersDomainElements(objective: PrimitiveObjective): UserDomainElements[] {
		var allUsersDomainElements: UserDomainElements[] = [];
		var domainElements: (string | number)[] = [];

		if (objective.getDomainType() === 'categorical') {
			domainElements = (<CategoricalDomain> objective.getDomain()).getElements();
		} else if (objective.getDomainType() === 'interval') {
			domainElements = (<IntervalDomain> objective.getDomain()).getElements();
		} else {
			domainElements = this.valueChartService.getCurrentUser().getScoreFunctionMap().getObjectiveScoreFunction(objective.getId()).getAllElements();
		}

		this.valueChartService.getUsers().forEach((user: User) => {
			var userDomainElements: UserDomainElements = { user: user, elements: [] };

			domainElements.forEach((domainElement: string | number) => {
				userDomainElements.elements.push({ user: user, element: domainElement });
			});

			allUsersDomainElements.push(userDomainElements);
		});

		return allUsersDomainElements;
	}

	getElementUserScoresSummary(objectiveId: string, element: (number | string)): ElementUserScoresSummary {
		var userScores: number[] = [];

		this.valueChartService.getUsers().forEach((user: User) => {
			let scoreFunction: ScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(objectiveId);
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

		var scoreFunction: ScoreFunction = this.valueChartService.getUsers()[0].getScoreFunctionMap().getObjectiveScoreFunction(objective.getId());
		scoreFunction.getAllElements().forEach((element: (number | string)) => {
			elementUserScoresSummaries.push(this.getElementUserScoresSummary(objective.getId(), element));
		});

		return elementUserScoresSummaries;
	}
}