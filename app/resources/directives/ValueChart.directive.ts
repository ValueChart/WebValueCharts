/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-06 17:20:40
*/


import { Directive, Input } 										from '@angular/core';
import { OnInit, OnChanges, SimpleChange }							from '@angular/core';
import { TemplateRef, ViewContainerRef, ElementRef }				from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';

// Model Classes
import { ValueChart } 												from '../model/ValueChart';
import { GroupValueChart } 											from '../model/GroupValueChart';
import { IndividualValueChart } 									from '../model/IndividualValueChart';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { WeightMap }												from '../model/WeightMap';
import { User }														from '../model/User';

@Directive({
	selector: 'ValueChart',
	inputs: ['data', 'orientation']
})
export class ValueChartDirective implements OnInit, OnChanges {

	private VALUECHART_WIDTH: number = 400;
	private VALUECHART_HEIGHT: number = 200;

	private isInitialized: boolean;
	// Inputs to the directive.
	private valueChart: ValueChart;		// A ValueChart. Can be an IndividualValueChart or a GroupValueChart
	private weightMap: WeightMap;
	private numPrimitiveObjectives: number;
	private numUsers: number;
	private viewOrientation: string;	// View orientation. Either 'horizontal' or 'vertical'

	// Height and width of the viewport for use with viewBox attribute of the root SVG element
	private viewportWidth: number;
	private viewportHeight: number;

	// Fields for configuring whether to render horizontally or vertically. May combine these into a config object later.
	private dimensionOneSize: number;
	private dimensionTwoSize: number;
	private dimensionOne: string;
	private dimensionTwo: string;
	private coordinateOne: string;
	private coordinateTwo: string;
	private dimensionOneScale: any;
	private dimensionTwoScale: any;

	// ValueChart data that has been organized to work with d3.
	private dataRows: VCRowData[];	// ValueCharts row (or column if in vertical orientation) data. Each array element is the data for one objective.
	private labelData: VCLabelData[];

	// Fields for d3 collections that should be saved for later manipulation
	private el: any; // The SVG base element for the ValueChart rendering.

	private labelSelections: any;
	private objectiveChartSelections: any; 
	private stackedBarChartSelections: any;

	constructor(
		private template: TemplateRef<any>,
		private viewContainer: ViewContainerRef,
		private elementRef: ElementRef,
		private chartDataService: ChartDataService) { }

	// Binds to the directive attribute 'data', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives data attribute.
	@Input() set data(value: any) {
		this.valueChart = <ValueChart>value;
	}

	// Binds to the directive attribute 'orientation', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives orientation attribute.
	@Input() set orientation(value: any) {
		this.viewOrientation = <string>value;
	}

	// Initialization code for the ValueChart goes in this function. ngOnInit is called by Angular AFTER the first ngOnChange
	// and after the input variables are initialized. This means that this.valueChart and this.viewOrientation are defined.
	// ngOnInit is only called ONCE. This function should thus be used for one-time initialized only.
	ngOnInit() {
		// Configure the size of the user viewport. This will be scaled to fit the browser window
		this.viewportWidth = 900;
		this.viewportHeight = 450;

		if (this.valueChart.type === 'individual') {
			this.weightMap = (<IndividualValueChart>this.valueChart).getUser().getWeightMap();
			this.numUsers = 1;
		} else {
			this.weightMap = (<GroupValueChart> this.valueChart).calculateAverageWeightMap();
			this.numUsers = (<GroupValueChart> this.valueChart).getUsers().length;
		}

		this.objectiveChartSelections = {};
		this.stackedBarChartSelections = {};
		this.labelSelections = {};

		// Configure the orientation options depending on the 
		this.configureViewOrientation(this.viewOrientation);

		// Create the SVG base element, and set it to dynamically fit to the viewport.
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed({ 'ValueChart': true, 'svg-content-responsive': true })
			.attr('viewBox', '0 0' + ' ' + this.viewportWidth + ' ' + this.viewportHeight)
			.attr('preserveAspectRatio', 'xMinYMin meet');


		// Get objective data in a format that suits d3.
		this.dataRows = this.chartDataService.getRowData(this.valueChart);
		this.calculateWeightOffsets(this.dataRows);
		this.calculateStackedBarOffsets(this.dataRows);
		this.numPrimitiveObjectives = this.dataRows.length;

		this.labelData = this.chartDataService.getLabelData(this.valueChart, this.weightMap);
		this.createLabelSpace(this.labelData);
		this.renderLabelSpace(this.labelData);

		// Render the ValueChart;
		this.createObjectiveChart(this.dataRows);
		this.renderObjectiveChart(this.dataRows);

		this.createStackedBarChart(this.dataRows);
		this.renderStackedBarChart();

		this.isInitialized = true;
	}

	// The type of changeRecord should be SimpleChanges, but no such type exists in this release. TODO: Update this once Angular has been updated.
	// noOnChanges is called by Angular whenever the inputs to the directive change. It is called BEFORE ngOnIt when the directive is first
	// initialized. 
	ngOnChanges(changeRecord: any): void {
		// Check to see if the directive has been initialized yet (ie. if ngOnInit has run).
		if (this.isInitialized === undefined)
			return;

		// The valueChart data has changed.
		if (changeRecord.data){
			this.valueChart = changeRecord.data.currentValue;
		}

		// The orientation of the ValueChart has been changed.
		if (changeRecord.orientation) {
			this.viewOrientation = changeRecord.orientation.currentValue;

			// Change orientation
			this.configureViewOrientation(this.viewOrientation);
			this.calculateStackedBarOffsets(this.dataRows);
			this.renderLabelSpace(this.labelData);
			this.renderObjectiveChart(this.dataRows);
			this.renderStackedBarChart();

		}
	}


	createLabelSpace(labelData: VCLabelData[]): void {
		this.labelSelections.labelRootSpace = this.el.append('g')
			.classed('labelspace-rootspace', true)
			
		this.labelSelections.spaceOutline = this.labelSelections.labelRootSpace.append('g')
			.classed('labelspace-outline-container', true)
			.append('rect')
				.classed('lablespace-outline', true)
					.style('fill', 'white')
					.style('stroke-width', 1)
					.style('stroke', 'grey');

		this.createLabels(this.labelSelections.labelRootSpace.append('g'), labelData, 'rootspace');
	}

	createLabels(labelSpace: any, labelData: VCLabelData[], parentName: string): void {
		
		var subLabelSpaces = labelSpace.selectAll('g')
			.data(labelData)
			.enter().append('g')
				.classed('labelspace-subspace', true)
				.attr('id', (d: VCLabelData) => { return 'labelspace-' + d.objective.getName() + '-container' })
				.attr('parent', parentName);

		subLabelSpaces.append('rect')
			.classed('labelspace-subspace-outline', true)
			.attr('id', (d: VCLabelData) => { return 'labelspace-' + d.objective.getName() + '-outline' });

		subLabelSpaces.append('text')
			.classed('labelspace-subspace-text', true)
			.attr('id', (d: VCLabelData) => { return 'labelspace-' + d.objective.getName() + '-text' });


		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.subLabelData === undefined)
				return;

			this.createLabels(this.el.select('#labelspace-' + labelDatum.objective.getName() + '-container'), labelDatum.subLabelData, labelDatum.objective.getName());
		});
	}

	renderLabelSpace(labelData: VCLabelData[]): void {
		this.labelSelections.labelRootSpace
			.attr('transform', () => {
				if (this.viewOrientation === 'vertical')
					return this.generateTransformTranslation(0, this.dimensionTwoSize + 10);
				else
					return this.generateTransformTranslation(0, 0);
			});
				
		this.labelSelections.spaceOutline
			.attr(this.dimensionOne, this.dimensionOneSize)
			.attr(this.dimensionTwo, this.dimensionTwoSize);

		var labelSpaces = this.labelSelections.labelRootSpace.selectAll('g[parent=rootspace]');
		this.renderLabels(labelSpaces, labelData);
	}

	renderLabels(labelSpaces: any, labelData: VCLabelData[]): void {
		
		var numLabelsAtLevel = labelData.length;
		var dimensionOne: number = 20;

		labelSpaces.select('rect')
			.style('fill', 'white')
			.style('stroke-width', 1)
			.style('stroke', 'grey')
			.attr(this.dimensionOne, dimensionOne)
			.attr(this.dimensionTwo, (d: VCLabelData, i: number) => {
				return (this.dimensionTwoSize / numLabelsAtLevel);
			})
			.attr(this.coordinateOne, 0)



		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.subLabelData === undefined)
				return;
			let subLabelSpaces = this.labelSelections.labelRootSpace.selectAll('g[parent=' + labelDatum.objective.getName() + ']');
			subLabelSpaces.attr('transform', this.generateTransformTranslation(dimensionOne, 0));

			this.renderLabels(subLabelSpaces, labelDatum.subLabelData);
		});
	}


	createObjectiveChart(rows: VCRowData[]): void {
		this.objectiveChartSelections.chart = this.el.append('g')
			.classed('objective-chart', true)
			
		this.createObjectiveRows(this.objectiveChartSelections.chart, rows);
	}

	createObjectiveRows(objectiveChart: any, rows: VCRowData[]): void {
		this.objectiveChartSelections.rowOutlines = objectiveChart.append('g')
			.classed('objective-row-outlines-container', true)
			.selectAll('rect')
				.data(rows)
				.enter().append('rect')
					.classed('objective-row-outline', true)
					.style('stroke-width', 1)
					.style('stroke', 'grey')
					.style('fill', 'white');

		this.objectiveChartSelections.rows = objectiveChart.append('g')
			.classed('objective-rows-container', true)
			.selectAll('g')
				.data(rows)
				.enter().append('g')
					.classed('objective-row', true);

		this.objectiveChartSelections.dividingLines = objectiveChart.append('g')
			.classed('objective-dividers-container', true)
			.selectAll('line')
				.data(this.valueChart.getAlternatives())
				.enter().append('line')
					.classed('objective-dividing-line', true)
					.style('stroke-width', 1)
					.style('stroke', 'grey');

		this.createObjectiveCells(this.objectiveChartSelections.rows)

	}

	createObjectiveCells(objectiveRows: any): void {
		this.objectiveChartSelections.cells = objectiveRows.selectAll('g')
			.data((d: VCRowData) => { return d.cells; })
			.enter().append('g')
				.classed('objective-cell', true);

		this.objectiveChartSelections.userScores = this.objectiveChartSelections.cells.selectAll('rect')
			.data((d: VCCellData, i: number) => { return d.userScores; })
			.enter().append('rect')
				.classed('objective-user-scores', true);
	}

	renderObjectiveChart(rows: VCRowData[]): void {
		this.objectiveChartSelections.chart
			.attr('transform', () => {
				if (this.viewOrientation == 'vertical')
					return this.generateTransformTranslation(this.dimensionOneSize, this.dimensionTwoSize + 10);
				else
					return this.generateTransformTranslation(this.dimensionOneSize, 0);	// TODO: Fix this.
			});

		this.objectiveChartSelections.dividingLines
			.attr(this.coordinateOne + '1', (d: VCCellData, i: number) => { return i * (this.dimensionOneSize / this.valueChart.getAlternatives().length); })
			.attr(this.coordinateTwo + '1', (d: VCCellData, i: number) => { return 0; })
			.attr(this.coordinateOne + '2', (d: VCCellData, i: number) => { return i * (this.dimensionOneSize / this.valueChart.getAlternatives().length); })
			.attr(this.coordinateTwo + '2', (d: VCCellData, i: number) => { return this.dimensionTwoSize });

		this.renderObjectiveChartRows();
	}

	// Render the rows of the ValueChart
	renderObjectiveChartRows(): void {
		this.objectiveChartSelections.rowOutlines
			.attr('transform', (d: VCRowData, i: number) => {
				return this.generateTransformTranslation(0, (this.dimensionTwoScale(d.weightOffset)));
			})
			.attr(this.dimensionOne, this.dimensionOneSize)
			.attr(this.dimensionTwo, (d: VCRowData) => {
				var objectiveWeight: number = this.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				return this.dimensionTwoScale(objectiveWeight);
			});

		this.objectiveChartSelections.rows
			.attr('transform', (d: VCRowData, i: number) => {
				return this.generateTransformTranslation(0, (this.dimensionTwoScale(d.weightOffset)));
			});				

		this.renderObjectiveChartCells();
	}

	// Don't worry about this for now.
	renderObjectiveChartCells(): void {
		this.objectiveChartSelections.cells
				.attr('transform', (d: VCCellData, i: number) => { return this.generateTransformTranslation(i * (this.dimensionOneSize / this.valueChart.getAlternatives().length), 0); })
					
		this.objectiveChartSelections.userScores	
			.style('fill', (d: any, i: number) => { return d.objective.getColor(); })
			.attr(this.dimensionOne, (d: any, i: number) => { 
				return (this.dimensionOneSize / this.valueChart.getAlternatives().length) / this.numUsers;
			})
			.attr(this.dimensionTwo, (d: any, i: number ) => { 
				var objectiveWeight: number = this.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				return this.dimensionTwoScale(d.score * objectiveWeight); 
			} )
			.attr(this.coordinateOne, (d: any, i: number) => { 
				return ((this.dimensionOneSize / this.valueChart.getAlternatives().length) / this.numUsers) * i; 
			});
						
		if (this.viewOrientation === 'vertical') {
			this.objectiveChartSelections.userScores
				.attr(this.coordinateTwo, (d: any, i: number) => {
					var objectiveWeight: number = this.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
					return this.dimensionTwoScale(objectiveWeight) - this.dimensionTwoScale(d.score * objectiveWeight);
				});
		}
	}

	createStackedBarChart(rows: VCRowData[]): void {
		this.stackedBarChartSelections.chart = this.el.append('g')
			.classed('stackedbar-chart', true);

		this.createStackedBarRows(this.stackedBarChartSelections.chart, rows);
	}

	createStackedBarRows(stackedBarChart: any, rows: VCRowData[]): void {
		this.stackedBarChartSelections.outline = stackedBarChart.append('g')
				.classed('stackedbar-outline-container', true)
				.append('rect')
					.classed('stackedbar-outline', true)
					.attr('fill', 'white')
					.attr('stroke', 'grey')
					.attr('stroke-width', 1);

		this.stackedBarChartSelections.rows = stackedBarChart.append('g')
				.classed('stackedbar-rows-container', true)
				.selectAll('g')
					.data(rows)
					.enter().append('g')
						.classed('objective-col', true);

		this.stackedBarChartSelections.dividingLines = stackedBarChart.append('g')
			.classed('stackedbar-dividers-container', true)
			.selectAll('line')
				.data(this.valueChart.getAlternatives())
				.enter().append('line')
					.classed('stackedbar-dividing-line', true)
					.style('stroke-width', 1)
					.style('stroke', 'grey');

		this.createStackedBarCells(this.stackedBarChartSelections.rows);
	}

	createStackedBarCells(stackedBarRows: any): void {
		this.stackedBarChartSelections.cells = stackedBarRows.selectAll('g')
			.data((d: VCRowData) => { return d.cells; })
			.enter().append('g')
				.classed('stackedbar-cell', true);

		this.stackedBarChartSelections.userScores = this.stackedBarChartSelections.cells.selectAll('rect')
			.data((d: VCCellData, i: number) => { return d.userScores; })
			.enter().append('rect')
				.classed('stackedbar-user-scores', true);
	}

	renderStackedBarChart(): void {
		this.stackedBarChartSelections.chart
			.attr('transform', () => {
				if (this.viewOrientation == 'vertical')
					return this.generateTransformTranslation(this.dimensionOneSize, 0);
				else
					return this.generateTransformTranslation(this.dimensionOneSize, this.dimensionTwoSize + 10);
			});

		this.stackedBarChartSelections.outline
			.attr(this.dimensionOne, this.dimensionOneSize)
			.attr(this.dimensionTwo, this.dimensionTwoSize);

		this.stackedBarChartSelections.dividingLines
			.attr(this.coordinateOne + '1', (d: VCCellData, i: number) => { 
				return i * (this.dimensionOneSize / this.valueChart.getAlternatives().length); 
			})
			.attr(this.coordinateTwo + '1', (d: VCCellData, i: number) => { return 0; })
			.attr(this.coordinateOne + '2', (d: VCCellData, i: number) => { 
				return i * (this.dimensionOneSize / this.valueChart.getAlternatives().length); 
			})
			.attr(this.coordinateTwo + '2', (d: VCCellData, i: number) => { return this.dimensionTwoSize });

		this.renderStackedBarRows();
	}	

	renderStackedBarRows(): void {			

		this.renderStackedBarCells()
	}

	renderStackedBarCells(): void {
		this.stackedBarChartSelections.cells
			.attr('transform', (d: VCCellData, i: number) => { return this.generateTransformTranslation(i * (this.dimensionOneSize / this.valueChart.getAlternatives().length), 0); })


		this.stackedBarChartSelections.userScores
			.style('fill', (d: any, i: number) => { return d.objective.getColor(); })
			.attr(this.dimensionOne, (d: any, i: number) => {
				return (this.dimensionOneSize / this.valueChart.getAlternatives().length) / this.numUsers;
			})
			.attr(this.dimensionTwo, (d: any, i: number) => {
				var objectiveWeight: number = this.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				return this.dimensionTwoScale(d.score * objectiveWeight);
			})
			.attr(this.coordinateOne, (d: any, i: number) => {
				return ((this.dimensionOneSize / this.valueChart.getAlternatives().length) / this.numUsers) * i;
			})
			.attr(this.coordinateTwo, (d: any, i: number) => {
				var objectiveWeight: number = this.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				if (this.viewOrientation == 'vertical')
					return (this.dimensionTwoSize - this.dimensionTwoScale(d.offset)) - this.dimensionTwoScale(d.score * objectiveWeight);
				else
					return this.dimensionTwoScale(d.offset);
			});

	}

	// TODO: Move this to ChartDataSerivce

	// Calculate the weight offset for each row. The weight offset for one row is the combined weights of all rows
	// prior in the row ordering. This is needed to determine the y (or x if in vertical orientation) position for each row,
	// seeing as the weight of the previous rows depends on the their weights.
	calculateWeightOffsets(rows: VCRowData[]): void {
		var weightOffset: number = 0;

		for (var i = 0; i < rows.length; i++) {
			rows[i].weightOffset = weightOffset;
			weightOffset += this.weightMap.getNormalizedObjectiveWeight(rows[i].objective.getName());
		}
	}

	calculateStackedBarOffsets(rows: VCRowData[]): void {
		var stack = d3.layout.stack()
			.x((d: any, i: number) => { return i; })
			.y((d: any) => { return (d.score * this.weightMap.getNormalizedObjectiveWeight(d.objective.getName())); })
			.out((d: any, y0: number) => {
				d.offset = y0;
			});

		if (this.viewOrientation === 'vertical') {
			stack.order('reverse');
		}

		for (var i: number = 0; i < rows[0].cells.length; i++) {
			stack.values((d: any) => { return d.cells[i].userScores; })
			stack(<any> rows);
		}
	}

	// Generate the correct translation depending on the orientation. Translations are not performed individually for x and y,
	// so this function is required to return the correct string.
	generateTransformTranslation(coordinateOneAmount: number, coordinateTwoAmount: number): string {
		if (this.viewOrientation === 'vertical') {
			return 'translate(' + coordinateOneAmount + ',' + coordinateTwoAmount + ')';
		} else {
			return 'translate(' + coordinateTwoAmount + ',' + coordinateOneAmount + ')';
		}
	}


	// This function configures the variables used for height, width, x, and y attributes of SVG elements.
	// Whenever defining height and width attributes, the attributes should be set using dimensionOne, and dimensionTwo
	// The same goes for x and y positions. This insures that when the orientation of the graph changes, the x and y,
	// and height, and width attributes are switched. Note that the size of the graph -  width: 500, height: 300 - does not change,
	// although the which variable represents that dimension does.
	configureViewOrientation(viewOrientation: string): void {
		if (this.viewOrientation === 'vertical') {
			// We want to render the ValueChart horizontally
			this.dimensionOne = 'width';	// Set dimensionOne to be the width of the graph
			this.dimensionTwo = 'height';	// Set dimensionTwo to the height of the graph
			this.coordinateOne = 'x';		// Set coordinateOne to the x coordinate
			this.coordinateTwo = 'y';		// Set coordinateTwo to the y coordinate

			this.dimensionOneSize = this.VALUECHART_WIDTH;	// This is the width of the graph
			this.dimensionTwoSize = this.VALUECHART_HEIGHT;	// This is the height of the graph

			this.dimensionTwoScale = d3.scale.linear()
				.domain([0, 1])
				.range([0, this.VALUECHART_HEIGHT]);

		} else if (this.viewOrientation === 'horizontal') {
			this.dimensionOne = 'height'; 	// Set dimensionOne to be the height of the graph
			this.dimensionTwo = 'width';	// Set dimensionTwo to be the width of the graph
			this.coordinateOne = 'y';		// Set coordinateOne to the y coordinate
			this.coordinateTwo = 'x';		// Set coordinateTwo to the x coordinate

			this.dimensionOneSize = this.VALUECHART_HEIGHT;	// This is the height of the graph
			this.dimensionTwoSize = this.VALUECHART_WIDTH;	// This is the width of the graph

			this.dimensionTwoScale = d3.scale.linear()
				.domain([0, 1])
				.range([0, this.VALUECHART_WIDTH]);
		}
	}

}