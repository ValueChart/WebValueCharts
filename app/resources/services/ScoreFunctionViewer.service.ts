/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-12 13:40:19
*/

import { Injectable } 										from '@angular/core';

// Application Classes:
import { ValueChartService }								from './ValueChart.service';

// Model Classes
import { PrimitiveObjective }								from '../model/PrimitiveObjective';
import { User }												from '../model/User';	
import { CategoricalDomain }								from '../model/CategoricalDomain';
import { IntervalDomain }									from '../model/IntervalDomain';

import { DomainElement, UserDomainElements }				from '../types/ScoreFunctionViewer.types.ts';
	
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
			domainElements = this.valueChartService.currentUser.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId()).getAllElements();
		}

		this.valueChartService.users.forEach((user: User) => {
			var userDomainElements: UserDomainElements = { user: user, elements: [] };

			domainElements.forEach((domainElement: string | number) => {
				userDomainElements.elements.push({ user: user, element: domainElement });
			});

			allUsersDomainElements.push(userDomainElements);
		});

		return allUsersDomainElements;
	}
}