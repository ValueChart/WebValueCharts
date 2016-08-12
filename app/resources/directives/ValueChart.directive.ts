/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-12 10:42:35
*/


import { Directive, Input } 													from '@angular/core';
import { OnInit, DoCheck, SimpleChange }										from '@angular/core';
import { TemplateRef, ViewContainerRef, ElementRef }							from '@angular/core';

// d3
import * as d3 																	from 'd3';

// Application classes
import { ValueChartService}														from '../services/ValueChart.service';
import { ValueChartViewerService}												from '../services/ValueChartViewer.service';
import { RenderConfigService }													from '../services/RenderConfig.service';
import { ChartUndoRedoService }													from '../services/ChartUndoRedo.service';
import { ChangeDetectionService }												from '../services/ChangeDetection.service';


import { ObjectiveChartRenderer }												from '../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }													from '../renderers/SummaryChart.renderer';
import { LabelRenderer }														from '../renderers/Label.renderer';

import { ReorderObjectivesInteraction }											from '../interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }												from '../interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }											from '../interactions/SortAlternatives.interaction';
import { SetColorsInteraction }													from '../interactions/SetColors.interaction';
import { ExpandScoreFunctionInteraction }										from '../interactions/ExpandScoreFunction.interaction';

import { LabelDefinitions }														from '../services/LabelDefinitions.service';


// Model Classes
import { ValueChart } 															from '../model/ValueChart';
import { PrimitiveObjective }													from '../model/PrimitiveObjective';
import { WeightMap }															from '../model/WeightMap';
import { User }																	from '../model/User';
import { ScoreFunction }														from '../model/ScoreFunction';

import {RowData, CellData, LabelData}											from '../types/ValueChartViewer.types';


@Directive({
	selector: 'ValueChart',
	inputs: ['data', 
			'orientation',
			'width',
			'height',
			'displayScoreFunctions',
			'displayDomainValues',
			'displayScales',
			'displayTotalScores',
			'displayScoreFunctionValueLabels',
			'weightResizeType',
			'reorderObjectives',
			'sortAlternatives',
			'pumpWeights',
			'setObjectiveColors',]
})
export class ValueChartDirective implements OnInit, DoCheck {

	private isInitialized: boolean;

	private valueChart: ValueChart;

	private previousOrientation: string;
	private viewOrientation: string;	// View orientation. Either 'horizontal' or 'vertical'

	private chartWidth: number;
	private chartHeight: number;

	// Interaction Toggles
	private interactionConfig: any = {};

	// Fields for d3 collections that should be saved for later manipulation
	private el: d3.Selection<any>; // The SVG base element for the ValueChart rendering.

	private defaultChartComponentWidth: number;
	private defaultChartComponentHeight: number;

	constructor(
		// Angular Resources:
		private template: TemplateRef<any>,
		private viewContainer: ViewContainerRef,
		private elementRef: ElementRef,
		// Services:
		private valueChartService: ValueChartService,
		private valueChartViewerService: ValueChartViewerService,
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
		private setColorsInteraction: SetColorsInteraction,
		private expandScoreFunctionInteraction: ExpandScoreFunctionInteraction,

		private labelDefinitions: LabelDefinitions) { 
	}
	// Initialization code for the ValueChart goes in this function. ngOnInit is called by Angular AFTER the first ngDoCheck()
	// and after the input variables are initialized. This means that this.valueChart and this.viewOrientation are defined.
	// ngOnInit is only called ONCE. This function should thus be used for one-time initialized only.
	ngOnInit() {

		// Configure the ValueChartViewerService.
		this.valueChartService.setValueChart(this.valueChart);
		this.valueChartViewerService.initialize();
		// Retrieve the formatted data from ValueChartViewerService.
		this.valueChartViewerService.updateWeightOffsets();
		this.valueChartViewerService.updateStackedBarOffsets(this.viewOrientation);

		this.calculateDefaultComponentSize();

		this.renderConfigService.viewOrientation = this.viewOrientation;
		this.renderConfigService.initUserColors();

		// Initialize Change Detection:
		this.initChangeDetection();

		// Create the Visual Elements of the ValueChart.
		this.createValueChart();

		// ValueChart Setup is complete:
		this.isInitialized = true;	
	}

	calculateDefaultComponentSize() {
		this.defaultChartComponentWidth = (this.chartWidth * this.renderConfigService.CHART_COMPONENT_RATIO);
		this.defaultChartComponentHeight = (this.chartHeight * this.renderConfigService.CHART_COMPONENT_RATIO);
	}

	createValueChart(): void {
		// Create the SVG base element, and set it to dynamically fit to the viewport:
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed('ValueChart svg-content-valuechart', true)
			.attr('viewBox', '0 -10' + ' ' + this.chartWidth + ' ' + this.chartHeight)
			.attr('preserveAspectRatio', 'xMinYMin meet');


		// Render the ValueChart:
		this.labelRenderer.createLabelSpace(this.el, this.valueChartViewerService.getLabelData(), this.valueChartService.getPrimitiveObjectives());
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getLabelData(), this.viewOrientation, this.valueChartService.getPrimitiveObjectives());
		this.resizeWeightsInteraction.toggleDragToResizeWeights(this.interactionConfig.weightResizeType);
		this.expandScoreFunctionInteraction.toggleExpandScoreFunction(true);

		this.objectiveChartRenderer.createObjectiveChart(this.el, this.valueChartViewerService.getRowData());
		this.objectiveChartRenderer.renderObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.viewOrientation);

		this.summaryChartRenderer.createSummaryChart(this.el, this.valueChartViewerService.getRowData());
		this.summaryChartRenderer.renderSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getRowData(), this.viewOrientation);
	}

	initChangeDetection(): void {
		this.changeDetectionService.initDiffers(this.valueChart);
		// View Configuration
		this.previousOrientation = this.viewOrientation;
		this.changeDetectionService.initPreviousViewConfig(this.renderConfigService.viewConfiguration);
		this.changeDetectionService.previousWidth = this.chartWidth;
		this.changeDetectionService.previousHeight = this.chartHeight;

		// Interactions:
		this.changeDetectionService.initPreviousInteractionConfig(this.interactionConfig)
	}


	// This function is called by Angular whenever it detects that a change to this directive's inputs MAY have occurred. The method body is our implementation of change
	// detection. We are implementing our own change detection since Angular's change detection (ngOnChanges) is by reference. Note that when a a class implements 
	// DoCheck, ngOnChanges is never called, even if the class also implements OnChanges. This means that changes must be both detected, and handled in ngDoCheck.
	ngDoCheck() {
		// DO NOT proceed with change detection if the directive has not yet been initialized.
		if (this.isInitialized === undefined)
			return;

		this.detectValueChartChanges();
		this.detectDataOrderChanges();
		this.detectViewConfigChanges();
		this.detectInteractionConfigChanges();
	}

	// Methods for Detecting Changes:
	detectValueChartChanges(): void {
		// Check for changes to the ValueChart fields. This is NOT deep.
		if (this.valueChart !== this.changeDetectionService.previousValueChart) {
			this.chartUndoRedoService.clearRedo();
			this.chartUndoRedoService.clearUndo();			

			this.valueChartService.setValueChart(this.valueChart);
			this.valueChartViewerService.initialize();
			this.valueChartViewerService.updateAllValueChartData(this.viewOrientation);
			this.initChangeDetection();
			// Configure the Render Service:
			this.renderConfigService.viewOrientation = this.viewOrientation;
			this.renderConfigService.initUserColors();


			this.objectiveChartRenderer.createObjectiveRows(this.objectiveChartRenderer.rowsContainer, this.objectiveChartRenderer.rowOutlinesContainer, this.objectiveChartRenderer.alternativeBoxesContainer, this.objectiveChartRenderer.alternativeLabelsContainer, this.valueChartViewerService.getRowData());
			this.summaryChartRenderer.createSummaryChartRows(this.summaryChartRenderer.rowsContainer, this.summaryChartRenderer.alternativeBoxesContainer, this.summaryChartRenderer.scoreTotalsContainer, this.valueChartViewerService.getRowData());

			this.updateRowOrder()
		}

		// Check for added or deleted users
		if (this.valueChartService.getUsers().length !== this.changeDetectionService.previousNumUsers) {
			// A user has been added to the ValueChart.
			this.changeDetectionService.initDiffers(this.valueChart);
			this.renderConfigService.initUserColors();
			// Update data
			this.valueChartViewerService.generateRowData();
			this.valueChartViewerService.updateAllValueChartData(this.viewOrientation);

			// Add new columns for the new user.
			this.objectiveChartRenderer.createObjectiveRows(this.objectiveChartRenderer.rowsContainer, this.objectiveChartRenderer.rowOutlinesContainer, this.objectiveChartRenderer.alternativeBoxesContainer, this.objectiveChartRenderer.alternativeLabelsContainer, this.valueChartViewerService.getRowData());
			this.summaryChartRenderer.createSummaryChartRows(this.summaryChartRenderer.rowsContainer, this.summaryChartRenderer.alternativeBoxesContainer, this.summaryChartRenderer.scoreTotalsContainer, this.valueChartViewerService.getRowData());

			// Re-render everything.
			this.updateValueChartDisplay()
		}

		// Check the User Models for Changes:
		this.valueChartService.getUsers().forEach((user: User, i: number) => {
			let userChanges = this.changeDetectionService.userDiffers[i].diff(user);
			if (userChanges) {
				this.renderConfigService.initUserColors(); 
				this.updateValueChartDisplay();
			}

			let internalWeightMap = user.getWeightMap().getInternalWeightMap();
			let weightMapChanges = this.changeDetectionService.weightMapDiffers[i].diff(internalWeightMap);
			if (weightMapChanges) {
				this.updateValueChartDisplay();
			}

			let scoreFunctionMap = user.getScoreFunctionMap();
			let scoreFunctionMapChanges = this.changeDetectionService.scoreFunctionMapDiffers[i].diff(scoreFunctionMap);
			if (scoreFunctionMapChanges) {
				this.updateValueChartDisplay();
			}

			var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();
			scoreFunctions.forEach((scoreFunction: ScoreFunction, j: number) => {
				var functionIndex: number = j + (i * scoreFunctions.length)
				var scoreFunctionChanges = this.changeDetectionService.scoreFunctionDiffers[functionIndex].diff(scoreFunction.getElementScoreMap());
				if (scoreFunctionChanges) {
					this.updateValueChartDisplay();
				}
			});

		});

		if (this.changeDetectionService.colorsHaveChanged) {
			// Objective colors have been changed
			this.changeDetectionService.colorsHaveChanged = false;
			this.updateRowOrder();
		}
	}

	detectDataOrderChanges(): void {
		if (this.changeDetectionService.alternativeOrderChanged) {
				this.changeDetectionService.alternativeOrderChanged = false;

				this.updateAlternativeOrder();
		} 
		if (this.changeDetectionService.rowOrderChanged) {
			this.changeDetectionService.rowOrderChanged = false;
			this.changeDetectionService.alternativeOrderChanged = false;
			this.updateRowOrder();
		}
	}

	detectViewConfigChanges(): void {
		if (this.previousOrientation !== this.viewOrientation) {
			this.previousOrientation = this.viewOrientation;
			this.updateViewOrientation();
		}

		if (this.changeDetectionService.previousWidth !== this.chartWidth || this.changeDetectionService.previousHeight !== this.chartHeight) {
			this.changeDetectionService.previousWidth = this.chartWidth;
			this.changeDetectionService.previousHeight = this.chartHeight;
			this.el.attr('viewBox', '0 -10' + ' ' + this.chartWidth + ' ' + this.chartHeight);
			this.calculateDefaultComponentSize();
			this.updateViewOrientation();
		}

		if (this.renderConfigService.viewConfiguration.displayScoreFunctions !== this.changeDetectionService.previousViewConfig.displayScoreFunctions) {
			this.changeDetectionService.previousViewConfig.displayScoreFunctions = this.renderConfigService.viewConfiguration.displayScoreFunctions;
			// Toggle Score Functions.
			this.updateScoreFunctionDisplay();
		}

		if (this.renderConfigService.viewConfiguration.displayDomainValues !== this.changeDetectionService.previousViewConfig.displayDomainValues) {
			this.changeDetectionService.previousViewConfig.displayDomainValues = this.renderConfigService.viewConfiguration.displayDomainValues;
			// Toggle Domain Labels.
			this.objectiveChartRenderer.toggleDomainLabels();
		}

		if (this.renderConfigService.viewConfiguration.displayScales !== this.changeDetectionService.previousViewConfig.displayScales) {
			this.changeDetectionService.previousViewConfig.displayScales = this.renderConfigService.viewConfiguration.displayScales;
			// Toggle Utility Scale
			this.summaryChartRenderer.toggleUtilityAxis();
		}

		if (this.renderConfigService.viewConfiguration.displayTotalScores !== this.changeDetectionService.previousViewConfig.displayTotalScores) {
			this.changeDetectionService.previousViewConfig.displayTotalScores = this.renderConfigService.viewConfiguration.displayTotalScores;
			// Toggle Total Scores
			this.summaryChartRenderer.toggleScoreTotals();
		}

		if (this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels !== this.changeDetectionService.previousViewConfig.displayScoreFunctionValueLabels) {
			this.changeDetectionService.previousViewConfig.displayScoreFunctionValueLabels = this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels;
			// Toggle Score Function Value Labels.
			this.labelRenderer.toggleScoreFunctionValueLabels();
		}
	}

	detectInteractionConfigChanges(): void {
		if (this.interactionConfig.weightResizeType !== this.changeDetectionService.previousInteractionConfig.weightResizeType) {
			this.changeDetectionService.previousInteractionConfig.weightResizeType = this.interactionConfig.weightResizeType;

			this.resizeWeightsInteraction.toggleDragToResizeWeights(this.interactionConfig.weightResizeType);
		}

		if (this.interactionConfig.reorderObjectives !== this.changeDetectionService.previousInteractionConfig.reorderObjectives) {
			this.changeDetectionService.previousInteractionConfig.reorderObjectives = this.interactionConfig.reorderObjectives;
			// Toggle Dragging to sort objectives:
			this.reorderObjectivesInteraction.toggleObjectiveReordering(this.interactionConfig.reorderObjectives);
		}

		if (this.interactionConfig.sortAlternatives !== this.changeDetectionService.previousInteractionConfig.sortAlternatives) {
			this.changeDetectionService.previousInteractionConfig.sortAlternatives = this.interactionConfig.sortAlternatives;
			this.sortAlternativesInteraction.toggleAlternativeSorting(this.changeDetectionService.previousInteractionConfig.sortAlternatives);
		}

		if (this.interactionConfig.pumpWeights !== this.changeDetectionService.previousInteractionConfig.pumpWeights) {
			this.changeDetectionService.previousInteractionConfig.pumpWeights = this.interactionConfig.pumpWeights;
			// Toggle the pump interaction:
			this.resizeWeightsInteraction.togglePump(this.interactionConfig.pumpWeights);
		}

		if (this.interactionConfig.setObjectiveColors !== this.changeDetectionService.previousInteractionConfig.setObjectiveColors) {
			this.changeDetectionService.previousInteractionConfig.setObjectiveColors = this.interactionConfig.setObjectiveColors;
			// Toggle setting objective colors:
			this.setColorsInteraction.toggleSettingObjectiveColors(this.interactionConfig.setObjectiveColors);
		}
	}

	// Methods for Handling Changes:

	updateValueChartDisplay(): void {
		this.valueChartViewerService.updateAllValueChartData(this.viewOrientation);
		this.labelRenderer.updateLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getLabelData(), this.labelDefinitions.ROOT_CONTAINER_NAME, this.viewOrientation, this.valueChartService.getPrimitiveObjectives());
		this.objectiveChartRenderer.updateObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getRowData(), this.viewOrientation);
		this.summaryChartRenderer.updateSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getRowData(), this.viewOrientation);
	}

	updateRowOrder(): void {
		// Destroy the previous label area.
		(<Element>d3.select('.' + this.labelDefinitions.ROOT_CONTAINER).node()).remove();
		// Rebuild and re-render the label area.
		this.labelRenderer.createLabelSpace(d3.select('.ValueChart'), this.valueChartViewerService.getLabelData(), this.valueChartService.getPrimitiveObjectives());
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getLabelData(), this.renderConfigService.viewOrientation, this.valueChartService.getPrimitiveObjectives());
		// Turn on objective sorting again. This was turned off because the label area was reconstructed.
		this.reorderObjectivesInteraction.toggleObjectiveReordering(this.interactionConfig.reorderObjectives);
		this.resizeWeightsInteraction.toggleDragToResizeWeights(this.interactionConfig.weightResizeType);
		this.updateAlternativeOrder()
	}

	updateAlternativeOrder(): void {
		this.valueChartViewerService.updateWeightOffsets();
		this.valueChartViewerService.updateStackedBarOffsets(this.viewOrientation);
		
		this.objectiveChartRenderer.updateObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getRowData(), this.viewOrientation);
		this.summaryChartRenderer.updateSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getRowData(), this.viewOrientation);
	}

	updateViewOrientation(): void {
		this.renderConfigService.viewOrientation = this.viewOrientation;
		this.valueChartViewerService.updateStackedBarOffsets(this.viewOrientation);
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getLabelData(), this.viewOrientation, this.valueChartService.getPrimitiveObjectives());
		this.objectiveChartRenderer.renderObjectiveChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.viewOrientation);
		this.summaryChartRenderer.renderSummaryChart(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getRowData(), this.viewOrientation);
	}

	updateScoreFunctionDisplay(): void {
		this.labelRenderer.renderLabelSpace(this.defaultChartComponentWidth, this.defaultChartComponentHeight, this.valueChartViewerService.getLabelData(), this.viewOrientation, this.valueChartService.getPrimitiveObjectives());
	}



	// Variable binding functions. These functions are called when the directive is initialized.


	// Binds to the directive attribute 'data', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives data attribute.
	@Input() set data(value: any) {
		this.valueChart = <ValueChart> value;
	}

	// View Configuration

	// Binds to the directive attribute 'orientation', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives orientation attribute.
	@Input() set orientation(value: any) {
		this.viewOrientation = <string> value;
	}

	// Binds to the directive attribute 'orientation', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives orientation attribute.
	@Input() set width(value: any) {
		this.chartWidth = <number> value;
	}

	// Binds to the directive attribute 'orientation', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives orientation attribute.
	@Input() set height(value: any) {
		this.chartHeight = <number> value;
	}


	// Binds to the directive attribute 'displayScoreFunctions', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayScoreFunctions attribute.
	@Input() set displayScoreFunctions(value: any) {
		this.renderConfigService.viewConfiguration.displayScoreFunctions = <boolean> value;
	}

	// Binds to the directive attribute 'displayDomainValues', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayDomainValues attribute.
	@Input() set displayDomainValues(value: any) {
	this.renderConfigService.viewConfiguration.displayDomainValues = <boolean>value;
	}

	// Binds to the directive attribute 'displayScales', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayScales attribute.
	@Input() set displayScales(value: any) {
	this.renderConfigService.viewConfiguration.displayScales = <boolean>value;
	}

	// Binds to the directive attribute 'displayTotalScores', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayTotalScores attribute.
	@Input() set displayTotalScores(value: any) {
		this.renderConfigService.viewConfiguration.displayTotalScores = <boolean>value;
	}

	@Input() set displayScoreFunctionValueLabels(value: any) {
		this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels = <boolean>value;
	}

	// Interactions:

	@Input() set weightResizeType(value: any) {
		this.interactionConfig.weightResizeType = <string> value;
	}

	@Input() set reorderObjectives(value: any) {
		this.interactionConfig.reorderObjectives = <boolean> value;
	}

	@Input() set sortAlternatives(value: any) {	
		this.interactionConfig.sortAlternatives = <string> value;
	}

	@Input() set pumpWeights(value: any) {
		this.interactionConfig.pumpWeights = <string> value;
	}

	@Input() set setObjectiveColors(value: any) {
		this.interactionConfig.setObjectiveColors = <string>value;
	}



}