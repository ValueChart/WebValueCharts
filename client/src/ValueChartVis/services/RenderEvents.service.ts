/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 17:21:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-11 13:11:51
*/

import { Injectable } 															from '@angular/core';

// d3
import { Subject }																from 'rxjs/Subject';
import { Observable }															from 'rxjs/Observable';
import '../../app/utilities/rxjs-operators';

@Injectable()
export class RenderEventsService {

	summaryChartDispatcher: Subject<number>;		// The Subject used to notify observers of SummaryChartRenderer events.

	objectiveChartDispatcher: Subject<number>;		// The Subject used to notify observers of ObjectiveChartRenderer events.

	labelsDispatcher: Subject<number>;				// The Subject used to notify observers of LabelRenderer events.

	rendersCompleted: Observable<number>; 			// An observable that accumulates the total number of render events issued by all three
													// renderer subjects. Initial renderering has been completed if this accumulated number is greater than 3.

	constructor() {
		this.summaryChartDispatcher = new Subject();
		this.objectiveChartDispatcher = new Subject();
		this.labelsDispatcher = new Subject();

		this.rendersCompleted = Observable.merge(this.summaryChartDispatcher, this.objectiveChartDispatcher, this.labelsDispatcher)
			.scan((acc, one) => acc + one, 0);
	}
}