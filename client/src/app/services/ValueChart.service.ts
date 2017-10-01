/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-19 16:15:02
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core'

import * as _ 												from 'lodash';

// Import Model Classes:
import { ValueChart }										from '../../model';

// Import Types:
import { ValueChartStatus }									from '../../types';

/*
	This class stores a ValueChart and exposes this state to any component, directive, or service in the application
	that requires it. Often this ValueChart is referred to as the "base" ValueChart since it constitutes the master
	copy of the ValueChart. This is as opposed to the ValueChartViewer service which stores the "active" ValueChart.
*/

@Injectable()
export class ValueChartService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private valueChart: ValueChart;				// The "base" ValueChart.
	private status: ValueChartStatus = <any> { lockedByCreator: false, lockedBySystem: false };	// The status of the ValueChart.


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() {}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;
	}

	getValueChart(): ValueChart {
		if (_.isNil(this.valueChart))
			throw 'ValueChart is not defined';

		return this.valueChart;
	}

	valueChartIsDefined(): boolean {
		return !_.isNil(this.valueChart);
	}


	getStatus(): ValueChartStatus {
		return this.status;
	}

	setStatus(status: ValueChartStatus): void {
		this.status = status;
	}
}