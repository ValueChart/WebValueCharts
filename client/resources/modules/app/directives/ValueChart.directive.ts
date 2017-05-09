/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-09 15:29:54
*/

// Import Angular Classes:
import { Directive, Input } 													from '@angular/core';
import { OnInit, DoCheck, SimpleChange }										from '@angular/core';
import { ElementRef }															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';
import * as _ 																	from 'lodash';
import { Observable }															from 'rxjs/Observable';
import { Subscription } 														from 'rxjs/Subscription';
import { Subject }																from 'rxjs/Subject';
import '../../utilities/rxjs-operators';


// Import Application Classes:
// Services:
import { ValueChartService}														from '../services/ValueChart.service';
import { RendererDataService}													from '../services/RendererData.service';
import { RenderConfigService }													from '../services/RenderConfig.service';
import { ChartUndoRedoService }													from '../services/ChartUndoRedo.service';
import { ChangeDetectionService }												from '../services/ChangeDetection.service';
// Renderers:
import { ObjectiveChartRenderer }												from '../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }													from '../renderers/SummaryChart.renderer';
import { LabelRenderer }														from '../renderers/Label.renderer';

// Definitions:
import { LabelDefinitions }														from '../services/LabelDefinitions.service';

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
		private valueChartService: ValueChartService,
		private rendererDataService: RendererDataService,
		private chartUndoRedoService: ChartUndoRedoService,
		private renderConfigService: RenderConfigService,
		private changeDetectionService: ChangeDetectionService,
		// Renderers:
		private objectiveChartRenderer: ObjectiveChartRenderer,
		private summaryChartRenderer: SummaryChartRenderer,
		private labelRenderer: LabelRenderer,
		// Definitions:
		private labelDefinitions: LabelDefinitions) { }


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
		// Configure ValueChart size.
		this.calculateDefaultComponentSize();
		this.renderConfigService.viewConfig = this.viewConfig;
		this.renderConfigService.initUserColors();
		this.rendererDataService.recordOriginalAlternativeOrder(this.valueChart);

		// Configure the directive for the input data:
		// this.configureChartData();

		// Initialize Change Detection:
		this.changeDetectionService.startChangeDetection(this.valueChart, this.width, this.height, this.viewConfig, this.interactionConfig);

		this.valueChartSubject 	= new Subject();
		this.interactionSubject = new Subject();
		this.viewConfigSubject 	= new Subject();

		// Create the Visual Elements of the ValueChart.
		this.createValueChart();

		// Set initialization to be complete.
		this.isInitialized = true;
	}

	/*
		@returns {void}
		@description	Calculates the default size of ValueChart components (labels, summary chart, objective chart) depending on the input width 
						and height of the ValueChart.
	*/
	calculateDefaultComponentSize(): void {
		this.defaultChartComponentWidth = (this.width * this.renderConfigService.CHART_COMPONENT_RATIO);
		this.defaultChartComponentHeight = (this.height * this.renderConfigService.CHART_COMPONENT_RATIO);
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

		var renderInformation = this.valueChartSubject.map((valueChart: ValueChart) => {
			return { el: this.el, valueChart: valueChart, height: this.defaultChartComponentHeight, width: this.defaultChartComponentWidth, viewConfig: this.viewConfig, interactionConfig: this.interactionConfig };
		}).map(this.rendererDataService.produceRowData)
			.map(this.rendererDataService.produceLabelData)
			.map(this.renderConfigService.produceRendererConfig);

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

		this.valueChartSubject.next(this.valueChart);
		this.interactionSubject.next(this.interactionConfig);
		this.viewConfigSubject.next(this.viewConfig);
	}

	// ========================================================================================
	// 								Change Detection Methods:
	// ========================================================================================

	/*
		@returns {void}
		@description	Detects and handles any changes to the directive's inputs (data, and view + interactions). This method is called by Angular whenever it detects that a change to this directive's inputs 
						MAY have occurred. The method body is an implementation of change detection for the directive's various inputs. We are implementing our own change detection because 
						Angular's change detection (provided by the ngOnChanges method) is by reference. Note that when a a class implements DoCheck, ngOnChanges is never called, even if
						the class also implements OnChanges. This means that changes must be both detected, and handled in ngDoCheck.
	*/
	ngDoCheck() {
		// DO NOT proceed with change detection if the directive has not yet been initialized.
		if (this.isInitialized === undefined)
			return;

		if (this.changeDetectionService.detectChanges(this.valueChart, this.viewConfig, this.interactionConfig)) {
			// TODO <@aaron> : Remove this temporary call to initUserColors.
			this.renderConfigService.initUserColors();
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
		}
	}
}