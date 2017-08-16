/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 12:27:10
*/

// Import Angular Classes:
import { Component }															from '@angular/core';
import { OnInit, OnDestroy }													from '@angular/core';
import { Router, ActivatedRoute }												from '@angular/router';

// Import Libraries:
import * as d3 																	from 'd3';
import * as _																	from 'lodash';
import { Subscription }															from 'rxjs/Subscription';
import { Observable }															from 'rxjs/Observable';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartDirective }													from '../../../ValueChart/directives/ValueChart.directive';

import { ValueChartService }													from '../../services/ValueChart.service';
import { CurrentUserService }													from '../../services/CurrentUser.service';
import { ValueChartViewerService }												from '../../services/ValueChartViewer.service';
import { HostService }															from '../../services/Host.service';
import { ValueChartHttpService }												from '../../services/ValueChartHttp.service';
import { ValidationService }													from '../../services/Validation.service';
import { UpdateValueChartService }												from '../../services/UpdateValueChart.service';
import { UserNotificationService }												from '../../services/UserNotification.service'; 
import { ChartUndoRedoService }													from '../../../ValueChart/services/ChartUndoRedo.service';
import { RenderEventsService }													from '../../../ValueChart/services/RenderEvents.service';

// Import Model Classes:
import { ValueChart, ChartType } 												from '../../../../model/ValueChart';
import { User }																	from '../../../../model/User';
import { WeightMap } 															from '../../../../model/WeightMap';
import { Alternative } 															from '../../../../model/Alternative';
import { PrimitiveObjective } 													from '../../../../model/PrimitiveObjective';

// Import Types:
import { ViewConfig, InteractionConfig }										from '../../../../types/Config.types';
import { ScoreFunctionRecord }													from '../../../../types/Record.types';
import { UserRole }																from '../../../../types/UserRole'
import { CreatePurpose }														from '../../../../types/CreatePurpose'
import { ValueChartStatus }														from '../../../../types/ValueChartStatus'

/*
	This class is responsible for displaying a ValueChart visualization. It uses the ValueChartDirective to create and render a ValueChart, and
	provides itself the UI elements and logic needed for the visualization's controls.

	The visualization controls provided by ValueChartViewer are of three basic types: interaction toggles, view option toggles, and hosting controls.
	Interaction toggles allow users to control what interactions provided by the ValueChartDirective are enabled by modifying
	the values of the inputs to the directive. View option toggles change the display of the ValueChart visualization by similarly modifying the inputs
	to the ValueChartDirective. The class also provides controls for hosting a ValueChart and submitting preferences to it. Hosting controls
	allow the user to either host the current ValueChart, or, if they have joined an existing ValueChart, submit their preferences to the server. 
*/

@Component({
	selector: 'ValueChartViewer',
	templateUrl: './ValueChartViewer.template.html',
	providers: [ ValueChartViewerService, HostService ]
})
export class ValueChartViewerComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public ChartType = ChartType;
	public UserRole = UserRole;
	public userRecord: User;

	public routeSubscription: Subscription;

	public valueChartWidth: number;
	public valueChartHeight: number;

	public chartElement: d3.Selection<any, any, any, any>;
	public undoRedoService: ChartUndoRedoService;
	public renderEvents: RenderEventsService;

	public usersToDisplay: User[];
	public validationMessage: string = '';

	// ValueChart Configuration:
	public viewConfig: ViewConfig = <any> {};
	public interactionConfig: InteractionConfig = <any> {};

	public loading: boolean = true;


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		public valueChartService: ValueChartService,
		public valueChartViewerService: ValueChartViewerService,
		public currentUserService: CurrentUserService,
		private router: Router,
		private route: ActivatedRoute,
		private valueChartHttpService: ValueChartHttpService,
		private hostService: HostService,
		private validationService: ValidationService,
		private userNotificationService: UserNotificationService,
		private updateValueChartService: UpdateValueChartService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	// ================================ Life-cycle Methods ====================================


	/* 	
		@returns {void}
		@description 	Initializes the ValueChartViewer. ngOnInit is only called ONCE by Angular. This function is thus used for one-time initialized only. 
						Calling ngOnInit should be left to Angular. Do not call it manually. All initialization logic for this component should be put in this
					method rather than in the constructor. Be aware that Angular will NOT call ngOnInit again if the a user navigates to the ValueChartViewer
						from the ValueChartViewer as the component is reused instead of being created again.
	*/
	ngOnInit() {

		this.routeSubscription = Observable.zip(
			this.route.params, 
			this.route.queryParams, 
			(params, queryParams) => ({ params: params, queryParams: queryParams }))
			.subscribe(urlParameters =>  {

				// Retrieve the ValueChart type from the URL route parameters. 			
				let type: ChartType = Number.parseInt(urlParameters.params['ChartType']);
				// Retrieve the ValueChart type from the URL route parameters. 			
				let role: UserRole = Number.parseInt(urlParameters.queryParams['role']);
				// Retrieve the ValueChart name from the URL route parameters.
				let fname: string = urlParameters.params['ValueChart'];
				// Retrieve the ValueChart password from the URL query parameters.
				let password: string = urlParameters.queryParams['password'];
				
				this.valueChartViewerService.setUserRole(role);

				if (this.loading) {
					if (!this.valueChartService.valueChartIsDefined()) {
						this.valueChartHttpService.getValueChartByName(fname, password)
							.subscribe(valueChart => {
								this.valueChartService.setValueChart(valueChart);
								this.initializeViewer(type);
								this.loading = false;
							});
					} else {
						this.initializeViewer(type);
						this.loading = false;
					}
				}

			});

		this.route.params.subscribe(params => { if (!this.loading) this.setValueChartTypeToView(params['ChartType'], this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername())) });

		this.resizeValueChart();
		$(window).resize((eventObjective: Event) => {
			this.resizeValueChart();
		});
	}

	initializeViewer(type: ChartType): void {
		let valueChart = this.valueChartService.getValueChart();
		let currentUser = valueChart.getUser(this.currentUserService.getUsername());
		this.userRecord = _.cloneDeep(currentUser);

		let invalidUsers = this.validationService.getInvalidUsers(valueChart);
		this.valueChartViewerService.initializeUsers(valueChart.getUsers(), invalidUsers);

		if (invalidUsers.length > 0 && this.valueChartViewerService.getUserRole() !== UserRole.UnsavedParticipant) {
			let errorMessages = this.validationService.validateUsers(valueChart);
			this.validationMessage = "The following users' preferences are invalid. They have been hidden from the chart:\n\n" + errorMessages.join('\n\n');
		}

		if (this.valueChartService.getStatus().chartId !== valueChart._id) // If the status document is not associated with this ValueChart, fetch the correct one.
			this.valueChartHttpService.getValueChartStatus(valueChart._id).subscribe(status => this.valueChartService.setStatus(status));

		this.setValueChartTypeToView(type, currentUser);
		this.hostValueChart();
	}

	setValueChartTypeToView(type: ChartType, currentUser: User) {
		if (type == ChartType.Individual) {

			let individualChart = this.valueChartViewerService.generateIndividualChart();
			this.valueChartViewerService.setActiveValueChart(individualChart);

			// TODO:<aaron> Clean this up.
			this.usersToDisplay = this.valueChartViewerService.getActiveValueChart().getUsers();
		} else {
			let baseValueChart = this.valueChartService.getValueChart();
			this.valueChartViewerService.setActiveValueChart(baseValueChart);
			
			if (currentUser) {
				let errors = this.validationService.validateUser(baseValueChart, currentUser);
				this.valueChartViewerService.updateInvalidUser(currentUser, errors)
			}

			this.usersToDisplay = this.valueChartViewerService.getUsersToDisplay();
		}

		this.router.navigate(['ValueCharts', this.valueChartViewerService.getActiveValueChart().getFName(), type], { queryParamsHandling: "merge" });
	}

	updateView(viewConfig: ViewConfig) {
		this.viewConfig = viewConfig;
	}

	updateInteractions(interactionConfig: InteractionConfig) {
		this.interactionConfig = interactionConfig;
	}

	updateUndoRedo(undoRedoService: ChartUndoRedoService) {
		this.undoRedoService = undoRedoService;

		undoRedoService.undoRedoDispatcher.on(undoRedoService.SCORE_FUNCTION_CHANGE, this.currentUserScoreFunctionChange);
		undoRedoService.undoRedoDispatcher.on(undoRedoService.WEIGHT_MAP_CHANGE, this.currentUserWeightMapChange);
	}

	updateChartElement(chartElement: d3.Selection<any, any, any, any>) {
		this.chartElement = chartElement;
	}

	updateRenderEvents(renderEvents: RenderEventsService) {
		this.renderEvents = renderEvents;
	}

	/* 	
		@returns {void}
		@description 	Destroys the ValueChartViewer. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
						requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {

		if (this.hostService.hostWebSocket) {
			this.hostService.endCurrentHosting();
		}

		// Destroy the ValueChart manually to prevent memory leaks.
		$('ValueChart').remove();
	}

	/* 	
		@returns {void}
		@description 	Resizes the ValueChart depending on the dimensions of the window. Changing valueChartWidth and ValueChartHeight
						triggers re-rendering of the ValueChart via the ValueChartDirective.
	*/
	resizeValueChart(): void {
		this.valueChartWidth = (window.innerWidth * 0.95) * 1.5;
		this.valueChartHeight = (window.innerHeight * 0.75) * 1.5;
	}


	// TODO <@aaron>: Cleanup these methods.

	/* 	
		@returns {boolean}
		@description 	Whether or not the current user may interactively change the scores and weights.
	*/
	canInteract(): boolean {
		return this.valueChartViewerService.isParticipant() && this.valueChartViewerService.getActiveValueChart().isIndividual();
	}

	/*   
	  @returns {boolean}
	  @description	Help function to determine whether or not the current user has access to the "View Group Chart" button.
	  				A user can view the Group Chart when: 	1) there is a group chart to view;
															2) they have submitted their preferences to the Group Chart;
	*/
	canViewGroupChart(): boolean {
		return this.valueChartViewerService.isParticipant() 
			&& (this.valueChartViewerService.getUserRole() !== UserRole.UnsavedParticipant) 
			&& (this.valueChartService.getValueChart().getType() === ChartType.Group) 
			&& this.valueChartViewerService.userIsMember(this.currentUserService.getUsername());
	}

	/*   
	  @returns {boolean}
	  @description	Helper function to determine whether or not the current user has access to the "Save" button.
	  				This is almost the same as canInteract; it is different in that ValueChart owners that are not members
	  				are allowed to save changes to the order of alternatives and objectives.
	*/
	canSave(): boolean {
		return this.valueChartViewerService.isParticipant() || this.valueChartViewerService.getUserRole() == UserRole.Owner;
	}

  /*   
    @returns {void}
    @description   Rescales all ScoreFunctions so that the worst and best outcomes have scores of 0 and 1 respectively.
  */
	rescaleScoreFunctions(): void {
		let currentUser: User = this.valueChartViewerService.getActiveValueChart().getUser(this.currentUserService.getUsername());
		let rescaled: boolean = false;
		for (let objName of this.valueChartViewerService.getActiveValueChart().getAllPrimitiveObjectivesByName()) {
			let scoreFunction = currentUser.getScoreFunctionMap().getObjectiveScoreFunction(objName);
			if (scoreFunction.rescale()) {
				rescaled = true;
			}
		}
		if (rescaled) {
			this.userNotificationService.displayWarnings(["Score functions rescaled so that scores range from 0 to 1."]);
		}
	}

  	editPreferences(): void {	
  		if (this.valueChartService.getValueChart().getMutableObjectives().length > 0)	{
  			this.router.navigate(['create', CreatePurpose.EditUser, 'ScoreFunctions'], { queryParams: { role: this.valueChartViewerService.getUserRole() }});
  		}
  		else {
  			this.router.navigate(['create', CreatePurpose.EditUser, 'Weights'], { queryParams: { role: this.valueChartViewerService.getUserRole() }});
  		}
		
  	}

  	editValueChart(): void {
  		this.router.navigate(['create', CreatePurpose.EditValueChart, 'BasicInfo'], { queryParams: { role: this.valueChartViewerService.getUserRole() } });
  	}

	// ================================ Hosting/Joining/Saving a ValueChart ====================================

	/* 	
		@returns {void}
		@description 	Hosts the current ValueChart, causing the server to send messages to the client whenever a user joins/modifies/leaves
						the current ValueChart. These messages are handled automatically by the HostService and ValueChartDirective's change detection.
						This method should NEVER be called by a user that is joining an existing ValueChart. 
	*/
	hostValueChart(): void {
		this.hostService.hostGroupValueChart(this.valueChartViewerService.getActiveValueChart()._id);
	}


	/* 	
		@returns {void}
		@description 	Save the current user's changes to the ValueChart.
						If the current user is the ValueChart owner, this method will also save the ValueChart structure.
	*/
	save(): void {
		let userRole = this.valueChartViewerService.getUserRole();
		
		if (this.valueChartViewerService.isParticipant())
			this.submitPreferences()
		
		if (userRole == UserRole.Owner || userRole == UserRole.OwnerAndParticipant) {
			// Update the ValueChart.
			this.valueChartHttpService.updateValueChartStructure(this.valueChartService.getValueChart()).subscribe(
				(result: ValueChart) => { this.userNotificationService.displaySuccesses(['Save successful']); },
				(error: any) => {
					// Handle any errors here.
					this.userNotificationService.displayWarnings(['Saving Failed.']);
				});
		}
	}

	/* 	
		@returns {void}
		@description 	Submits the current user's preferences to the copy of the ValueChart on the database. Anyone hosting the ValueChart will
						be automatically notified of the submission. This method can be used to join a ValueChart for the first time or to update
						previously submitted preferences that have changed. This method should ONLY be called when by a user that is joining an existing
						ValueChart.
	*/
	submitPreferences(): void {
		var currentUser: User = this.valueChartViewerService.getActiveValueChart().getUser(this.currentUserService.getUsername());
		let errors: string[] = this.validationService.validateUser(this.valueChartService.getValueChart(), currentUser);

		if (errors.length > 0) {
			this.userNotificationService.displayWarnings(['Saving failed. Your preferences are not valid.']);
			this.userNotificationService.displayErrors(errors);
		} else {
			this.rescaleScoreFunctions();

			// The ValueChart ID should always be defined at this point since we are joining an EXISTING chart
			// that has been retrieved from the server.
			this.valueChartHttpService.updateUser(this.valueChartViewerService.getActiveValueChart()._id, currentUser)
				.subscribe(
				// User added/updated!
				(user: User) => {
					this.userNotificationService.displaySuccesses(['Save successful']);
					this.userRecord = _.cloneDeep(user);

					if (this.valueChartViewerService.getUserRole() === UserRole.UnsavedParticipant) {
						let newRole = (this.valueChartViewerService.userIsCreator(this.currentUserService.getUsername())) ? UserRole.OwnerAndParticipant : UserRole.Participant;
						let type = this.valueChartViewerService.getActiveValueChart().getType();
						this.valueChartViewerService.setUserRole(newRole);

						// Update the URL parameters to reflect the new user role.
						this.router.navigate(['ValueCharts', this.valueChartViewerService.getActiveValueChart().getFName(), type ], { queryParamsHandling: "merge", queryParams: { role: newRole } });
					}
				},
				// Handle Server Errors
				(error) => {
					if (error === '403 - Forbidden')
						this.userNotificationService.displayWarnings(['Saving failed. The Host has disabled changes.']);
					else 
						this.userNotificationService.displayErrors(['Saving failed. There was an error saving your preferences.']);
				});			
		}		
	}

	setUserChangesAccepted(userChangesPermitted: any): void {
		this.valueChartService.getStatus().userChangesPermitted = userChangesPermitted;

		this.valueChartHttpService.setValueChartStatus(this.valueChartService.getStatus()).subscribe((status) => {
			var messageString: string = ((userChangesPermitted) ? 'ValueChart unlocked. Changes will be allowed.' : 'ValueChart locked. Changes will be prevented.');
			this.userNotificationService.displayWarnings([messageString]);
		});

	}


	// TODO <@aaron>: Move the Undo/Redo functionality to its own component.

	// ================================ Undo/Redo ====================================

	undoChartChange(): void {
		this.undoRedoService.undo(this.valueChartViewerService.getActiveValueChart());
	}

	redoChartChange(): void {
		this.undoRedoService.redo(this.valueChartViewerService.getActiveValueChart());
	}

	currentUserScoreFunctionChange = (scoreFunctionRecord: ScoreFunctionRecord) => {
		this.valueChartViewerService.getActiveValueChart().getUser(this.currentUserService.getUsername()).getScoreFunctionMap().setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
	}

	currentUserWeightMapChange = (weightMapRecord: WeightMap) => {
		this.valueChartViewerService.getActiveValueChart().getUser(this.currentUserService.getUsername()).setWeightMap(weightMapRecord);
	}
}