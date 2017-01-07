/*
* @Author: aaronpmishkin
* @Date:   2016-07-05 15:13:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-01-03 18:18:06
*/

import { Injectable } 												from '@angular/core';



@Injectable()
export class SummaryChartDefinitions {

	CHART: string = 'summary-chart';

	OUTLINE_CONTAINER: string = 'summary-outline-container';
	OUTLINE: string = 'summary-outline';

	ROWS_CONTAINER: string = 'summary-rows-container';
	ROW: string = 'summary-row';
	CELL: string = 'summary-cell';
	USER_SCORE: string = 'summary-user-score';


	SCORE_TOTAL_CONTAINER: string = 'summary-scoretotals-container';
	SCORE_TOTAL_SUBCONTAINER: string = 'summary-scoretotal-subcontainer';
	SCORE_TOTAL: string = 'summary-scoretotal';
	BEST_SCORE: string = 'best-score-label';

	AVERAGE_LINES_CONTAINER: string = 'summary-averagelines-container';
	AVERAGE_LINE: string = 'summary-averageline';

	UTILITY_AXIS_CONTAINER: string = 'summary-utilityaxis-container';

	ALTERNATIVE_BOXES_CONTAINER: string = 'summary-alternative-boxes-container';
	ALTERNATIVE_BOX: string = 'summary-alternative-box';

	CHART_CELL: string = 'cell';
	CHART_ALTERNATIVE: string = 'alternative-box';


	constructor() { }

}