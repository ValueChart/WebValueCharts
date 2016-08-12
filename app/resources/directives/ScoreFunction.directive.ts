/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-12 14:52:02
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
import { ChartUndoRedoService }											from '../services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../services/ScoreFunctionViewer.service';

// Model Classes:
import { ScoreFunction }												from '../model/ScoreFunction';
import { PrimitiveObjective }											from '../model/PrimitiveObjective';
import { User }															from '../model/User';
import { UserDomainElements, DomainElement }							from '../types/ScoreFunctionViewer.types';


@Directive({
	selector: 'ScoreFunction',
	inputs: ['objective', 'height', 'width', 'orientation', 'services'],
	providers: [ScoreFunctionViewerService]
})
export class ScoreFunctionDirective implements OnInit, DoCheck {
	// Input fields:
	private objectiveToDisplay: PrimitiveObjective;
	private plotWidth: number;
	private plotHeight: number;
	private viewOrientation: string;

	// Services:
	private valueChartService: ValueChartService;
	private scoreFunctionViewerService: ScoreFunctionViewerService;
	private chartUndoRedoService: ChartUndoRedoService;

	// Renderer Fields:
	private scoreFunctionPlotContainer: d3.Selection<any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;

	// Change detection fields:
	private previousObjectiveToDisplay: PrimitiveObjective;
	private previousScoreFunction: ScoreFunction;

	private user: User;



	constructor(private ngZone: NgZone) { }

	ngOnInit() {

		this.user = this.valueChartService.getCurrentUser();

		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');

		this.initChangeDetection();
		this.initScoreFunctionPlot();
	}

	initChangeDetection(): void {

		let currentScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName()).getMemento();
		this.previousScoreFunction = currentScoreFunction;
		this.previousObjectiveToDisplay = this.objectiveToDisplay;
	}

	initScoreFunctionPlot(): void {

		if (this.objectiveToDisplay.getDomainType() === 'continuous') {
			this.scoreFunctionRenderer = new ContinuousScoreFunctionRenderer(this.valueChartService, this.scoreFunctionViewerService, this.chartUndoRedoService, this.ngZone);
		} else {
			this.scoreFunctionRenderer = new DiscreteScoreFunctionRenderer(this.valueChartService, this.scoreFunctionViewerService, this.chartUndoRedoService, this.ngZone);
		}

		this.scoreFunctionRenderer.createScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay);
		this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, this.plotWidth, this.plotHeight, this.viewOrientation);
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

		if (this.previousObjectiveToDisplay !== this.objectiveToDisplay) {
			this.initScoreFunctionPlot();
			this.previousObjectiveToDisplay = this.objectiveToDisplay;
		}

		else {
			let currentScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName());
			var scoreFunctionChange: boolean = this.detectScoreFunctionChange(this.previousScoreFunction, currentScoreFunction);

			if (scoreFunctionChange) {
				this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, this.plotWidth, this.plotHeight, this.viewOrientation);
				this.previousScoreFunction = currentScoreFunction.getMemento();
				
				// If this is a sub window, update the parent window in response to the changes.
				if (window.opener) {
					(<any> window.opener).angularAppRef.tick();
				}
			}
		}
	}

	@Input() set objective(value: any) {
		this.objectiveToDisplay = <PrimitiveObjective> value;
	}

	@Input() set width(value: any) {
		this.plotWidth = <number> value;
	}

	@Input() set height(value: any) {
		this.plotHeight = <number> value;
	}

	@Input() set orientation(value: any) {
		this.viewOrientation = <string> value;
	}

	@Input() set services(value: any) {
		this.valueChartService = value.valueChartService;
		this.chartUndoRedoService = value.chartUndoRedoService;
		this.scoreFunctionViewerService = value.scoreFunctionViewerService;
	}
}
