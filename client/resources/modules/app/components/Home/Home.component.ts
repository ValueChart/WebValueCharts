/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-24 15:16:22
*/

// Import Angular Classes:
import { Component }									from '@angular/core';
import { Router }										from '@angular/router';

// Import Application Classes:
import { XMLValueChartParserService } 					from '../../services/XMLValueChartParser.service';
import { ValueChartDirective }							from '../../directives/ValueChart.directive';
import { CurrentUserService }							from '../../services/CurrentUser.service';
import { ValueChartService }							from '../../services/ValueChart.service';
import { ValueChartHttpService }						from '../../services/ValueChartHttp.service';
import { ValidationService }							from '../../services/Validation.service';

// Import Model Classes:
import { ValueChart }									from '../../../../model/ValueChart';

// Import Sample Data:
import { singleHotel, groupHotel, waterManagement}		from '../../../../data/DemoValueCharts';

/*
	This component implements the home page. The home page is the central page of the ValueCharts application and is where users
	are directed after logging in. It has links to the My ValueCharts page, and the creation workflow, and also allows users to upload
	XML ValueCharts, and join pre-existing ValueCharts. HomeComponent also users to open demo ValueCharts from a 
	table of pre-made individual and group charts. This is a temporary a feature that will be removed in later releases.
*/

@Component({
	selector: 'home',
	templateUrl: 'client/resources/modules/app/components/Home/Home.template.html',
})
export class HomeComponent {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	demoValueCharts: any[] = [{ xmlString: singleHotel, name: 'Hotel Selection Problem', type: 'Individual' }, { xmlString: groupHotel, name: 'Hotel Selection Problem', type: 'Group' }, { xmlString: waterManagement, name: 'Runoff Management', type: 'Individual' }]

	private valueChartName: string;
	private valueChartPassword: string;
	private invalidCredentials: boolean;
	private validationMessage: string;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private router: Router,
		private valueChartParser: XMLValueChartParserService,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private valueChartHttpService: ValueChartHttpService,
		private validationService: ValidationService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param chartName - The name of the ValueChart to join. This is NOT the _id field set by the server, but rather the user defined name.
		@param chartPassword - The password of the ValueChart to join. 
		@returns {void}
		@description 	Retrieves the structure of the ValueChart that matches the given credentials and directs the user into the creation workflow
						so that they may define their preferences. Notifies the user using a banner warning if no ValueChart exists with the given
						name and password.
	*/
	joinValueChart(chartName: string, chartPassword: string): void {
		this.valueChartHttpService.getValueChartStructure(chartName, chartPassword)
			.subscribe(
			(valueChart: ValueChart) => {
				this.valueChartService.setValueChart(valueChart);
				this.currentUserService.setJoiningChart(true);
				$('#chart-credentials-modal').modal('hide');
				this.router.navigate(['createValueChart/newUser/ScoreFunctions']);
			},
			// Handle Server Errors (like not finding the ValueChart)
			(error) => {
				if (error === '404 - Not Found')
					this.invalidCredentials = true;	// Notify the user that the credentials they input are invalid.
			});
	}

	/*
		@param demoChart - A demonstration chart to view. 
		@returns {void}
		@description 	Opens a demonstration ValueChart and directs the user to the ValueChartViewerComponent to view it.
						This method will be removed when demonstration charts are removed from the home page.
	*/
	selectDemoValueChart(demoChart: any): void {
		this.valueChartService.setValueChart(this.valueChartParser.parseValueChart(demoChart.xmlString), true);
		this.currentUserService.setJoiningChart(false);
		var parameters = this.valueChartService.getValueChartName();
		this.router.navigate(['/view/', parameters]);
	}

	/*
		@param event - A file upload event fired by the XML ValueChart file upload.
		@returns {void}
		@description 	Parses an uploaded XML ValueChart using the XMLValueChartParserService, and then navigates
						to the ValueChartViewer to view it. This is called whenever the file input to the File Upload on
						this page changes.
	*/
	uploadValueChart(event: Event) {
		var xmlFile: File = (<HTMLInputElement>event.target).files[0];	// Retrieve the uploaded file from the File Input element. It will always be at index 0.

		var reader: FileReader = new FileReader();
		// Define the event handler for when file reading completes:
		reader.onload = (fileReaderEvent: ProgressEvent) => {
			if (event.isTrusted) {
				var xmlString = (<FileReader>fileReaderEvent.target).result;	// Retrieve the file contents string from the file reader.
				// Parse the XML string and set it to be the ValueChartService's active chart.
				this.valueChartService.setValueChart(this.valueChartParser.parseValueChart(xmlString));
				
				// The user uploaded a ValueChart so they aren't joining an existing one.
				this.currentUserService.setJoiningChart(false);
				
				// Validate the chart.
				let validationErrors = this.validationService.validate(this.valueChartService.getValueChart());
				if (validationErrors.length === 0) {
					// Navigate to the ValueChartViewerComponent to display the ValueChart.
					this.router.navigate(['/view/', this.valueChartService.getValueChartName()]);
				}
				else {
					this.validationMessage = "There were problems with this chart: \n- " + validationErrors.join('\n- ') + "\n\nWould you like to fix them now?";
					$('#validate-modal').modal('show');
				}			
			}
		};
		// Read the file as a text string. This should be fine because ONLY XML files should be uploaded.
		reader.readAsText(xmlFile);
		// Reset upload file so that user can try the same file again after fixing it.
		(<HTMLSelectElement>document.getElementsByName("file-to-upload")[0]).value = null;
	}

	/*
		@returns {void}
		@description 	Called in response to validation error modal.
						Redirects user to create workflow to edit an invalid chart.
	*/
	fixChart() {
		this.router.navigate(['/createValueChart/editChart/BasicInfo']);
	}
}