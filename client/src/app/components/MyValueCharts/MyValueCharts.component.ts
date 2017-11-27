/*
* @Author: aaronpmishkin
* @Date:   2016-08-04 13:09:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:48:46
*/

// Import Angular Classes:
import { Component }									from '@angular/core';
import { Router }										from '@angular/router';
import { OnInit }										from '@angular/core';

// Import Application Classes:
import { CurrentUserService }							from '../../services';
import { ValueChartService }							from '../../services';
import { UserHttp }										from '../../http';
import { ValueChartHttp }								from '../../http';
import { ValidationService }							from '../../services';
import { UserNotificationService }						from '../../services';
import { ExportValueChartComponent }					from '../ExportValueChart/ExportValueChart.component';
import { XmlValueChartEncoder }							from '../../utilities';
import * as Formatter									from '../../utilities/Formatter';

// Import Model Classes:
import { ValueChart }									from '../../../model';

// Import Types
import { UserRole }										from '../../../types';
import { CreatePurpose }								from '../../../types';


/*
	This component implements the My ValueChart's page. The my ValueChart page is where an authenticated user can view and manage the 
	ValueCHarts that they have created. MyValueChartsComponent allows users to view summaries of their ValueCharts that include
	the charts name, and password, the number of user preferences it contains, and its completion status. An incomplete ValueChart is a 
	ValueChart that is missing something because its creator did not complete the creation workflow. Incomplete ValueCharts can only be
	delete or completed by clicking the edit button, while complete ValueCharts can be edited, deleted, exported or viewed. Exporting a ValueChart
	as an XML string is handled by the ExportValueChartComponent, while exporting ONLY the user weights from a ValueChart is handled by this component.

	The MyValueChartsComponent can only be navigated to by users logged into a permanent account. Temporary users cannot have their ValueCharts
	saved to their account because their usernames may not be unique. 
*/

@Component({
	selector: 'myValueCharts',
	templateUrl: './MyValueCharts.template.html',
})
export class MyValueChartsComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public valueChartOwnerships: any[];	// The array of ValueChart summary objects belonging to the current user. These are retrieved from the server
										// Belonging is defined as having the creator field of the ValueChart match the user's username.

	public valueChartMemberships: any[];	// The array of ValueChart summary objects fthat the current user is a member of.
										// Member of is defined as having a user in the 'users' field of the ValueChart with a username that matches the current user's username.
	
	private downloadLink: HTMLElement;			// The <a> element for exporting a ValueChart as an XML file. Downloading an XML ValueChart is done entirely
										// on the client side using object URLs.	

    public displayModal: boolean = false;
    public modalActionEnabled: boolean = false;
    public modalActionFunction: Function = () => { };
	public modalTitle: string;
	public modalBody: string;
	public valueChartName: string;
	public valueChartPassword: string;

	// Upload validation fields:
	public displayValidationModal = false;
	public validationMessage: string;

	public invalidCredentials: boolean;
	public isJoining: boolean = false; // boolean toggle indicating whether user clicked to join or view an existing chart 
									   // this is needed so we can use the same credentials modal in both cases



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
		private xmlValueChartEncoder: XmlValueChartEncoder,
		private currentUserService: CurrentUserService,
		public valueChartService: ValueChartService,
		private userNotificationService: UserNotificationService,
		private userHttp: UserHttp,
		private valueChartHttp: ValueChartHttp,
		private validationService: ValidationService) { }

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
		//	Retrieve summary objects for all of the ValueCharts created by the current user.
		this.userHttp.getOwnedValueCharts(this.currentUserService.getUsername())
			.subscribe(
			valueChartOwnerships => {
				this.valueChartOwnerships = valueChartOwnerships;
				if (!this.valueChartService.valueChartIsDefined())
					return;
				
				let valueChart = this.valueChartService.getValueChart();
				let status = this.valueChartService.getStatus();

				// Update the summary with local (possibly more up-to-date) information.
				this.valueChartOwnerships.forEach((chartSummary: any) => {
					if (chartSummary._id === valueChart._id) {
							chartSummary.name = valueChart.getName();
							chartSummary.password = valueChart.password;
							chartSummary.numUsers = valueChart.getUsers().length;
						}

					if (chartSummary._id === status.chartId) {
						chartSummary.lockedBySystem = status.lockedBySystem;
						chartSummary.lockedByCreator = status.lockedByCreator;
					}
				});
			});

		//	Retrieve summary objects for all of the ValueCharts the current user is a member of.
		this.userHttp.getJoinedValueCharts(this.currentUserService.getUsername())
			.subscribe(
			valueChartMemberships => {
				this.valueChartMemberships = valueChartMemberships;
			});

		this.downloadLink = <HTMLElement> document.querySelector('#download-user-weights');
	}

	openValueChart(chartId: string, password: string): void {
		password = password || '';
		
		this.valueChartHttp.getValueChart(chartId, password)
			.subscribe(valueChart => {
				
				// Validate chart structure before proceeding.
				// (This is a sanity check to catch any as any errors brought on by changes in validation since saving to the database.)
				let errorMessages = this.validationService.validateStructure(valueChart);
				if (errorMessages.length > 0) {
					this.modalTitle = 'Validation Error';
					this.modalBody = "Cannot view chart. Please fix the following problems:\n\n" + errorMessages.join('\n\n');
					this.modalActionEnabled = false;
					this.displayModal = true;
				}
				else {
					this.valueChartService.setValueChart(valueChart);
					let role = valueChart.isMember(this.currentUserService.getUsername()) ? UserRole.OwnerAndParticipant : UserRole.Owner;
					this.router.navigate(['ValueCharts', valueChart.getFName(), valueChart.getType()], { queryParams: { password: valueChart.password, role: role } });
				}	
			});
	}

	editValueChart(chartId: string, password: string): void {
		password = password || '';

		this.valueChartHttp.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.valueChartService.setValueChart(valueChart);

				this.router.navigate(['create', CreatePurpose.EditValueChart, 'BasicInfo'], { queryParams: { role: UserRole.Owner }});
			});
	}

	editPreferences(chartId: string, chartName: string, password: string): void {
		this.valueChartHttp.getValueChart(Formatter.nameToID(chartName), password)
			.subscribe(valueChart => {
				// Validate chart structure before proceeding.
				// (This is a sanity check to catch any as any errors brought on by changes in validation since saving to the database.)
				if (this.validationService.validateStructure(valueChart).length > 0) {
					this.modalTitle = 'Validation Error';
					this.modalBody = "Cannot edit preferences. There are problems with this chart that can only be fixed by the owner.";
					this.modalActionEnabled = false;
					this.displayModal = true;
				}
				else {
					this.valueChartService.setValueChart(valueChart);
			  		if (this.valueChartService.getValueChart().getMutableObjectives().length > 0)	{
			  			this.router.navigate(['create', CreatePurpose.EditUser, 'ScoreFunctions'], { queryParams: { role: UserRole.Participant }});
			  		}
			  		else {
			  			this.router.navigate(['create', CreatePurpose.EditUser, 'Weights'], { queryParams: { role: UserRole.Participant }});
			  		}
				}
			});
	}

	displayLeaveChart(chartId: string, chartPassword: string): void {
		this.setValueChart(chartId, chartPassword);

		this.modalTitle = 'Leave ValueChart';
		this.modalBody = 'Are you sure you want to leave this ValueChart?';
		this.modalActionEnabled = true;
		this.modalActionFunction = this.leaveValueChart.bind(this, chartId);
		this.displayModal = true;
	}

	leaveValueChart(chartId: string): void {
		this.valueChartHttp.deleteUser(chartId, this.currentUserService.getUsername())
			.subscribe(username => {
				let index: number = this.valueChartMemberships.findIndex((valueChartSummary: any) => {
					return valueChartSummary._id === chartId;
				});
				this.valueChartMemberships.splice(index, 1);
		});
	}

	displayDeleteChart(chartId: string, chartPassword: string): void {
		this.setValueChart(chartId, chartPassword);

		this.modalTitle = 'Delete ValueChart';
		this.modalBody = 'Are you sure you want to permanently delete this ValueChart?';
		this.modalActionEnabled = true;
		this.modalActionFunction = this.deleteValueChart.bind(this, chartId);
		this.displayModal = true;
	}

	deleteValueChart(chartId: string): void {
		this.valueChartHttp.deleteValueChart(chartId)
			.subscribe(status => {
				let index: number = this.valueChartOwnerships.findIndex((valueChartSummary: any) => {
					return valueChartSummary._id === chartId;
				});
				this.valueChartOwnerships.splice(index, 1);

				index = this.valueChartMemberships.findIndex((valueChartSummary: any) => {
					return valueChartSummary._id === chartId;
				});
				this.valueChartMemberships.splice(index, 1);
			});

		this.valueChartHttp.deleteValueChartStatus(this.valueChartService.getValueChart()._id).subscribe((status) => {
			// Do nothing;
		});
	}

	setValueChart(chartId: string, password: string): void {
		this.valueChartHttp.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.valueChartService.setValueChart(valueChart);
			});
	}

	getValueChartName(): string {
		if (this.valueChartService.valueChartIsDefined()) {
			return this.valueChartService.getValueChart().getFName() + 'UserWeights.csv';
		} else {
			return '';
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

	exportUserWeights() {
		var valueChart: ValueChart = this.valueChartService.getValueChart();
		var weightsObjectUrl: string = this.convertUserWeightsIntoObjectURL(valueChart);

		this.downloadLink.setAttribute('href', weightsObjectUrl);	// Set the download link on the <a> element to be the URL created for the CSV string.
		$(this.downloadLink).click();									// Click the <a> element to programmatically begin the download.
	}

	convertUserWeightsIntoObjectURL(valueChart: ValueChart): string {
		if (valueChart === undefined)
			return;
		
		// Obtain a CSV string for the user defined weights in the given ValueChart. 
		var weightString: string = this.xmlValueChartEncoder.encodeUserWeights(valueChart);
		// Convert the string into a blob. We must do this before we can create a download URL for the CSV string.
		var weightsBlob: Blob = new Blob([weightString], { type: 'text/xml' });

		// Create and return a unique download URL for the CSV string.
		return URL.createObjectURL(weightsBlob);
	}

	getStatusText(valueChartSummary: any): string {
		if (valueChartSummary.lockedBySystem) {
			return 'Incomplete';
		} else {
			return 'Complete';
		}
	}

	getChangesPermittedText(valueChartSummary: any): string {
		if (!valueChartSummary.lockedByCreator && !valueChartSummary.lockedBySystem) {
			return 'Allowed';
		} else {
			return 'Prevented';
		}
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
