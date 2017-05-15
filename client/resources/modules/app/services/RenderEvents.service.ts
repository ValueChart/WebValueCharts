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
import '../../utilities/rxjs-operators';

@Injectable()
export class RenderEventsService {

	summaryChartDispatcher: Subject<number>;

	objectiveChartDispatcher: Subject<number>;

	labelsDispatcher: Subject<number>;

	rendersCompleted: Observable<number>; 

	constructor() {
		this.summaryChartDispatcher = new Subject();
		this.objectiveChartDispatcher = new Subject();
		this.labelsDispatcher = new Subject();

		this.rendersCompleted = Observable.merge(this.summaryChartDispatcher, this.objectiveChartDispatcher, this.labelsDispatcher)
			.scan((acc, one) => acc + one, 0);
	}

}