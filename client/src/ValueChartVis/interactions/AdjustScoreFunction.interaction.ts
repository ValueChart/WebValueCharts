/*
* @Author: aaronpmishkin
* @Date:   2017-05-11 15:57:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-18 13:22:30
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';

// Import Application Classes
import { ChartUndoRedoService }										from '../services';

// Import Types
import { DomainElement }											from '../../types';
import { ScoreFunctionUpdate, ScoreFunctionConfig }					from '../../types';
import { ChartOrientation }											from '../../types';

/*
	This class contains all the logic for adjusting user ScoreFunctions by implementing interactions for the ScoreFunction plots. 
	For discrete ScoreFunction plots, the tops of the bars in the bar chart are made dragable when the interaction is turned on.
	This allows them to be moved up and down and thus permits adjusting the discrete score function.
	For continuous ScoreFunction plots, the so-called "knots" become tragable. This allows the user to create/adjust a piecewise linear function
	that expresses their scorefunction.
*/


@Injectable()
export class AdjustScoreFunctionInteraction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public lastRendererUpdate: ScoreFunctionUpdate;				// The most recent ScoreFunctionUpdate object.
	public adjustScoreFunctions: boolean;						// Whether or not the ScoreFunctions should be adjustable/interactive.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private chartUndoRedoService: ChartUndoRedoService) {}

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/*
		@param adjustScoreFunctions - Whether dragging to alter a user's score function should be enabled. 
		@param chartElements - The selection of chart elements that will become (or stop being) dragable depending on the value of adjustScoreFunctions.
		@param rendererUpdate - The most recent ScoreFunctionUpdate object. 
		@returns {void}
		@description	This method toggles the interaction that allows clicking and dragging on scatter plot points to alter a user's score function.
	*/
	toggleDragToChangeScore(adjustScoreFunctions: boolean, chartElement: d3.Selection<any, any, any, any>, rendererUpdate: ScoreFunctionUpdate): void {
		this.lastRendererUpdate = rendererUpdate;
		this.adjustScoreFunctions = adjustScoreFunctions;

		var dragToResizeScores = d3.drag();

		if (adjustScoreFunctions) {
			dragToResizeScores.on('start', (d: DomainElement, i: number) => {
				// Save the current state of the ScoreFunction.
				this.chartUndoRedoService.saveScoreFunctionRecord(d.scoreFunction, this.lastRendererUpdate.objective);
			});

			dragToResizeScores.on('drag', this.handleDrag);
		}

		// Set the drag listeners on the point elements.
		chartElement.call(dragToResizeScores);

		// Set the cursor style for the points to indicate that they are drag-able (if dragging was enabled).
		chartElement.style('cursor', () => {
			if (!adjustScoreFunctions) {
				return 'auto';
			} else {
				return (this.lastRendererUpdate.viewOrientation === ChartOrientation.Vertical) ? 'ns-resize' : 'ew-resize';
			}
		});
	}


	handleDrag = (d: DomainElement, i: number) => {
		var score: number;
		// Convert the y position of the mouse into a score by using the inverse of the scale used to convert scores into y positions:
		if (this.lastRendererUpdate.viewOrientation === ChartOrientation.Vertical) {
			// Subtract the event y form the offset to obtain the y value measured from the bottom of the plot.
			score = this.lastRendererUpdate.heightScale.invert(this.lastRendererUpdate.rendererConfig.independentAxisCoordinateTwo - (<any>d3.event)[this.lastRendererUpdate.rendererConfig.coordinateTwo]);
		} else {
			// No need to do anything with offsets here because x is already left to right.
			score = this.lastRendererUpdate.heightScale.invert((<any>d3.event)[this.lastRendererUpdate.rendererConfig.coordinateTwo]);
		}
		score = Math.max(0, Math.min(score, 1)); // Normalize the score to be between 0 and 1.

		d.scoreFunction.setElementScore(<number>d.element, score);
	}

}





