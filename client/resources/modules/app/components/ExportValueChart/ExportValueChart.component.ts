/*
* @Author: aaronpmishkin
* @Date:   2016-07-02 12:20:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-01 11:26:07
*/

// Import Angular Classes:
import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';


// Import Application Classes:
import { ValueChartService }								from '../../services/ValueChart.service';
import { ValueChartXMLEncoder }								from '../../../utilities/classes/ValueChartXMLEncoder';

// Import Model Classes:
import { ValueChart }										from '../../../../model/ValueChart';

/*
	This component implements a button that can be used to download the current ValueChart as an XML file. Current ValueChart refers
	to the active ValueChart in the ValueChartService.
*/


@Component({
	selector: 'ExportValueChart',
	template: `
				<div class="export-value-chart">
					<a class="btn btn-default" id="download-value-chart"
						[class.disabled]="!valueChartService.getValueChart()" 
						download="{{getValueChartName()}}" 
						href="javascript:void(0)" 
						(click)="downloadValueChart()">
						Export ValueChart
					</a>
				</div>
				`
})
export class ExportValueChartComponent implements OnInit {
	
	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private valueChartXMLEncoder: ValueChartXMLEncoder;
	private valueChartStringURL: string;

	private downloadLink: JQuery;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private valueChartService: ValueChartService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/* 	
		@returns {void}
		@description 	Initializes the ValueChartViewer. ngOnInit is only called ONCE by Angular. This function is thus used for one-time initialized only. 
						Calling ngOnInit should be left to Angular. Do not call it manually. All initialization logic for the component should be put in this
						method rather than in the constructor.
	*/
	ngOnInit() {
		this.valueChartXMLEncoder = new ValueChartXMLEncoder();
		this.downloadLink = $('#download-value-chart');
	}

	getValueChartName(): string {
		var valueChart: ValueChart = this.valueChartService.getValueChart();

		if (valueChart) {
			return valueChart.getId() + '.xml';
		} else {
			return '';
		}

	}

	downloadValueChart(): void {
		var valueChart: ValueChart = this.valueChartService.getValueChart();
		var valueChartObjectURL: string = this.convertValueChartIntoObjectURL(valueChart);

		this.downloadLink.attr('href', valueChartObjectURL);		// Set the download link on the <a> element to be the URL created for the XML string.
		this.downloadLink.click();									// Click the <a> element to programmatically begin the download.
	}

	convertValueChartIntoObjectURL(valueChart: ValueChart): string {
		if (valueChart === undefined)
			return;

		// Obtain a XML string for the user defined weights in the given ValueChart. 
		var valueChartString: string = this.valueChartXMLEncoder.encodeValueChart(valueChart);
		// Convert the string into a blob. We must do this before we can create a download URL for the XML string.
		var valueChartBlob: Blob = new Blob([valueChartString], { type: 'text/xml' });

		// Create an return a unique download URL for the XML string.
		return URL.createObjectURL(valueChartBlob);
	}


}
