/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:02:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-09 22:41:42
*/

import { Injectable } 												from '@angular/core';


@Injectable()
export class RenderConfigService {

	public VALUECHART_WIDTH: number = 800;	// Width of a a single ValueChart component (like an Objective chart, summary chart, or label area.)
	public VALUECHART_HEIGHT: number = 400;	// Height of a a single ValueChart component (like an Objective chart, summary chart, or label area.)

	private viewOrientation: string;	// String representing the current orientation of the ValueChart. Either 'vertical' or 'horizontal'

	public dimensionOne: string; // Width when in 'vertical' Orientation, Height when in 'horizontal' Orientation
	public dimensionTwo: string; // Height when in 'vertical' Orientation, Width when in 'horizontal' Orientation
	
	public coordinateOne: string; // x when in 'vertical' Orientation, y when in 'horizontal' Orientation
	public coordinateTwo: string; // y when in 'vertical' Orientation, x when in 'horizontal' Orientation

	public dimensionOneSize: number; // Width (or Height) of a major element of a ValueChart (objective chart, labels, and summary chart)
	public dimensionTwoSize: number; // Height (or Width) of a major element of a ValueChart (objective chart, labels, and summary chart)

	public dimensionTwoScale: any; // Linear scale between domain [0,1] and range [0, dimensionTwoSize]


	constructor() { 
		this.configureViewOrientation('vertical');
	}

	// This function configures the variables used for height, width, x, and y attributes of SVG elements.
	// Whenever defining height and width attributes, the attributes should be set using dimensionOne, and dimensionTwo
	// The same goes for x and y positions. This insures that when the orientation of the graph changes, the x and y,
	// and height, and width attributes are switched. Note that the size of the graph -  width: 500, height: 300 - does not change,
	// although the which variable represents that dimension does.
	configureViewOrientation(viewOrientation: string): void {
		this.viewOrientation = viewOrientation;

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

	// Generate the correct translation depending on the orientation. Translations are not performed individually for x and y,
	// so this function is required to return the correct string.
	generateTransformTranslation(viewOrientation: string, coordinateOneAmount: number, coordinateTwoAmount: number): string {
		if (viewOrientation === 'vertical') {
			return 'translate(' + coordinateOneAmount + ',' + coordinateTwoAmount + ')';
		} else {
			return 'translate(' + coordinateTwoAmount + ',' + coordinateOneAmount + ')';
		}
	}
}
