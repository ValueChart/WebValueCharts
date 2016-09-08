/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-01 10:59:25
*/

// Import Angular Classes:
import { Component }															from '@angular/core';
import { OnInit, OnDestroy }													from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }							from '@angular/router';

// Import Libraries:
import * as d3 																	from 'd3';

// Import Application Classes:
import { ValueChartDirective }													from '../../directives/ValueChart.directive';

import { CurrentUserService }													from '../../services/CurrentUser.service';
import { ValueChartService }													from '../../services/ValueChart.service';
import { RendererDataService }													from '../../services/RendererData.service';
import { ScoreFunctionViewerService }											from '../../services/ScoreFunctionViewer.service';
import { RenderConfigService }													from '../../services/RenderConfig.service';
import { ChartUndoRedoService }													from '../../services/ChartUndoRedo.service';
import { ChangeDetectionService }												from '../../services/ChangeDetection.service';
import { RenderEventsService }													from '../../services/RenderEvents.service';
import { HostService }															from '../../services/Host.service';
import { ValueChartHttpService }												from '../../services/ValueChartHttp.service';

import { ObjectiveChartRenderer }												from '../../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }													from '../../renderers/SummaryChart.renderer';
import { LabelRenderer }														from '../../renderers/Label.renderer';

import { ReorderObjectivesInteraction }											from '../../interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }												from '../../interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }											from '../../interactions/SortAlternatives.interaction';
import { SetObjectiveColorsInteraction }										from '../../interactions/SetObjectiveColors.interaction';
import { ExpandScoreFunctionInteraction }										from '../../interactions/ExpandScoreFunction.interaction';

import { SummaryChartDefinitions }												from '../../services/SummaryChartDefinitions.service';
import { ObjectiveChartDefinitions }											from '../../services/ObjectiveChartDefinitions.service';
import { LabelDefinitions }														from '../../services/LabelDefinitions.service';

// Import Model Classes:
import { User }																	from '../../../../model/User';
import { ValueChart } 															from '../../../../model/ValueChart';
import { Alternative } 															from '../../../../model/Alternative';
import { PrimitiveObjective } 													from '../../../../model/PrimitiveObjective';



/*
	This class is responsible for displaying a ValueChart visualization. It uses the ValueChartDirective to create and render a ValueChart, and
	provides itself the UI elements and logic needed for the visualization's controls. The ValueChart that is displayed by this class is either
	the ValueChart currently stored by the ValueChartService, or its average depending on the current route parameters. 

	The visualization controls provided by ValueChartViewer are of three basic types: interaction toggles, view option toggles, and hosting controls.
	Interaction toggles allow users to control what interactions provided by the ValueChartDirective are enabled by modifying
	the values of the inputs to the directive. View option toggles change the display of the ValueChart visualization by similarly modifying the inputs
	to the ValueChartDirective. The class also provides controls for hosting a ValueChart and submitting preferences to it. Hosting controls
	allow the user to either host the current ValueChart, or, if they have joined an existing ValueChart, submit their preferences to the server. 
*/

@Component({
	selector: 'ValueChartViewer',
	templateUrl: 'client/resources/modules/app/components/ValueChartViewer/ValueChartViewer.template.html',
	directives: [ROUTER_DIRECTIVES, ValueChartDirective],
	providers: [
		// Services:
		RendererDataService,
		ScoreFunctionViewerService,
		RenderConfigService,
		ChangeDetectionService,
		RenderEventsService,
		HostService,
		// Renderers:
		ObjectiveChartRenderer,
		SummaryChartRenderer,
		LabelRenderer,
		// Interactions:
		ReorderObjectivesInteraction,
		ResizeWeightsInteraction,
		SortAlternativesInteraction,
		SetObjectiveColorsInteraction,
		ExpandScoreFunctionInteraction,

		// Definitions:
		SummaryChartDefinitions,
		ObjectiveChartDefinitions,
		LabelDefinitions]
})
export class ValueChartViewerComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Pump Sorting Values:
	private PUMP_OFF: string = 'none';
	private PUMP_DECREASE: string = 'decrease';
	private PUMP_INCREASE: string = 'increase';

	// Alternative Sorting Values:
	private ALTERNATIVE_SORT_MANUAL: string = 'manual';
	private ALTERNATIVE_SORT_OBJECTIVE: string = 'objective';
	private ALTERNATIVE_SORT_ALPHABET: string = 'alphabet';
	private ALTERNATIVE_SORT_RESET: string = 'reset';
	private ALTERNATIVE_SORT_OFF: string = 'none';

	// Weight Resizing Values:
	private RESIZE_NEIGHBOR: string = 'neighbor';
	private RESIZE_SIBLINGS: string = 'siblings';
	private NO_RESIZING: string = 'none';

	private valueChartWidth: number;
	private valueChartHeight: number;

	// Attach the window variable to the component so that it is available in the template.
	private window = window;

	sub: any;

	valueChart: ValueChart;
	alternatives: Alternative[];


	// ValueChart Display Configuration Options:
	orientation: string;
	displayScoreFunctions: boolean;
	displayDomainValues: boolean;
	displayScales: boolean;
	displayTotalScores: boolean;
	displayScoreFunctionValueLabels: boolean;

	// ValueChart Interactions Configuration:
	weightResizeType: string;
	reorderObjectives: boolean;
	sortAlternatives: string;
	pumpWeights: string;
	setObjectiveColors: boolean;

	// Detail Box 
	detailBoxAlternativeTab: string;
	alternativeObjectives: string[];
	alternativeObjectiveValues: (string | number)[];

	DETAIL_BOX_WIDTH_OFFSET: number = -50;
	DETAIL_BOX_HEIGHT_OFFSET: number = -55;
	DETAIL_BOX_HORIZONTAL_SCALE: number = 1.15;

	detailBoxCurrentTab: string;
	DETAIL_BOX_ALTERNATIVES_TAB: string = 'alternatives';
	DETAIL_BOX_USERS_TAB: string = 'users';

	chartType: string;

	// Save Jquery as a field of the class so that it is exposed to the template.
	$: JQueryStatic;



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
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private renderConfigService: RenderConfigService,
		private chartUndoRedoService: ChartUndoRedoService,
		private changeDetectionService: ChangeDetectionService,
		private renderEventsService: RenderEventsService,
		private summaryChartDefinitions: SummaryChartDefinitions,
		private objectiveChartDefinitions: ObjectiveChartDefinitions,
		private labelDefinitions: LabelDefinitions,
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
		// Display either the current ValueChart, or the average of the current ValueChart depending on the route parameters:
		this.sub = this.route.params.subscribe(params => {
			let valueChartName: string = params['ValueChart']; // (+) converts string 'id' to a number
			this.detailBoxCurrentTab = this.DETAIL_BOX_ALTERNATIVES_TAB;

			if (valueChartName.toLowerCase().indexOf('average') !== -1) {
				this.valueChartService.inactiveValueCharts.push(this.valueChartService.getValueChart());
				this.valueChartService.setValueChart(this.valueChartService.getValueChart().getAverageValueChart());
				this.valueChart = this.valueChartService.getValueChart();
				this.chartType = 'average';
				this.weightResizeType = this.RESIZE_NEIGHBOR;

			} else {
				this.valueChart = this.valueChartService.getValueChart();
				this.chartType = 'normal';
				this.weightResizeType = (this.valueChart.isIndividual()) ? this.RESIZE_NEIGHBOR : this.NO_RESIZING;
			}

		});


		this.$ = $;
		this.alternatives = this.valueChart.getAlternatives();

		// View Configuration
		this.orientation = 'vertical';
		this.displayScoreFunctions = this.valueChart.isIndividual();

		this.displayTotalScores = true;
		this.displayScales = false;
		this.displayDomainValues = false;
		this.displayScoreFunctionValueLabels = false;

		// Interactions
		this.weightResizeType = (this.valueChart.isIndividual()) ? this.RESIZE_NEIGHBOR : this.NO_RESIZING;
		this.reorderObjectives = false;
		this.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.pumpWeights = this.PUMP_OFF;
		this.setObjectiveColors = false;

		// Detail Box
		this.detailBoxCurrentTab = this.DETAIL_BOX_ALTERNATIVES_TAB;
		this.detailBoxAlternativeTab = 'Alternatives';
		this.alternativeObjectives = [];
		this.alternativeObjectiveValues = [];

		// Size the ValueChart and detail box:
		this.resizeValueChart();

		// Resize the alternative detail box whenever the window is resized.
		$(window).resize((eventObjective: Event) => {
			this.resizeDetailBox();
			this.resizeValueChart()
		});

		// Set Alternative labels to link to the Alternative detail box. 
		this.renderEventsService.objectiveChartDispatcher.on('Rendering-Over', this.linkAlternativeLabelsToDetailBox);
	}

	/* 	
		@returns {void}
		@description 	Destroys the ValueChartViewer. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
						requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		// Unsubscribe from the route parameters to prevent a memory leak.
		this.sub.unsubscribe();

		// Destroy the ValueChart manually to prevent memory leaks.
		$('ValueChart').remove();
	}

	/* 	
		@returns {void}
		@description 	Resizes the ValueChart depending on the dimensions of the window. Changing valueChartWidth and ValueChartHeight
						triggers re-rendering of the ValueChart via the ValueChartDirective.
	*/
	resizeValueChart(): void {
		this.valueChartWidth = ($(window).width() * 0.95) * 1.5;
		this.valueChartHeight = ($(window).height() * 0.75) * 1.5;
	}

	// ================================ Hosting/Joining a ValueChart ====================================

	/* 	
		@returns {void}
		@description 	Hosts the current ValueChart, causing the server to send messages to the client whenever a user joins/modifies/leaves
						the current ValueChart. These messages are handled automatically by the HostService and ValueChartDirective's change detection.
						This method should NEVER be called by a user that is joining an existing ValueChart. 
	*/
	hostValueChart(): void {
		// Close the Modal
		$('#host-chart-modal').modal('hide');

		// If the ID is not defined (indicating it has not been submitted to the server), submit the ValueChart.
		if (!this.valueChart._id) {
			this.valueChartHttpService.createValueChart(this.valueChart)
				.subscribe(
				(valueChart: ValueChart) => {
					// Set the id of the ValueChart.
					this.valueChart._id = valueChart._id;
					// Host the ValueChart.
					this.hostService.hostGroupValueChart(valueChart._id);
				},
				// Handle Server Errors
				(error) => {

				});
		} else {
			this.hostService.hostGroupValueChart(this.valueChart._id);
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
		var currentUser: User = this.valueChartService.getCurrentUser();

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
				toastr.warning('Preference submission failed. The Host has disabled new submissions');
			});
	}


	// ================================ Detail Box Methods ====================================

	/* 	
		@returns {void}
		@description 	Resizes the detail box depending on the dimensions of the ValueChart. This method should ONLY be called
						when the ValueChart has already been rendered.
	*/
	resizeDetailBox(): void {
		// When the window is resized, set the height of the detail box to be 50px less than the height of summary chart.
		var alternativeDetailBox: any = $('#alternative-detail-box')[0];
		var summaryOutline: any = $('.' + this.summaryChartDefinitions.OUTLINE)[0];
		if (summaryOutline) {
			alternativeDetailBox.style.height = (summaryOutline.getBoundingClientRect().height + this.DETAIL_BOX_WIDTH_OFFSET) + 'px';
			alternativeDetailBox.style.width = (summaryOutline.getBoundingClientRect().width + this.DETAIL_BOX_HEIGHT_OFFSET) + 'px';
		}

		if (this.orientation === 'horizontal') {
			let detailBoxContainer: any = $('.detail-box')[0];
			let labelOutline: any = $('.' + this.labelDefinitions.OUTLINE)[0];
			if (labelOutline) {
				// Offset the detail box to the left if the ValueChart is in horizontal orientation.
				detailBoxContainer.style.left = (labelOutline.getBoundingClientRect().width * this.DETAIL_BOX_HORIZONTAL_SCALE) + 'px';
			}
		}
	}

	expandAlternative(alternative: Alternative): void {
		this.detailBoxAlternativeTab = alternative.getName();

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.alternativeObjectives[index] = objective.getName();
			this.alternativeObjectiveValues[index] = alternative.getObjectiveValue(objective.getName());
		});

		this.resizeDetailBox();
	}

	collapseAlternative(): void {
		this.detailBoxAlternativeTab = 'Alternatives';
		this.resizeDetailBox();
	}

	setUserColor(user: User, color: string): void {
		user.color = color;
		this.changeDetectionService.colorsHaveChanged = true;
	}

	/* 	
		@returns {void}
		@description 	Removes a user from the existing ValueChart, and updates the ValueChart's resource on the database.
	*/
	removeUser(userToDelete: User): void {
		this.valueChartHttpService.deleteUser(this.valueChart._id, userToDelete.getUsername())
			.subscribe(username => {
				if (!this.hostService.hostWebSocket) { 	// Handle the deleted user manually.

					var userIndex: number = this.valueChart.getUsers().findIndex((user: User) => {
						return user.getUsername() === userToDelete.getUsername();
					});
					// Delete the user from the ValueChart
					this.valueChart.getUsers().splice(userIndex, 1);
					toastr.warning(userToDelete.getUsername() + ' has left the ValueChart');
				}

				// The Host connection is active, so let it handle notifications about the deleted user.
			},
			err => {
				toastr.error(userToDelete.getUsername() + ' could not be deleted');
			});
	}

	// An anonymous function that links the alternative labels created by the ObjectiveChartRenderer to the Chart Detail box.
	linkAlternativeLabelsToDetailBox = () => {
		d3.selectAll('.' + this.objectiveChartDefinitions.ALTERNATIVE_LABEL)
			.classed('alternative-link', true);

		$('.' + this.objectiveChartDefinitions.ALTERNATIVE_LABEL).click((eventObject: Event) => {
			var selection: d3.Selection<any> = d3.select(eventObject.target);
			this.expandAlternative(selection.datum());
		});
	};

	// ================================ Undo/Redo ====================================


	undoChartChange(): void {
		this.chartUndoRedoService.undo(this.valueChartService);
	}

	redoChartChange(): void {
		this.chartUndoRedoService.redo(this.valueChartService);
	}

	// ================================ Handlers for View Config Controls ====================================

	setOrientation(viewOrientation: string): void {
		this.orientation = viewOrientation;

		if (this.orientation === 'horizontal') {
			let detailBoxContainer: any = $('.detail-box')[0];
			let labelOutline: any = $('.' + this.labelDefinitions.OUTLINE)[0];

			detailBoxContainer.style.left = (labelOutline.getBoundingClientRect().width * this.DETAIL_BOX_HORIZONTAL_SCALE) + 'px';
		}
	}

	setDisplayScoreFunctions(newVal: boolean): void {
		this.displayScoreFunctions = newVal;
	}

	setDisplayDomainValues(newVal: boolean): void {
		this.displayDomainValues = newVal;
	}

	setDisplayScales(newVal: boolean): void {
		this.displayScales = newVal;
	}

	setDisplayTotalScores(newVal: boolean): void {
		this.displayTotalScores = newVal;
	}
	setDisplayScoreFunctionValueLabels(newVal: boolean): void {
		this.displayScoreFunctionValueLabels = newVal;
	}


	// ================================ Handlers for User Interaction Controls ====================================

	setWeightResizeType(resizeType: string): void {
		this.weightResizeType = resizeType;
	}


	toggleReorderObjectives(newVal: boolean): void {
		this.reorderObjectives = newVal;

		// Turn off all other interactions.
		this.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.pumpWeights = this.PUMP_OFF;
		this.setObjectiveColors = false;
	}

	toggleSortAlternatives(sortType: string): void {
		this.sortAlternatives = (this.sortAlternatives === sortType && (sortType === this.ALTERNATIVE_SORT_OBJECTIVE || sortType === this.ALTERNATIVE_SORT_MANUAL)) ? this.ALTERNATIVE_SORT_OFF : sortType;

		if (sortType === this.ALTERNATIVE_SORT_ALPHABET || sortType === this.ALTERNATIVE_SORT_RESET) {
			window.setTimeout(() => {
				this.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
			}, 10);
		}

		// Turn off all other interactions.
		this.reorderObjectives = false;
		this.pumpWeights = this.PUMP_OFF;
		this.setObjectiveColors = false;
	}

	setPumpType(pumpType: string): void {
		this.pumpWeights = (this.pumpWeights === pumpType) ? this.PUMP_OFF : pumpType;

		// Turn off all other interactions.
		this.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.reorderObjectives = false;
		this.setObjectiveColors = false;
	}

	toggleSetObjectiveColors(newVal: boolean): void {
		this.setObjectiveColors = newVal;

		// Turn off all other interactions.
		this.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.reorderObjectives = false;
		this.pumpWeights = this.PUMP_OFF;
	}
}