/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 12:26:30
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-24 16:21:33
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';
import * as $														from 'jquery';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { LabelRenderer }											from '../renderers/Label.renderer';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

// Model Classes
import { PrimitiveObjective }										from '../model/PrimitiveObjective';



@Injectable()
export class SortAlternativesInteraction {

	SORT_BY_OBJECTIVE: string = 'objective';
	SORT_ALPHABETICALLY: string = 'alphabet';
	SORT_MANUALLY: string = 'manual';
	RESET_SORT: string = 'reset';
	SORT_OFF: string = 'none';

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private chartUndoRedoService: ChartUndoRedoService) { }

	toggleAlternativeSorting(sortingType: string): void {
		// Toggle Dragging to sort objectives:
		if (sortingType === this.SORT_BY_OBJECTIVE) {
			this.sortAlternativesByObjective(true);
		} else if (sortingType === this.SORT_ALPHABETICALLY) {
			console.log('sorting alphabetically');
			this.chartDataService.reorderAllCells(this.chartDataService.generateCellOrderAlphabetically);
		} else if (sortingType === this.SORT_MANUALLY) {

		} else if (sortingType === this.RESET_SORT) {
			this.chartDataService.resetCellOrder();
		} else if (sortingType === this.SORT_OFF) {
			this.sortAlternativesByObjective(false);
		}

	}

	sortAlternativesByObjective(enableSorting: boolean): void {
		var primitiveObjeciveLabels: JQuery = $('.label-primitive-objective');
		primitiveObjeciveLabels.off('dblclick');

		if (enableSorting) {
			primitiveObjeciveLabels.dblclick((eventObject: Event) => {
				eventObject.preventDefault();
				var objectiveToReorderBy: PrimitiveObjective = (<any>eventObject.target).__data__.objective;
				this.chartDataService.reorderAllCells(this.chartDataService.generateCellOrderByObjectiveScore, objectiveToReorderBy);
			});
		}
	}

}