/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:40:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-17 13:14:31
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';
import * as $														from 'jquery';

// Application Classes:
import { ValueChartService }										from '../services/ValueChart.service';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';
import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';

// Model Classes:
import { User }														from '../model/User';
import { ScoreFunction }											from '../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../model/DiscreteScoreFunction';
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';

import { UserDomainElements, DomainElement }						from '../types/ScoreFunctionViewer.types';


@Injectable()
export class ExpandScoreFunctionInteraction {

	private SCORE_FUNCTION_ROUTE: string = document.baseURI + 'scoreFunction/plot';
	private WINDOW_OPTIONS: string = 'menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes,width=600,height=600';

	public popUpRef: any;

	constructor(
		private valueChartService: ValueChartService,
		private chartUndoRedoService: ChartUndoRedoService) { }

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

		// Pass relevant data to the pop-up by attaching it to the window object.
		(<any>window).objectiveToPlot = objective;
		(<any>window).valueChartService = this.valueChartService;
		(<any>window).chartUndoRedoService = this.chartUndoRedoService;

		this.popUpRef = window.open(this.SCORE_FUNCTION_ROUTE,
			'Expanded' + objective.getName() + 'ScoreFunction',
			this.WINDOW_OPTIONS);

		(<any>window).childWindows = (<any>window).childWindows || {};
		(<any>window).childWindows.scoreFunctionViewer = this.popUpRef;

	}

	expandScoreFunction = (eventObject: Event) => {
		var objective: PrimitiveObjective = d3.select(eventObject.target).datum();

		this.openPopUp(this.valueChartService.getUsers(), objective);
	}
}