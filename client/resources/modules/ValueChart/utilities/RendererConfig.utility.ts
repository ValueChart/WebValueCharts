/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:02:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-22 14:30:27
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';
import * as _														from 'lodash';

// Import Model Classes:
import { User }														from '../../../model/User';
import { ValueChart }												from '../../../model/ValueChart';

// Import Types:
import { ViewConfig }												from '../../../types/Config.types';
import { RendererConfig, RendererUpdate }							from '../../../types/RendererData.types';

import { ChartOrientation }											from '../../../types/Config.types';



@Injectable()
export class RendererConfigUtility {

	// ========================================================================================
	// 									Fields
	// ========================================================================================


	private offset: number = 10;

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

	produceObjectiveChartConfig = (u: RendererUpdate): RendererUpdate => {
		u = _.clone(u);

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			u.x = u.width;
			u.y = u.height + this.offset;
		} else {
			u.x = 0;
			u.y = u.height;
		}

		return u;
	}

	produceLabelConfig = (u: RendererUpdate): RendererUpdate => {
		u = _.clone(u);

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			u.x = 0;
			u.y = u.height + this.offset;
		} else {
			u.x = 0;
			u.y = 0;
		}

		console.log(u);

		return u;
	}

	produceSummaryChartConfig = (u: RendererUpdate): RendererUpdate => {
		u = _.clone(u); 

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			let maxHeight = u.height;
			let height = u.height / u.maximumWeightMap.getWeightTotal(); 
			u.x = u.width;
			u.y = maxHeight - height; 
			u.height = height;
		} else {
			let maxWidth = u.width;
			let width = u.width / u.maximumWeightMap.getWeightTotal(); 
			u.x = u.width; 
			u.y = u.height;
			u.width = width;
		}

		 return u;
	}
}





