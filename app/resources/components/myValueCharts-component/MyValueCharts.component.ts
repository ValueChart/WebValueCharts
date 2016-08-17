/*
* @Author: aaronpmishkin
* @Date:   2016-08-04 13:09:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-17 13:19:45
*/

import { Component }									from '@angular/core';
import { Router, ROUTER_DIRECTIVES }					from '@angular/router';
import { OnInit }										from '@angular/core';

// Application classes:
import { CurrentUserService }							from '../../services/CurrentUser.service';
import { UserHttpService }								from '../../services/UserHttp.service';
import { GroupVcHttpService }							from '../../services/GroupVcHttp.service';
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
		private userHttpService: UserHttpService,
		private groupVcHttpService: GroupVcHttpService) { }


	ngOnInit() {
		this.userHttpService.getUserValueCharts(this.currentUserService.getUsername())
			.subscribe(
				valueChartSummaries => { 
					this.valueChartSummaries = valueChartSummaries;
				});

		this.downloadLink = $('#download-user-weights');
	}

	openValueChart(chartId: string, password: string): void {
		this.groupVcHttpService.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.currentUserService.setValueChart(valueChart);
				this.currentUserService.setJoiningChart(false);
				this.router.navigate(['/view/', valueChart.getName()]);
			});
	}

	deleteValueChart(chartId: string): void {
		this.groupVcHttpService.deleteValueChart(chartId)
			.subscribe(status => {
				var index: number = this.valueChartSummaries.findIndex((valueChartSummary: any) => {
					return valueChartSummary._id === chartId;
				});
				this.valueChartSummaries.splice(index, 1);
			});
	}

	openExportChartModal(chartId: string, password: string): void {
		this.groupVcHttpService.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.currentUserService.setValueChart(valueChart);
			});
	}

	getValueChartName(): string {
		var valueChart: ValueChart = this.currentUserService.getValueChart();

		if (valueChart) {
			return valueChart.getName() + 'UserWeights.csv';
		} else {
			return '';
		}
	}

	exportUserWeights() {
		var valueChart: ValueChart = this.currentUserService.getValueChart();
		var weightsObjectUrl: string = this.convertValueChartIntoObjectURL(valueChart);

		this.downloadLink.attr('href', weightsObjectUrl);
		this.downloadLink.click();
	}

	convertValueChartIntoObjectURL(valueChart: ValueChart): string {
		if (valueChart === undefined) 
			return;

		var weightString: string = this.valueChartXMLEncoder.encodeUserWeights(valueChart);
		var weightsBlob: Blob = new Blob([weightString], {type: 'text/xml'});

		return URL.createObjectURL(weightsBlob);
	}

}
