/*
* @Author: aaronpmishkin
* @Date:   2016-05-31 11:04:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-30 13:02:59
*/
// Library Classes
import { Injectable } 															from '@angular/core';

// Utility Classes
import { ValueChartLegacyParser }												from '../../utilities/classes/XmlValueChartLegacyParser';
import { XmlValueChartParser }													from '../../utilities/classes/XMLValueChartParser';

// Model Classes
import { ValueChart }															from '../../../model/ValueChart';


@Injectable()
export class XMLValueChartParser {

	xmlDocParser: DOMParser;
	valueChartPlusParser: ValueChartLegacyParser;
	webValueChartsParser: XmlValueChartParser;

	constructor() {
		this.xmlDocParser = new DOMParser();
		this.valueChartPlusParser = new ValueChartLegacyParser();
		this.webValueChartsParser = new XmlValueChartParser();
	}

	parseValueChart(xmlString: string): ValueChart {
		var valueChart: ValueChart;

		var xmlDocument: Document = this.xmlDocParser.parseFromString(xmlString, 'application/xml');
		var valueChartElement: Element = xmlDocument.querySelector('ValueCharts')

		// The ValueChart XML representation is version 1.0, or the version is not defined.
		if (!valueChartElement.getAttribute('version') || valueChartElement.getAttribute('version') === '1.0') {
			try {
				valueChart = this.valueChartPlusParser.parseValueChart(xmlDocument);
			} catch (e) {
				console.log(e);
			}
		} else {
			try {
				valueChart = this.webValueChartsParser.parseValueChart(xmlDocument);
			} catch (e) {
				console.log(e);
			}
		}

		return valueChart;
	}
}