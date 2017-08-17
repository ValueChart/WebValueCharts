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
import { ValueChart }										from '../../../model/ValueChart';

// Import Types:
import { ValueChartStatus }									from '../../../types/ValueChartStatus';

/*
	This class stores a ValueChart and exposes this state to any component, directive, or service in the application
	that requires it. It also provides utility methods for retrieving specific data from a ValueChart object.
*/

@Injectable()
export class ValueChartService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private valueChart: ValueChart;
	private status: ValueChartStatus = <any> { userChangesPermitted: true, incomplete: false };


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