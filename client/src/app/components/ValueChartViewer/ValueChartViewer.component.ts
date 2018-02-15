/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 17:18:14
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
import '../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartDirective }													from '../../../ValueChartVis';
import { ChartUndoRedoService }													from '../../../ValueChartVis';
import { RenderEventsService }													from '../../../ValueChartVis';

import { ValueChartService }													from '../../services';
import { CurrentUserService }													from '../../services';
import { ValueChartViewerService }												from '../../services';
import { HostService }															from '../../services';
import { ValidationService }													from '../../services';
import { UpdateValueChartService }												from '../../services';
import { UserNotificationService }												from '../../services';
import { UserGuard }															from '../../guards';
import { ValueChartHttp }														from '../../http';

// Import Model Classes:
import { ValueChart, ChartType } 												from '../../../model';
import { User }																	from '../../../model';
import { WeightMap } 															from '../../../model';
import { Alternative } 															from '../../../model';
import { PrimitiveObjective } 													from '../../../model';

// Import Types:
import { ViewConfig, InteractionConfig }										from '../../../types';
import { ScoreFunctionRecord }													from '../../../types';
import { UserRole }																from '../../../types';
import { CreatePurpose }														from '../../../types';
import { ValueChartStatus }														from '../../../types';

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
	providers: [ ValueChartViewerService ]
})
export class ValueChartViewerComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public ChartType = ChartType;
	public UserRole = UserRole;
	public _ = _;

	public chartName: string = "";

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
	public reducedInformation: boolean = false;


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
		public userGuard: UserGuard,
		private router: Router,
		private route: ActivatedRoute,
		private valueChartHttp: ValueChartHttp,
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

				// Is this chart being loaded for the first time?
				if (this.chartName !== fname) {
					// If the ValueChart in the ValueChartService is not defined,
					// then fetch the ValueChart from the server using the URL parameters.
					if (!this.valueChartService.valueChartIsDefined()) {
						this.valueChartHttp.getValueChartByName(fname, password)
							.subscribe(valueChart => {
								this.valueChartService.setValueChart(valueChart);
								this.initializeViewer(type);
								this.chartName = fname;
							});
					} else {
						this.initializeViewer(type);
						this.chartName = fname;
					}
				}

			});

		// Subscribe to the route parameters so that the type of ValueChart being viewed changes when the parameters change.
		this.route.params.subscribe(params => { if (!(this.chartName === "")) this.setValueChartTypeToView(params['ChartType'], this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername())) });

		// Initialize automatic resizing of the ValueChart when the window is resized.
		this.resizeValueChart();
		$(window).resize((eventObjective: Event) => {
			this.resizeValueChart();
		});
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


	// ================================ Setup Methods ====================================


	/* 	
		@param type - The type of the ValueChart to display.
		@returns {void}
		@description	Initializes the ValueChartViewer to display a ValueChart for the first time. This saves a copy of the user to 
						userGuard (which is used to determine if the user has made changes to their preferences), initializes
						the valueChartViewerService's usersToDisplay and invalidUsers lists, prints error messages to current user,
						and hosts the current ValueChart.
	*/
	initializeViewer(type: ChartType): void {
		let valueChart = this.valueChartService.getValueChart();
		let currentUser = valueChart.getUser(this.currentUserService.getUsername());
		
		// Save the initial user object for change detection.
		if (!this.userGuard.getUserRecord()) {
			this.userGuard.setUserRecord(_.cloneDeep(currentUser));
		}

		let invalidUsers = this.validationService.getInvalidUsers(valueChart);
		this.valueChartViewerService.initializeUsers(valueChart.getUsers(), invalidUsers);

		if (invalidUsers.length > 0 && this.valueChartViewerService.getUserRole() !== UserRole.UnsavedParticipant) {
			let errorMessages = this.validationService.validateUsers(valueChart);
			this.validationMessage = "The following users' preferences are invalid. They have been hidden from the chart:\n\n" + errorMessages.join('\n\n');
		}

		if (this.valueChartService.getStatus().chartId !== valueChart._id) // If the status document is not associated with this ValueChart, fetch the correct one.
			this.valueChartHttp.getValueChartStatus(valueChart._id).subscribe(status => this.valueChartService.setStatus(status));

		this.setValueChartTypeToView(type, currentUser);
		this.valueChartViewerService.setSavedValueChartStructure(_.cloneDeep(this.valueChartService.getValueChart().getValueChartStructure()));
		this.hostValueChart();
	}

	/* 	
		@param type - The type of the ValueChart to display.
		@param currentUser - The user object from the ValueChart that is being viewed that is associated with the current user.
		@returns {void}
		@description	Changes the type of ValueChart displayed by the ValueChartViewer to be the given type. 
						If the type is individual and the current ValueChart is a group chart, then a new ValueChart
						containing ONLY the current user is created and displayed. If the type is group, then the ValueChart
						from the ValueChartService is displayed. Note that this assumes that the "baseValueChart" from the 
						ValueChartService is a group ValueChart.
	*/
	setValueChartTypeToView(type: ChartType, currentUser: User) {
		if (type == ChartType.Individual) {

			let individualChart = this.valueChartViewerService.generateIndividualChart();
			this.valueChartViewerService.setActiveValueChart(individualChart);

			// There is no hiding/showing users in an individual chart, so set the usersToDisplay to be the user in the ValueChart.
			this.usersToDisplay = this.valueChartViewerService.getActiveValueChart().getUsers();
		} else {
			let baseValueChart = this.valueChartService.getValueChart();
			this.valueChartViewerService.setActiveValueChart(baseValueChart);
			
			if (currentUser) {
				let errors = this.validationService.validateUser(baseValueChart, currentUser);
				this.valueChartViewerService.updateInvalidUser(currentUser, errors);
			}

			// Group ValueCharts have hiding/showing users, so set the usersToDisplay to be the array in valueChartViewerService,
			// which is connected to the user details box.
			this.usersToDisplay = this.valueChartViewerService.getUsersToDisplay();
		}

		// Change the URL parameters to reflect the type of ValueChart being viewed.
		this.router.navigate(['ValueCharts', this.valueChartViewerService.getActiveValueChart().getFName(), type], { queryParamsHandling: "merge" });
	}

	// ================================ Event Handlers for Component/Directive Outputs ====================================

	/* 	
		@param viewConfig - the new view configuration for the ValueChartDirective.
		@returns {void}
		@description Sets the view configuration field as a response to an event emitted by the ViewOptionsComponent.
					 This updates the view configuration of the ValueChartDirective automatically via Angular's binding system.
	*/
	updateView(viewConfig: ViewConfig): void {
		this.viewConfig = viewConfig;
	}

	/* 	
		@param interactionConfig - the new interaction configuration for the ValueChartDirective.
		@returns {void}
		@description Sets the interaction configuration field as a response to an event emitted by the InteractionOptionsComponent.
					 This updates the interaction configuration of the ValueChartDirective automatically via Angular's binding system.
	*/
	updateInteractions(interactionConfig: InteractionConfig): void {
		this.interactionConfig = interactionConfig;
	}

	updateReducedInfo(reducedInformation: boolean): void {
		this.reducedInformation = reducedInformation;
	}

	/* 	
		@param undoRedoService - the UndoRedoService instantiated by the ValueChartDirective and used by the directive's ecosystem.
		@returns {void}
		@description Sets the current undoRedoService to be instance used by the ValueChartDirective and its ecosystem. This allows
					 the ValueChartViewer and other components to use the "proper" instance of the UndoRedoService using the same dependency
					 injection provider as the ValueChartDirective. The goal here is decoupling the ValueChartDirective from the ValueChartViewerService. 
	*/
	updateUndoRedo(undoRedoService: ChartUndoRedoService): void {
		this.undoRedoService = undoRedoService;

		undoRedoService.undoRedoSubject.subscribe(this.currentUserScoreFunctionChange);
		undoRedoService.undoRedoSubject.subscribe(this.currentUserWeightMapChange);
	}

	/* 	
		@param chartElement - the base SVG element of that the ValueChartDirective uses to render the ValueChart visualization.
		@returns {void}
		@description Sets the chartElement field to be the base element emitted by the ValueChartDirective. This allows
					 the ValueChartViewer to have access to the visualization's parent element without directing interacting with the DOM.
	*/
	updateChartElement(chartElement: d3.Selection<any, any, any, any>): void {
		this.chartElement = chartElement;
	}

	/* 	
		@param renderEvents - the RenderEventsService instance used by the ValueChartDirective to signal when rendering has completed.
		@returns {void}
		@description Sets the renderEventsService field to be the service instance used by the ValueChartDirective ecosystem.
					 This allows the ValueChartDirective to listen to render events without having the same service provider as the 
					 ValueChartDirective. 
	*/
	updateRenderEvents(renderEvents: RenderEventsService): void {
		this.renderEvents = renderEvents;
	}

	/* 	
		@returns {void}
		@description 	Resizes the ValueChart depending on the dimensions of the window. Changing valueChartWidth and ValueChartHeight
						triggers re-rendering of the ValueChart via the ValueChartDirective.
	*/
	resizeValueChart(): void {
		this.valueChartWidth = (window.innerWidth * 0.95) * 1.5;
		this.valueChartHeight = (window.innerHeight * 0.75) * 1.5 - 50;
	}


	// ================================ Helper Methods for Determining Permissions ====================================

	/* 	
		@returns {boolean}
		@description 	Whether or not the current user may interactively change the scores and weights.
	*/
	canInteract(): boolean {
		return this.valueChartViewerService.isParticipant() && this.valueChartViewerService.getActiveValueChart().isIndividual();
	}

	/*   
	  @returns {boolean}
	  @description	Helper function to determine whether or not the current user has access to the "View Group Chart" button.
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
	  @returns {boolean}
	  @description	Helper function to determine whether or not the "Save" button is enabled.
	  				True if the current user has made changes to their preferences, or if the chart owner has made changes to the structure.
	*/
	saveEnabled(): boolean {
		if (this.valueChartViewerService.isOwner() && !_.isEqual(this.valueChartViewerService.getSavedValueChartStructure(), this.valueChartService.getValueChart().getValueChartStructure())) {
			return true;
		}
		return !_.isEqual(_.omit(this.userGuard.getUserRecord(), ['id']), _.omit(this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername()), ['id']));
	}



	/*   
	  @returns {void}
	  @description   Rescales all ScoreFunctions so that the worst and best outcomes have scores of 0 and 1 respectively.
	*/
	rescaleScoreFunctions(): void {
		let currentUser: User = this.valueChartViewerService.getActiveValueChart().getUser(this.currentUserService.getUsername());
		let rescaled: boolean = false;
		for (let objId of this.valueChartViewerService.getActiveValueChart().getAllPrimitiveObjectives().map(obj => obj.getId())) {
			let scoreFunction = currentUser.getScoreFunctionMap().getObjectiveScoreFunction(objId);
			if (scoreFunction.rescale()) {
				rescaled = true;
			}
		}
		if (rescaled) {
			this.userNotificationService.displayWarnings(["Score functions rescaled so that scores range from 0 to 1."]);
		}
	}

	/*   
	  @returns {void}
	  @description   Navigate to the Create workflow to edit the current user's preferences. Note that this should only be called
	  				 if the current user is a member of the ValueChart being viewed.
	*/
  	editPreferences(): void {	
  		if (this.valueChartService.getValueChart().getMutableObjectives().length > 0)	{
  			this.router.navigate(['create', CreatePurpose.EditUser, 'ScoreFunctions'], { queryParams: { role: this.valueChartViewerService.getUserRole() }});
  		}
  		else {
  			this.router.navigate(['create', CreatePurpose.EditUser, 'Weights'], { queryParams: { role: this.valueChartViewerService.getUserRole() }});
  		}
		
  	}

  	/*   
  	  @returns {void}
  	  @description   Navigate to the Create workflow to edit the current ValueChart. Note that this should only be called
  	  				 if the current user is the owner of the ValueChart being viewed.
  	*/
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
		
		if (this.valueChartViewerService.isParticipant() && 
			!_.isEqual(this.userGuard.getUserRecord(), this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername())))
			this.submitPreferences();
		
		if (userRole == UserRole.Owner || userRole == UserRole.OwnerAndParticipant) {
			// Update the ValueChart.
			this.valueChartHttp.updateValueChartStructure(this.valueChartService.getValueChart()).subscribe(
				(result: ValueChart) => { this.valueChartViewerService.setSavedValueChartStructure(_.cloneDeep(result.getValueChartStructure())) },
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
			this.valueChartViewerService.initUserColors(this.valueChartService.getValueChart());
			// The ValueChart ID should always be defined at this point since we are joining an EXISTING chart
			// that has been retrieved from the server.
			this.valueChartHttp.updateUser(this.valueChartViewerService.getActiveValueChart()._id, currentUser)
				.subscribe(
				// User added/updated!
				(user: User) => {
					this.userNotificationService.displaySuccesses(['Save successful']);
					// Save the updated user object for change detection.
					this.userGuard.setUserRecord(_.cloneDeep(currentUser));

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


	// ================================ Undo/Redo ====================================

	undoChartChange(): void {
		this.undoRedoService.undo(this.valueChartViewerService.getActiveValueChart());
	}

	redoChartChange(): void {
		this.undoRedoService.redo(this.valueChartViewerService.getActiveValueChart());
	}

	currentUserScoreFunctionChange = (message: {type: string, data: ScoreFunctionRecord}) => {
		if (message.type === this.undoRedoService.SCORE_FUNCTION_CHANGE)
			this.valueChartViewerService.getActiveValueChart().getUser(this.currentUserService.getUsername()).getScoreFunctionMap().setObjectiveScoreFunction(message.data.objectiveId, message.data.scoreFunction);
	}

	currentUserWeightMapChange = (message: {type: string, data: WeightMap}) => {
		if (message.type === this.undoRedoService.WEIGHT_MAP_CHANGE)
			this.valueChartViewerService.getActiveValueChart().getUser(this.currentUserService.getUsername()).setWeightMap(message.data);
	}
}