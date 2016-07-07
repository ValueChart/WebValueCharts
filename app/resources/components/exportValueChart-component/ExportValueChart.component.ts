/*
* @Author: aaronpmishkin
* @Date:   2016-07-02 12:20:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-07 10:39:46
*/

// Angular Classes:
import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';

// JQuery
import * as $																	from 'jquery';

// Application Classes:
import { CurrentUserService }								from '../../services/CurrentUser.service';
import { ValueChartXMLEncoder }								from '../../utilities/ValueChartXMLEncoder';

// Model Classes:
import { ValueChart }										from '../../model/ValueChart';

 
@Component({
	selector: 'ExportValueChart',
	template: 	`
				<div class="export-value-chart">
					<a class="btn btn-default" id="download-value-chart"
						[class.disabled]="!currentUserService.getValueChart()" 
						download="{{getValueChartName()}}" 
						href="javascript:void(0)" 
						(click)="downloadValueChart()">
						Export ValueChart
					</a>
				</div>
				`
})
export class ExportValueChartComponent implements OnInit{

	private valueChartXMLEncoder: ValueChartXMLEncoder;
	private valueChartStringURL: string;

	private downloadLink: JQuery;

	constructor(private currentUserService: CurrentUserService) { } 

	ngOnInit() {
		this.valueChartXMLEncoder = new ValueChartXMLEncoder();
		this.downloadLink = $('#download-value-chart');
	}

	getValueChartName(): string {
		var valueChart: ValueChart = this.currentUserService.getValueChart();

		if (valueChart) {
			return valueChart.getName() + '.xml';
		} else {
			return '';
		}

	}

	downloadValueChart(): void {
		var valueChart: ValueChart = this.currentUserService.getValueChart();
		var valueChartObjectURL: string = this.convertValueChartIntoObjectURL(valueChart);

		this.downloadLink.attr('href', valueChartObjectURL);
		this.downloadLink.click();
		// this.downloadLink.attr('href', 'javascript:void(0)');
	}

	convertValueChartIntoObjectURL(valueChart: ValueChart): string {
		if (valueChart === undefined) 
			return;

		var valueChartString: string = this.valueChartXMLEncoder.encodeValueChart(valueChart);
		var valueChartBlob: Blob = new Blob([valueChartString], {type: 'text/xml'});

		return URL.createObjectURL(valueChartBlob);
	}	


}
