/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:46:42
*/

// Import Angular Classes:
import { Component } 												from '@angular/core';
import { OnInit } 													from '@angular/core';
import { Router }													from '@angular/router';
import { ApplicationRef } 											from '@angular/core';


// Import Application Classes:
import { XMLValueChartParserService } 								from '../../services';
import { CurrentUserService }										from '../../services';
import { ValueChartService }										from '../../services';
import { UserHttp }													from '../../http';
import { ValueChartHttp }											from '../../http';
import { ValidationService }										from '../../services';
import { ExportValueChartComponent }								from '../ExportValueChart/ExportValueChart.component';
import { XmlValueChartEncoder }										from '../../utilities';
import { UserNotificationService }									from '../../services';

// Import Model Classes:
import { ValueChart, ChartType }									from '../../../model';

// Import Utility Classes:
import * as Formatter												from '../../utilities/Formatter';

// Import Types
import { UserRole }													from '../../../types';
import { CreatePurpose }											from '../../../types';


/*
	The root component is the base component of the application. It is the only component that is always displayed
	and its template contains the router-outlet directive. The router-outlet directive is the where the Angular router
	places whatever component should be displayed based upon the current url path. Its template is also where the 
	HTML for the application's navigation bar is defined. This is why the component's class body contains several methods 
	that relate the navigation bar functionality, such as logging out.

	The root component is also an important location for registering providers. Any angular services that are intended 
	to be singletons across the application should be placed in the root components list of providers. The root component
	is only ever initialized once by the application, which in turn means that the classes in the providers list will only
	ever be created once. 
*/


@Component({
	selector: 'root',
	templateUrl: './Root.template.html',
	providers: [
		XMLValueChartParserService,
		XmlValueChartEncoder]
})
export class RootComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// The current chart type. Either 'normal' or 'average'. This is used to keep track of what type of ValueChart the 
	// ValueChartViewer is currently displaying. 'normal' is the default value.
	chartType: string = 'normal';

	public invalidCredentials: boolean;
	// Upload validation fields:
	public displayValidationModal = false;
	
	public validationMessage: string;
	public displayModal: boolean = false;
	public valueChartName: string;
	public valueChartPassword: string;

	// The current chart type. Either 'Score Distributions' or 'User Scores'. This is used to keep track of the view 
	// that the ScoreFuntionViewer is currently displaying. 'normal' is the default value.
	private switchScoreFunctionViewText: string = 'Score Distributions';

	public isJoining: boolean = false; // boolean toggle indicating whether user clicked to join or view an existing chart 
	// this is needed so we can use the same credentials modal in both cases


	public window: any = window;

	public modalActionEnabled: boolean = false;
	public modalActionFunction: Function = () => { };
	public modalTitle: string;
	public modalBody: string;


	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						Any initialization that needs to be done should be placed in the ngOnInit method.
						This constructor should NOT be called manually. There is never any reason to manually create a component class;
						component classes should always be created by Angular so that the template can be parsed and two-way binding can be
						initialized. Angular will automatically handle the construction of this class whenever it's selector is used.
	*/
	constructor(
		public router: Router,
		public currentUserService: CurrentUserService,
		private valueChartParser: XMLValueChartParserService,
		private userHttp: UserHttp,
		private valueChartHttp: ValueChartHttp,
		private valueChartService: ValueChartService,
		private userNotificationService: UserNotificationService,
		private validationService: ValidationService,
		private applicationRef: ApplicationRef) { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/* 	
		@returns {void}
		@description 	Initializes the RootComponent. Any initialization logic that is required for the component to run properly should
						be placed in this method. ngOnInit is called by Angular AFTER the first change detection cycle (i.e. ngDoCheck is called once).
						ngOnInit is only called ONCE by Angular. This function is thus used for one-time initialized only. Calling ngOnInit should be left 
						to Angular. Do NOT call it manually. 
	*/
	ngOnInit() {
		// Attach this Angular application reference to the window object.
		// This is to make it accessible to any additional windows that are created
		// by this window. This is specifically used by the ScoreFunctionViewerComponent.
		(<any>window).angularAppRef = this.applicationRef;
		(<any>window).childWindows = {};					// Initialize a map to used as storage for references to an windows created by this window.
	}

	/* 	
		@returns {void} - 
		@description 	Logs the current user out by making a call to the logout endpoint. This endpoint deletes the current user's 
						session. This method then redirects the application to the register page no matter what the current URL path is.
						This is because users must be authenticated (or temporary) to view pages other than register.
						Note that this method should only called when a user is logged in. It may throw errors if no user is logged in,
						or if the user is a temporary user.
	*/
	logout(): void {
		if (this.currentUserService.isLoggedIn()) {
			this.userHttp.logout()
				.subscribe(logoutResult => {
					this.currentUserService.setLoggedIn(false);
					this.currentUserService.setUsername(undefined);
					(<any> window).destination = '/register';
					this.router.navigate(['/register']);
				});
		} else {
			this.currentUserService.setUsername(undefined);
			(<any> window).destination = '/register';
			this.router.navigate(['/register']);
		}
	}

	/* 	
		@returns {void} - 
		@description 	Changes the url path in order to cause the ScoreFunctionViewer to display either the Score Function Plot,
						or the Score Distribution Chart. Which one is displayed depends on the current state of the ScoreFucntionViewer.
						This method will show the Score Function Plot if the score Distribution Chart is currently displayed,
						and vice versa. This method should only be called when the current route is 'scoreFunction', as it will cause 
						navigation to that url path.
	*/
	switchScoreFunctionView() {

		if (this.router.url.indexOf('distribution') === -1) {
			this.router.navigate(['scoreFunction', 'distribution']);
			this.switchScoreFunctionViewText = 'User Scores';
		} else {
			this.router.navigate(['scoreFunction', 'plot']);
			this.switchScoreFunctionViewText = 'Score Distributions';
		}

	}

	createValueChart(): void {
		var valueChart = new ValueChart('', '', this.currentUserService.getUsername());
		valueChart.setType(ChartType.Individual); 
		this.valueChartService.setValueChart(valueChart);
		this.router.navigate(['create', CreatePurpose.NewValueChart, 'BasicInfo'], { queryParams: { role: UserRole.Owner }});
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
				let valueChart = this.valueChartParser.parseValueChart(xmlString);
				valueChart.setCreator(this.currentUserService.getUsername());	// Set the current user as the owner.
				valueChart.setName('');											// Erase the ValueChart's name. The owner must give it a new one.

				this.valueChartService.setValueChart(valueChart);
				this.router.navigate(['create', CreatePurpose.NewValueChart, 'BasicInfo'], { queryParams: { role: UserRole.Owner }});
			}
		};
		// Read the file as a text string. This should be fine because ONLY XML files should be uploaded.
		reader.readAsText(xmlFile);
		// Reset upload file so that user can try the same file again after fixing it.
		(<HTMLSelectElement>document.getElementsByName("file-to-upload")[0]).value = null;
	}

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

	getValueChartName(): string {
		if (this.valueChartService.valueChartIsDefined()) {
			return this.valueChartService.getValueChart().getFName() + 'UserWeights.csv';
		} else {
			return '';
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
		
		this.valueChartHttp.getValueChart(Formatter.nameToID(chartName), chartPassword)
			.subscribe(
			(valueChart: ValueChart) => {
				$('#chart-credentials-modal').modal('hide');
				if (this.validateChartForJoining(valueChart)) {
					this.valueChartService.setValueChart(valueChart);
					let role = valueChart.isMember(this.currentUserService.getUsername()) ? UserRole.Participant : UserRole.UnsavedParticipant;

					if (this.valueChartService.getValueChart().getMutableObjectives().length > 0)	{
			  			this.router.navigate(['create', CreatePurpose.NewUser, 'ScoreFunctions'], { queryParams: { role: role }});
			  		}
			  		else {
			  			this.router.navigate(['create', CreatePurpose.NewUser, 'Weights'], { queryParams: { role: role }});
			  		}
				}
			},
			// Handle Server Errors (like not finding the ValueChart)
			(error) => {
				if (error === '404 - Not Found')
					this.invalidCredentials = true;	// Notify the user that the credentials they input are invalid.
			});
	}

	/*
		@returns {boolean}
		@description 	Validates chart structure prior to joining.
						Returns true if it is ok for the current user to join.
	*/
	validateChartForJoining(valueChart: ValueChart): boolean {
		if (valueChart.isIndividual()) {
			this.userNotificationService.displayErrors(["The chart you are trying to join is single-user only."]);
			return false;
		}
		else if (valueChart.getCreator() === this.currentUserService.getUsername()) {
			this.userNotificationService.displayErrors(["You cannot join a chart that you own."]);
			return false;
		}	
		else if (this.validationService.validateStructure(valueChart).length > 0) {
			this.userNotificationService.displayErrors(["Cannot join chart. There are problems with this chart that can only be fixed by the owner."]);
			return false;
		}
		return true;
	}

	/*
		@param chartName - The name of the ValueChart to view. This is NOT the _id field set by the server, but rather the user defined name.
		@param chartPassword - The password of the ValueChart to join. 
		@returns {void}
		@description 	Retrieves the ValueChart that matches the given credentials and directs the user to the ValueChartViewerComponent to view it. 
						Notifies the user using a banner warning if no ValueChart exists with the given name and password.
	*/
	viewValueChart(chartName: string, chartPassword: string): void {
		this.valueChartHttp.getValueChartByName(Formatter.nameToID(chartName), chartPassword)
			.subscribe(
			(valueChart: ValueChart) => {

				$('#chart-credentials-modal').modal('hide');
				if (this.validateChartForViewing(valueChart)) {
					this.valueChartService.setValueChart(valueChart);
					this.router.navigate(['ValueCharts', valueChart.getFName(), valueChart.getType()], { queryParams: { password: valueChart.password, role: UserRole.Viewer } });
				}
			},
			// Handle Server Errors (like not finding the ValueChart)
			(error) => {
				if (error === '404 - Not Found')
					this.invalidCredentials = true;	// Notify the user that the credentials they input are invalid.
			});
	}

	/*
		@returns {boolean}
		@description 	Validates chart structure prior to viewing and gives the creator an opportunity to fix errors.
						Returns true iff there were no validation errors.
	*/
	validateChartForViewing(valueChart: ValueChart): boolean {
		let structuralErrors = this.validationService.validateStructure(valueChart); 	
		if (structuralErrors.length > 0) {
			if (valueChart.getCreator() !== this.currentUserService.getUsername()) {
				this.userNotificationService.displayErrors(["Cannot join chart. There are problems with this chart that can only be fixed by its creator."]);
			}
			else {
				this.validationMessage = "There are problems with this chart: \n\n" + structuralErrors.join('\n\n') + "\n\nWould you like to fix them now?";
				this.displayValidationModal = true;
			}
			return false;
		}
		return true;
	}

}