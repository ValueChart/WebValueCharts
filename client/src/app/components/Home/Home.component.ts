/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   tylerjamesmalloy
* @Last Modified time: 2017-09-13 14:31:22
*/

// Import Angular Classes:
import { Component }									from '@angular/core';
import { Router }										from '@angular/router';
import { OnInit }										from '@angular/core';

// Import Application Classes:
import { XMLValueChartParserService } 					from '../../services';
import { CurrentUserService }							from '../../services';
import { ValueChartService }							from '../../services';
import { UserHttp }										from '../../http';
import { ValueChartHttp }								from '../../http';
import { ValidationService }							from '../../services';
import { UserNotificationService }						from '../../services';
import { ExportValueChartComponent }					from '../ExportValueChart/ExportValueChart.component';

// Import Model Classes:
import { ValueChart, ChartType }						from '../../../model';

// Import Utility Classes:
import * as Formatter									from '../../utilities/Formatter';

// Import Types
import { UserRole }										from '../../../types';
import { CreatePurpose }								from '../../../types';


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
export class HomeComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public UserRole = UserRole;
	public CreatePurpose = CreatePurpose;

	demoValueCharts: any[] = [{ xmlString: singleHotel, name: 'Hotel Selection Problem', type: 'Individual' }, { xmlString: groupHotel, name: 'Hotel Selection Problem', type: 'Group' }, { xmlString: waterManagement, name: 'Runoff Management', type: 'Individual' }]

	public valueChartName: string;
	public valueChartPassword: string;
	public invalidCredentials: boolean;
	public isJoining: boolean = false; // boolean toggle indicating whether user clicked to join or view an existing chart 
									   // this is needed so we can use the same credentials modal in both cases

	// Upload validation fields:
	public displayValidationModal = false;
	public validationMessage: string;

	public valueChartOwnerships: any[];	// The array of ValueChart summary objects belonging to the current user. These are retrieved from the server
	// Belonging is defined as having the creator field of the ValueChart match the user's username.

	public valueChartMemberships: any[];	// The array of ValueChart summary objects fthat the current user is a member of.
		// Member of is defined as having a user in the 'users' field of the ValueChart with a username that matches the current user's username.	

	public displayModal: boolean = false;
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
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private router: Router,
		private valueChartParser: XMLValueChartParserService,
		public  currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private valueChartHttp: ValueChartHttp,
		private validationService: ValidationService,
		private userNotificationService: UserNotificationService,
		private userHttp: UserHttp
	) { }


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
		if (this.currentUserService.isLoggedIn()) {
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

		}
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
					let role: UserRole;
					if (valueChart.getCreator() === this.currentUserService.getUsername()) {
						role = valueChart.isMember(this.currentUserService.getUsername()) ? UserRole.OwnerAndParticipant : UserRole.Owner;
					}
					else {
						role = UserRole.Participant;
					}
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
		@param demoChart - A demonstration chart to view. 
		@returns {void}
		@description 	Opens a demonstration ValueChart and directs the user to the ValueChartViewerComponent to view it.
						This method will be removed when demonstration charts are removed from the home page.
	*/
	selectDemoValueChart(demoChart: any): void {
		let valueChart = this.valueChartParser.parseValueChart(demoChart.xmlString);
		this.valueChartService.setValueChart(valueChart);
		this.router.navigate(['ValueCharts', valueChart.getFName(), valueChart.getType()], { queryParams: { password: valueChart.password, role: UserRole.Viewer } });
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
		@returns {void}
		@description 	Called in response to click of "Yes" button in validation error modal.
	*/
	fixChart() {
		this.router.navigate(['create', CreatePurpose.EditValueChart, 'BasicInfo'], { queryParams: { role: UserRole.Owner }});
	}
}