/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:02:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-21 21:47:44
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ValueChartService }										from './ValueChart.service';

// Model Classes:
import { User }														from '../model/User';

@Injectable()
export class RenderConfigService {

	public CHART_COMPONENT_RATIO: number = 0.47;

	public viewOrientation: string;	// String representing the current orientation of the ValueChart. Either 'vertical' or 'horizontal'

	public viewConfiguration: any = {};

	// This list is drawn from Kelly's 22 Colors of Maximum Contrast. White and Black, the first two colors, have been omitted. See: http://www.iscc.org/pdf/PC54_1724_001.pdf
	public kellyColors: string[] = ['#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26']

	public userColorsAssigned: boolean;


	constructor(private valueChartService: ValueChartService) { }

	// This function configures the variables used for height, width, x, and y attributes of SVG elements.
	// Whenever defining height and width attributes, the attributes should be set using dimensionOne, and dimensionTwo
	// The same goes for x and y positions. This insures that when the orientation of the graph changes, the x and y,
	// and height, and width attributes are switched. Note that the size of the graph -  width: 500, height: 300 - does not change,
	// although the which variable represents that dimension does.
	updateViewConfig(viewConfig: any, viewOrientation: string, componentWidth: number, componentHeight: number): void {
		viewConfig.viewOrientation = viewOrientation;
		viewConfig.chartComponentWidth = componentWidth;
		viewConfig.chartComponentHeight = componentHeight;

		if (viewOrientation === 'vertical') {
			// We want to render the ValueChart horizontally
			viewConfig.dimensionOne = 'width';	// Set dimensionOne to be the width of the graph
			viewConfig.dimensionTwo = 'height';	// Set dimensionTwo to the height of the graph
			viewConfig.coordinateOne = 'x';		// Set coordinateOne to the x coordinate
			viewConfig.coordinateTwo = 'y';		// Set coordinateTwo to the y coordinate

			viewConfig.dimensionOneSize = viewConfig.chartComponentWidth;	// This is the width of the graph
			viewConfig.dimensionTwoSize = viewConfig.chartComponentHeight;	// This is the height of the graph

			viewConfig.dimensionTwoScale = d3.scaleLinear()
				.domain([0, this.valueChartService.getMaximumWeightMap().getWeightTotal()])
				.range([0, componentHeight]);

		} else if (viewOrientation === 'horizontal') {
			viewConfig.dimensionOne = 'height'; 	// Set dimensionOne to be the height of the graph
			viewConfig.dimensionTwo = 'width';	// Set dimensionTwo to be the width of the graph
			viewConfig.coordinateOne = 'y';		// Set coordinateOne to the y coordinate
			viewConfig.coordinateTwo = 'x';		// Set coordinateTwo to the x coordinate

			viewConfig.dimensionOneSize = viewConfig.chartComponentHeight;	// This is the height of the graph
			viewConfig.dimensionTwoSize = viewConfig.chartComponentWidth;	// This is the width of the graph

			viewConfig.dimensionTwoScale = d3.scaleLinear()
				.domain([0, this.valueChartService.getMaximumWeightMap().getWeightTotal()])
				.range([0, componentWidth]);
		}
	}

	initObjectiveColors(): void {
		// Assign a color to each user in the ValueChart
		if (!this.userColorsAssigned) {
			var numKellyColorsUsed: number = 0;
			this.valueChartService.getUsers().forEach((user: User, index: number) => {
				if (!user.color) {
					user.color = this.kellyColors[numKellyColorsUsed];
					numKellyColorsUsed++;
				}
			});
			this.userColorsAssigned = true;
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
