/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 21:35:20
*/

// Import Angular Classes:
import { Component }													from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';
import { NgZone }														from '@angular/core';
import { Router, ActivatedRoute }										from '@angular/router';

// Import Libraries:
import * as d3 															from 'd3';

// Import Application Classes:
import { ScoreFunctionRenderer }										from '../../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }								from '../../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }								from '../../renderers/ContinuousScoreFunction.renderer';
import { ScoreDistributionChartRenderer }								from '../../renderers/ScoreDistributionChart.renderer';

import { ValueChartService }											from '../../services/ValueChart.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';

import { ScoreFunctionDirective }										from '../../../utilities/directives/ScoreFunction.directive';

// Import Model Classes:
import { ScoreFunction }												from '../../../../model/ScoreFunction';
import { PrimitiveObjective }											from '../../../../model/PrimitiveObjective';
import { User }															from '../../../../model/User';
import { UserDomainElements, DomainElement }							from '../../../../types/ScoreFunctionViewer.types';

/*
	This component implements the expanded score function plot page. The expanded score function plot page is a pop-up window that opens when a
	user double clicks on an embedded score function plot in a ValueChart visualization (although this only happens if the interaction is enabled).
	The ScoreFunctionViewerComponent displays multi-user score function plots in a larger size than is possible within a ValueChart visualization using
	the ScoreFunctionDirective class. It also has a score distribution graph made up of box plots that is created by the ScoreDistributionChartRenderer.

	This component has several features that are different from other components in the application because it is ONLY displayed in a pop-up window.
	Firstly, all data services and ValueChart data are obtained through a reference to the opening window rather than through angular. This is because the
	pop-up window is actually a completely new Angular application, and its data services are not initialized. ScoreFunctionViewerComponent also uses the
	reference to the opening window to trigger change detection in the main application. This allows any changes made to the expanded score function plot
	to be immediately reflected in the main ValueChart visualization.
*/

@Component({
	selector: 'ScoreFunctionViewer',
	templateUrl: 'client/resources/modules/app/components/ScoreFunctionViewer/ScoreFunctionViewer.template.html',
})
export class ScoreFunctionViewerComponent implements OnInit, OnDestroy, DoCheck {

	// ========================================================================================
	// 									Fields
	// ========================================================================================	

	private sub: any;
	private opener: Window;

	private valueChartService: ValueChartService;
	private scoreFunctionViewerService: ScoreFunctionViewerService;
	private chartUndoRedoService: ChartUndoRedoService;

	private services: any = {};

	private scoreFunctionPlotContainer: d3.Selection<any, any, any, any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;
	private scoreDistributionChartContainer: d3.Selection<any, any, any, any>;
	private scoreDistributionChartRenderer: ScoreDistributionChartRenderer;

	private users: User[];
	private objectiveToDisplay: PrimitiveObjective;
	private enableInteraction: boolean;
	private previousScoreFunctions: ScoreFunction[];

	private viewType: string;
	private previousViewType: string;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private ngZone: NgZone,
		private router: Router,
		private route: ActivatedRoute) { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// ================================ Life-cycle Methods ====================================

	/* 	
		@returns {void}
		@description 	Initializes the ScoreFunctionViewer. ngOnInit is only called ONCE by Angular. This function is thus used for one-time initialized only. 
						Calling ngOnInit should be left to Angular. Do not call it manually. All initialization logic for the component should be put in this
						method rather than in the constructor.
	*/
	ngOnInit() {
		this.sub = this.route.params.subscribe(params => this.viewType = params['viewType']);

		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');
		this.scoreDistributionChartContainer = d3.select('.score-distribution-plot');

		if (window) {
			this.opener = window.opener;

			this.objectiveToDisplay = (<any>window.opener).objectiveToPlot;
			this.valueChartService = (<any>window.opener).valueChartService;
			this.chartUndoRedoService = (<any>window.opener).chartUndoRedoService;
			this.enableInteraction = (<any>window.opener).enableInteraction;
			this.scoreFunctionViewerService = new ScoreFunctionViewerService(this.valueChartService);
		}

		this.services.valueChartService = this.valueChartService;
		this.services.chartUndoRedoService = this.chartUndoRedoService;
		this.services.scoreFunctionViewerService = this.scoreFunctionViewerService;

		this.previousViewType = this.viewType;

		this.users = this.valueChartService.getUsers();
		this.initDistributionPlot();
		this.configureDisplay();
	}

	ngDoCheck() {

		if (this.viewType !== this.previousViewType) {
			this.previousViewType = this.viewType;
			this.configureDisplay();
		}
	}

	ngOnDestroy() {
		// Remove the ScoreFunction viewer form the parent window's list of children.
		(<any>this.opener).childWindows.scoreFunctionViewer = null;
		this.sub.unsubscribe();											// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
	}

	// ================================ Other Methods ====================================


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
}
