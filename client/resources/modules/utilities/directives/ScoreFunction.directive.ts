/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-09 23:36:48
*/

import { Directive, Input }												from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';

// d3
import * as d3 															from 'd3';
import * as _															from 'lodash';
import { Subject }														from 'rxjs/Subject';
import '../../utilities/rxjs-operators';

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

	private scoreFunctionSubject: Subject<any>;
	private viewSubject: Subject<boolean>;	

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	ngOnInit() {
		
		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');

		this.initChangeDetection();
		this.initScoreFunctionPlot();
	}

	initChangeDetection(): void {

		if (this.enableInteraction) {
			let currentScoreFunction = this.valueChartService.getCurrentUser().getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName()).getMemento();
			this.previousScoreFunction = currentScoreFunction;
			this.previousObjectiveToDisplay = this.objectiveToDisplay;
		}	
	}

	initScoreFunctionPlot(): void {

		if (this.objectiveToDisplay.getDomainType() === 'continuous') {
			this.scoreFunctionRenderer = new ContinuousScoreFunctionRenderer(this.chartUndoRedoService);
		} else {
			this.scoreFunctionRenderer = new DiscreteScoreFunctionRenderer(this.chartUndoRedoService);
		}
		
		this.scoreFunctionSubject = new Subject();

		this.scoreFunctionSubject.map((sfU: any) => { 
			sfU.el = this.scoreFunctionPlotContainer;
			sfU.valueChart = this.valueChartService.getValueChart();
			sfU.objective = this.objectiveToDisplay;
			sfU.viewOrientation = this.viewOrientation;
			sfU.interactive = this.enableInteraction;
			
			return sfU;
		}).map(this.scoreFunctionViewerService.produceUsersDomainElements)
			.map(this.scoreFunctionViewerService.produceViewConfig)
			.subscribe(this.scoreFunctionRenderer.scoreFunctionChanged);

		this.scoreFunctionSubject.next({ width: this.plotWidth, height: this.plotHeight });
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
			this.scoreFunctionRenderer.outlineContainer.node().remove();
			this.scoreFunctionRenderer.plotContainer.node().remove();
			this.scoreFunctionRenderer = null;
			this.initScoreFunctionPlot();
			this.previousObjectiveToDisplay = this.objectiveToDisplay;
		}

		else {
			if (this.enableInteraction) {
				let currentScoreFunction = this.valueChartService.getCurrentUser().getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName());

				if (!_.isEqual(this.previousScoreFunction, currentScoreFunction)) {
					
					this.scoreFunctionSubject.next({ width: this.plotWidth, height: this.plotHeight });
					this.previousScoreFunction = currentScoreFunction.getMemento();

					// If this is a sub window, update the parent window in response to the changes.
					if (window.opener) {
						(<any>window.opener).angularAppRef.tick();
					}
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
