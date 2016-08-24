/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 16:09:29
*/

import { Component }															from '@angular/core';
import { OnInit, OnDestroy }													from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }							from '@angular/router';

// d3
import * as d3 																	from 'd3';

// Application classes
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

// Model Classes
import { User }																	from '../../../../model/User';
import { ValueChart } 															from '../../../../model/ValueChart';
import { Alternative } 															from '../../../../model/Alternative';
import { PrimitiveObjective } 													from '../../../../model/PrimitiveObjective';



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

	ngOnInit() {

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

		this.resizeValueChart();
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

		// Resize the alternative detail box whenever the window is resized.
		$(window).resize((eventObjective: Event) => {
			this.resizeDetailBox();
			this.resizeValueChart()
		});

		this.renderEventsService.objectiveChartDispatcher.on('Rendering-Over', this.linkAlternativeLabelsToDetailBox);
	}

	ngOnDestroy() {
		this.sub.unsubscribe();

		// Destroy the ValueChart
		$('ValueChart').remove();
	}

	setUserColor(user: User, color: string): void {
		user.color = color;
		this.changeDetectionService.colorsHaveChanged = true;
	}

	resizeValueChart(): void {
		this.valueChartWidth = ($(window).width() * 0.95) * 1.5;
		this.valueChartHeight = ($(window).height() * 0.75) * 1.5;
	}

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

	linkAlternativeLabelsToDetailBox = () => {
		d3.selectAll('.' + this.objectiveChartDefinitions.ALTERNATIVE_LABEL)
			.classed('alternative-link', true);

		$('.' + this.objectiveChartDefinitions.ALTERNATIVE_LABEL).click((eventObject: Event) => {
			var selection: d3.Selection<any> = d3.select(eventObject.target);
			this.expandAlternative(selection.datum());
		});
	};

	// Host ValueChart:

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

				// The Host connection is active, so let it handle the deleted user.
			},
			err => {
				toastr.error(userToDelete.getUsername() + ' could not be deleted');
			});
	}

	// ValueChart Member:

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


	// Detail Box:

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

	// Undo and Redo:

	undoChartChange(): void {
		this.chartUndoRedoService.undo(this.valueChartService);
	}

	redoChartChange(): void {
		this.chartUndoRedoService.redo(this.valueChartService);
	}

	// View Configuration Options:

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

	// Interaction Toggles

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