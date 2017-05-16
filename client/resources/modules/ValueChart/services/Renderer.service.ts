/*
* @Author: aaronpmishkin
* @Date:   2017-05-10 22:24:20
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-11 17:20:59
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';


// Import Model Classes:
import { User }														from '../../../model/User';
import { ValueChart }												from '../../../model/ValueChart';

// Import Types
import { ViewConfig }												from '../../../types/Config.types';




@Injectable()
export class RendererService {


	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// This list is drawn from Kelly's 22 Colors of Maximum Contrast. White and Black, the first two colors, have been omitted. See: http://www.iscc.org/pdf/PC54_1724_001.pdf
	public kellyColors: string[] = ['#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26']


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() {	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@returns {void}
		@description	Assigns a color to every user in the ValueChart that does not yet have a color. Note that users that join the ValueChart
						do not have colors, so this method must be called whenever a new user joins.

	*/
	initUserColors(valueChart: ValueChart): void {
		if (valueChart.isIndividual())
			return;

		// Assign a color to each user without one in the ValueChart
		valueChart.getUsers().forEach((user: User, index: number) => {
			if (!user.color || user.color == "#000000") {
				user.color = this.kellyColors[index];
			}
		});
	}

	/*
		@param viewOrientation - the viewOrientation of the desired transform.
		@param coordinateOneAmount - the amount of translation in the coordinateOne direction. Note what direction this is depends on the orientation.
		@param coordinateTwoAmount - the amount of translation in the coordinateTwo direction. Note what direction this is depends on the orientation.
		@returns a correctly formatted translate string for a transform attribute.
		@description	Generate the correct translation for a transform attribute of an SVG element depending on the current ValueChart orientation.
						This method allows transformations to be generated properly while using the coordinateOne and coordinateTwo fields instead of 
						directly using x and y.
	*/
	generateTransformTranslation(viewOrientation: string, coordinateOneAmount: number, coordinateTwoAmount: number): string {
		if (viewOrientation === 'vertical') {
			return 'translate(' + coordinateOneAmount + ',' + coordinateTwoAmount + ')';
		} else {
			return 'translate(' + coordinateTwoAmount + ',' + coordinateOneAmount + ')';
		}
	}

	/*
		@param previousTransform - the transformation that is to be incremented by deltaCoordinateOne and deltaCoordinateTwo.
		@param deltaCoordinateOne - the amount to increase the translation in the coordinateOne direction.
		@param deltaCoordinateTwo - the amount to increase the translation in the coordinateTwo direction.
		@returns a correctly formatted and incremented translate string for a transform attribute.
		@description	Properly increment an existing transformation by deltaCoordinateOne and deltaCoordinateTwo while taking into account the current 
						orientation of the ValueChart.
	*/
	incrementTransform(viewConfig: ViewConfig, previousTransform: string, deltaCoordinateOne: number, deltaCoordinateTwo: number): string {
		var xTransform: number
		var yTransform: number

		if (previousTransform) {
			var commaIndex: number = previousTransform.indexOf(',');
			// Pull the current transform coordinates form the string. + is a quick operation that converts them into numbers.
			xTransform = +previousTransform.substring(previousTransform.indexOf('(') + 1, commaIndex);
			yTransform = +previousTransform.substring(commaIndex + 1, previousTransform.indexOf(')'));
		} else {
			xTransform = 0;
			yTransform = 0;
		}


		if (viewConfig.viewOrientation === 'vertical') {
			return 'translate(' + (xTransform + deltaCoordinateOne) + ',' + (yTransform + deltaCoordinateTwo) + ')';
		} else {
			return 'translate(' + (xTransform + deltaCoordinateTwo) + ',' + (yTransform + deltaCoordinateOne) + ')';
		}
	}


}