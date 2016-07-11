/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 13:34:24
*/

import { Component }															from '@angular/core';
import { OnInit, OnDestroy }													from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }							from '@angular/router';

// JQuery
import * as $																	from 'jquery';
// d3
import * as d3 																	from 'd3';

// Application classes
import { CreateComponent }														from '../create-component/Create.component';

import { CurrentUserService }													from '../../services/CurrentUser.service';

import { ValueChartDirective }													from '../../directives/ValueChart.directive';

import { ChartDataService }														from '../../services/ChartData.service';
import { RenderConfigService }													from '../../services/RenderConfig.service';
import { ChartUndoRedoService }													from '../../services/ChartUndoRedo.service';
import { ChangeDetectionService }												from '../../services/ChangeDetection.service';
import { RenderEventsService }													from '../../services/RenderEvents.service';

import { ObjectiveChartRenderer }												from '../../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }													from '../../renderers/SummaryChart.renderer';
import { LabelRenderer }														from '../../renderers/Label.renderer';

import { ReorderObjectivesInteraction }											from '../../interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }												from '../../interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }											from '../../interactions/SortAlternatives.interaction';
import { SetColorsInteraction }													from '../../interactions/SetColors.interaction';

import { SummaryChartDefinitions }												from '../../services/SummaryChartDefinitions.service';
import { ObjectiveChartDefinitions }											from '../../services/ObjectiveChartDefinitions.service';
import { LabelDefinitions }														from '../../services/LabelDefinitions.service';

// Model Classes
import { ValueChart } 															from '../../model/ValueChart';
import { Alternative } 															from '../../model/Alternative';
import { PrimitiveObjective } 													from '../../model/PrimitiveObjective';


@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/valueChartViewer-component/ValueChartViewer.template.html',
	directives: [ROUTER_DIRECTIVES, ValueChartDirective],
	providers: [
	// Services:
		ChartDataService,
		RenderConfigService,
		ChartUndoRedoService,
		ChangeDetectionService,
		RenderEventsService,
	// Renderers:
		ObjectiveChartRenderer,
		SummaryChartRenderer,
		LabelRenderer,
	// Interactions:
		ReorderObjectivesInteraction,
		ResizeWeightsInteraction,
		SortAlternativesInteraction,
		SetColorsInteraction,

	// Definitions:
		SummaryChartDefinitions,
		ObjectiveChartDefinitions,
		LabelDefinitions]
})
export class ValueChartViewerComponent implements OnInit {

	private PUMP_OFF: string = 'none';
	private ALTERNATIVE_SORT_OFF: string = 'none';

	private RESIZE_NEIGHBOR: string = 'neighbor';
	private RESIZE_SIBLINGS: string = 'siblings';
	private NO_RESIZING: string = 'none';

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
	DETAIL_BOX_HORIZONTAL_SCALE: number = 1.3;

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
		private renderConfigService: RenderConfigService,
		private chartUndoRedoService: ChartUndoRedoService,
		private renderEventsService: RenderEventsService,
		private summaryChartDefinitions: SummaryChartDefinitions,
		private objectiveChartDefinitions: ObjectiveChartDefinitions,
		private labelDefinitions: LabelDefinitions) { }

	ngOnInit() {

		this.sub = this.route.params.subscribe(params => {
		    let valueChartName: string = params['ValueChart']; // (+) converts string 'id' to a number
		    this.detailBoxCurrentTab = this.DETAIL_BOX_ALTERNATIVES_TAB;

		    if (valueChartName.toLowerCase().indexOf('average') !== -1) {
		     	this.valueChart = this.currentUserService.getValueChart().getAverageValueChart();
		     	this.chartType = 'average';
		    } else {
				this.valueChart = this.currentUserService.getValueChart();
				this.chartType = 'normal';
			}

		});

		this.$ = $;

		// Redirect back to Create page if the ValueChart is not initialized.
		if (this.valueChart === undefined) {
			this.router.navigate(['/create']);
			return;
		}

		this.alternatives = this.valueChart.getAlternatives();

		// View Configuration

		this.orientation = 'vertical';
		this.displayScoreFunctions = true;
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
		});

		this.renderEventsService.summaryChartDispatcher.on('Rendering-Over', this.linkAlternativeLabelsToDetailBox);
	}

	ngOnDestroy() {
 		this.sub.unsubscribe();

 		// Destroy the ValueChart
 		$('ValueChart').remove();
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

	// Detail Box:

	expandAlternative(alternative: Alternative): void {
		this.detailBoxAlternativeTab = alternative.getName();

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.alternativeObjectives[index] = objective.getId();
			this.alternativeObjectiveValues[index] = alternative.getObjectiveValue(objective.getId());
		});

		this.resizeDetailBox();
	}

	collapseAlternative(): void {
		this.detailBoxAlternativeTab = 'Alternatives';
		this.resizeDetailBox();
	}


	// Undo and Redo:

	undoChartChange(): void {
		this.chartUndoRedoService.undo();
	}

	redoChartChange(): void {
		this.chartUndoRedoService.redo();
	}

	// View Configuration Options:

	setOrientation(viewOrientation: string): void {
		this.orientation = viewOrientation;

		if (this.orientation === 'horizontal') {
			let detailBoxContainer: any = $('.detail-box')[0];
			let labelOutline: any = $('.' + this.labelDefinitions.OUTLINE)[0];

			detailBoxContainer.style.left = (labelOutline.getBoundingClientRect().width * 1.3) + 'px';
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

	editObjectiveModel(): void {
		// TODO: Implement Editing of Objective Model
	}

	editPreferenceModel(): void {
		// TODO: Implement Editing of Preference Model.
	}




	// Interaction Toggles

	setWeightResizeType(resizeType: string): void {
		this.weightResizeType = resizeType;
	}


	toggleReorderObjectives(newVal: boolean): void {
		this.reorderObjectives = newVal;

		// Turn off all other interactions.
		this.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.pumpWeights = 'none';
		this.setObjectiveColors = false;
	}

	toggleSortAlternatives(sortType: string): void {
		this.sortAlternatives = (this.sortAlternatives === sortType && (sortType === 'objective' || sortType === 'manual')) ? this.ALTERNATIVE_SORT_OFF : sortType;

		if (sortType === 'alphabet' || sortType === 'reset') {
			window.setTimeout(() => {
				this.sortAlternatives = 'none';
			}, 10);
		}

		// Turn off all other interactions.
		this.reorderObjectives = false;
		this.pumpWeights = 'none';
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