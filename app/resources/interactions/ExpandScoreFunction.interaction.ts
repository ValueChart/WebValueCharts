/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:40:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-13 11:21:01
*/

import { Injectable } 												from '@angular/core';

// JQuery
import * as $														from 'jquery';
// d3
import * as d3 														from 'd3';

// Application Classes:

import { ChartDataService }											from '../services/ChartData.service';
import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';

// Model Classes:
import { User }														from '../model/User';
import { ScoreFunction }											from '../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../model/DiscreteScoreFunction';
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';






@Injectable()
export class ExpandScoreFunctionInteraction {

	private SCORE_FUNCTION_ROUTE: string = '/expandScoreFunction';
	private WINDOW_OPTIONS: string = 'menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes';

	constructor(private chartDataService: ChartDataService) { }

	toggleExpandScoreFunction(enableExpanding: boolean) {
		var ScoreFunctionPlots: JQuery = $('.' + ScoreFunctionRenderer.defs.PLOT_OUTLINE);
		
		ScoreFunctionPlots.off('dblclick');

		if (enableExpanding) {
			ScoreFunctionPlots.dblclick(this.expandScoreFunction);
		}

	}

	openPopUp(users: User[], objective: PrimitiveObjective) {
		// TODO: Update this URL to have a parameter that is the name of the objective. Router is currently not correctly identifying routes with parameters
		// correctly unless the navigation to them is initiated by Angular.
		var popup: Window = window.open(this.SCORE_FUNCTION_ROUTE,
					'Expanded' + objective.getName() + 'ScoreFunction',
					this.WINDOW_OPTIONS);

		console.log(popup);


	}

	expandScoreFunction = (eventObject: Event) => {
		console.log(eventObject);
		var objective: PrimitiveObjective = d3.select(eventObject.target).datum();

		this.openPopUp(this.chartDataService.users, objective);
	}
}