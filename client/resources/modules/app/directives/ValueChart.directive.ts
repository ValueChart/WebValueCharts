/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-08 17:58:20
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
	//		'valueChart', 						// The data to be rendered. Must be an instance of the ValueChart class.
	// 		'width',								// The width of the area in which to render the ValueChart. Must be a number.
	// 		'height',								// The height of the area in which to render the ValueChart. Must be a number.
	// 		'viewConfig',							// Options for configuring the ValueChart's appearance. Must be of type ViewConfig.
	// 		'interactionConfig',					// Options for configuring enabled and disabled interactions. Must be of type InteractionConfig. 


	// Chart Inputs:
	@Input() private valueChart: ValueChart;								// The main data input to the directive.
	@Input() private width: number;										// The width of the ValueChart.
	@Input() private height: number;										// The Height of the ValueChart.
	@Input() private viewConfig: ViewConfig = <any>{};					// Configuration options for view settings;
	@Input() private interactionConfig: InteractionConfig = <any>{};		// Configuration options for user interactions.

	// d3 Selections:
	private el: d3.Selection<any, any, any, any>; 				// The SVG base element for the ValueChart.

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

		// Configure the directive for the input data:
		this.configureChartData();

		// Initialize Change Detection:
		this.changeDetectionService.startChangeDetection(this.valueChart, this.width, this.height, this.renderConfigService.viewConfig, this.interactionConfig);

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
		@description	Configures ValueChartViewerService and RenderConfigService using the directive's input data. This must be done before
						constructing and/or rendering a ValueChart for the first time as these services are what provide data to the renderer classes.
	*/
	configureChartData(): void {
		// Configure ValueChartViewerService.
		this.rendererDataService.initialize();
		this.rendererDataService.updateAllValueChartData(this.renderConfigService.viewConfig.viewOrientation);

		// Configure RenderConfigService.
		this.renderConfigService.viewConfig.viewOrientation = this.renderConfigService.viewConfig.viewOrientation;
		this.renderConfigService.initUserColors();
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
		});

		var rowRenderInformation = renderInformation.map(this.rendererDataService.produceRowData);

		rowRenderInformation
			.subscribe(this.summaryChartRenderer.valueChartChanged);

		rowRenderInformation
			.subscribe(this.objectiveChartRenderer.valueChartChanged);

		renderInformation.map(this.rendererDataService.produceLabelData)
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

	/*
		@returns {void}
		@description	Creates and renders the labels using the LabelRenderer. This is used more frequently than the other component create + render calls so it
						is encapsulated in its own method. 
	*/
	createLabels(): void {
		this.labelRenderer.createLabelSpace(this.el, this.rendererDataService.getLabelData(), this.valueChartService.getPrimitiveObjectives(), this.interactionConfig.adjustScoreFunctions);
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getLabelData(), this.labelDefinitions.ROOT_CONTAINER_NAME, this.viewConfig, this.valueChartService.getPrimitiveObjectives());
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

		this.changeDetectionService.detectChanges(this.valueChart, this.width, this.height, this.viewConfig, this.interactionConfig);

		// Check for the Changes to the input data.
		this.detectDataModelChanges();			// Check for and handle changes to the ValueChart.
		this.detectDataOrderChanges();			// Check for and handle changes to the objective and alternative orderings. 

		this.detectViewConfigChanges();			// Check for and handle changes to the view config.
		this.detectInteractionConfigChanges();	// Check for and handle changes to the interaction config.
	}

	/*
		@returns {void}
		@description	Check for and handle changes to the ValueChart input to the directive.
	*/
	detectDataModelChanges(): void {
		// Check to see if users have been added to deleted.
		if (this.valueChartService.getUsers().length !== this.changeDetectionService.usersRecord) {
			this.updateUsers();
			this.updateValueChartDisplay()
			return;
		}

		if (!_.isEqual(this.valueChartService.getValueChart(), this.changeDetectionService.valueChartRecord)) {
			this.valueChartSubject.next(this.valueChart);

			this.changeDetectionService.valueChartRecord = _.cloneDeep(this.valueChartService.getValueChart());
			return; 
		}

		// Check for and handle changes to the objectives' colors.
		if (this.changeDetectionService.colorsHaveChanged) {
			// Objective colors have been changed
			this.changeDetectionService.colorsHaveChanged = false;
			this.updateObjectiveOrder();
			this.updateValueChartDisplay();
		}
	}

	/*
		@returns {void}
		@description	Check for and handle changes to the Alternative and Objective orderings.
	*/
	detectDataOrderChanges(): void {
		// Check for and handle changes to the alternative ordering.
		if (this.changeDetectionService.alternativeOrderChanged) {
			this.changeDetectionService.alternativeOrderChanged = false;
			this.valueChartSubject.next(this.valueChart);
		}

		// Check for and handle changes to the objective ordering.
		if (this.changeDetectionService.objectiveOrderChanged) {
			this.changeDetectionService.objectiveOrderChanged = false;
			// Set alternative order changed to false as well since updating the objective order will update the alternative order.
			this.changeDetectionService.alternativeOrderChanged = false;
			this.updateObjectiveOrder();
			this.updateValueChartDisplay();
		}
	}

	/*
		@returns {void}
		@description	Check for and handle changes to the ValueChart's orientation, size, and display options.
	*/
	detectViewConfigChanges(): void {
		// Change for and handle changes to the orientation.
		if (this.changeDetectionService.viewConfigRecord.viewOrientation !== this.renderConfigService.viewConfig.viewOrientation) {
			this.changeDetectionService.viewConfigRecord.viewOrientation = this.renderConfigService.viewConfig.viewOrientation;
			
			this.valueChartSubject.next(this.valueChart);
		}
		// Change for and handle changes to the width and height of the ValueChart.
		if (this.changeDetectionService.widthRecord !== this.width || this.changeDetectionService.heightRecord !== this.height) {
			this.changeDetectionService.widthRecord = this.width;
			this.changeDetectionService.heightRecord = this.height;
			this.el.attr('viewBox', '0 -10' + ' ' + this.width + ' ' + this.height);
			this.calculateDefaultComponentSize();
			this.updateViewOrientation();
		}

		// Change for and handle changes to the display options:

		if (!_.isEqual(this.renderConfigService.viewConfig, this.changeDetectionService.viewConfigRecord)) {
			if (this.viewConfig.displayScoreFunctions != this.changeDetectionService.viewConfigRecord.displayScoreFunctions)
				this.valueChartSubject.next(this.valueChart);
			
			this.viewConfigSubject.next(this.viewConfig);
			this.changeDetectionService.viewConfigRecord = _.cloneDeep(this.renderConfigService.viewConfig);
		}
	}

	/*
		@returns {void}
		@description	Check for and handle changes to the interaction options.
	*/
	detectInteractionConfigChanges(): void {
		if (!_.isEqual(this.interactionConfig, this.changeDetectionService.interactionConfigRecord)) {
			this.changeDetectionService.interactionConfigRecord = _.cloneDeep(this.interactionConfig);
			this.interactionSubject.next(this.interactionConfig);
		}
	}

	// ========================================================================================
	// 								Change Handling Methods
	// ========================================================================================

	/*
		@returns {void}
		@description	Update the ValueChart's user columns in response to a new user, or a deleted user. Re-renders the ValueChart.
	*/
	updateUsers(): void {
		this.changeDetectionService.usersRecord = this.valueChartService.getNumUsers();
		this.renderConfigService.initUserColors();
		this.rendererDataService.generateRowData();
		this.rendererDataService.updateAllValueChartData(this.renderConfigService.viewConfig.viewOrientation);
		
		// Update the ValueChart's SVG structure.
		this.labelRenderer.updateScoreFunctions(this.labelRenderer.scoreFunctionContainer, this.valueChartService.getPrimitiveObjectives());
		// this.objectiveChartRenderer.createObjectiveRows(this.objectiveChartRenderer.rowsContainer, this.objectiveChartRenderer.rowOutlinesContainer, this.objectiveChartRenderer.alternativeBoxesContainer, this.objectiveChartRenderer.alternativeLabelsContainer, this.rendererDataService.getRowData());
		this.summaryChartRenderer.createSummaryChartRows(this.summaryChartRenderer.rowsContainer, this.summaryChartRenderer.alternativeBoxesContainer, this.summaryChartRenderer.scoreTotalsContainer, this.rendererDataService.getRowData());
	}

	/*
		@returns {void}
		@description	Update ValueChart's objective order. Does NOT re-render the ValueChart.
	*/
	updateObjectiveOrder(): void {
		// Destroy the previous label area.
		(<Element>d3.select('.' + this.labelDefinitions.ROOT_CONTAINER).node()).remove();
		// Rebuild and re-render the label area.
		this.createLabels();

		// Turn on any interactions that were removed when the labels were reconstructed. 
		this.updateAlternativeOrder()
	}

	/*
		@returns {void}
		@description	Update the ValueChart's alternative order. Does NOT re-render the ValueChart.
	*/
	updateAlternativeOrder(): void {
		this.rendererDataService.updateWeightOffsets();
		this.rendererDataService.updateStackedBarOffsets(this.renderConfigService.viewConfig.viewOrientation);
	}

	/*
		@returns {void}
		@description	Update the orientation of the ValueChart. Re-renders the ValueChart.
	*/
	updateViewOrientation(): void {
		this.rendererDataService.updateStackedBarOffsets(this.renderConfigService.viewConfig.viewOrientation);
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getLabelData(), this.labelDefinitions.ROOT_CONTAINER_NAME, this.renderConfigService.viewConfig, this.valueChartService.getPrimitiveObjectives());
		this.objectiveChartRenderer.renderObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig);
		this.summaryChartRenderer.renderSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig);
	}

	/*
		@returns {void}
		@description	Update the ValueChart's visual appearance. Does not do anything structural, like update objective/alternative ordering, add/delete new user columns, etc. 
						It will update existing features like user column heights, objective widths, etc. This should be used as the last stage of handling change to update
						the visual appearance of the ValueChart by re-rendering its components.
	*/
	updateValueChartDisplay(): void {
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getLabelData(), this.labelDefinitions.ROOT_CONTAINER_NAME, this.renderConfigService.viewConfig, this.valueChartService.getPrimitiveObjectives());
		this.objectiveChartRenderer.renderObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig);
		this.summaryChartRenderer.renderSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig);
	}
}