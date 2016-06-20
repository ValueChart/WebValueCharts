/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-20 14:37:28
*/

import { Component }				from '@angular/core';
import { OnInit }					from '@angular/core';

// Application classes
import { ValueChartDirective }		from '../../directives/ValueChart.directive';
import { CurrentUserService }		from '../../services/CurrentUser.service';

// Model Classes
import { ValueChart } 				from '../../model/ValueChart';

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
	}

	setOrientation(viewOrientation: string): void{
		this.orientation = viewOrientation;
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