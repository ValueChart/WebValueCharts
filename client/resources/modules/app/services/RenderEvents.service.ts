/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 17:21:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 21:58:15
*/

import { Injectable } 															from '@angular/core';

// d3
import * as d3 																	from 'd3';

@Injectable()
export class RenderEventsService {

	summaryChartDispatcher: d3.Dispatch<any>;

	objectiveChartDispatcher: d3.Dispatch<any>;

	labelsDispatcher: d3.Dispatch<any>;

	constructor() {
		this.summaryChartDispatcher = d3.dispatch('Rendering-Over', 'Construction-Over');
		this.objectiveChartDispatcher = d3.dispatch('Rendering-Over', 'Construction-Over');
		this.labelsDispatcher = d3.dispatch('Rendering-Over', 'Construction-Over');
	}

}