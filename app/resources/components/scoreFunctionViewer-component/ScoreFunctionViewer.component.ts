/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-19 19:52:51
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
import { ValueChartService }											from '../../services/ValueChart.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';

// Model Classes:
import { ScoreFunction }												from '../../model/ScoreFunction';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { User }															from '../../model/User';
import { UserDomainElements, DomainElement }							from '../../types/ScoreFunctionViewer.types';


@Component({
	selector: 'ScoreFunction',
	templateUrl: '/app/resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.template.html',
	directives: []
})
export class ScoreFunctionViewerComponent implements OnInit, DoCheck, OnDestroy {
	private sub: any;
	private opener: Window;

	private valueChartService: ValueChartService;
	private scoreFunctionViewerService: ScoreFunctionViewerService;
	private chartUndoRedoService: ChartUndoRedoService;

	private scoreFunctionPlotContainer: d3.Selection<any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;
	private distributionPlotContainer: d3.Selection<any>;
	private distributionRenderer: any;

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
		this.distributionPlotContainer = d3.select('.score-distribution-plot');

		if (window) {
			this.opener = window.opener;

			this.objectiveToDisplay = (<any> window.opener).objectiveToPlot;
			this.valueChartService = (<any> window.opener).valueChartService;
			this.chartUndoRedoService = (<any> window.opener).chartUndoRedoService;
		}


		this.users = this.valueChartService.users

		this.initChangeDetection();
		this.initScoreFunctionPlot();
		this.initDistributionPlot();

		this.configureDisplay();
	}

	initChangeDetection(): void {

		this.previousViewType = this.viewType;

		this.previousScoreFunctions = [];

		this.users.forEach((user: User) => {
			let currentScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName()).getMemento();
			this.previousScoreFunctions.push(currentScoreFunction);
		});
	}

	initScoreFunctionPlot(): void {

		if (this.objectiveToDisplay.getDomainType() === 'continuous') {
			this.scoreFunctionRenderer = new ContinuousScoreFunctionRenderer(this.valueChartService, this.scoreFunctionViewerService, this.chartUndoRedoService, this.ngZone);
		} else {
			this.scoreFunctionRenderer = new DiscreteScoreFunctionRenderer(this.valueChartService, this.scoreFunctionViewerService, this.chartUndoRedoService, this.ngZone);
		}

		this.scoreFunctionRenderer.createScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay);
		this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, 300, 300, 'vertical');
	}

	initDistributionPlot(): void {

	}

	configureDisplay(): void {
		if (this.viewType === 'plot') {
			this.scoreFunctionPlotContainer.attr('display', 'block');
			this.distributionPlotContainer.attr('display', 'none');
		} else if (this.viewType == 'distribution') {
			this.scoreFunctionPlotContainer.attr('display', 'none');
			this.distributionPlotContainer.attr('display', 'block');
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


		this.users.forEach((user: User, index: number) => {
			let currentScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName());
			var scoreFunctionChange: boolean = this.detectScoreFunctionChange(this.previousScoreFunctions[index], currentScoreFunction);

			if (scoreFunctionChange) {
				this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, 300, 300, 'vertical');
				// Trigger change detection in the main application:
				if (window) {
					(<any> window.opener).angularAppRef.tick();
				} else {
					this.ngOnDestroy();	// Remove the reference to this window from the parent window, seeing as this window has been destroyed.
				}

				this.previousScoreFunctions[index] = currentScoreFunction.getMemento();
			}
		})
	}

	ngOnDestroy() {
		// Remove the ScoreFunction viewer form the parent window's list of children.
		(<any> this.opener).childWindows.scoreFunctionViewer = null;
		this.sub.unsubscribe();											// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
	}
}
