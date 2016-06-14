/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-14 13:07:18
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

	// ValueChart Display Configuration Options:
	orientation: string;
	displayScoreFunctions: boolean;
	displayDomainValues: boolean;
	displayScales: boolean;
	displayTotalScores: boolean;
	
	constructor(private chartDataService: ChartDataService) { }

	ngOnInit() {
		this.valueChart = this.chartDataService.getValueChart();
		this.orientation = 'vertical';
		this.displayScoreFunctions = true;
		this.displayTotalScores = true;
		this.displayScales = false;
		this.displayDomainValues = false;
	}

	setOrientation(viewOrientation: string): void{
		this.orientation = viewOrientation;
	}

	setDisplayScoreFunctions(newVal: boolean): void {
		this.displayScoreFunctions = newVal;
	}	

	setDisplayDomainValues(newVal: boolean): void {
		this.displayDomainValues = newVal;
	}	

	setDisplayScales(newVal: boolean): void {
		this.displayScales = newVal;
	}	

	setDisplayTotalScores(newVal: boolean): void {
		this.displayTotalScores = newVal;
	}	

}