/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:00:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-17 15:14:00
*/

import { Component }				from '@angular/core';
import { OnInit }					from '@angular/core';

// Application classes
import { ValueChartDirective }		from '../../directives/ValueChart.directive';
import { ChartDataService }			from '../../services/ChartData.service';

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
	pumpWeights: string;
	pumpType: string;
	
	constructor(private chartDataService: ChartDataService) { }

	ngOnInit() {
		this.valueChart = this.chartDataService.getValueChart();
		this.orientation = 'vertical';
		this.displayScoreFunctions = true;
		this.displayTotalScores = true;
		this.displayScales = false;
		this.displayDomainValues = false;
		this.displayScoreFunctionValueLabels = false;

		this.pumpWeights = this.PUMPOFF;
		this.sortObjectives = false;
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

	toggleSort(newVal: boolean): void {
		this.sortObjectives = newVal;
		if (this.sortObjectives) {
			this.pumpWeights = this.PUMPOFF;
		}
	}

	togglePump(pumpType: string): void {
		if (this.pumpWeights ===this.PUMPOFF) {
			this.pumpWeights = pumpType;
			this.sortObjectives = false;
		} else {
			this.pumpWeights = this.PUMPOFF;
		}
	}



}