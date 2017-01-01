/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 21:35:16
*/

// Import Angular Resources:
import { Directive, Input } 													from '@angular/core';
import { OnInit, DoCheck, SimpleChange }										from '@angular/core';
import { ElementRef }															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';

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
// Interactions:
import { ReorderObjectivesInteraction }											from '../interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }												from '../interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }											from '../interactions/SortAlternatives.interaction';
import { SetObjectiveColorsInteraction }										from '../interactions/SetObjectiveColors.interaction';
import { ExpandScoreFunctionInteraction }										from '../interactions/ExpandScoreFunction.interaction';
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

	// Chart Inputs:
	private valueChart: ValueChart;								// The main data input to the directive.
	private viewOrientation: string;							// View orientation. Either 'horizontal' or 'vertical'
	private chartWidth: number;									// The width of the ValueChart.
	private chartHeight: number;								// The Height of the ValueChart.
	private interactionConfig: InteractionConfig = <any>{};	// Configuration options for user interactions.

	// d3 Selections:
	private el: d3.Selection<any, any, any, any>; 								// The SVG base element for the ValueChart.

	// Default Size of ValueChart components. These components are the: labels, objective chart, summary chart. 
	private defaultChartComponentWidth: number;
	private defaultChartComponentHeight: number;

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
		// Interactions:
		private reorderObjectivesInteraction: ReorderObjectivesInteraction,
		private resizeWeightsInteraction: ResizeWeightsInteraction,
		private sortAlternativesInteraction: SortAlternativesInteraction,
		private setObjectiveColorsInteraction: SetObjectiveColorsInteraction,
		private expandScoreFunctionInteraction: ExpandScoreFunctionInteraction,
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

		// Configure the directive for the input data:
		this.configureChartData();

		// Initialize Change Detection:
		this.initChangeDetection();

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
		this.defaultChartComponentWidth = (this.chartWidth * this.renderConfigService.CHART_COMPONENT_RATIO);
		this.defaultChartComponentHeight = (this.chartHeight * this.renderConfigService.CHART_COMPONENT_RATIO);
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
			.attr('viewBox', '0 -10' + ' ' + this.chartWidth + ' ' + this.chartHeight)
			.attr('preserveAspectRatio', 'xMinYMin meet');


		// Create the labels:
		this.createLabels();
		this.resizeWeightsInteraction.toggleDragToResizeWeights(this.interactionConfig.weightResizeType);
		this.expandScoreFunctionInteraction.toggleExpandScoreFunction(true);

		// Create the objective chart:
		this.objectiveChartRenderer.createObjectiveChart(this.el, this.rendererDataService.getRowData());
		this.objectiveChartRenderer.renderObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.renderConfigService.viewConfig.viewOrientation);

		// Create the summary chart:
		this.summaryChartRenderer.createSummaryChart(this.el, this.rendererDataService.getRowData());
		this.summaryChartRenderer.renderSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig.viewOrientation);
	}

	/*
		@returns {void}
		@description	Creates and renders the labels using the LabelRenderer. This is used more frequently than the other component create + render calls so it
						is encapsulated in its own method. 
	*/
	createLabels(): void {
		this.labelRenderer.createLabelSpace(this.el, this.rendererDataService.getLabelData(), this.valueChartService.getPrimitiveObjectives());
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getLabelData(), this.renderConfigService.viewConfig.viewOrientation, this.valueChartService.getPrimitiveObjectives());
	}

	/*
		@returns {void}
		@description	Initializes change detection for the directive using ChangeDetectionService. 
	*/
	initChangeDetection(): void {
		// Init change detection for the input data:
		this.changeDetectionService.initDiffers(this.valueChart);

		// Init change detection for the view configuration:
		this.changeDetectionService.previousOrientation = this.renderConfigService.viewConfig.viewOrientation;
		this.changeDetectionService.previousWidth = this.chartWidth;
		this.changeDetectionService.previousHeight = this.chartHeight;
		this.changeDetectionService.initPreviousViewConfig(this.renderConfigService.viewConfig);

		// Init change detection for the interaction configuration:
		this.changeDetectionService.initPreviousInteractionConfig(this.interactionConfig)
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
		// Check for and handle changes to the ValueChart. This is by reference.
		if (this.valueChart !== this.changeDetectionService.previousValueChart) {
			this.updateValueChart();
		}

		// Check to see if users have been added to deleted.
		if (this.valueChartService.getUsers().length !== this.changeDetectionService.previousNumUsers) {
			this.updateUsers();
		}

		// Check for and handle changes to the users.
		this.valueChartService.getUsers().forEach((user: User, i: number) => {
			// Check for and handle changes to the user's fields.
			let userChanges = this.changeDetectionService.userDiffers[i].diff(user);
			if (userChanges) {
				this.rendererDataService.updateAllValueChartData(this.renderConfigService.viewConfig.viewOrientation);
				this.updateValueChartDisplay();
			}

			// Check for and handle changes to the user's WeightMap.
			let internalWeightMap = user.getWeightMap().getInternalWeightMap();
			let weightMapChanges = this.changeDetectionService.weightMapDiffers[i].diff(internalWeightMap);
			if (weightMapChanges) {
				this.rendererDataService.updateAllValueChartData(this.renderConfigService.viewConfig.viewOrientation);
				this.updateValueChartDisplay();
			}

			// Check for and handle changes to the user's ScoreFunctionMap.
			let scoreFunctionMap = user.getScoreFunctionMap();
			let scoreFunctionMapChanges = this.changeDetectionService.scoreFunctionMapDiffers[i].diff(scoreFunctionMap);
			if (scoreFunctionMapChanges) {
				this.rendererDataService.updateAllValueChartData(this.renderConfigService.viewConfig.viewOrientation);
				this.updateValueChartDisplay();
			}

			// Check for and handle changes to the user's ScoreFunctions
			var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();
			scoreFunctions.forEach((scoreFunction: ScoreFunction, j: number) => {
				var functionIndex: number = j + (i * scoreFunctions.length)
				var scoreFunctionChanges = this.changeDetectionService.scoreFunctionDiffers[functionIndex].diff(scoreFunction.getElementScoreMap());
				if (scoreFunctionChanges) {
					this.rendererDataService.updateAllValueChartData(this.renderConfigService.viewConfig.viewOrientation);
					this.updateValueChartDisplay();
				}
			});
		});

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
			this.updateAlternativeOrder();
			this.updateValueChartDisplay();
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
		if (this.changeDetectionService.previousOrientation !== this.renderConfigService.viewConfig.viewOrientation) {
			this.changeDetectionService.previousOrientation = this.renderConfigService.viewConfig.viewOrientation;
			this.updateViewOrientation();
		}
		// Change for and handle changes to the width and height of the ValueChart.
		if (this.changeDetectionService.previousWidth !== this.chartWidth || this.changeDetectionService.previousHeight !== this.chartHeight) {
			this.changeDetectionService.previousWidth = this.chartWidth;
			this.changeDetectionService.previousHeight = this.chartHeight;
			this.el.attr('viewBox', '0 -10' + ' ' + this.chartWidth + ' ' + this.chartHeight);
			this.calculateDefaultComponentSize();
			this.updateViewOrientation();
		}

		// Change for and handle changes to the display options:

		if (this.renderConfigService.viewConfig.displayScoreFunctions !== this.changeDetectionService.previousViewConfig.displayScoreFunctions) {
			this.changeDetectionService.previousViewConfig.displayScoreFunctions = this.renderConfigService.viewConfig.displayScoreFunctions;
			this.updateScoreFunctionDisplay();
		}

		if (this.renderConfigService.viewConfig.displayDomainValues !== this.changeDetectionService.previousViewConfig.displayDomainValues) {
			this.changeDetectionService.previousViewConfig.displayDomainValues = this.renderConfigService.viewConfig.displayDomainValues;
			this.objectiveChartRenderer.toggleDomainLabels();
		}

		if (this.renderConfigService.viewConfig.displayScales !== this.changeDetectionService.previousViewConfig.displayScales) {
			this.changeDetectionService.previousViewConfig.displayScales = this.renderConfigService.viewConfig.displayScales;
			this.summaryChartRenderer.toggleUtilityAxis();
		}

		if (this.renderConfigService.viewConfig.displayTotalScores !== this.changeDetectionService.previousViewConfig.displayTotalScores) {
			this.changeDetectionService.previousViewConfig.displayTotalScores = this.renderConfigService.viewConfig.displayTotalScores;
			this.summaryChartRenderer.toggleScoreTotals();
		}

		if (this.renderConfigService.viewConfig.displayScoreFunctionValueLabels !== this.changeDetectionService.previousViewConfig.displayScoreFunctionValueLabels) {
			this.changeDetectionService.previousViewConfig.displayScoreFunctionValueLabels = this.renderConfigService.viewConfig.displayScoreFunctionValueLabels;
			this.labelRenderer.toggleScoreFunctionValueLabels();
		}
	}

	/*
		@returns {void}
		@description	Check for and handle changes to the interaction options.
	*/
	detectInteractionConfigChanges(): void {
		if (this.interactionConfig.weightResizeType !== this.changeDetectionService.previousInteractionConfig.weightResizeType) {
			this.changeDetectionService.previousInteractionConfig.weightResizeType = this.interactionConfig.weightResizeType;

			this.resizeWeightsInteraction.toggleDragToResizeWeights(this.interactionConfig.weightResizeType);
		}

		if (this.interactionConfig.reorderObjectives !== this.changeDetectionService.previousInteractionConfig.reorderObjectives) {
			this.changeDetectionService.previousInteractionConfig.reorderObjectives = this.interactionConfig.reorderObjectives;
			this.reorderObjectivesInteraction.toggleObjectiveReordering(this.interactionConfig.reorderObjectives);
		}

		if (this.interactionConfig.sortAlternatives !== this.changeDetectionService.previousInteractionConfig.sortAlternatives) {
			this.changeDetectionService.previousInteractionConfig.sortAlternatives = this.interactionConfig.sortAlternatives;
			this.sortAlternativesInteraction.toggleAlternativeSorting(this.changeDetectionService.previousInteractionConfig.sortAlternatives);
		}

		if (this.interactionConfig.pumpWeights !== this.changeDetectionService.previousInteractionConfig.pumpWeights) {
			this.changeDetectionService.previousInteractionConfig.pumpWeights = this.interactionConfig.pumpWeights;
			this.resizeWeightsInteraction.togglePump(this.interactionConfig.pumpWeights);
		}

		if (this.interactionConfig.setObjectiveColors !== this.changeDetectionService.previousInteractionConfig.setObjectiveColors) {
			this.changeDetectionService.previousInteractionConfig.setObjectiveColors = this.interactionConfig.setObjectiveColors;
			this.setObjectiveColorsInteraction.toggleSettingObjectiveColors(this.interactionConfig.setObjectiveColors);
		}
	}

	// ========================================================================================
	// 								Change Handling Methods
	// ========================================================================================

	/*
		@returns {void}
		@description	Update the entire ValueChart. This method should be used when the ValueChart input the directive changes to a different reference.
						Re-renders the ValueChart.
	*/
	updateValueChart(): void {
		this.chartUndoRedoService.resetUndoRedo();
		this.configureChartData();
		this.updateUserPreferenceColumns();
		this.updateObjectiveOrder();
		this.updateValueChartDisplay();
	}

	/*
		@returns {void}
		@description	Update the ValueChart's user columns in response to a new user, or a deleted user. Re-renders the ValueChart.
	*/
	updateUsers(): void {
		this.changeDetectionService.initDiffers(this.valueChart);
		this.renderConfigService.initUserColors();
		this.rendererDataService.generateRowData();
		this.rendererDataService.updateAllValueChartData(this.renderConfigService.viewConfig.viewOrientation);
		this.updateUserPreferenceColumns();
		this.updateValueChartDisplay()
	}

	/*
		@returns {void}
		@description	Create and delete user preference columns in response to new or deleted users. Does NOT re-render the ValueChart.
	*/
	updateUserPreferenceColumns(): void {
		this.objectiveChartRenderer.createObjectiveRows(this.objectiveChartRenderer.rowsContainer, this.objectiveChartRenderer.rowOutlinesContainer, this.objectiveChartRenderer.alternativeBoxesContainer, this.objectiveChartRenderer.alternativeLabelsContainer, this.rendererDataService.getRowData());
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
		this.reorderObjectivesInteraction.toggleObjectiveReordering(this.interactionConfig.reorderObjectives);
		this.resizeWeightsInteraction.toggleDragToResizeWeights(this.interactionConfig.weightResizeType);
		this.setObjectiveColorsInteraction.toggleSettingObjectiveColors(this.interactionConfig.setObjectiveColors);

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
		this.renderConfigService.viewConfig.viewOrientation = this.renderConfigService.viewConfig.viewOrientation;
		this.rendererDataService.updateStackedBarOffsets(this.renderConfigService.viewConfig.viewOrientation);
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getLabelData(), this.renderConfigService.viewConfig.viewOrientation, this.valueChartService.getPrimitiveObjectives());
		this.objectiveChartRenderer.renderObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.renderConfigService.viewConfig.viewOrientation);
		this.summaryChartRenderer.renderSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig.viewOrientation);
	}

	/*
		@returns {void}
		@description	Remove or display the ScoreFunction plots.
	*/
	updateScoreFunctionDisplay(): void {
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getLabelData(), this.renderConfigService.viewConfig.viewOrientation, this.valueChartService.getPrimitiveObjectives());
	}

	/*
		@returns {void}
		@description	Update the ValueChart's visual appearance. Does not do anything structural, like update objective/alternative ordering, add/delete new user columns, etc. 
						It will update existing features like user column heights, objective widths, etc. This should be used as the last stage of handling change to update
						the visual appearance of the ValueChart by re-rendering its components.
	*/
	updateValueChartDisplay(): void {
		this.labelRenderer.updateLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getLabelData(), this.labelDefinitions.ROOT_CONTAINER_NAME, this.renderConfigService.viewConfig.viewOrientation, this.valueChartService.getPrimitiveObjectives());
		this.objectiveChartRenderer.updateObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig.viewOrientation);
		this.summaryChartRenderer.updateSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.rendererDataService.getRowData(), this.renderConfigService.viewConfig.viewOrientation);
	}


// inputs: ['data', 							// The data to be rendered. Must be an instance of the ValueChart class.
// 		'width',								// The width of the area in which to render the ValueChart. Must be a number.
// 		'height',								// The height of the area in which to render the ValueChart. Must be a number.
// 		'viewConfig',							// Options for configuring the ValueChart's appearance. Must be of type ViewConfig.
// 		'interactions',							// Options for configuring enabled and disabled interactions. Must be of type InteractionConfig. 

	// ========================================================================================
	// 								Input Variable Binding Methods
	// ========================================================================================


	// Binds to the directive attribute 'data', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives data attribute.
	@Input() set data(value: any) {
		this.valueChart = <ValueChart>value;
	}

	// View Configuration

	// Binds to the directive attribute 'orientation', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives orientation attribute.
	@Input() set orientation(value: any) {
		this.renderConfigService.viewConfig.viewOrientation = <string>value;
	}

	// Binds to the directive attribute 'width', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives width attribute.
	@Input() set width(value: any) {
		this.chartWidth = <number>value;
	}

	// Binds to the directive attribute 'height', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives height attribute.
	@Input() set height(value: any) {
		this.chartHeight = <number>value;
	}


	// View Options:

	// Binds to the directive attribute 'viewConfig', and is automatically called before ngOnInit. 
	// The variable 'config' is whatever was input to the directives viewConfig attribute.
	@Input() set viewConfig(config: ViewConfig) {
		this.renderConfigService.viewConfig = config;
	}

	// Interaction Options:

	// Binds to the directive attribute 'interactions', and is automatically called before ngOnInit. 
	// The variable 'config' is whatever was input to the directives interactions attribute.
	@Input() set interactions(config: InteractionConfig) {
		this.interactionConfig = config;
	}
}