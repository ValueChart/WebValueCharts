/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 17:36:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-30 14:44:10
*/

import { Injectable } 															from '@angular/core';

// d3
import * as d3 																	from 'd3';

// Application Classes:
import { ChangeDetectionService }												from '../services/ChangeDetection.service';

// Model Classes: 
import { PrimitiveObjective }													from '../model/PrimitiveObjective';



@Injectable()
export class SetColorsInteraction {

	constructor(private changeDetectionService: ChangeDetectionService) { } 

	toggleSettingObjectiveColors(setObjectiveColors: boolean): void {
		var primitiveObjectiveLabels: JQuery = $('.label-primitive-objective');
		primitiveObjectiveLabels.off('click');
		if (setObjectiveColors) {
			primitiveObjectiveLabels.click((eventObject: Event) => {
				var targetObjective: PrimitiveObjective = d3.select(eventObject.target).datum().objective;
				var colorPicker = $('#primitiveObjective-color-picker');
				colorPicker.off('change');
				
				colorPicker.change((e: Event) => {
					var color: string = (<any> e.target).value;
					targetObjective.setColor(color);
					this.changeDetectionService.colorsHaveChanged = true;
				});

				colorPicker.click();
			});
		}
	}

}