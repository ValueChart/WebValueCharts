/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-27 22:03:20
*/

import { Component }															from '@angular/core';
import { OnInit }																from '@angular/core';
import { Router }																from '@angular/router';

// JQuery
import * as $																	from 'jquery';

// Application classes
import { CreateComponent }														from '../create-component/Create.component';

import { CurrentUserService }													from '../../services/CurrentUser.service';

import { ValueChartDirective }													from '../../directives/ValueChart.directive';

import { ChartDataService }														from '../../services/ChartData.service';
import { RenderConfigService }													from '../../services/RenderConfig.service';
import { ChartUndoRedoService }													from '../../services/ChartUndoRedo.service';
import { ChangeDetectionService }												from '../../services/ChangeDetection.service';

import { ObjectiveChartRenderer }												from '../../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }													from '../../renderers/SummaryChart.renderer';
import { LabelRenderer }														from '../../renderers/Label.renderer';

import { ReorderObjectivesInteraction }											from '../../interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }												from '../../interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }											from '../../interactions/SortAlternatives.interaction';
import { SetColorsInteraction }													from '../../interactions/SetColors.interaction';

// Model Classes
import { ValueChart } 															from '../../model/ValueChart';
import { Alternative } 															from '../../model/Alternative';
import { PrimitiveObjective } 													from '../../model/PrimitiveObjective';


@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/valueChartViewer-component/ValueChartViewer.template.html',
	directives: [ValueChartDirective],
	providers: [
	// Services:
		ChartDataService,
		RenderConfigService,
		ChartUndoRedoService,
		ChangeDetectionService,
	// Renderers:
		ObjectiveChartRenderer,
		SummaryChartRenderer,
		LabelRenderer,
	// Interactions:
		ReorderObjectivesInteraction,
		ResizeWeightsInteraction,
		SortAlternativesInteraction,
		SetColorsInteraction]
})
export class ValueChartViewerComponent implements OnInit {

	private PUMP_OFF: string = 'none';
	private ALTERNATIVE_SORT_OFF: string = 'none';

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
	reorderObjectives: boolean;
	sortAlternatives: string;
	pumpWeights: string;
	setObjectiveColors: boolean;

	// Detail Box 
	detailBoxHeader: string;
	alternativeObjectives: string[];
	alternativeObjectiveValues: (string | number)[];

	// Save Jquery as a field of the class so that it is exposed to the template.
	$: JQueryStatic;
	
	constructor(
		private router: Router,
		private currentUserService: CurrentUserService,
		private chartUndoRedoService: ChartUndoRedoService) { }

	ngOnInit() {
		this.valueChart = this.currentUserService.getValueChart();

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

		this.reorderObjectives = false;
		this.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.pumpWeights = this.PUMP_OFF;
		this.setObjectiveColors = false;

		this.detailBoxHeader = 'Alternatives';
		this.alternativeObjectives = [];
		this.alternativeObjectiveValues = [];

		this.resizeDetailBox();

		// Resize the alternative detail box whenever the window is resized.
		$(window).resize((eventObjective: Event) => {
			this.resizeDetailBox();
		});
	}

	resizeDetailBox(): void {
		// When the window is resized, set the height of the detail box to be 50px less than the height of summary chart.
		var alternativeDetailBox: any = $('#alternative-detail-box')[0];
		var summaryOutline: any = $('.summary-outline')[0];
		if (summaryOutline) {
			alternativeDetailBox.style.height = (summaryOutline.getBoundingClientRect().height - 50) + 'px';
			alternativeDetailBox.style.width = (summaryOutline.getBoundingClientRect().width - 25) + 'px';
		}

		if (this.orientation === 'horizontal') {
			let detailBoxContainer: any = $('.detail-box')[0];
			let labelOutline: any = $('.label-outline')[0];
			if (labelOutline) {
				detailBoxContainer.style.left = (labelOutline.getBoundingClientRect().width * 1.3) + 'px';
			}
		}
	}

	// Detail Box:

	expandAlternative(alternative: Alternative): void {
		this.detailBoxHeader = alternative.getName();

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.alternativeObjectives[index] = objective.getName();
			this.alternativeObjectiveValues[index] = alternative.getObjectiveValue(objective.getName());
		});

		this.resizeDetailBox();
	}

	collapseAlternative(): void {
		this.detailBoxHeader = 'Alternatives';
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

	setOrientation(viewOrientation: string): void{
		this.orientation = viewOrientation;

		if (this.orientation === 'horizontal') {
			let detailBoxContainer: any = $('.detail-box')[0];
			let labelOutline: any = $('.label-outline')[0];

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