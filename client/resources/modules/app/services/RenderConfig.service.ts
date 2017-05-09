/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:02:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-09 12:29:30
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';

// Import Application Classes
import { ValueChartService }										from './ValueChart.service';

// Import Model Classes:
import { User }														from '../../../model/User';

// Import Types:
import { ViewConfig }												from '../../../types/Config.types';
import { RendererConfig }											from '../../../types/RendererData.types';

@Injectable()
export class RenderConfigService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public CHART_COMPONENT_RATIO: number = 0.47;		// This ratio is used to determine the default size of the ValueChart components. e.x. componentHeight = ValueChartHeight * CHART_COMPONENT_RATIO. 

	public viewConfig: ViewConfig = <any>{};			// Object with the current view configuration. The fields of this object are set by the ValueChartDirective input methods. 

	// This list is drawn from Kelly's 22 Colors of Maximum Contrast. White and Black, the first two colors, have been omitted. See: http://www.iscc.org/pdf/PC54_1724_001.pdf
	public kellyColors: string[] = ['#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26']


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description	Used for Angular's dependency injection.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this service when it is injected.
	*/
	constructor(private valueChartService: ValueChartService) { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param viewConfig - The current viewConfig object for the ValueChartDirective.
		@param viewOrientation - The current viewOrientation of the ValueChartDirective.
		@param componentWidth - The width to that the ValueChartComponents are to be rendered with. Note that this currently does not support different widths for different components.
		@param componentHeight - The height to that the ValueChartComponents are to be rendered with. Note that this currently does not support different heights for different components.
		@returns {void}
		@description	This function configures the variables used for height, width, x, and y attributes of SVG elements during the rendering of the ValueChart.
						The height and width attributes of SVG elements should be set using dimensionOne, and dimensionTwo.
						The x and y positions should be set using coordinateOne and coordinateTwo. 
						This insures that when the orientation of the graph changes, the x and y, and height, and width attributes are switched. 
						Note that the size of the graph is not changed during this process. 

	*/
	updateRendererConfig(rendererConfig: RendererConfig, viewOrientation: string, componentWidth: number, componentHeight: number): void {
		rendererConfig.viewOrientation = viewOrientation;
		rendererConfig.chartComponentWidth = componentWidth;
		rendererConfig.chartComponentHeight = componentHeight;

		if (viewOrientation === 'vertical') {
			// We want to render the ValueChart horizontally
			rendererConfig.dimensionOne = 'width';	// Set dimensionOne to be the width of the graph
			rendererConfig.dimensionTwo = 'height';	// Set dimensionTwo to the height of the graph
			rendererConfig.coordinateOne = 'x';		// Set coordinateOne to the x coordinate
			rendererConfig.coordinateTwo = 'y';		// Set coordinateTwo to the y coordinate

			rendererConfig.dimensionOneSize = rendererConfig.chartComponentWidth;	// This is the width of the graph
			rendererConfig.dimensionTwoSize = rendererConfig.chartComponentHeight;	// This is the height of the graph

			rendererConfig.dimensionTwoScale = d3.scaleLinear()
				.domain([0, this.valueChartService.getValueChart().getMaximumWeightMap().getWeightTotal()])
				.range([0, componentHeight]);

		} else if (viewOrientation === 'horizontal') {
			rendererConfig.dimensionOne = 'height'; 	// Set dimensionOne to be the height of the graph
			rendererConfig.dimensionTwo = 'width';	// Set dimensionTwo to be the width of the graph
			rendererConfig.coordinateOne = 'y';		// Set coordinateOne to the y coordinate
			rendererConfig.coordinateTwo = 'x';		// Set coordinateTwo to the x coordinate

			rendererConfig.dimensionOneSize = rendererConfig.chartComponentHeight;	// This is the height of the graph
			rendererConfig.dimensionTwoSize = rendererConfig.chartComponentWidth;	// This is the width of the graph

			rendererConfig.dimensionTwoScale = d3.scaleLinear()
				.domain([0, this.valueChartService.getValueChart().getMaximumWeightMap().getWeightTotal()])
				.range([0, componentWidth]);
		}
	}

	/*
		@returns {void}
		@description	Assigns a color to every user in the ValueChart that does not yet have a color. Note that users that join the ValueChart
						do not have colors, so this method must be called whenever a new user joins.

	*/
	initUserColors(): void {
		if (this.valueChartService.isIndividual())
			return;

		// Assign a color to each user without one in the ValueChart
		this.valueChartService.getUsers().forEach((user: User, index: number) => {
			if (!user.color) {
				user.color = this.kellyColors[index];
			}
		});
	}

	/*
		@param viewOrientation - the viewOrientation of the desired transform.
		@param coordinateOneAmount - the amount of translation in the coordinateOne direction. Note what direction this is depends on the orientation.
		@param coordinateTwoAmount - the amount of translation in the coordinateTwo direction. Note what direction this is depends on the orientation.
		@returns a correctly formatted translate string for a transform attribute.
		@description	Generate the correct translation for a transform attribute of an SVG element depending on the current ValueChart orientation.
						This method allows transformations to be generated properly while using the coordinateOne and coordinateTwo fields instead of 
						directly using x and y.
	*/
	generateTransformTranslation(viewOrientation: string, coordinateOneAmount: number, coordinateTwoAmount: number): string {
		if (viewOrientation === 'vertical') {
			return 'translate(' + coordinateOneAmount + ',' + coordinateTwoAmount + ')';
		} else {
			return 'translate(' + coordinateTwoAmount + ',' + coordinateOneAmount + ')';
		}
	}

	/*
		@param previousTransform - the transformation that is to be incremented by deltaCoordinateOne and deltaCoordinateTwo.
		@param deltaCoordinateOne - the amount to increase the translation in the coordinateOne direction.
		@param deltaCoordinateTwo - the amount to increase the translation in the coordinateTwo direction.
		@returns a correctly formatted and incremented translate string for a transform attribute.
		@description	Properly increment an existing transformation by deltaCoordinateOne and deltaCoordinateTwo while taking into account the current 
						orientation of the ValueChart.
	*/
	incrementTransform(previousTransform: string, deltaCoordinateOne: number, deltaCoordinateTwo: number): string {
		var xTransform: number
		var yTransform: number

		if (previousTransform) {
			var commaIndex: number = previousTransform.indexOf(',');
			// Pull the current transform coordinates form the string. + is a quick operation that converts them into numbers.
			xTransform = +previousTransform.substring(previousTransform.indexOf('(') + 1, commaIndex);
			yTransform = +previousTransform.substring(commaIndex + 1, previousTransform.indexOf(')'));
		} else {
			xTransform = 0;
			yTransform = 0;
		}


		if (this.viewConfig.viewOrientation === 'vertical') {
			return 'translate(' + (xTransform + deltaCoordinateOne) + ',' + (yTransform + deltaCoordinateTwo) + ')';
		} else {
			return 'translate(' + (xTransform + deltaCoordinateTwo) + ',' + (yTransform + deltaCoordinateOne) + ')';
		}
	}
}
