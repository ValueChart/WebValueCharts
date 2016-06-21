/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-21 11:59:00
*/

import { Component }				from '@angular/core';
import { OnInit }					from '@angular/core';

// JQuery
import * as $						from 'jquery';

// Application classes
import { ValueChartDirective }		from '../../directives/ValueChart.directive';
import { CurrentUserService }		from '../../services/CurrentUser.service';

// Model Classes
import { ValueChart } 				from '../../model/ValueChart';
import { Alternative } 				from '../../model/Alternative';
import { PrimitiveObjective } 		from '../../model/PrimitiveObjective';


@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/valueChartViewer-component/ValueChartViewer.template.html',
	directives: [ValueChartDirective]
})
export class ValueChartViewerComponent implements OnInit {

	private PUMPOFF: string = 'none';

	valueChart: ValueChart;

	// ValueChart Display Configuration Options:
	orientation: string;
	displayScoreFunctions: boolean;
	displayDomainValues: boolean;
	displayScales: boolean;
	displayTotalScores: boolean;
	displayScoreFunctionValueLabels: boolean;

	sortObjectives: boolean;
	sortAlternatives: boolean;
	pumpWeights: string;

	detailBoxHeader: string;
	alternativeObjectives: string[];
	alternativeObjectiveValues: (string | number)[];

	$: JQueryStatic;
	
	constructor(private currentUserService: CurrentUserService) { }

	ngOnInit() {
		this.valueChart = this.currentUserService.getValueChart();
		this.orientation = 'vertical';
		this.displayScoreFunctions = true;
		this.displayTotalScores = true;
		this.displayScales = false;
		this.displayDomainValues = false;
		this.displayScoreFunctionValueLabels = false;

		this.sortObjectives = false;
		this.sortAlternatives = false;
		this.pumpWeights = this.PUMPOFF;

		this.detailBoxHeader = 'Alternatives';
		this.alternativeObjectives = [];
		this.alternativeObjectiveValues = [];

		this.$ = $;

		$(window).resize((eventObjective: Event) => {
			// When the window is resized, set the height of the detail box to be 90% of the height of summary chart.
			var alternativeDetailBox: any = $('#alternative-detail-box')[0];
			var summaryOutline: any = $('.summary-outline')[0];
			alternativeDetailBox.style.height = (summaryOutline.getBoundingClientRect().height - 50) + 'px';
			alternativeDetailBox.style.width = (summaryOutline.getBoundingClientRect().width - 25) + 'px';

			if (this.orientation === 'horizontal') {
				let detailBoxContainer: any = $('.detail-box')[0]; 
				let labelOutline: any = $('.label-outline')[0];

				detailBoxContainer.style.left = (labelOutline.getBoundingClientRect().width * 1.3) + 'px';
			}
		});
	}

	// Detail Box:

	expandAlternative(alternative: Alternative): void {
		this.detailBoxHeader = alternative.getName();

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.alternativeObjectives[index] = objective.getName();
			this.alternativeObjectiveValues[index] = alternative.getObjectiveValue(objective.getName());
		});
	}

	collapseAlternative(): void {
		this.detailBoxHeader = 'Alternatives';
	}



	// Configuration Options:

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

	toggleSortObjectives(newVal: boolean): void {
		this.sortObjectives = newVal;
		this.sortAlternatives = false;
		this.pumpWeights = 'none';
	}

	toggleSortAlternatives(newVal: boolean): void {
		this.sortAlternatives = newVal;
		this.sortObjectives = false;
		this.pumpWeights = 'none';
	}

	setPumpType(pumpType: string): void {
		this.pumpWeights = (this.pumpWeights === pumpType) ? 'none' : pumpType; 
		this.sortAlternatives = false;
		this.sortObjectives = false;
	}



}