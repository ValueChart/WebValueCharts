/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 17:21:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 17:31:17
*/
			
import { Injectable } 															from '@angular/core';
		
// d3
import * as d3 																	from 'd3';

@Injectable()
export class RenderEventsService {

	summaryChartDispatcher: d3.Dispatch;

	constructor() {
		this.summaryChartDispatcher = d3.dispatch('Rendering-Over');
	}

}