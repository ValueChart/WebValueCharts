/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-09 15:55:20
*/

// Import Angular Classes:
import { Component }															from '@angular/core';
import { OnInit, OnDestroy }													from '@angular/core';
import { Router, ActivatedRoute }												from '@angular/router';

// Import Libraries:
import * as d3 																	from 'd3';
import * as _																	from 'lodash';

// Import Application Classes:
import { ViewOptionsComponent }													from '../widgets/ViewOptions/ViewOptions.component'
import { InteractionOptionsComponent }											from '../widgets/InteractionOptions/InteractionOptions.component'

import { ValueChartDirective }													from '../../../ValueChart/directives/ValueChart.directive';

import { CurrentUserService }													from '../../services/CurrentUser.service';
import { ValueChartService }													from '../../services/ValueChart.service';
import { DisplayedUsersService }												from '../../services/DisplayedUsers.service';
import { HostService }															from '../../services/Host.service';
import { ValueChartHttpService }												from '../../services/ValueChartHttp.service';
import { ValidationService }													from '../../services/Validation.service';
import { ChartUndoRedoService }													from '../../../ValueChart/services/ChartUndoRedo.service';
import { RenderEventsService }													from '../../../ValueChart/services/RenderEvents.service';

// Import Model Classes:
import { ValueChart } 															from '../../../../model/ValueChart';
import { User }																	from '../../../../model/User';
import { WeightMap } 															from '../../../../model/WeightMap';
import { Alternative } 															from '../../../../model/Alternative';
import { PrimitiveObjective } 													from '../../../../model/PrimitiveObjective';

// Import Types:
import { ViewConfig, InteractionConfig }										from '../../../../types/Config.types';
import { ScoreFunctionRecord }													from '../../../../types/Record.types';

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
	providers: [ ]
})
export class ValueChartViewerComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public valueChartWidth: number;
	public valueChartHeight: number;

	public chartElement: d3.Selection<any, any, any, any>;
	public undoRedoService: ChartUndoRedoService;
	public renderEvents: RenderEventsService;

	public valueChart: ValueChart;
	public valueChartStatus: any = { userChangesPermitted: true, incomplete: false };
	public usersToDisplay: User[];
	public validationMessage: string;

	// ValueChart Configuration:
	public viewConfig: ViewConfig = <any> {};
	public interactionConfig: InteractionConfig = <any> {};


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
		private route: ActivatedRoute,
		public currentUserService: CurrentUserService,
		public valueChartService: ValueChartService,
		public displayedUsersService: DisplayedUsersService,
		private valueChartHttpService: ValueChartHttpService,
		private hostService: HostService,
		private validationService: ValidationService) { }

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
		this.resizeValueChart();

		this.valueChart = this.valueChartService.getValueChart();

		this.valueChartHttpService.getValueChartStatus(this.valueChart.getFName()).subscribe((status) => { this.valueChartStatus = status; });

		let invalidUsers = this.validationService.getInvalidUsers(this.valueChart);
		this.usersToDisplay = _.clone(this.valueChartService.getValueChart().getUsers().filter(user => invalidUsers.indexOf(user.getUsername()) === -1));
		this.displayedUsersService.setUsersToDisplay(this.usersToDisplay);
		this.displayedUsersService.setInvalidUsers(invalidUsers);

		if (!this.currentUserService.isJoiningChart()) {
			this.hostValueChart();
		}

		$(window).resize((eventObjective: Event) => {
			this.resizeValueChart();
		});

		if (invalidUsers.length > 0) {
			let errorMessages = this.validationService.validateUsers(this.valueChart);
			this.validationMessage = "The following users' preferences are invalid. They have been hidden from the chart:\n\n" + errorMessages.join('\n\n');
			$('#validate-modal').modal('show');
		}
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

	/* 	
		@returns {boolean}
		@description 	Whether or not the current user may interactively change the scores and weights.
						True if the current user is joining the chart OR the chart contains exactly ONE user who is:
							(a) the current user AND
							(b) the chart creator
						Under any other circumstances, the current user should not be permitted to alter the scores and weights.
	*/
	enableInteraction(): boolean {
		return (this.currentUserService.isJoiningChart() 
			|| (this.valueChartService.isIndividual()
				&& this.valueChartService.currentUserIsDefined()
				&& this.valueChartService.currentUserIsCreator()));
	}

	/* 	
		@returns {boolean}
		@description 	Whether or not the current user should be permitted to manage the chart.
						Management activities include: Edit chart, export chart, lock/unlock chart, and remove users
	*/
	enableManagement(): boolean {
		return (!this.currentUserService.isJoiningChart() 
			&& this.valueChartService.currentUserIsCreator());
	}

	/* 	
		@returns {boolean}
		@description 	Whether or not to show the Edit Preferences button.
						True if current user is joining a chart, or the current user is the chart's creator and already a member of the chart.
	*/
	enableEditPreferences(): boolean {
		return (this.currentUserService.isJoiningChart() 
			|| (this.valueChartService.currentUserIsDefined()
				&& this.valueChartService.currentUserIsCreator()));
	}

  /*   
    @returns {void}
    @description   Check that no score function has a range of 0 (i.e. best and worst outcomes have the same score)
  */
	checkScoreFunctionRanges(): boolean {
  		let currentUser: User = this.valueChartService.getCurrentUser();
		for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
  			let scoreFunction = currentUser.getScoreFunctionMap().getObjectiveScoreFunction(objName);
  			if (scoreFunction.getRange() === 0) {
  				return false;
  			}
    	}
    	return true;
  	}

  /*   
    @returns {void}
    @description   Rescales all ScoreFunctions so that the worst and best outcomes have scores of 0 and 1 respectively.
  */
	rescaleScoreFunctions(): void {
		let currentUser: User = this.valueChartService.getCurrentUser();
		let rescaled: boolean = false;
		for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
			let scoreFunction = currentUser.getScoreFunctionMap().getObjectiveScoreFunction(objName);
			if (scoreFunction.rescale()) {
				rescaled = true;
			}
		}
		if (rescaled) {
			toastr.warning("Score functions rescaled so that scores range from 0 to 1.");
		}
	}

  /*   
    @returns {void}
    @description   This is executed when the user clicks "Edit Preferences" and does the following:
    				(1) If user is joining the chart, fetch the chart again - this is necessary to get any changes made to the chart structure by the creator
    				(2) Normalize the user's weights in case the pump tool was used
    				(3) Redirect to edit preference workflow
  */
  	editPreferences(): void {
		if (this.currentUserService.isJoiningChart()) {
			this.valueChartHttpService.getValueChartStructure(this.valueChart.getFName(), this.valueChart.password)
			.subscribe(valueChart => {
				valueChart.setUser(this.valueChartService.getCurrentUser());
				this.valueChartService.setValueChart(valueChart);
				this.valueChartService.getCurrentUser().getWeightMap().normalize();
				this.router.navigate(['/createValueChart/editPreferences/ScoreFunctions']);
			});
		}
		else {
			this.valueChartService.getCurrentUser().getWeightMap().normalize();
			this.router.navigate(['/createValueChart/editPreferences/ScoreFunctions']);
		}	
  	}

	// ================================ Hosting/Joining/Saving a ValueChart ====================================

	/* 	
		@returns {void}
		@description 	Hosts the current ValueChart, causing the server to send messages to the client whenever a user joins/modifies/leaves
						the current ValueChart. These messages are handled automatically by the HostService and ValueChartDirective's change detection.
						This method should NEVER be called by a user that is joining an existing ValueChart. 
	*/
	hostValueChart(): void {
		this.hostService.hostGroupValueChart(this.valueChart._id);
	}

	/* 	
		@returns {void}
		@description 	Submits the current user's preferences to the copy of the ValueChart on the database. Anyone hosting the ValueChart will
						be automatically notified of the submission. This method can be used to join a ValueChart for the first time or to update
						previously submitted preferences that have changed. This method should ONLY be called when by a user that is joining an existing
						ValueChart.
	*/
	submitPreferences(): void {
		if (this.checkScoreFunctionRanges()) {
			var currentUser: User = this.valueChartService.getCurrentUser();
			this.rescaleScoreFunctions();
			currentUser.getWeightMap().normalize();

			// The ValueChart ID should always be defined at this point since we are joining an EXISTING chart
			// that has been retrieved from the server.
			this.valueChartHttpService.updateUser(this.valueChart._id, currentUser)
				.subscribe(
				// User added/updated!
				(user: User) => {
					toastr.success('Preferences successfully submitted');
				},
				// Handle Server Errors
				(error) => {
					// Add something to handle when the host has disabled user changes
					console.log(error);
					if (error === '403 - Forbidden')
						toastr.warning('Preference submission failed. The Host has disabled new submissions');
					else 
						toastr.error('Preference submission failed. There was an error submitting your preferences');
				});			
		}
		else {
			toastr.error("Saving failed - score function outcomes can't all have the same value.")
		}			
	}

	/* 	
		@returns {void}
		@description 	Updates the chart on the database.
	*/
	saveChart(): void {
		if (this.checkScoreFunctionRanges()) {
			this.rescaleScoreFunctions();
			this.valueChartService.getCurrentUser().getWeightMap().normalize();
			
			this.valueChartHttpService.updateValueChart(this.valueChart)
				.subscribe(
				(valuechart) => { toastr.success('ValueChart saved'); },
				(error) => {
					// Handle any errors here.
					toastr.warning('Saving failed');
				});
		}
		else {
			toastr.error("Saving failed - score function outcomes can't all have the same value.")
		}			
	}

	setUserChangesAccepted(userChangesPermitted: any): void {
		this.valueChartStatus.userChangesPermitted = userChangesPermitted;

		this.valueChartHttpService.setValueChartStatus(this.valueChartStatus).subscribe((status) => {
			var messageString: string = ((userChangesPermitted) ? 'ValueChart unlocked. Changes will be allowed' : 'ValueChart locked. Changes will be blocked');
			toastr.warning(messageString);
		});

	}

	// ================================ Undo/Redo ====================================

	undoChartChange(): void {
		this.undoRedoService.undo(this.valueChartService.getValueChart());
	}

	redoChartChange(): void {
		this.undoRedoService.redo(this.valueChartService.getValueChart());
	}

	currentUserScoreFunctionChange = (scoreFunctionRecord: ScoreFunctionRecord) => {
		this.valueChartService.getCurrentUser().getScoreFunctionMap().setObjectiveScoreFunction(scoreFunctionRecord.objectiveName, scoreFunctionRecord.scoreFunction);
	}

	currentUserWeightMapChange = (weightMapRecord: WeightMap) => {
		this.valueChartService.getCurrentUser().setWeightMap(weightMapRecord);
	}
}