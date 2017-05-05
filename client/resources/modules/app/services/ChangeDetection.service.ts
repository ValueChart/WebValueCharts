/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 15:53:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-04 22:00:24
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';
import { KeyValueDiffers, KeyValueDiffer }										from '@angular/core';

// Import libraries:
import * as _ 																	from 'lodash';


// Import Application Classes:
import { ChartUndoRedoService }													from './ChartUndoRedo.service';

// Import Model Classes: 
import { ValueChart } 															from '../../../model/ValueChart';
import { ScoreFunction } 														from '../../../model/ScoreFunction';
import { User }																	from '../../../model/User';

// Import Types:
import { InteractionConfig, ViewConfig }										from '../../../types/Config.types';

@Injectable()
export class ChangeDetectionService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public previousValueChart: ValueChart;

	// Public flags that can be set to notify the ValueChartDirective about changes.
	public objectiveOrderChanged: boolean;						// whether the objective order been changed or not. Set this to be true when you do something that changes the objective order.
	public alternativeOrderChanged: boolean;					// Whether the alternative order been changed or not. Set this to be true when you do something that changes the alternative order.
	public colorsHaveChanged: boolean;							// Whether the objective colors have been changed or not. Set this to be true when you do something that changes the objective colors.

	// Old input values to the ValueChartDirective. Used for comparison purposes.
	public previousViewConfig: ViewConfig = <any>{};				// Old values of the view config. Its fields should equal those of the viewConfig object in RenderConfigService unless a change has taken place.
	public previousInteractionConfig: InteractionConfig = <any>{};	// Old values of the interaction config. Its fields should equal those of the interactionConfig object in ValueChartDirective unless a change has taken place.
	public previousWidth: number;									// The old width. Its should equal the width in ValueChartDirective unless a change has taken place.
	public previousHeight: number;									// The old height. Its should equal the height in ValueChartDirective unless a change has taken place.
	public previousNumUsers: number;								// The old number of users. Its should equal the number of users in the ValueChart in the ValueChartDirective unless a change has taken place.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description	Used for Angular's dependency injection and initializing event listeners for the chartUndoRedoService.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this service when it is injected.
	*/
	constructor(
		private objectDiffers: KeyValueDiffers,
		private chartUndoRedoService: ChartUndoRedoService) {
		// Listen to undo-redo events notifying of changes to the alternative ordering.
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_ALTERNATIVE_ORDER_CHANGED, () => { this.alternativeOrderChanged = true; });
		// Listen to undo-redo events notifying of changes to the objective ordering.
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_OBJECTIVES_CHANGED, () => { this.objectiveOrderChanged = true; });
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param valueChart - The valueChart that differ classes should be initialized for. This is usually the ValueChart input the ValueChartDirective.
		@returns {void}
		@description	Initialize differ classes for use in detecting changes to a ValueChart. This should be called whenever a new ValueChart is input to
						the ValueChartDirective, or when the number of users changes. 
	*/
	initChangeDetection(valueChart: ValueChart, chartWidth: number, chartHeight: number, viewConfig: ViewConfig, interactionConfig: InteractionConfig): void {
		this.previousValueChart = _.cloneDeep(valueChart);
		var users = valueChart.getUsers();
		this.previousNumUsers = users.length;

		// Init change detection for the view configuration:
		this.previousWidth = chartWidth;
		this.previousHeight = chartHeight;

		this.previousViewConfig = _.cloneDeep(viewConfig);
		this.previousInteractionConfig = _.cloneDeep(interactionConfig);
	}

}