/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-16 22:50:53
*/

import { Component }													from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';
import { NgZone }														from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';

// d3
import * as d3 															from 'd3';
	
// Application classes:
import { ScoreFunctionRenderer }										from '../../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }								from '../../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }								from '../../renderers/ContinuousScoreFunction.renderer';
import { ScoreDistributionChartRenderer }								from '../../renderers/ScoreDistributionChart.renderer';

import { ValueChartService }											from '../../services/ValueChart.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';

import { ScoreFunctionDirective }										from '../../directives/ScoreFunction.directive';

// Model Classes:
import { ScoreFunction }												from '../../model/ScoreFunction';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { User }															from '../../model/User';
import { UserDomainElements, DomainElement }							from '../../types/ScoreFunctionViewer.types';


@Component({
	selector: 'ScoreFunction',
	templateUrl: 'app/resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.template.html',
	directives: [ScoreFunctionDirective]
})
export class ScoreFunctionViewerComponent implements OnInit, OnDestroy, DoCheck {
	private sub: any;
	private opener: Window;

	private valueChartService: ValueChartService;
	private scoreFunctionViewerService: ScoreFunctionViewerService;
	private chartUndoRedoService: ChartUndoRedoService;

	private services: any = {};

	private scoreFunctionPlotContainer: d3.Selection<any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;
	private scoreDistributionChartContainer: d3.Selection<any>;
	private scoreDistributionChartRenderer: ScoreDistributionChartRenderer;

	private users: User[];
	private objectiveToDisplay: PrimitiveObjective;
	private previousScoreFunctions: ScoreFunction[];

	private viewType: string;
	private previousViewType: string;

	constructor(
		private ngZone: NgZone, 
		private router: Router,
		private route: ActivatedRoute) { }

	ngOnInit() {
		this.sub = this.route.params.subscribe(params => this.viewType = params['viewType']);

		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');
		this.scoreDistributionChartContainer = d3.select('.score-distribution-plot');

		if (window) {
			this.opener = window.opener;

			this.objectiveToDisplay = (<any> window.opener).objectiveToPlot;
			this.valueChartService = (<any> window.opener).valueChartService;
			this.chartUndoRedoService = (<any> window.opener).chartUndoRedoService;

			this.scoreFunctionViewerService = new ScoreFunctionViewerService(this.valueChartService);
		}

		this.services.valueChartService = this.valueChartService;
		this.services.chartUndoRedoService = this.chartUndoRedoService;
		this.services.scoreFunctionViewerService = this.scoreFunctionViewerService;

		this.previousViewType = this.viewType;

		this.users = this.valueChartService.getUsers()
		this.initDistributionPlot();
		this.configureDisplay();
	}

	initDistributionPlot(): void {
		this.scoreDistributionChartRenderer = new ScoreDistributionChartRenderer(this.scoreFunctionViewerService);
		this.scoreDistributionChartRenderer.createScoreDistributionChart(this.scoreDistributionChartContainer, this.objectiveToDisplay);
		this.scoreDistributionChartRenderer.renderScoreDistributionChart(375, 300, 'vertical');
	}

	configureDisplay(): void {
		if (this.viewType === 'plot') {
			this.scoreFunctionPlotContainer.attr('display', 'block');
			this.scoreDistributionChartContainer.attr('display', 'none');
		} else if (this.viewType == 'distribution') {
			this.scoreFunctionPlotContainer.attr('display', 'none');
			this.scoreDistributionChartContainer.attr('display', 'block');
		}
	}

	detectScoreFunctionChange(previousScoreFunction: ScoreFunction, currentScoreFunction: ScoreFunction): boolean {

		var elementIterator: Iterator<number | string> = previousScoreFunction.getElementScoreMap().keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();

		while (iteratorElement.done === false) {

			if (previousScoreFunction.getScore(iteratorElement.value) !== currentScoreFunction.getScore(iteratorElement.value)) {
				return true;
			}

			iteratorElement = elementIterator.next();
		}

		return false;
	}


	ngDoCheck() {

		if (this.viewType !== this.previousViewType) {
			this.previousViewType = this.viewType;
			this.configureDisplay();
		}
	}

	ngOnDestroy() {
		// Remove the ScoreFunction viewer form the parent window's list of children.
		(<any> this.opener).childWindows.scoreFunctionViewer = null;
		this.sub.unsubscribe();											// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
	}
}
