/*
* @Author: aaronpmishkin
* @Date:   2016-05-31 11:04:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-03 19:00:14
*/
// Import Angular Classes
import { Injectable } 															from '@angular/core';

// Import Utility Classes
import { XmlValueChartLegacyParser }											from '../../utilities/classes/XmlValueChartLegacyParser';
import { XmlValueChartParser }													from '../../utilities/classes/XmlValueChartParser';

// Import Model Classes:
import { ValueChart }															from '../../../model/ValueChart';


/*
	This class is an Angular service that provides an interface for parsing XML ValueCharts regardless of their schema. It uses instances of the
	XmlValueChartLegacyParser and XmlValueChartParser classes to parse XML ValueCharts of either the WebValueCharts, or the ValueChartsPlus (deprecated) schema.
	Please see the Wiki for more information about these two different schemas. 
*/

@Injectable()
export class XMLValueChartParserService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private xmlDocParser: DOMParser;							// A DOM parser used to parse XML strings into document objects.

	private valueChartPlusParser: XmlValueChartLegacyParser;	// The utility class for parsing ValueChartsPlus Schema XML ValueCharts.
	private webValueChartsParser: XmlValueChartParser;			// The utility class for parsing WebValueCharts Schema XML ValueCharts.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor() {
		// Initialize the parser fields.
		this.xmlDocParser = new DOMParser();
		this.valueChartPlusParser = new XmlValueChartLegacyParser();
		this.webValueChartsParser = new XmlValueChartParser();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param xmlString - An XML string of a ValueChart that is to be parsed into an instance of the ValueChart class. The XML can be in either
							the ValueChartsPlus or WebValueCharts schemas.
		@returns {ValueChart}	- A ValueChart object parsed from the xmlString parameter. 
		@description	Parses a ValueChart from an XML string and into the proper class instances so that it can be used by the 
						application. This method can parse either schema of XML ValueChart.
	*/
	parseValueChart(xmlString: string): ValueChart {
		var valueChart: ValueChart;

		var xmlDocument: Document = this.xmlDocParser.parseFromString(xmlString, 'application/xml');	// Parse the XML string into a document object.
		var valueChartElement: Element = xmlDocument.querySelector('ValueCharts')						// Retrieve the ValueChart element from the document.

		// The ValueChart XML representation is version 1.0, or the version is not defined. This means the XML is of the deprecated ValueChartsPlus schema.
		if (!valueChartElement.getAttribute('version') || valueChartElement.getAttribute('version') === '1.0') {
			try {
				valueChart = this.valueChartPlusParser.parseValueChart(xmlDocument);	// Parse with the deprecated, legacy parser.
			} catch (e) {
				console.log(e);
			}
		} else {	// The ValueChart XML representation is version 2.0. This means the XML is of the WebValueCharts schema.
			try {
				valueChart = this.webValueChartsParser.parseValueChart(xmlDocument);	// Parse with the regular parser.
			} catch (e) {
				console.log(e);
			}
		}

		return valueChart;
	}
}