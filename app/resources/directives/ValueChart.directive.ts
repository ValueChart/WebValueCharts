/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 11:42:42
*/


import { Directive, Input } 													from '@angular/core';
import { OnInit, DoCheck, SimpleChange }										from '@angular/core';
import { TemplateRef, ViewContainerRef, ElementRef }							from '@angular/core';
import { KeyValueDiffers, IterableDiffers, KeyValueDiffer, IterableDiffer }		from '@angular/core';

// d3
import * as d3 																	from 'd3';

// Application classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }					from '../services/ChartData.service';
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


// Model Classes
import { ValueChart } 															from '../model/ValueChart';
import { GroupValueChart } 														from '../model/GroupValueChart';
import { IndividualValueChart } 												from '../model/IndividualValueChart';
import { PrimitiveObjective }													from '../model/PrimitiveObjective';
import { WeightMap }															from '../model/WeightMap';
import { User }																	from '../model/User';
import { ScoreFunction }														from '../model/ScoreFunction';

@Directive({
	selector: 'ValueChart',
	inputs: ['data', 'orientation']
})
export class ValueChartDirective implements OnInit, DoCheck {

	private isInitialized: boolean;
	// Inputs to the directive.
	private valueChart: ValueChart;		// A ValueChart. Can be an IndividualValueChart or a GroupValueChart

	private previousOrientation: string;
	private viewOrientation: string;	// View orientation. Either 'horizontal' or 'vertical'

	// Height and width of the viewport for use with viewBox attribute of the root SVG element

	private viewportWidth: number;
	private viewportHeight: number;

	// ValueChart data that has been organized to work with d3.
	private dataRows: VCRowData[];	// ValueCharts row (or column if in vertical orientation) data. Each array element is the data for one objective.
	private labelData: VCLabelData[];
	private primitiveObjectives: PrimitiveObjective[];

	// Interaction Toggles
	private interactionConfig: any = {};

	// Fields for d3 collections that should be saved for later manipulation
	private el: d3.Selection<any>; // The SVG base element for the ValueChart rendering.

	constructor(
		// Angular Resources:
		private template: TemplateRef<any>,
		private viewContainer: ViewContainerRef,
		private elementRef: ElementRef,
		// Services:
		private chartDataService: ChartDataService,
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
		private setColorsInteraction: SetColorsInteraction) { 
	}
	// Initialization code for the ValueChart goes in this function. ngOnInit is called by Angular AFTER the first ngDoCheck()
	// and after the input variables are initialized. This means that this.valueChart and this.viewOrientation are defined.
	// ngOnInit is only called ONCE. This function should thus be used for one-time initialized only.
	ngOnInit() {
		// Configure the size of the user viewport. This will be scaled to fit the browser window
		this.viewportWidth = 1700;
		this.viewportHeight = 850;

		// Configure the Chart Data Service.
		this.chartDataService.setValueChart(this.valueChart);
		// 
		this.dataRows = this.chartDataService.getRowData();
		this.chartDataService.updateWeightOffsets();
		this.chartDataService.updateStackedBarOffsets(this.viewOrientation);

		this.labelData = this.chartDataService.getLabelData();

		// Configure the Render Service:
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);
		this.renderConfigService.configureViewOrientation(this.viewOrientation);

		// Initialize Change Detection:
		this.initChangeDetection();

		// Create the Visual Elements of the ValueChart.
		this.createValueChart();

		// ValueChart Setup is complete:
		this.isInitialized = true;	
	}

	createValueChart(): void {
		// Create the SVG base element, and set it to dynamically fit to the viewport:
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed({ 'ValueChart': true, 'svg-content-responsive': true })
			.attr('viewBox', '0 -10' + ' ' + this.viewportWidth + ' ' + this.viewportHeight)
			.attr('preserveAspectRatio', 'xMinYMin meet');


		// Render the ValueChart:
		this.labelRenderer.createLabelSpace(this.el, this.labelData, this.chartDataService.primitiveObjectives);
		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.chartDataService.primitiveObjectives);

		this.objectiveChartRenderer.createObjectiveChart(this.el, this.dataRows);
		this.objectiveChartRenderer.renderObjectiveChart(this.viewOrientation);

		this.summaryChartRenderer.createSummaryChart(this.el, this.dataRows);
		this.summaryChartRenderer.renderSummaryChart(this.dataRows, this.viewOrientation);
	}

	initChangeDetection(): void {
		this.changeDetectionService.initDiffers(this.valueChart);
		// View Configuration
		this.previousOrientation = this.viewOrientation;
		this.changeDetectionService.initPreviousViewConfig(this.renderConfigService.viewConfiguration);

		// Interactions:
		this.changeDetectionService.initPreviousInteractionConfig(this.interactionConfig)
	}


	// This function is called by Angular whenever it detects that a change to this directive's inputs MAY have occurred. The method body is our implementation of change
	// detection. We are implementing our own change detection Since Angular's change detection (ngOnChanges) is by reference. Note that when a a class implements 
	// DoCheck, ngOnChanges is never called, even if the class also implements OnChanges. This means that changes must both be detected, and handled in ngDoCheck.
	ngDoCheck() {
		// DO NOT proceed with change detection if the directive has not yet been initialized.
		if (this.isInitialized === undefined)
			return;

		this.detectValueChartChanges();
		this.detectDataRowChanges();
		this.detectViewConfigChanges();
		this.detectInteractionConfigChanges();
	}


	detectValueChartChanges(): void {
		// Check for changes to the ValueChart fields. This is NOT deep.
		var valueChartChanges = this.changeDetectionService.valueChartDiffer.diff(this.valueChart);
		if (valueChartChanges) {
			this.updateValueChart();
		}
		// Check for changes to the User fields. This is NOT deep.
		var user = (<IndividualValueChart>this.valueChart).getUser();
		var userChanges = this.changeDetectionService.userDiffer.diff(user);
		if (userChanges) {
			this.updateValueChart();
		}
		// Check for changes to the WeightMap. This is NOT deep, and only checks the internal mappings of the WeightMap.
		var internalWeightMap = user.getWeightMap().getInternalWeightMap();
		var weightMapChanges = this.changeDetectionService.weightMapDiffer.diff(internalWeightMap);
		if (weightMapChanges) {
			this.updateValueChart();
		}

		// Check for changes to the ScoreFunctions. This is NOT deep, and only checks the internal mappings of the ScoreFunctions.
		var scoreFunctionMap = user.getScoreFunctionMap();
		var scoreFunctionMapChanges = this.changeDetectionService.scoreFunctionMapDiffer.diff(scoreFunctionMap);
		if (scoreFunctionMapChanges) {
			this.updateValueChart();
		}

		var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();
		scoreFunctions.forEach((scoreFunction: ScoreFunction, index: number) => {
			var scoreFunctionChanges = this.changeDetectionService.scoreFunctionDiffers[index].diff(scoreFunction.getElementScoreMap());
			if (scoreFunctionChanges) {
				this.updateValueChart();
			}
		});

		if (this.changeDetectionService.colorsHaveChanged) {
			// Objective colors have been changed
			this.changeDetectionService.colorsHaveChanged = false;
			this.updateValueChart();
		}
	}

	detectDataRowChanges(): void {
		if (this.changeDetectionService.rowOrderChanged		||
			this.changeDetectionService.alternativeOrderChanged
			) {
			this.changeDetectionService.rowOrderChanged = false;
			this.changeDetectionService.alternativeOrderChanged = false;

			this.updateDataRows();
		}
	}

	detectViewConfigChanges(): void {
		if (this.previousOrientation !== this.viewOrientation) {
			this.previousOrientation = this.viewOrientation;
			this.updateOrientation();
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

	updateValueChart(): void {
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);

		this.chartDataService.updateWeightOffsets();
		this.chartDataService.updateStackedBarOffsets(this.viewOrientation);
		
		this.labelData.forEach((labelDatum: VCLabelData) => {
			this.chartDataService.updateLabelData(labelDatum);
		});

		this.labelRenderer.updateLabelSpace(this.labelData, 'rootcontainer', this.viewOrientation, this.chartDataService.primitiveObjectives);
		this.objectiveChartRenderer.updateObjectiveChart(this.dataRows, this.viewOrientation);
		this.summaryChartRenderer.updateSummaryChart(this.dataRows, this.viewOrientation);
	}

	updateDataRows(): void {
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);

		this.chartDataService.updateWeightOffsets();
		this.chartDataService.updateStackedBarOffsets(this.viewOrientation);
		
		this.objectiveChartRenderer.updateObjectiveChart(this.dataRows, this.viewOrientation);
		this.summaryChartRenderer.updateSummaryChart(this.dataRows, this.viewOrientation);

	}

	updateOrientation(): void {
		this.renderConfigService.configureViewOrientation(this.viewOrientation);
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);

		this.chartDataService.updateStackedBarOffsets(this.viewOrientation);

		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.chartDataService.primitiveObjectives);
		this.objectiveChartRenderer.renderObjectiveChart(this.viewOrientation);
		this.summaryChartRenderer.renderSummaryChart(this.dataRows, this.viewOrientation);
	}

	updateScoreFunctionDisplay(): void {
		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.chartDataService.primitiveObjectives);
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