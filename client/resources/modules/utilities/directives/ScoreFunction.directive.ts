/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 21:35:04
*/

import { Directive, Input }												from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';
import { NgZone }														from '@angular/core';

// d3
import * as d3 															from 'd3';

// Import Application Classes:
import { ScoreFunctionRenderer }										from '../../app/renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }								from '../../app/renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }								from '../../app/renderers/ContinuousScoreFunction.renderer';

import { CurrentUserService }											from '../../app/services/CurrentUser.service';
import { ValueChartService }											from '../../app/services/ValueChart.service';
import { ChartUndoRedoService }											from '../../app/services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../../app/services/ScoreFunctionViewer.service';

// Import Model Classes:
import { ScoreFunction }												from '../../../model/ScoreFunction';
import { PrimitiveObjective }											from '../../../model/PrimitiveObjective';
import { User }															from '../../../model/User';
import { UserDomainElements, DomainElement }							from '../../../types/ScoreFunctionViewer.types';


@Directive({
	selector: 'ScoreFunction'
})
export class ScoreFunctionDirective implements OnInit, DoCheck {

	// ========================================================================================
	// 									Fields
	// ========================================================================================	

	// Input fields:
	private objectiveToDisplay: PrimitiveObjective;
	private plotWidth: number;
	private plotHeight: number;
	private viewOrientation: string;
	private individual: boolean;
	private enableInteraction: boolean;

	// Services:
	private valueChartService: ValueChartService;
	private scoreFunctionViewerService: ScoreFunctionViewerService;
	private chartUndoRedoService: ChartUndoRedoService;

	// Renderer Fields:
	private scoreFunctionPlotContainer: d3.Selection<any, any, any, any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;

	// Change detection fields:
	private previousObjectiveToDisplay: PrimitiveObjective;
	private previousScoreFunction: ScoreFunction;

	private user: User;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private ngZone: NgZone) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

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

		this.valueChartService.getCurrentUser()

		var usersDomainElements: UserDomainElements[]

		if (this.individual) {
			usersDomainElements = this.scoreFunctionViewerService.getAllUsersDomainElements(this.objectiveToDisplay, [this.valueChartService.getCurrentUser()]);
		} else {
			usersDomainElements = this.scoreFunctionViewerService.getAllUsersDomainElements(this.objectiveToDisplay, this.valueChartService.getUsers());
		}

		this.scoreFunctionRenderer.createScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, usersDomainElements, this.enableInteraction);
		this.scoreFunctionRenderer.renderScoreFunction(this.objectiveToDisplay, this.plotWidth, this.plotHeight, this.viewOrientation);
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
				this.scoreFunctionRenderer.renderScoreFunction(this.objectiveToDisplay, this.plotWidth, this.plotHeight, this.viewOrientation);
				this.previousScoreFunction = currentScoreFunction.getMemento();

				// If this is a sub window, update the parent window in response to the changes.
				if (window.opener) {
					(<any>window.opener).angularAppRef.tick();
				}
			}
		}
	}

	@Input() set objective(value: any) {
		this.objectiveToDisplay = <PrimitiveObjective>value;
	}

	@Input() set width(value: any) {
		this.plotWidth = <number>value;
	}

	@Input() set height(value: any) {
		this.plotHeight = <number>value;
	}

	@Input() set orientation(value: any) {
		this.viewOrientation = <string>value;
	}

	@Input() set services(value: any) {
		this.valueChartService = value.valueChartService;
		this.chartUndoRedoService = value.chartUndoRedoService;
		this.scoreFunctionViewerService = value.scoreFunctionViewerService;
	}

	@Input() set individualOnly(value: any) {
		this.individual = <boolean> value;
	}

	@Input() set interaction(value: any) {
		this.enableInteraction = <boolean> value;
	}
}
