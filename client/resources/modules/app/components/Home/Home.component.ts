/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-29 17:48:17
*/

// Import Angular Classes:
import { Component }									from '@angular/core';
import { Router }										from '@angular/router';

// Import Application Classes:
import { XMLValueChartParserService } 					from '../../services/XMLValueChartParser.service';
import { CurrentUserService, UserRole }					from '../../services/CurrentUser.service';
import { ValueChartService }							from '../../services/ValueChart.service';
import { ValueChartHttpService }						from '../../services/ValueChartHttp.service';
import { ValidationService }							from '../../services/Validation.service';

// Import Model Classes:
import { ValueChart }									from '../../../../model/ValueChart';

// Import Utility Classes:
import * as Formatter									from '../../../utilities/classes/Formatter';

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
	templateUrl: './Home.template.html',
})
export class HomeComponent {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	demoValueCharts: any[] = [{ xmlString: singleHotel, name: 'Hotel Selection Problem', type: 'Individual' }, { xmlString: groupHotel, name: 'Hotel Selection Problem', type: 'Group' }, { xmlString: waterManagement, name: 'Runoff Management', type: 'Individual' }]

	public valueChartName: string;
	public valueChartPassword: string;
	public invalidCredentials: boolean;
	public isJoining: boolean = false; // boolean toggle indicating whether user clicked to join or view an existing chart 
									   // this is needed so we can use the same credentials modal in both cases

	// Upload validation fields:
	public validationMessage: string;
	public canFixChart: boolean;

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
		@description 	Called when credentials modal is closed. 
						Delegates to joinValueChart or viewValueChart based on which button was clicked.
	*/
	handleModalInputs(chartName: string, chartPassword: string): void {
		if (this.isJoining) {
			this.joinValueChart(chartName, chartPassword);
		}
		else {
			this.viewValueChart(chartName, chartPassword);
		}
	}

	/*
		@returns {string}
		@description 	Title for the credentials modal.
	*/
	getModalTitle(): string {
		if (this.isJoining) {
			return "Join Existing Chart";
		}
		else {
			return "View Existing Chart";
		}
	}

	/*
		@param chartName - The name of the ValueChart to join. This is NOT the _id field set by the server, but rather the user defined name.
		@param chartPassword - The password of the ValueChart to join. 
		@returns {void}
		@description 	Retrieves the structure of the ValueChart that matches the given credentials and directs the user into the creation workflow
						so that they may define their preferences. Notifies the user using a banner warning if no ValueChart exists with the given
						name and password.
	*/
	joinValueChart(chartName: string, chartPassword: string): void {
		this.valueChartHttpService.getValueChart(Formatter.nameToID(chartName), chartPassword)
			.subscribe(
			(valueChart: ValueChart) => {
				this.valueChartService.setValueChart(valueChart);
				this.valueChartService.setActiveChart('individual');
				
				this.currentUserService.setUserRole(UserRole.Participant);
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
		@param chartName - The name of the ValueChart to view. This is NOT the _id field set by the server, but rather the user defined name.
		@param chartPassword - The password of the ValueChart to join. 
		@returns {void}
		@description 	Retrieves the ValueChart that matches the given credentials and directs the user to the ValueChartViewerComponent to view it. 
						Notifies the user using a banner warning if no ValueChart exists with the given name and password.
	*/
	viewValueChart(chartName: string, chartPassword: string): void {
		this.valueChartHttpService.getValueChartByName(Formatter.nameToID(chartName), chartPassword)
			.subscribe(
			(valueChart: ValueChart) => {
				this.valueChartService.setValueChart(valueChart);
				this.currentUserService.setUserRole(UserRole.Viewer);
				$('#chart-credentials-modal').modal('hide');
				if (this.validateChartStructure()) {
					let valueChart = this.valueChartService.getValueChart();
					this.router.navigate(['view', 'group', valueChart.getFName()], { queryParams: { password: valueChart.password } });
				}
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
		this.valueChartService.setValueChart(this.valueChartParser.parseValueChart(demoChart.xmlString));
		this.currentUserService.setUserRole(UserRole.Participant);
		let valueChart = this.valueChartService.getValueChart();
		let viewType = valueChart.isIndividual() ? 'individual' : 'group';
		this.router.navigate(['view', viewType, valueChart.getFName()], { queryParams: { password: valueChart.password } });
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
				
				let role: UserRole = UserRole.Viewer;
				// The user uploaded a ValueChart so they aren't joining an existing one.
				if (this.valueChartService.currentUserIsMember())
					role = UserRole.OwnerAndParticipant;
				else 
					role = UserRole.Owner;
				this.currentUserService.setUserRole(role)

				if (this.validateChartStructure()) {
					// Navigate to the ValueChartViewerComponent to display the ValueChart.
					this.saveValueChartToDatabase(this.valueChartService.getValueChart());
					let valueChart = this.valueChartService.getValueChart();
					let viewType = valueChart.isIndividual() ? 'individual' : 'group';
					this.router.navigate(['view', viewType, valueChart.getFName()], { queryParams: { password: valueChart.password } });
				}		
			}
		};
		// Read the file as a text string. This should be fine because ONLY XML files should be uploaded.
		reader.readAsText(xmlFile);
		// Reset upload file so that user can try the same file again after fixing it.
		(<HTMLSelectElement>document.getElementsByName("file-to-upload")[0]).value = null;
	}

	/*
		@returns {boolean}
		@description 	Validates chart structure prior to viewing and gives the creator an opportunity to fix errors.
						Returns true iff there were no validation errors.
	*/
	validateChartStructure(): boolean {
		let structuralErrors = this.validationService.validateStructure(this.valueChartService.getValueChart()); 	
		if (structuralErrors.length > 0) {
			if (this.valueChartService.currentUserIsCreator()) {
				this.canFixChart = false;
				this.validationMessage = "Cannot view chart. There are problems with this chart that can only be fixed by its creator.";
				$('#validate-modal').modal('show');
			}
			else {
				this.canFixChart = true;
				this.validationMessage = "There are problems with this chart: \n\n" + structuralErrors.join('\n\n') + "\n\nWould you like to fix them now?";
				$('#validate-modal').modal('show');
			}
			return false;
		}
		return true;
	}

	/*
		@returns {void}
		@description 	Called in response to click of "Yes" button in validation error modal.
	*/
	fixChart() {
		this.router.navigate(['/createValueChart/editChart/BasicInfo']);
	}

	/* 	
		@returns {void}
		@description	Save valueChart to database. valueChart_.id is the id assigned by the database.
	*/
	saveValueChartToDatabase(valueChart: ValueChart): void {
		if (!valueChart._id) {
			// Save the ValueChart for the first time.
			this.valueChartHttpService.createValueChart(valueChart)
				.subscribe(
				(valuechart: ValueChart) => {
					// Set the id of the ValueChart.
					valueChart._id = valuechart._id;
					toastr.success('ValueChart saved');
				},
				// Handle Server Errors
				(error) => {
					toastr.warning('Saving failed');
				});
		} else {
			// Update the ValueChart.
			this.valueChartHttpService.updateValueChart(valueChart)
				.subscribe(
				(valuechart) => { toastr.success('ValueChart saved'); },
				(error) => {
					// Handle any errors here.
					toastr.warning('Saving failed');
				});
		}
	}
}