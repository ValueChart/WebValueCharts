/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 17:36:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 21:41:37
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';

// Import Application Classes:
import { ChangeDetectionService }												from '../services/ChangeDetection.service';
import { LabelDefinitions }														from '../services/LabelDefinitions.service';

// Import Model Classes: 
import { PrimitiveObjective }													from '../../../model/PrimitiveObjective';

/*
	This class implements the Set Objective Colors ValueChart user interaction. When it is enabled, a user can click on a PrimitiveObjective's
	label in the label area to open a color picker. The color picker can be used to change the selection objective's color, with the ValueChart
	re-rendering to be whatever color is currently selected. 
*/

@Injectable()
export class SetObjectiveColorsInteraction {

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor(
		private changeDetectionService: ChangeDetectionService,
		private labelDefinitions: LabelDefinitions) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================
	
	/*
		@param enableExpanding - Whether or not to enable clicking on a PrimitiveObjective's label in the label area to open a color picker that can be used to
								 change that objective's color.
		@returns {void}
		@description 	Toggles clicking on a PrimitiveObjective's label in the label area to open a color picker that can be used to
						change that objective's color. Only one objective's color can be modified at one time using the color picker.
	*/
	toggleSettingObjectiveColors(setObjectiveColors: boolean): void {
		var primitiveObjectiveLabels: JQuery = $('.' + this.labelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);
		primitiveObjectiveLabels.off('click');	// Remove any old click listeners from the PrimitiveObjective labels.
		
		// Attach the click listener to the labels if setObjectiveColors is true. The body of this listener will be executed whenever a user
		// clicks on one of the labels.
		if (setObjectiveColors) {
			primitiveObjectiveLabels.click((eventObject: Event) => {
				var targetObjective: PrimitiveObjective = (<any> d3.select(<any> eventObject.target).datum()).objective;
				var colorPicker = $('#primitiveObjective-color-picker');
				
				colorPicker.off('change');	// Remove any old listeners from the color picker.

				// Attach a listener to the change event that fires when the value of the color picker changes. Note that this event fires
				// whenever the value of the color picker changes, NOT when the user makes a decision and closes the color picker.
				// The body of this listener is where the objective's color is set.
				colorPicker.change((e: Event) => {
					var color: string = (<any>e.target).value;
					targetObjective.setColor(color);
					this.changeDetectionService.colorsHaveChanged = true;
				});

				colorPicker.click(); // Open the color picker by programmatically clicking on it.
			});
		}
	}

}