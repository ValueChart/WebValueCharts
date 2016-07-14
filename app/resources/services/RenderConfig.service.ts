/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:02:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 17:30:34
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService }											from './ChartData.service';

// Model Classes:
import { User }														from '../model/User';

@Injectable()
export class RenderConfigService {

	public VALUECHART_WIDTH: number = 800;	// Width of a a single ValueChart component (like an Objective chart, summary chart, or label area.)
	public VALUECHART_HEIGHT: number = 400;	// Height of a a single ValueChart component (like an Objective chart, summary chart, or label area.)

	public viewOrientation: string;	// String representing the current orientation of the ValueChart. Either 'vertical' or 'horizontal'

	public dimensionOne: string; // Width when in 'vertical' Orientation, Height when in 'horizontal' Orientation
	public dimensionTwo: string; // Height when in 'vertical' Orientation, Width when in 'horizontal' Orientation
	
	public coordinateOne: string; // x when in 'vertical' Orientation, y when in 'horizontal' Orientation
	public coordinateTwo: string; // y when in 'vertical' Orientation, x when in 'horizontal' Orientation

	public dimensionOneSize: number; // Width (or Height) of a major element of a ValueChart (objective chart, labels, and summary chart)
	public dimensionTwoSize: number; // Height (or Width) of a major element of a ValueChart (objective chart, labels, and summary chart)

	public dimensionTwoScale: d3.Linear<number, number>; // Linear scale between domain [0,1] and range [0, dimensionTwoSize]

	public viewConfiguration: any = {};

	// This list is drawn from Kelly's 22 Colors of Maximum Contrast. White and Black, the first two colors, have been omitted. See: http://www.iscc.org/pdf/PC54_1724_001.pdf
	public kellyColors: string[] = ['#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26']

	public userColorsAssigned: boolean;


	constructor(private chartDataService: ChartDataService) { }

	// This function configures the variables used for height, width, x, and y attributes of SVG elements.
	// Whenever defining height and width attributes, the attributes should be set using dimensionOne, and dimensionTwo
	// The same goes for x and y positions. This insures that when the orientation of the graph changes, the x and y,
	// and height, and width attributes are switched. Note that the size of the graph -  width: 500, height: 300 - does not change,
	// although the which variable represents that dimension does.
	configureViewOrientation(viewOrientation: string): void {
		this.viewOrientation = viewOrientation;

		if (viewOrientation === 'vertical') {
			// We want to render the ValueChart horizontally
			this.dimensionOne = 'width';	// Set dimensionOne to be the width of the graph
			this.dimensionTwo = 'height';	// Set dimensionTwo to the height of the graph
			this.coordinateOne = 'x';		// Set coordinateOne to the x coordinate
			this.coordinateTwo = 'y';		// Set coordinateTwo to the y coordinate

			this.dimensionOneSize = this.VALUECHART_WIDTH;	// This is the width of the graph
			this.dimensionTwoSize = this.VALUECHART_HEIGHT;	// This is the height of the graph

		} else if (viewOrientation === 'horizontal') {
			this.dimensionOne = 'height'; 	// Set dimensionOne to be the height of the graph
			this.dimensionTwo = 'width';	// Set dimensionTwo to be the width of the graph
			this.coordinateOne = 'y';		// Set coordinateOne to the y coordinate
			this.coordinateTwo = 'x';		// Set coordinateTwo to the x coordinate

			this.dimensionOneSize = this.VALUECHART_HEIGHT;	// This is the height of the graph
			this.dimensionTwoSize = this.VALUECHART_WIDTH;	// This is the width of the graph
		}

		// Assign a color to each user in the ValueChart
		if (!this.userColorsAssigned) {
			var numKellyColorsUsed: number = 0;
			this.chartDataService.users.forEach((user: User, index: number) => {
				if (!user.color) {
					user.color = this.kellyColors[numKellyColorsUsed];
					numKellyColorsUsed++;
				}
			});
			this.userColorsAssigned = true;
		}
	}

	recalculateDimensionTwoScale(viewOrientation: string): void {
		if (viewOrientation === 'vertical') {

			this.dimensionTwoScale = d3.scaleLinear()
				.domain([0, this.chartDataService.maximumWeightMap.getWeightTotal()])
				.range([0, this.VALUECHART_HEIGHT]);
		} else if (viewOrientation === 'horizontal') {
			
			this.dimensionTwoScale = d3.scaleLinear()
				.domain([0, this.chartDataService.maximumWeightMap.getWeightTotal()])
				.range([0, this.VALUECHART_WIDTH]);
		}
	}

	// Generate the correct translation depending on the orientation. Translations are not performed individually for x and y,
	// so this function is required to return the correct string.
	generateTransformTranslation(viewOrientation: string, coordinateOneAmount: number, coordinateTwoAmount: number): string {
		if (viewOrientation === 'vertical') {
			return 'translate(' + coordinateOneAmount + ',' + coordinateTwoAmount + ')';
		} else {
			return 'translate(' + coordinateTwoAmount + ',' + coordinateOneAmount + ')';
		}
	}

	incrementTransform(previousTransform: string, deltaCoordinateOne: number, deltaCoordinateTwo: number): string {
		var commaIndex: number = previousTransform.indexOf(',');
		// Pull the current transform coordinates form the string. + is a quick operation that converts them into numbers.
		var xTransform: number = +previousTransform.substring(previousTransform.indexOf('(') + 1, commaIndex);
		var yTransform: number = +previousTransform.substring(commaIndex + 1, previousTransform.indexOf(')'));

		if (this.viewOrientation === 'vertical') {
			return 'translate(' + (xTransform + deltaCoordinateOne) + ',' + (yTransform + deltaCoordinateTwo) + ')';
		} else {
			return 'translate(' + (xTransform + deltaCoordinateTwo) + ',' + (yTransform + deltaCoordinateOne) + ')';
		}
	}
}
