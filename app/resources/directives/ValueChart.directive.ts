/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-03 16:06:08
*/


import { Directive, Input } 							from '@angular/core';
import { OnInit, OnChanges, SimpleChange }				from '@angular/core';
import { TemplateRef, ViewContainerRef, ElementRef }	from '@angular/core';

// d3
import * as d3 											from 'd3';

// Application classes
import { ChartDataService }								from '../services/ChartData.service';

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

	private valueChart: ValueChart;
	private weightMap: WeightMap;
	private viewOrientation: string;
	private el: any;

	private viewportWidth: number;	
	private viewportHeight: number;

	private dimensionOneSize: number;
	private dimensionTwoSize: number;

	private dimensionOne: string;
	private dimensionTwo: string;
	private coordinateOne: string;
	private coordinateTwo: string;

	private objectiveCharts: any;
	private objectives: any[];
												// Using any for now...
	constructor(
		private template: TemplateRef<any>, 
		private viewContainer: ViewContainerRef, 
		private elementRef: ElementRef, 
		private chartDataService: ChartDataService) { }

	@Input() set data(value: any) {
		this.valueChart = <ValueChart> value;
	}

	@Input() set orientation(value: any) {
		this.viewOrientation = <string> value;
	}

	ngOnInit() {
		this.viewportWidth = 600;
		this.viewportHeight = 400;

		this.configureViewOrientation()

		console.log(this.valueChart);

		console.log(this.elementRef);

		console.log(this.viewOrientation);

		// Make the SVG scale dynamically to fit the viewport.
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed({ 'ValueChart': true, 'svg-content-responsive': true })
			.attr('viewBox', '0 0' + ' ' + this.viewportWidth + ' ' + this.viewportWidth)
			.attr('preserveAspectRatio', 'xMinYMin meet');

		this.objectives = [];

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective) => {
			this.objectives.push({
				objective: objective,
				objectiveValues: this.chartDataService.getValuesForPrimitiveObjective(objective)
			});
		});

		this.renderPrimitiveObjectives(this.objectives);
	}

	configureViewOrientation(): void {
		if (this.viewOrientation === 'horizontal') {
			console.log('horizontal')
			this.dimensionOne = 'width';
			this.dimensionTwo = 'height';
			this.coordinateOne = 'x';
			this.coordinateTwo = 'y';

			this.dimensionOneSize = 500;	// This is the width of the graph
			this.dimensionTwoSize = 300;	// This is the height of the graph
		} else if (this.viewOrientation === 'vertical') {
			console.log('vertical')
			this.dimensionOne = 'height';
			this.dimensionTwo = 'width';
			this.coordinateOne = 'y';
			this.coordinateTwo = 'x';

			this.dimensionOneSize = 300;	// This is the height of the graph
			this.dimensionTwoSize = 500;	// This is the width of the graph
		}
	}

	renderPrimitiveObjectives(objectives: any[]) {
		this.objectiveCharts = this.el.append('g')
			.selectAll('g')
				.data(objectives)
				.enter().append('g')
					.attr('transform', (d: any, i: number) => {
						return this.generateTranslation(0, (i * this.dimensionTwoSize / objectives.length));
					});

		this.objectiveCharts.append('rect')
			.attr(this.dimensionOne, this.dimensionOneSize)
			.attr(this.dimensionTwo, this.dimensionTwoSize / objectives.length)
			.style('stroke-width', 1)
			.style('stroke', 'black')
			.style('fill', 'white');
	}

	generateTranslation(coordinateOneAmount: number, coordinateTwoAmount: number): string {
		if (this.viewOrientation === 'horizontal') {
			return 'translate(' + coordinateOneAmount + ',' + coordinateTwoAmount + ')';
		} else {
			return 'translate(' + coordinateTwoAmount + ',' + coordinateOneAmount + ')';
		}
	}

	// The type of changeRecord should be SimpleChanges, but no such type exists in this release. TODO: Update this once Angular has been updated.
	ngOnChanges(changeRecord: any) {
		console.log(changeRecord, 'change in progress');


		if (this.el === undefined)
			return;
		
		if (changeRecord.data)
			this.valueChart = changeRecord.data.currentValue;
		if (changeRecord.orientation)
			this.viewOrientation = changeRecord.orientation.currentValue;

		this.configureViewOrientation();

		// This stuff is temporary
		this.objectiveCharts
			.attr('transform', (d: any, i: number) => {
				return this.generateTranslation(0, (i * this.dimensionTwoSize / this.objectives.length));
			})
			.selectAll('rect')
				.attr(this.dimensionOne, this.dimensionOneSize)
				.attr(this.dimensionTwo, this.dimensionTwoSize / this.objectives.length)

	}
}