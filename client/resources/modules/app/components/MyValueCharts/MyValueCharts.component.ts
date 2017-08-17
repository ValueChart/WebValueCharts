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
import { CurrentUserService }							from '../../services/CurrentUser.service';
import { ValueChartService }							from '../../services/ValueChart.service';
import { UserHttpService }								from '../../services/UserHttp.service';
import { ValueChartHttpService }						from '../../services/ValueChartHttp.service';
import { ValidationService }							from '../../services/Validation.service';
import { ExportValueChartComponent }					from '../ExportValueChart/ExportValueChart.component';
import { XmlValueChartEncoder }							from '../../../utilities/classes/XmlValueChart.encoder';
import * as Formatter									from '../../../utilities/classes/Formatter';

// Import Model Classes:
import { ValueChart }									from '../../../../model/ValueChart';

// Import Types
import { UserRole }										from '../../../../types/UserRole'
import { CreatePurpose }								from '../../../../types/CreatePurpose'


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
		private userHttpService: UserHttpService,
		private valueChartHttpService: ValueChartHttpService,
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
		this.userHttpService.getOwnedValueCharts(this.currentUserService.getUsername())
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
						chartSummary.incomplete = status.incomplete;
						chartSummary.userChangesPermitted = status.userChangesPermitted;
					}
				});
			});

		//	Retrieve summary objects for all of the ValueCharts the current user is a member of.
		this.userHttpService.getJoinedValueCharts(this.currentUserService.getUsername())
			.subscribe(
			valueChartMemberships => {
				this.valueChartMemberships = valueChartMemberships;
			});

		this.downloadLink = <HTMLElement> document.querySelector('#download-user-weights');
	}

	openValueChart(chartId: string, password: string): void {
		password = password || '';
		
		this.valueChartHttpService.getValueChart(chartId, password)
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

		this.valueChartHttpService.getValueChart(chartId, password)
			.subscribe(valueChart => {
				this.valueChartService.setValueChart(valueChart);

				this.router.navigate(['create', CreatePurpose.EditValueChart, 'BasicInfo'], { queryParams: { role: UserRole.Owner }});
			});
	}

	editPreferences(chartId: string, chartName: string, password: string): void {
		this.valueChartHttpService.getValueChart(Formatter.nameToID(chartName), password)
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
		this.valueChartHttpService.deleteUser(chartId, this.currentUserService.getUsername())
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
		this.valueChartHttpService.deleteValueChart(chartId)
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

		this.valueChartHttpService.deleteValueChartStatus(this.valueChartService.getValueChart()._id).subscribe((status) => {
			// Do nothing;
		});
	}

	setValueChart(chartId: string, password: string): void {
		this.valueChartHttpService.getValueChart(chartId, password)
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
		if (valueChartSummary.incomplete) {
			return 'Incomplete';
		} else {
			return 'Complete';
		}
	}

	getChangesPermittedText(valueChartSummary: any): string {
		if (valueChartSummary.userChangesPermitted && !valueChartSummary.incomplete) {
			return 'Allowed';
		} else {
			return 'Prevented';
		}
	}
}
