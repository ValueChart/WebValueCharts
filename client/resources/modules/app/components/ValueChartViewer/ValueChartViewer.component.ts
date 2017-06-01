/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-31 17:55:41
*/

// Import Angular Classes:
import { Component }															from '@angular/core';
import { OnInit, OnDestroy }													from '@angular/core';
import { Router, ActivatedRoute }												from '@angular/router';

// Import Libraries:
import * as d3 																	from 'd3';

// Import Application Classes:
import { ViewOptionsComponent }													from '../widgets/ViewOptions/ViewOptions.component'
import { InteractionOptionsComponent }											from '../widgets/InteractionOptions/InteractionOptions.component'

import { ValueChartDirective }													from '../../../ValueChart/directives/ValueChart.directive';

import { CurrentUserService }													from '../../services/CurrentUser.service';
import { ValueChartService }													from '../../services/ValueChart.service';
import { HostService }															from '../../services/Host.service';
import { ValueChartHttpService }												from '../../services/ValueChartHttp.service';
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

	public undoRedoService: ChartUndoRedoService;
	public renderEvents: RenderEventsService;

	valueChart: ValueChart;

	// ValueChart Configuration:
	viewConfig: ViewConfig = <any> {};
	interactionConfig: InteractionConfig = <any> {};

	// This gets set each time the "Remove" button for a user is clicked
	// The user will be removed from chart upon confirmation
	userToRemove: User;

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
		private valueChartHttpService: ValueChartHttpService,
		private hostService: HostService) { }

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

		if (!this.currentUserService.isJoiningChart()) {
			this.hostValueChart();
		}

		$(window).resize((eventObjective: Event) => {
			this.resizeValueChart();
		});
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
						True iff the current user is joining the chart OR the chart contains exactly ONE user who is:
							(a) the current user AND
							(b) the chart creator
						Under any other circumstances, the current user should not be permitted to alter the scores and weights.
	*/
	enableInteraction(): boolean {
		return (this.currentUserService.isJoiningChart() 
			|| (this.valueChartService.isIndividual()
				&& this.valueChart.getUsers()[0].getUsername() === this.currentUserService.getUsername()
				&& this.valueChart.getCreator() === this.currentUserService.getUsername()));
	}

	/* 	
		@returns {boolean}
		@description 	Whether or not the current user should be permitted to manage the chart.
						Management activities include: Edit chart, export chart, lock/unlock chart, and remove users
	*/
	enableManagement(): boolean {
		return (!this.currentUserService.isJoiningChart() 
			&& this.valueChart.getCreator() === this.currentUserService.getUsername());
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