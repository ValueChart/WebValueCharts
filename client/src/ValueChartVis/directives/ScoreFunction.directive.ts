/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-19 12:11:42
*/

import { Directive, Input }												from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';

// d3
import * as d3 															from 'd3';
import * as _															from 'lodash';
import { Subject }														from 'rxjs/Subject';
import { Subscription }													from 'rxjs/Subscription';
import '../../app/utilities/rxjs-operators';

// Import Application Classes:
import { ScoreFunctionRenderer }										from '../../ValueChartVis';
import { DiscreteScoreFunctionRenderer }								from '../../ValueChartVis';
import { ContinuousScoreFunctionRenderer }								from '../../ValueChartVis';

import { ExpandScoreFunctionInteraction }								from '../../ValueChartVis';

import { ChartUndoRedoService }											from '../../ValueChartVis';
import { RendererScoreFunctionUtility }									from '../../ValueChartVis';

// Import Model Classes:
import { ScoreFunction }												from '../../model';
import { PrimitiveObjective }											from '../../model';
import { ScoreFunctionUpdate, ScoreFunctionConfig }						from '../../types';
import { ChartOrientation }												from '../../types';


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
	@Input() viewOrientation: ChartOrientation;
	@Input() individual: boolean;
	@Input() enableInteraction: boolean;

	// Services:
	private rendererScoreFunctionUtility: RendererScoreFunctionUtility;
	private chartUndoRedoService: ChartUndoRedoService;

	// Renderer Fields:
	private scoreFunctionPlotContainer: d3.Selection<any, any, any, any>;
	private scoreFunctionRenderer: ScoreFunctionRenderer;

	// Change detection fields:
	private previousObjectiveToDisplay: PrimitiveObjective;
	private previousScoreFunctions: ScoreFunction[];
	private previousEnableInteraction: boolean;

	private scoreFunctionSubject: Subject<any>;
	private viewConfigSubject: Subject<boolean>;	
	private interactionSubject: Subject<any>;
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
		this.rendererScoreFunctionUtility = new RendererScoreFunctionUtility();

		this.initChangeDetection();
		this.initScoreFunctionPlot();
	}

	initChangeDetection(): void {
		this.previousScoreFunctions = _.cloneDeep(this.scoreFunctions);
		this.previousObjectiveToDisplay = _.cloneDeep(this.objective);
		this.previousEnableInteraction = _.clone(this.enableInteraction);
	}

	initScoreFunctionPlot(): void {

		if (this.objective.getDomainType() === 'continuous') {
			this.scoreFunctionRenderer = new ContinuousScoreFunctionRenderer(this.chartUndoRedoService);
		} else {
			this.scoreFunctionRenderer = new DiscreteScoreFunctionRenderer(this.chartUndoRedoService);
		}
		
		this.scoreFunctionSubject = new Subject();
		this.interactionSubject = new Subject();

		this.rendererSubscription = this.scoreFunctionSubject.map((sfU: ScoreFunctionUpdate) => { 
			sfU.el = this.scoreFunctionPlotContainer;
			sfU.objective = this.objective;
			
			return sfU;
		}).map(this.rendererScoreFunctionUtility.produceScoreFunctionData)
			.map(this.rendererScoreFunctionUtility.produceViewConfig)
			.subscribe(this.scoreFunctionRenderer.scoreFunctionChanged);

		this.interactionSubject.subscribe(this.scoreFunctionRenderer.interactionConfigChanged);

		this.scoreFunctionSubject.next(
			{ 
				width: this.width, 
				height: this.height, 				
				colors: this.colors,
				scoreFunctions: this.scoreFunctions,
				viewOrientation: this.viewOrientation,
				interactionConfig: { expandScoreFunctions: false, adjustScoreFunctions: this.enableInteraction },
				individual: this.individual
			});

		this.interactionSubject.next({ expandScoreFunctions: false, adjustScoreFunctions: this.enableInteraction });
	}

	ngDoCheck() {

		if (this.previousObjectiveToDisplay.getName() !== this.objective.getName()) {
			this.rendererSubscription.unsubscribe();
			this.previousObjectiveToDisplay = _.cloneDeep(this.objective);
			this.initScoreFunctionPlot();
		}

		if (this.enableInteraction !== this.previousEnableInteraction) {
			this.interactionSubject.next({ expandScoreFunctions: false, adjustScoreFunctions: this.enableInteraction });
			this.previousEnableInteraction = _.clone(this.enableInteraction);
		}

		if (!_.isEqual(this.previousScoreFunctions, this.scoreFunctions)) {
			
			this.scoreFunctionSubject.next(
				{
					width: this.width, 
					height: this.height, 
					interactionConfig: { expandScoreFunctions: false, adjustScoreFunctions: this.enableInteraction },
					colors: this.colors,
					scoreFunctions: this.scoreFunctions,
					viewOrientation: this.viewOrientation,
					individual: this.individual
					});
			
			this.previousScoreFunctions = _.cloneDeep(this.scoreFunctions);

			// If this is a sub window, update the parent window in response to the changes.
			if (window.opener) {
				(<any>window.opener).angularAppRef.tick();
			}
		}
	}

}
