/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-19 12:37:35
*/

// Import Angular Classes:
import { Directive, Input, Output, } 											from '@angular/core';
import { OnInit, DoCheck }														from '@angular/core';
import { ElementRef }															from '@angular/core';
import { EventEmitter }															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';
import { Observable }															from 'rxjs/Observable';
import { Subscription } 														from 'rxjs/Subscription';
import { Subject }																from 'rxjs/Subject';
import '../../utilities/rxjs-operators';


// Import Application Classes:
// Services:
import { RenderEventsService }													from '../services/RenderEvents.service';
import { RendererService }														from '../services/Renderer.service';
import { ChartUndoRedoService }													from '../services/ChartUndoRedo.service';
import { ChangeDetectionService }												from '../services/ChangeDetection.service';
// Renderers:
import { ObjectiveChartRenderer }												from '../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }													from '../renderers/SummaryChart.renderer';
import { LabelRenderer }														from '../renderers/Label.renderer';
// Utilities
import { RendererDataUtility }													from '../utilities/RendererData.utility';
import { RendererConfigUtility }												from '../utilities/RendererConfig.utility';
import { RendererScoreFunctionUtility }											from '../utilities/RendererScoreFunction.utility';
// Interactions
import { ReorderObjectivesInteraction }											from '../interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }												from '../interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }											from '../interactions/SortAlternatives.interaction';
import { SetObjectiveColorsInteraction }										from '../interactions/SetObjectiveColors.interaction';
import { ExpandScoreFunctionInteraction }										from '../interactions/ExpandScoreFunction.interaction';


// Import Model Classes:
import { ValueChart } 															from '../../../model/ValueChart';
import { PrimitiveObjective }													from '../../../model/PrimitiveObjective';
import { WeightMap }															from '../../../model/WeightMap';
import { User }																	from '../../../model/User';
import { ScoreFunction }														from '../../../model/ScoreFunction';

// Import Types:
import { RowData, CellData, LabelData }											from '../../../types/RendererData.types';
import { ViewConfig, InteractionConfig }										from '../../../types/Config.types';

@Directive({
	selector: 'ValueChart',
	providers: [
		// Services:
		ChangeDetectionService,
		RenderEventsService,
		ChartUndoRedoService,
		RendererService,
		// Utilities:
		RendererScoreFunctionUtility,
		RendererDataUtility,
		RendererConfigUtility,
		// Renderers:
		ObjectiveChartRenderer,
		SummaryChartRenderer,
		LabelRenderer,
		// Interactions:
		ReorderObjectivesInteraction,
		ResizeWeightsInteraction,
		SortAlternativesInteraction,
		SetObjectiveColorsInteraction,
		ExpandScoreFunctionInteraction,
	]
})
export class ValueChartDirective implements OnInit, DoCheck {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Directive Inputs: 
	//		'valueChart', 							// The data to be rendered. Must be an instance of the ValueChart class.
	// 		'width',								// The width of the area in which to render the ValueChart. Must be a number.
	// 		'height',								// The height of the area in which to render the ValueChart. Must be a number.
	// 		'viewConfig',							// Options for configuring the ValueChart's appearance. Must be of type ViewConfig.
	// 		'interactionConfig',					// Options for configuring enabled and disabled interactions. Must be of type InteractionConfig. 


	// Chart Inputs:
	@Input() private valueChart: ValueChart;								// The main data input to the directive.
	@Input() private width: number;											// The width of the ValueChart.
	@Input() private height: number;										// The Height of the ValueChart.
	@Input() private viewConfig: ViewConfig = <any>{};						// Configuration options for view settings;
	@Input() private interactionConfig: InteractionConfig = <any>{};		// Configuration options for user interactions.

	// Chart Outputs:
	@Output() undoRedo: EventEmitter<ChartUndoRedoService> = new EventEmitter();		// Output the ChartUndoRedoService so that external modules may interface with it.
	@Output() renderEvents: EventEmitter<RenderEventsService> = new EventEmitter();			// Output the renderEventsService so that external modules may listen to render events.

	public CHART_COMPONENT_RATIO: number = 0.47;							// This ratio is used to determine the default size of the ValueChart components. e.x. componentHeight = ValueChartHeight * CHART_COMPONENT_RATIO. 

	// d3 Selections:
	private el: d3.Selection<any, any, any, any>; 							// The SVG base element for the ValueChart.

	// Default Size of ValueChart components. These components are the: labels, objective chart, summary chart. 
	private defaultChartComponentWidth: number;
	private defaultChartComponentHeight: number;

	public valueChartSubject: Subject<ValueChart>;
	public interactionSubject: Subject<InteractionConfig>;
	public viewConfigSubject: Subject<ViewConfig>;

	// Misc. Fields
	private isInitialized: boolean;								// Is the directive initialized. Used to prevent change detection from activating before initialization is complete.
	private waitForRenderers: Subscription;


	public renderRequired: { value: boolean } = { value: false };

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						Any initialization that needs to be done should be placed in the ngOnInit method.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this directive when it is used.
	*/
	constructor(
		// Angular Resources:
		private elementRef: ElementRef,
		// Services:
		private renderEventsService: RenderEventsService,
		private chartUndoRedoService: ChartUndoRedoService,
		private rendererService: RendererService,
		private changeDetectionService: ChangeDetectionService,
		// Renderers:
		private objectiveChartRenderer: ObjectiveChartRenderer,
		private summaryChartRenderer: SummaryChartRenderer,
		private labelRenderer: LabelRenderer,
		// Utilities:
		private rendererDataUtility: RendererDataUtility,
		private rendererConfigUtility: RendererConfigUtility) { }


	// ========================================================================================
	//								Initialization Methods
	// ========================================================================================

	/* 	
		@returns {void}
		@description 	Initializes the ValueChartDirective. ngOnInit is called by Angular AFTER the first change detection cycle (i.e. ngDoCheck is called once)
						and after the input variables are initialized. ngOnInit is only called ONCE by Angular. This function is thus used for one-time initialized only. 
						Calling ngOnInit should be left to Angular. Do not call it manually.
	*/
	ngOnInit() {
		this.undoRedo.emit(this.chartUndoRedoService);
		this.renderEvents.emit(this.renderEventsService);

		// Configure ValueChart size.
		this.calculateDefaultComponentSize();
		this.rendererService.initUserColors(this.valueChart);

		// Initialize Change Detection:
		this.changeDetectionService.startChangeDetection(this.valueChart, this.width, this.height, this.viewConfig, this.interactionConfig);

		this.valueChartSubject 	= new Subject();
		this.interactionSubject = new Subject();
		this.viewConfigSubject 	= new Subject();

		// Create the Visual Elements of the ValueChart.
		this.createValueChart();
	}

	/*
		@returns {void}
		@description	Calculates the default size of ValueChart components (labels, summary chart, objective chart) depending on the input width 
						and height of the ValueChart.
	*/
	calculateDefaultComponentSize(): void {
		this.defaultChartComponentWidth = (this.width * this.CHART_COMPONENT_RATIO);
		this.defaultChartComponentHeight = (this.height * this.CHART_COMPONENT_RATIO);
	}

	/*
		@returns {void}
		@description	Creates the ValueChart for the first time. It creates the SVG element that will contain the ValueChart, and then uses 
						the renderer classes to create and render each component of the ValueChart.

	*/
	createValueChart(): void {
		// Create the SVG base element, and set it to fit to the input width and height:
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed('ValueChart svg-content-valuechart', true)
			.attr('viewBox', '0 -10' + ' ' + this.width + ' ' + this.height)
			.attr('preserveAspectRatio', 'xMinYMin meet');

		var renderInformation = new Subject();

		this.valueChartSubject.map((valueChart: ValueChart) => {
			return { el: this.el, valueChart: valueChart, height: this.defaultChartComponentHeight, width: this.defaultChartComponentWidth, viewConfig: this.viewConfig, interactionConfig: this.interactionConfig, renderRequired: this.renderRequired };
		}).map(this.rendererDataUtility.produceMaximumWeightMap)
			.map(this.rendererDataUtility.produceRowData)
			.map(this.rendererDataUtility.produceLabelData)
			.map(this.rendererConfigUtility.produceRendererConfig)
			.subscribe(renderInformation);

		renderInformation
			.subscribe(this.summaryChartRenderer.valueChartChanged);

		renderInformation
			.subscribe(this.objectiveChartRenderer.valueChartChanged);

		renderInformation
			.subscribe(this.labelRenderer.valueChartChanged)

		this.interactionSubject.subscribe(this.summaryChartRenderer.interactionsChanged);
		this.interactionSubject.subscribe(this.objectiveChartRenderer.interactionsChanged);
		this.interactionSubject.subscribe(this.labelRenderer.interactionsChanged);

		this.viewConfigSubject.subscribe(this.summaryChartRenderer.viewConfigChanged);
		this.viewConfigSubject.subscribe(this.objectiveChartRenderer.viewConfigChanged);
		this.viewConfigSubject.subscribe(this.labelRenderer.viewConfigChanged);

		this.waitForRenderers = this.renderEventsService.rendersCompleted.subscribe(this.rendersCompleted);

		this.valueChartSubject.next(this.valueChart);
	}

	rendersCompleted = (rendersCompleted: number) => {
		if (rendersCompleted >= 3) {
			this.interactionSubject.next(this.interactionConfig);
			this.viewConfigSubject.next(this.viewConfig);
			// Unsubscribe and set initialization to be complete.
			this.waitForRenderers.unsubscribe();
			this.isInitialized = true;
		}
	}

	// ========================================================================================
	// 								Change Detection Methods:
	// ========================================================================================

	/*
		@returns {void}s
		@description	Detects and handles any changes to the directive's inputs (data, and view + interactions). This method is called by Angular whenever it detects that a change to this directive's inputs 
						MAY have occurred. The method body is an implementation of change detection for the directive's various inputs. We are implementing our own change detection because 
						Angular's change detection (provided by the ngOnChanges method) is by reference. Note that when a a class implements DoCheck, ngOnChanges is never called, even if
						the class also implements OnChanges. This means that changes must be both detected, and handled in ngDoCheck.
	*/
	ngDoCheck() {
		// DO NOT proceed with change detection if the directive has not yet been initialized.
		if (this.isInitialized === undefined)
			return;

		if (this.changeDetectionService.detectChanges(this.valueChart, this.viewConfig, this.interactionConfig, this.renderRequired.value)) {
			this.renderRequired.value = false;
			this.rendererService.initUserColors(this.valueChart);
			this.valueChartSubject.next(this.valueChart);
		}

		if (this.changeDetectionService.detectViewConfigChanges(this.viewConfig))
			this.viewConfigSubject.next(this.viewConfig);

		if (this.changeDetectionService.detectInteractionConfigChanges(this.interactionConfig))
			this.interactionSubject.next(this.interactionConfig);

		if (this.changeDetectionService.detectWidthHeightChanges(this.width, this.height)) {
			this.el.attr('viewBox', '0 -10' + ' ' + this.width + ' ' + this.height);
			this.calculateDefaultComponentSize();
			this.valueChartSubject.next(this.valueChart);
			this.interactionSubject.next(this.interactionConfig);
		}
	}
}