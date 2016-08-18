/*
* @Author: aaronpmishkin
* @Date:   2016-07-05 15:13:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-05 16:36:44
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
	SCORE_TOTAL: string = 'summary-score-total';
	BEST_SCORE: string = 'best-score-label';

	UTILITY_AXIS_CONTAINER: string = 'summary-utilityaxis-container';

	ALTERNATIVE_BOXES_CONTAINER: string = 'summary-alternative-boxes-container';
	ALTERNATIVE_BOX: string = 'summary-alternative-box';

	CHART_CELL: string = 'cell';
	CHART_ALTERNATIVE: string = 'alternative-box';


	constructor() { }

}