/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-04 19:22:46
*/


import { Directive, Input } 							from '@angular/core';
import { OnInit, OnChanges, SimpleChange }				from '@angular/core';
import { TemplateRef, ViewContainerRef, ElementRef }	from '@angular/core';

// d3
import * as d3 											from 'd3';

// Application classes
import { ChartDataService, VCCellData, VCRowData }		from '../services/ChartData.service';

// Model Classes
import { ValueChart } 									from '../model/ValueChart';
import { GroupValueChart } 								from '../model/GroupValueChart';
import { IndividualValueChart } 						from '../model/IndividualValueChart';
import { PrimitiveObjective }							from '../model/PrimitiveObjective';
import { WeightMap }									from '../model/WeightMap';


@Directive({
	selector: 'ValueChart',
	inputs: ['data', 'orientation']
})
export class ValueChartDirective implements OnInit, OnChanges {

	private VALUECHART_WIDTH: number = 800;
	private VALUECHART_HEIGHT: number = 400;

	private isInitialized: boolean;
	// Inputs to the directive.
	private valueChart: ValueChart;		// A ValueChart. Can be an IndividualValueChart or a GroupValueChart
	private weightMap: WeightMap;
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
	private dataRows: VCRowData[];	// ValueCharts row (or column if in vertical orientation) data.


	// Fields for d3 collections that should be saved for later manipulation
	private el: any; // The SVG base element for the ValueChart rendering.
	private chartRows: any; // The collection of g elements that hold each row (or column if in vertical orientation) of the chart. 


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

		if (this.valueChart.type === 'individual')
			this.weightMap = (<IndividualValueChart> this.valueChart).getUser().getWeightMap();
		else {
			this.weightMap = (<GroupValueChart> this.valueChart).calculateAverageWeightMap();
		}

		// Configure the orientation options depending on the 
		this.configureViewOrientation(this.viewOrientation)

		// Create the SVG base element, and set it to dynamically fit to the viewport.
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed({ 'ValueChart': true, 'svg-content-responsive': true })
			.attr('viewBox', '0 0' + ' ' + this.viewportWidth + ' ' + this.viewportHeight)
			.attr('preserveAspectRatio', 'xMinYMin meet');

		// Get objective data in a format that suits d3.
		this.dataRows = this.chartDataService.getRowData(this.valueChart);
		this.calculateWeightOffsets(this.dataRows);
		// Render the ValueChart;
		this.renderRows(this.dataRows);

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
			this.configureViewOrientation(this.viewOrientation);
			this.reorientValueChart();
		}
	}

	// Render the rows of the ValueChart
	renderRows(rows: VCRowData[]): void {

		this.chartRows = this.el.append('g').append('g')
			.selectAll('g')
				.data(rows)
				.enter()
				.append('g')
					.attr('transform', (d: VCRowData, i: number) => {
						return this.generateTransformTranslation(0, (this.dimensionTwoScale(d.weightOffset)));
					});

		this.chartRows.append('rect')
			.classed('row-outline', true)
			.attr(this.dimensionOne, this.dimensionOneSize)
			.attr(this.dimensionTwo, (d: VCRowData) => { return this.dimensionTwoScale(d.weight) })
			.style('stroke-width', 1)
			.style('stroke', 'grey')
			.style('fill', 'white');

		this.el.select('g').append('g')
			.selectAll('line')
				.data(this.valueChart.getAlternatives())
				.enter()
				.append('line')
					.attr(this.coordinateOne + '1', (d: VCCellData, i: number) => { return i * (this.dimensionOneSize / this.valueChart.getAlternatives().length); })
					.attr(this.coordinateTwo + '1', (d: VCCellData, i: number) => { return 0; })
					.attr(this.coordinateOne + '2', (d: VCCellData, i: number) => { return i * (this.dimensionOneSize / this.valueChart.getAlternatives().length); })
					.attr(this.coordinateTwo + '2', (d: VCCellData, i: number) => { return this.dimensionTwoSize })
					.style('stroke-width', 1)
					.style('stroke', 'grey');


		this.renderCells();

	}

	// Don't worry about this for now.
	renderCells(): void {
		this.chartRows.append('g')
			.selectAll('g')
			.data((d: VCRowData) => { return d.cells; })
			.enter().append('g')
				.classed('cell', true)
					.attr('transform', (d: VCCellData, i: number) => { return this.generateTransformTranslation(i * (this.dimensionOneSize / this.valueChart.getAlternatives().length), 0); })
					.selectAll('rect')
						.data((d: VCCellData, i: number) => { console.log(d); return d.userScores; })
						.enter()
						.append('rect')
							.style('fill', 'red')
							.attr('height', 20)
							.attr('width', 20)
	}		

	// TODO: Move this to ChartDataSerivce

	// Calculate the weight offset for each row. The weight offset for one row is the combined weights of all rows
	// prior in the row ordering. This is needed to determine the y (or x if in vertical orientation) position for each row,
	// seeing as the weight of the previous rows depends on the their weights.
	calculateWeightOffsets(rows: VCRowData[]): void {
		var weightOffset: number = 0;

		for (var i = 0; i < rows.length; i++) {
			rows[i].weightOffset = weightOffset;
			weightOffset += rows[i].weight;
		}
	}

	// Render the ValueChart according to the current orientation.
	reorientValueChart(): void {
		this.chartRows
			.attr('transform', (d: any, i: number) => {
				return this.generateTransformTranslation(0, (i * this.dimensionTwoSize / this.dataRows.length));
			})
			.selectAll('rect')
				.attr(this.dimensionOne, this.dimensionOneSize)
				.attr(this.dimensionTwo, this.dimensionTwoSize / this.dataRows.length);

	}

	// Generate the correct translation depending on the orientation. Translations are not performed individually for x and y,
	// so this function is required to return the correct string.
	generateTransformTranslation(coordinateOneAmount: number, coordinateTwoAmount: number): string {
		if (this.viewOrientation === 'horizontal') {
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
		if (this.viewOrientation === 'horizontal') {
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

		} else if (this.viewOrientation === 'vertical') {
			this.dimensionOne = 'height'; 	// Set dimensionOne to be the height of the graph
			this.dimensionTwo = 'width';	// Set dimensionTwo to be the width of the graph
			this.coordinateOne = 'y';		// Set coordinateOne to the y coordinate
			this.coordinateTwo = 'x';		// Set coordinateTwo to the x coordinate

			this.dimensionOneSize = this.VALUECHART_HEIGHT;	// This is the height of the graph
			this.dimensionTwoSize = this.VALUECHART_WIDTH;	// This is the width of the graph

			this.dimensionTwoScale = d3.scale.linear()
				.domain([0, 1])
				.range([0, this.VALUECHART_HEIGHT]);
		}
	}

}