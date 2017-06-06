/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 15:53:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-06 15:04:53
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';

// Import libraries:
import * as _ 																	from 'lodash';

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

	// Copies of the input values to the ValueChartDirective. Used for comparison purposes.
	public valueChartRecord: ValueChart;							// Copy of the previous ValueChart. Its should be the same as the ValueChart input to the ValueChartDirective unless a change has taken place.
	public viewConfigRecord: ViewConfig = <any>{};					// Copy of the previous view config. Its fields should equal those of the viewConfig object in RendererConfigUtility unless a change has taken place.
	public interactionConfigRecord: InteractionConfig = <any>{};	// Copy of the previous interaction config. Its fields should equal those of the interactionConfig object in ValueChartDirective unless a change has taken place.
	public widthRecord: number;										// Copy of the previous width. It should equal the width in ValueChartDirective unless a change has taken place.
	public heightRecord: number;									// Copy of the previous height. It should equal the height in ValueChartDirective unless a change has taken place.
	public usersToDisplayRecord: User[];							// Copy of the previous list of users (by username) to be hidden.
	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description	Used for Angular's dependency injection. This constructor should NOT be called manually. Angular will automatically handle the construction of this service when it is injected.
	*/
	constructor() { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param valueChart - the ValueChart to be copied for use in future comparisons.
		@param width - the width of the area in which to render the ValueChart; to be copied for future comparisons.
		@param height - the width of the area in which to render the ValueChart; to be copied for future comparisons.
		@param viewConfig - the viewConfig object submitted to the ValueChartDirective; to be copied for future comparisons.
		@param interactionConfig - the viewConfig object submitted to the ValueChartDirective; to be copied for future comparisons.
		@returns {void}
		@description	Creates deep copies of the inputs to the ValueChartDirective and saves them into class fields. It should be used to initiate
						change detection and must be called before the change detection methods in this class. 
	*/
	startChangeDetection(valueChart: ValueChart, width: number, height: number, viewConfig: ViewConfig, interactionConfig: InteractionConfig, usersToDisplay: User[]): void {
		this.valueChartRecord = _.cloneDeep(valueChart);
		this.widthRecord = _.clone(width);
		this.heightRecord = _.clone(height);

		this.viewConfigRecord = _.cloneDeep(viewConfig);
		this.interactionConfigRecord = _.cloneDeep(interactionConfig);
	
		this.usersToDisplayRecord = _.cloneDeep(usersToDisplay);
	}

	

	// TODO <@aaron>: Add method signature.

	/*
		@param valueChart - the current ValueChart to check for changes. 
		@param viewConfig - the current viewConfig to check for changes.
		@param interactionConfig - the current interactionConfig to check for changes.
		@returns {boolean} - whether or not changes have occurred.
		@description	Deep compares the method inputs against saved records to determine if there are any changes since the last time detectChanges was called (or since startChangeDetection)
						if detectChanges has not yet been called. startChangeDetection should be used to initialize change detection before using this method.
						detectChanges should be used to detect changes that require an entire re-rendering of the ValueChart. 
	*/
	detectChanges(valueChart: ValueChart, viewConfig: ViewConfig, interactionConfig: InteractionConfig, usersToDisplay: User[], renderRequired: boolean): boolean {
		var valueChartChanged: boolean =  !_.isEqual(valueChart, this.valueChartRecord);
		var viewOrientationChanged: boolean = this.viewConfigRecord.viewOrientation !== viewConfig.viewOrientation;
		var scoreFunctionDisplayChanged: boolean = this.viewConfigRecord.displayScoreFunctions !== viewConfig.displayScoreFunctions;
		var usersToDisplayChanged: boolean = usersToDisplay.length !== this.usersToDisplayRecord.length;

		this.valueChartRecord = _.cloneDeep(valueChart);
		this.usersToDisplayRecord = _.cloneDeep(usersToDisplay);

		return valueChartChanged || viewOrientationChanged || scoreFunctionDisplayChanged || usersToDisplayChanged || renderRequired;
	}

	/*
		@param width - the current width to be checked for changes.
		@param height - the current height to be checked for changes.
		@returns {boolean} - whether or not changes have occurred.
		@description 	Compares the current width and height against saved records to determined if they have changed since the last comparison.
						This method is separate from detectChanges because width/height changes must be handled differently form changes that simply require re-rendering.
	*/
	detectWidthHeightChanges(width: number, height: number): boolean {
		var widthHeightChanges: boolean = this.widthRecord !== width || this.heightRecord !== height;

		this.widthRecord = _.clone(width);
		this.heightRecord = _.clone(height);

		return widthHeightChanges;
	}

	/*
		@param viewConfig -  the current viewConfig object to check for changes.
		@returns {boolean} - whether or not changes have occurred.
		@description	Compares the current veiwConfig object against a saved record to determine if changes have occurred.
	*/
	detectViewConfigChanges(viewConfig: ViewConfig): boolean {
		var viewConfigChanged: boolean = !_.isEqual(this.viewConfigRecord, viewConfig);
		this.viewConfigRecord = _.cloneDeep(viewConfig);

		return viewConfigChanged;
	}

	/*
		@param interactionConfig - the current interactionConfig object to check for changes.
		@returns {boolean} - whether or not changes have occurred.
		@description	Compares the current interactionConfig object against a saved record to determine if changes have occurred.
	*/
	detectInteractionConfigChanges(interactionConfig: InteractionConfig): boolean {
		var interactionConfigChanged: boolean = !_.isEqual(this.interactionConfigRecord, interactionConfig);
		this.interactionConfigRecord = _.cloneDeep(interactionConfig);

		return interactionConfigChanged;
	}




}