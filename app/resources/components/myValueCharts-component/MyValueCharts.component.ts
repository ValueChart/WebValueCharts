/*
* @Author: aaronpmishkin
* @Date:   2016-08-04 13:09:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-21 15:35:59
*/

import { Component }									from '@angular/core';
import { Router, ROUTER_DIRECTIVES }					from '@angular/router';
import { OnInit }										from '@angular/core';

// Application classes:
import { CurrentUserService }							from '../../services/CurrentUser.service';
import { ValueChartService }							from '../../services/ValueChart.service';
import { UserHttpService }								from '../../services/UserHttp.service';
import { ValueChartHttpService }						from '../../services/ValueChartHttp.service';
import { ExportValueChartComponent }					from '../exportValueChart-component/ExportValueChart.component';
import { ValueChartXMLEncoder }							from '../../utilities/ValueChartXMLEncoder';

// Model Classes:
import { ValueChart }									from '../../model/ValueChart';

@Component({
	selector: 'myValueCharts',
	templateUrl: 'app/resources/components/myValueCharts-component/MyValueCharts.template.html',
	directives: [ROUTER_DIRECTIVES, ExportValueChartComponent]
})
export class MyValueChartsComponent implements OnInit {

	private valueChartSummaries: any[];
	private downloadLink: any;

	constructor(
		private router: Router,
		private valueChartXMLEncoder: ValueChartXMLEncoder,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private userHttpService: UserHttpService,
		private valueChartHttpService: ValueChartHttpService) { }


	ngOnInit() {
		this.userHttpService.getUserValueCharts(this.currentUserService.getUsername())
			.subscribe(
			valueChartSummaries => {
				this.valueChartSummaries = valueChartSummaries;
			});

		this.downloadLink = $('#download-user-weights');
	}

	openValueChart(chartId: string, password: string): void {
		password = password || '';
		
		this.valueChartHttpService.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.valueChartService.setValueChart(valueChart);
				this.currentUserService.setJoiningChart(false);
				this.router.navigate(['/view/', valueChart.getName()]);
			});
	}

	editValueChart(chartId: string, password: string): void {
		password = password || '';

		this.valueChartHttpService.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.valueChartService.setValueChart(valueChart);
				this.currentUserService.setJoiningChart(false);
				this.router.navigate(['/createValueChart/editChart/BasicInfo']);
			});
	}

	deleteValueChart(chartId: string): void {
		this.valueChartHttpService.deleteValueChart(chartId)
			.subscribe(status => {
				var index: number = this.valueChartSummaries.findIndex((valueChartSummary: any) => {
					return valueChartSummary._id === chartId;
				});
				this.valueChartSummaries.splice(index, 1);
			});
	}

	openExportChartModal(chartId: string, password: string): void {
		this.valueChartHttpService.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.valueChartService.setValueChart(valueChart);
			});
	}

	getValueChartName(): string {
		var valueChart: ValueChart = this.valueChartService.getValueChart();

		if (valueChart) {
			return valueChart.getId() + 'UserWeights.csv';
		} else {
			return '';
		}
	}

	exportUserWeights() {
		var valueChart: ValueChart = this.valueChartService.getValueChart();
		var weightsObjectUrl: string = this.convertValueChartIntoObjectURL(valueChart);

		this.downloadLink.attr('href', weightsObjectUrl);
		this.downloadLink.click();
	}

	convertValueChartIntoObjectURL(valueChart: ValueChart): string {
		if (valueChart === undefined)
			return;

		var weightString: string = this.valueChartXMLEncoder.encodeUserWeights(valueChart);
		var weightsBlob: Blob = new Blob([weightString], { type: 'text/xml' });

		return URL.createObjectURL(weightsBlob);
	}

	getStatusText(valueChartSummary: any): string {
		if (valueChartSummary.incomplete === undefined) {
			return 'Complete';
		} else {
			return 'Incomplete';
		}
	}

}
