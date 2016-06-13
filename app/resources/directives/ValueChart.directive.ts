/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-13 11:03:17
*/


import { Directive, Input } 										from '@angular/core';
import { OnInit, DoCheck, SimpleChange }					from '@angular/core';
import { TemplateRef, ViewContainerRef, ElementRef }				from '@angular/core';
import { KeyValueDiffers, IterableDiffers }							from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService }										from '../services/RenderConfig.service';
import { ObjectiveChartRenderer }									from '../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }										from '../renderers/SummaryChart.renderer';
import { LabelRenderer }											from '../renderers/Label.renderer';


// Model Classes
import { ValueChart } 												from '../model/ValueChart';
import { GroupValueChart } 											from '../model/GroupValueChart';
import { IndividualValueChart } 									from '../model/IndividualValueChart';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { WeightMap }												from '../model/WeightMap';
import { User }														from '../model/User';
import { ScoreFunction }											from '../model/ScoreFunction';

@Directive({
	selector: 'ValueChart',
	inputs: ['data', 'orientation'],
	providers: [
		RenderConfigService,
		ObjectiveChartRenderer,
		SummaryChartRenderer,
		LabelRenderer]
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

	private valueChartDiffer: any;
	private userDiffer: any;
	private weightMapDiffer: any;
	private scoreFunctionMapDiffer: any;
	private scoreFunctionDiffer: any;
	private scoreFunctionDiffers: any;

	// Fields for d3 collections that should be saved for later manipulation
	private el: any; // The SVG base element for the ValueChart rendering.

	constructor(
		private template: TemplateRef<any>,
		private viewContainer: ViewContainerRef,
		private elementRef: ElementRef,
		private differs: KeyValueDiffers,
		private objectiveChartRenderer: ObjectiveChartRenderer,
		private summaryChartRenderer: SummaryChartRenderer,
		private labelRenderer: LabelRenderer,
		private chartDataService: ChartDataService,
		private renderConfigService: RenderConfigService) { 
	}

	// Binds to the directive attribute 'data', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives data attribute.
	@Input() set data(value: any) {
		this.valueChart = <ValueChart> value;
	}

	// Binds to the directive attribute 'orientation', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives orientation attribute.
	@Input() set orientation(value: any) {
		this.viewOrientation = <string> value;
	}

	// Initialization code for the ValueChart goes in this function. ngOnInit is called by Angular AFTER the first ngOnChange
	// and after the input variables are initialized. This means that this.valueChart and this.viewOrientation are defined.
	// ngOnInit is only called ONCE. This function should thus be used for one-time initialized only.
	ngOnInit() {
		// Configure the size of the user viewport. This will be scaled to fit the browser window
		this.viewportWidth = 1700;
		this.viewportHeight = 850;

		// Configure the orientation options depending on the 
		this.renderConfigService.configureViewOrientation(this.viewOrientation);

		this.previousOrientation = this.viewOrientation;

		// Create the SVG base element, and set it to dynamically fit to the viewport.
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed({ 'ValueChart': true, 'svg-content-responsive': true })
			.attr('viewBox', '0 0' + ' ' + this.viewportWidth + ' ' + this.viewportHeight)
			.attr('preserveAspectRatio', 'xMinYMin meet');

		// Get objective data in a format that suits d3.
		this.dataRows = this.chartDataService.getRowData(this.valueChart);

		this.dataRows = this.chartDataService.calculateWeightOffsets(this.dataRows);
		this.dataRows = this.chartDataService.calculateStackedBarOffsets(this.dataRows, this.viewOrientation);

		this.labelData = this.chartDataService.getLabelData(this.valueChart);
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
		// Render the ValueChart;
		this.labelRenderer.createLabelSpace(this.el, this.labelData, this.primitiveObjectives);
		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.primitiveObjectives);

		this.objectiveChartRenderer.createObjectiveChart(this.el, this.dataRows);
		this.objectiveChartRenderer.renderObjectiveChart(this.dataRows, this.viewOrientation);

		this.summaryChartRenderer.createSummaryChart(this.el, this.dataRows);
		this.summaryChartRenderer.renderSummaryChart(this.viewOrientation);

		this.initChangeDetection();

		this.isInitialized = true;
	}

	initChangeDetection(): void {
		// Create Differs for the pieces of the ValueChart:

		this.valueChartDiffer = this.differs.find({}).create(null);
		this.userDiffer = this.differs.find({}).create(null);
		this.weightMapDiffer = this.differs.find({}).create(null);
		this.scoreFunctionMapDiffer = this.differs.find({}).create(null);

		var user = (<IndividualValueChart>this.valueChart).getUser();
		var scoreFunctionMap = user.getScoreFunctionMap();

		var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();

		this.scoreFunctionDiffers = [];

		scoreFunctions.forEach((scoreFunction: ScoreFunction) => {
			let scoreFunctionDiffer = this.differs.find({}).create(null);
			this.scoreFunctionDiffers.push(scoreFunctionDiffer);
		});


	}


	// Set up change detection here:
	ngDoCheck() {
		// DO NOT proceed with change detection if the directive has not yet been initialized.
		if (this.isInitialized === undefined)
			return;

		this.chartDataService.setValueChart(this.valueChart);

		var valueChartChanges = this.valueChartDiffer.diff(this,ValueChart);

		var user = (<IndividualValueChart>this.valueChart).getUser();
		var userChanges = this.userDiffer.diff(user);

		var weightMap = user.getWeightMap().getInternalWeightMap();
		var weightMapChanges = this.weightMapDiffer.diff(weightMap);

		if (weightMapChanges) {
			this.onValueChartChange();
		}

		var scoreFunctionMap = user.getScoreFunctionMap();
		var scoreFunctionMapChanges = this.scoreFunctionMapDiffer.diff(scoreFunctionMap);

		var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();

		scoreFunctions.forEach((scoreFunction: ScoreFunction, index: number) => {
			var scoreFunctionChanges = this.scoreFunctionDiffers[index].diff(scoreFunction.getElementScoreMap());
			
			if (scoreFunctionChanges) {
				this.onValueChartChange();
			}
	
		});


		if (this.previousOrientation !== this.viewOrientation) {
			this.previousOrientation = this.viewOrientation;
			this.onOrientationChange();
		}
	}


	// TODO: This is not being called anymore because of ngDoCheck.

	// The type of changeRecord should be SimpleChanges, but no such type exists in this release. TODO: Update this once Angular has been updated.
	// noOnChanges is called by Angular whenever the inputs to the directive change. It is called BEFORE ngOnIt when the directive is first
	// initialized. 
	onOrientationChange(): void {

		this.renderConfigService.configureViewOrientation(this.viewOrientation);

		this.dataRows = this.chartDataService.calculateStackedBarOffsets(this.dataRows, this.viewOrientation);

		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.primitiveObjectives);
		this.objectiveChartRenderer.renderObjectiveChart(this.dataRows, this.viewOrientation);
		this.summaryChartRenderer.renderSummaryChart(this.viewOrientation);
		
	}

	onValueChartChange(): void {

		this.dataRows = this.chartDataService.calculateWeightOffsets(this.dataRows);
		this.dataRows = this.chartDataService.calculateStackedBarOffsets(this.dataRows, this.viewOrientation);

		this.summaryChartRenderer.updateSummaryChart(this.dataRows, this.viewOrientation);

		this.labelRenderer.updateLabelSpace(this.labelData, 'rootcontainer', this.viewOrientation, this.primitiveObjectives);
		this.objectiveChartRenderer.renderObjectiveChart(this.dataRows, this.viewOrientation);
	}

}