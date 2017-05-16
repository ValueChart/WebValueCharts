/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 15:53:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-16 09:50:30
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';

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

	public valueChartRecord: ValueChart;

	// Public flags that can be set to notify the ValueChartDirective about changes.
	public objectiveOrderChanged: boolean;							// whether the objective order been changed or not. Set this to be true when you do something that changes the objective order.
	public alternativeOrderChanged: boolean ;						// Whether the alternative order been changed or not. Set this to be true when you do something that changes the alternative order.
	// public colorsHaveChanged: boolean;								// Whether the objective colors have been changed or not. Set this to be true when you do something that changes the objective colors.

	// Old input values to the ValueChartDirective. Used for comparison purposes.
	public viewConfigRecord: ViewConfig = <any>{};					// Old values of the view config. Its fields should equal those of the viewConfig object in RendererConfigUtility unless a change has taken place.
	public interactionConfigRecord: InteractionConfig = <any>{};	// Old values of the interaction config. Its fields should equal those of the interactionConfig object in ValueChartDirective unless a change has taken place.
	public widthRecord: number;										// The old width. Its should equal the width in ValueChartDirective unless a change has taken place.
	public heightRecord: number;									// The old height. Its should equal the height in ValueChartDirective unless a change has taken place.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description	Used for Angular's dependency injection and initializing event listeners for the chartUndoRedoService.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this service when it is injected.
	*/
	constructor(
		private chartUndoRedoService: ChartUndoRedoService) {
		// Listen to undo-redo events notifying of changes to the alternative ordering.
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_ALTERNATIVE_ORDER_CHANGED, () => { this.alternativeOrderChanged = true; });
		// Listen to undo-redo events notifying of changes to the objective ordering.
		this.chartUndoRedoService.undoRedoDispatcher.on(this.chartUndoRedoService.SET_OBJECTIVES_CHANGED, () => { this.objectiveOrderChanged = true; });
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// TODO <@aaron>: Add method signature.

	/*
		@param valueChart - 
		@returns {void}
		@description	
	*/
	startChangeDetection(valueChart: ValueChart, width: number, height: number, viewConfig: ViewConfig, interactionConfig: InteractionConfig): void {
		this.valueChartRecord = _.cloneDeep(valueChart);
		this.widthRecord = _.clone(width);
		this.heightRecord = _.clone(height);

		this.viewConfigRecord = _.cloneDeep(viewConfig);
		this.interactionConfigRecord = _.cloneDeep(interactionConfig);
	}

	

	// TODO <@aaron>: Add method signature.

	/*
		@param 
		@returns {void}
		@description	
	*/
	detectChanges(valueChart: ValueChart, viewConfig: ViewConfig, interactionConfig: InteractionConfig): boolean {
		var valueChartChanged: boolean =  !_.isEqual(valueChart, this.valueChartRecord);
		var renderDataChanged: boolean = this.alternativeOrderChanged || this.objectiveOrderChanged;
		var viewOrientationChanged: boolean = this.viewConfigRecord.viewOrientation !== viewConfig.viewOrientation;
		var scoreFunctionDisplayChanged: boolean = this.viewConfigRecord.displayScoreFunctions !== viewConfig.displayScoreFunctions;

		this.valueChartRecord = _.cloneDeep(valueChart);
		this.alternativeOrderChanged = false;
		this.objectiveOrderChanged = false;
		this.viewConfigRecord.viewOrientation = viewConfig.viewOrientation;

		return valueChartChanged || renderDataChanged || viewOrientationChanged || scoreFunctionDisplayChanged;
	}

	detectWidthHeightChanges(width: number, height: number) {
		var widthHeightChanges: boolean = this.widthRecord !== width || this.heightRecord !== height;

		this.widthRecord = _.clone(width);
		this.heightRecord = _.clone(height);

		return widthHeightChanges;
	}

	detectViewConfigChanges(viewConfig: ViewConfig): boolean {
		var viewConfigChanged: boolean = !_.isEqual(this.viewConfigRecord, viewConfig);
		this.viewConfigRecord = _.cloneDeep(viewConfig);

		return viewConfigChanged;
	}

	detectInteractionConfigChanges(interactionConfig: InteractionConfig): boolean {
		var interactionConfigChanged: boolean = !_.isEqual(this.interactionConfigRecord, interactionConfig);
		this.interactionConfigRecord = _.cloneDeep(interactionConfig);

		return interactionConfigChanged;
	}




}