/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-11 14:18:28
*/

import { Component }				from '@angular/core';
import { OnInit }					from '@angular/core';

// Application classes
import { ValueChartDirective }		from '../../directives/ValueChart.directive';
import { ChartDataService }			from '../../services/ChartData.service';

// Model Classes
import { ValueChart } 				from '../../model/ValueChart';

@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/valueChartViewer-component/ValueChartViewer.template.html',
	directives: [ValueChartDirective]
})
export class ValueChartViewerComponent implements OnInit {

	valueChart: ValueChart;
	orientation: string;
	
	constructor(private chartDataService: ChartDataService) { }

	ngOnInit() {
		this.valueChart = this.chartDataService.getValueChart();
		this.orientation = 'vertical';
	}

	switchOrientation() {

		if (this.orientation === 'vertical') {
			this.orientation = 'horizontal';
		} else {
			this.orientation = 'vertical';
		}
	}

}