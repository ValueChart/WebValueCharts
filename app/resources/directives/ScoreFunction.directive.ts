/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-20 11:33:03
*/

import { Directive, Input }												from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';
import { NgZone }														from '@angular/core';

// d3
import * as d3 															from 'd3';
	
// Application classes:
import { ScoreFunctionRenderer }										from '../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }								from '../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }								from '../renderers/ContinuousScoreFunction.renderer';
import { ScoreDistributionChartRenderer }								from '../renderers/ScoreDistributionChart.renderer';

import { CurrentUserService }											from '../services/CurrentUser.service';
import { ValueChartService }											from '../services/ValueChart.service';
import { ScoreFunctionViewerService }									from '../services/ScoreFunctionViewer.service';
import { ChartUndoRedoService }											from '../services/ChartUndoRedo.service';
import { ChangeDetectionService }										from '../services/ChangeDetection.service';

// Model Classes:
import { ScoreFunction }												from '../model/ScoreFunction';
import { PrimitiveObjective }											from '../model/PrimitiveObjective';
import { User }															from '../model/User';
import { UserDomainElements, DomainElement }							from '../types/ScoreFunctionViewer.types';


@Directive({
	selector: 'ScoreFunctionDirective',
	inputs: ['objective'],
	providers: [ChartUndoRedoService,ChangeDetectionService,ScoreFunctionViewerService]
})
export class ScoreFunctionDirective implements OnInit, DoCheck {

	private scoreFunctionPlotContainer: d3.Selection<any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;

	private objectiveToDisplay: PrimitiveObjective;
	private previousScoreFunction: ScoreFunction;

	private viewType: string;
	private previousViewType: string;

	private user: User;

	constructor(
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private scoreFunctionViewerService: ScoreFunctionViewerService,
		private chartUndoRedoService: ChartUndoRedoService,
		private changeDetectionService: ChangeDetectionService,
		private ngZone: NgZone) { }

	ngOnInit() {

		this.user = this.valueChartService.getCurrentUser();

		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');

		this.initChangeDetection();
		this.initScoreFunctionPlot();

		this.configureDisplay();
	}

	initChangeDetection(): void {

		this.previousViewType = this.viewType;

		let currentScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName()).getMemento();
		this.previousScoreFunction = currentScoreFunction;
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

	configureDisplay(): void {
		this.scoreFunctionPlotContainer.attr('display', 'block');
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

		let currentScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName());
		var scoreFunctionChange: boolean = this.detectScoreFunctionChange(this.previousScoreFunction, currentScoreFunction);

		if (scoreFunctionChange) {
			this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, 300, 300, 'vertical');
			this.previousScoreFunction = currentScoreFunction.getMemento();
		}
	}

	@Input() set objective(value: any) {
		this.objectiveToDisplay = <PrimitiveObjective> value;
	}
}
