/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-10 13:22:23
*/

import { Directive, Input }												from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';

// d3
import * as d3 															from 'd3';
import * as _															from 'lodash';
import { Subject }														from 'rxjs/Subject';
import { Subscription }														from 'rxjs/Subscription';
import '../../utilities/rxjs-operators';

// Import Application Classes:
import { ScoreFunctionRenderer }										from '../../app/renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }								from '../../app/renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }								from '../../app/renderers/ContinuousScoreFunction.renderer';

import { ExpandScoreFunctionInteraction }								from '../../app/interactions/ExpandScoreFunction.interaction';

import { ChartUndoRedoService }											from '../../app/services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../../app/services/ScoreFunctionViewer.service';

// Import Model Classes:
import { ScoreFunction }												from '../../../model/ScoreFunction';
import { PrimitiveObjective }											from '../../../model/PrimitiveObjective';


@Directive({
	selector: 'ScoreFunction'
})
export class ScoreFunctionDirective implements OnInit, DoCheck {

	// ========================================================================================
	// 									Fields
	// ========================================================================================	

	// Input fields:
	@Input() scoreFunctions: ScoreFunction[];
	@Input() colors: string[];
	@Input() objective: PrimitiveObjective;
	@Input() width: number;
	@Input() height: number;
	@Input() viewOrientation: string;
	@Input() individualOnly: boolean;
	@Input() enableInteraction: boolean;

	// Services:
	private scoreFunctionViewerService: ScoreFunctionViewerService;
	private chartUndoRedoService: ChartUndoRedoService;

	// Renderer Fields:
	private scoreFunctionPlotContainer: d3.Selection<any, any, any, any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;

	// Change detection fields:
	private previousObjectiveToDisplay: PrimitiveObjective;
	private previousScoreFunctions: ScoreFunction[];

	private scoreFunctionSubject: Subject<any>;
	private viewSubject: Subject<boolean>;	
	private rendererSubscription: Subscription;

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

	@Input() set services(value: any) {
		this.chartUndoRedoService = value.chartUndoRedoService;
	}

	ngOnInit() {		
		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');
		this.scoreFunctionViewerService = new ScoreFunctionViewerService();

		this.initChangeDetection();
		this.initScoreFunctionPlot();
	}

	initChangeDetection(): void {
		this.previousScoreFunctions = _.cloneDeep(this.scoreFunctions);
		this.previousObjectiveToDisplay = _.cloneDeep(this.objective);
	}

	initScoreFunctionPlot(): void {

		if (this.objective.getDomainType() === 'continuous') {
			this.scoreFunctionRenderer = new ContinuousScoreFunctionRenderer(this.chartUndoRedoService, new ExpandScoreFunctionInteraction(null, null));
		} else {
			this.scoreFunctionRenderer = new DiscreteScoreFunctionRenderer(this.chartUndoRedoService, new ExpandScoreFunctionInteraction(null, null));
		}
		
		this.scoreFunctionSubject = new Subject();

		this.rendererSubscription = this.scoreFunctionSubject.map((sfU: any) => { 
			sfU.el = this.scoreFunctionPlotContainer;
			sfU.objective = this.objective;
			sfU.colors = this.colors;
			sfU.scoreFunctions = this.scoreFunctions;
			sfU.viewOrientation = this.viewOrientation;
			sfU.interactive = this.enableInteraction;
			
			return sfU;
		}).map(this.scoreFunctionViewerService.produceUsersDomainElements)
			.map(this.scoreFunctionViewerService.produceViewConfig)
			.subscribe(this.scoreFunctionRenderer.scoreFunctionChanged);

		this.scoreFunctionSubject.next({ width: this.width, height: this.height });
	}

	ngDoCheck() {

		if (this.previousObjectiveToDisplay !== this.objective) {
			this.rendererSubscription.unsubscribe();
			this.previousObjectiveToDisplay = _.cloneDeep(this.objective);
			this.initScoreFunctionPlot();
		}

		else {
			if (this.enableInteraction) {

				if (!_.isEqual(this.previousScoreFunctions, this.scoreFunctions)) {
					
					this.scoreFunctionSubject.next({ width: this.width, height: this.height });
					this.previousScoreFunctions = _.cloneDeep(this.scoreFunctions);

					// If this is a sub window, update the parent window in response to the changes.
					if (window.opener) {
						(<any>window.opener).angularAppRef.tick();
					}
				}
			}
		}
	}

}
