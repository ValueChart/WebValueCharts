/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:02:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-22 15:09:05
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';
import * as _														from 'lodash';

// Import Model Classes:
import { User }														from '../../model';
import { ValueChart }												from '../../model';

// Import Types:
import { ViewConfig }												from '../../types';
import { RendererConfig, RendererUpdate }							from '../../types';

import { ChartOrientation }											from '../../types';



@Injectable()
export class RendererConfigUtility {

	// ========================================================================================
	// 									Fields
	// ========================================================================================


	private offset: number = 10;				// The size of the offset/gap between the summary chart and the objective chart.
	private userSize: number = 50;				// The width (height if horizontal orientation) of each user's score bar when scaleAlternatives is false.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description	Used for Angular's dependency injection.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this service when it is injected.
	*/
	constructor() { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param u - the RendererUpdate object for which to create a renderer configuration. 
		@returns {RendererUpdate}
		@description	This function configures the variables used for height, width, x, and y attributes of SVG elements during the rendering of the ValueChart.
						Together, these variables constitute a RendererConfig object that specifies the dimensions and positions of the visualization elements.
						Note that this method is almost always used as a part of the rendering pipeline created in the ValueChartDirective.
						The height and width attributes of SVG elements should be set using dimensionOne, and dimensionTwo.
						The x and y positions should be set using coordinateOne and coordinateTwo. 
						This insures that when the orientation of the graph changes, the x and y, and height, and width attributes are switched. 
						Note that the size of the graph is not changed during this process. 

	*/
	produceRendererConfig(u: RendererUpdate): RendererUpdate {
		u.rendererConfig = <any> {};

		u.rendererConfig.viewOrientation = u.viewConfig.viewOrientation;
		u.rendererConfig.chartComponentWidth = u.width;
		u.rendererConfig.chartComponentHeight = u.height;

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			// We want to render the ValueChart horizontally
			u.rendererConfig.dimensionOne = 'width';	// Set dimensionOne to be the width of the graph
			u.rendererConfig.dimensionTwo = 'height';	// Set dimensionTwo to the height of the graph
			u.rendererConfig.coordinateOne = 'x';		// Set coordinateOne to the x coordinate
			u.rendererConfig.coordinateTwo = 'y';		// Set coordinateTwo to the y coordinate

			u.rendererConfig.dimensionOneSize = u.rendererConfig.chartComponentWidth;	// This is the width of the graph
			u.rendererConfig.dimensionTwoSize = u.rendererConfig.chartComponentHeight;	// This is the height of the graph

		} else if (u.viewConfig.viewOrientation === ChartOrientation.Horizontal) {
			u.rendererConfig.dimensionOne = 'height'; 	// Set dimensionOne to be the height of the graph
			u.rendererConfig.dimensionTwo = 'width';	// Set dimensionTwo to be the width of the graph
			u.rendererConfig.coordinateOne = 'y';		// Set coordinateOne to the y coordinate
			u.rendererConfig.coordinateTwo = 'x';		// Set coordinateTwo to the x coordinate

			u.rendererConfig.dimensionOneSize = u.rendererConfig.chartComponentHeight;	// This is the height of the graph
			u.rendererConfig.dimensionTwoSize = u.rendererConfig.chartComponentWidth;	// This is the width of the graph

		}
		
		u.rendererConfig.dimensionTwoScale = d3.scaleLinear()
			.domain([0, u.maximumWeightMap.getWeightTotal()])
			.range([0, u.rendererConfig.dimensionTwoSize]);

		return u;
	}

	/*
		@param u - the RendererUpdate object that will be customized to the ObjectiveChart visualization.
		@returns {RendererUpdate}
		@description This methods modifies the dimension and location fields (ie. height, width, and y, x) of the input
					 RendererUpdate object to suit the ObjectiveChart part of the visualization.
					 This method is almost always called as a part of the ValueChartDirective's rendering pipeline.
					 Notice that this method is where width (height if in horizontal orientation) of the objective chart is
					 set to depend only on the number of alternatives and users IF the visualization is not being scaled to fit 
					 in the view port.
	*/
	produceObjectiveChartConfig = (u: RendererUpdate): RendererUpdate => {
		u = _.clone(u);	// The RendererUpdate must be copied so that it is not the same reference as the RendererUpdates for the
						// other visualization elements (label area, summary chart).


		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			u.x = u.width;
			u.y = u.height + this.offset;

			if (!u.viewConfig.scaleAlternatives) 
				u.width = this.userSize * u.usersToDisplay.length * u.valueChart.getAlternatives().length;
			
			if (u.reducedInformation) {
				u.y = u.height * 2 + this.offset;
				u.height = 0;
			}
		} else {
			u.x = 0;
			u.y = u.height;

			if (!u.viewConfig.scaleAlternatives) 
				u.height = this.userSize * u.usersToDisplay.length * u.valueChart.getAlternatives().length;

			if (u.reducedInformation)
				u.x = u.width * 2;
				u.width = 0;
		}


		return u;
	}

	/*
		@param u - the RendererUpdate object that will be customized to the Label area visualization.
		@returns {RendererUpdate}
		@description This methods modifies the dimension and location fields (ie. height, width, and y, x) of the input
					 RendererUpdate object to suit the Label area part of the visualization.
					 This method is almost always called as a part of the ValueChartDirective's rendering pipeline.
	*/
	produceLabelConfig = (u: RendererUpdate): RendererUpdate => {
		u = _.clone(u); // The RendererUpdate must be copied so that it is not the same reference as the RendererUpdates for the
						// other visualization elements.

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			u.x = 0;
			u.y = u.height + this.offset;
		} else {
			u.x = 0;
			u.y = 0;
		}

		return u;
	}

	/*
		@param u - the RendererUpdate object that will be customized to the SummaryChart visualization.
		@returns {RendererUpdate}
		@description This methods modifies the dimension and location fields (ie. height, width, and y, x) of the input
					 RendererUpdate object to suit the SummaryChart part of the visualization.
					 This method is almost always called as a part of the ValueChartDirective's rendering pipeline.
					 Notice that this method is where width (height if in horizontal orientation) of the objective chart is
					 set to depend only on the number of alternatives and users IF the visualization is not being scaled to fit 
					 in the view port.
					 Also notice that this is where the height of the summary chart is scaled to preserve the utility scale
					 if there are multiple users to display.
	*/
	produceSummaryChartConfig = (u: RendererUpdate): RendererUpdate => {
		u = _.clone(u); // The RendererUpdate must be copied so that it is not the same reference as the RendererUpdates for the
						// other visualization elements.
		var maxHeight = u.height;
		var maxWidth = u.width;

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			if (u.reducedInformation) {
				u.height = maxHeight * 2 + this.offset;
				u.y = 0;
			} else {
				let height = u.height / u.maximumWeightMap.getWeightTotal(); 
				u.y = maxHeight - height; 
				u.height = height;

			}

			u.x = u.width;

			if (!u.viewConfig.scaleAlternatives) 
				u.width = this.userSize * u.usersToDisplay.length * u.valueChart.getAlternatives().length;


		} else {
			if (u.reducedInformation) {
				u.width = maxWidth * 2;
				u.x = 0;
			} else {
				let width = u.width / u.maximumWeightMap.getWeightTotal(); 
				u.x = u.width; 
				u.width = width;
			}
			u.y = u.height;

			if (!u.viewConfig.scaleAlternatives) 
				u.height = this.userSize * u.usersToDisplay.length * u.valueChart.getAlternatives().length;

		}

		return u;
	}
}





