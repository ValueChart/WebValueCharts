/*
* @Author: aaronpmishkin
* @Date:   2017-05-11 15:57:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-25 16:16:15
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';

// Import Application Classes
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

// Import Types
import { DomainElement }											from '../../../types/RendererData.types';
import { ScoreFunctionUpdate, ScoreFunctionConfig }					from '../../../types/RendererData.types';



@Injectable()
export class AdjustScoreFunctionInteraction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public lastRendererUpdate: ScoreFunctionUpdate;
	public adjustScoreFunctions: boolean;

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
		@param enableDragging - Whether dragging to alter a user's score function should be enabled. 
		@param objective - The objective for which the score function plot is being rendered.
		@param viewOrientation - The orientation of the score function plot. Must be either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This method toggles the interaction that allows clicking and dragging on scatter plot points to alter a user's score function.
	*/
	toggleDragToChangeScore(adjustScoreFunctions: boolean, selection: d3.Selection<any, any, any, any>, lastRendererUpdate: ScoreFunctionUpdate): void {
		this.adjustScoreFunctions = adjustScoreFunctions;

		this.lastRendererUpdate = lastRendererUpdate;

		var dragToResizeScores = d3.drag();

		if (adjustScoreFunctions) {
			dragToResizeScores.on('start', (d: DomainElement, i: number) => {
				// Save the current state of the ScoreFunction.
				this.chartUndoRedoService.saveScoreFunctionRecord(d.scoreFunction, lastRendererUpdate.objective);
			});

			dragToResizeScores.on('drag', this.handleDrag);
		}

		// Set the drag listeners on the point elements.
		selection.call(dragToResizeScores);

		// Set the cursor style for the points to indicate that they are drag-able (if dragging was enabled).
		selection.style('cursor', () => {
			if (!adjustScoreFunctions) {
				return 'auto';
			} else {
				return (lastRendererUpdate.viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			}
		});
	}


	handleDrag = (d: DomainElement, i: number) => {
		var score: number;
		// Convert the y position of the mouse into a score by using the inverse of the scale used to convert scores into y positions:
		if (this.lastRendererUpdate.viewOrientation === 'vertical') {
			// Subtract the event y form the offset to obtain the y value measured from the bottom of the plot.
			score = this.lastRendererUpdate.heightScale.invert(this.lastRendererUpdate.rendererConfig.domainAxisCoordinateTwo - (<any>d3.event)[this.lastRendererUpdate.rendererConfig.coordinateTwo]);
		} else {
			// No need to do anything with offsets here because x is already left to right.
			score = this.lastRendererUpdate.heightScale.invert((<any>d3.event)[this.lastRendererUpdate.rendererConfig.coordinateTwo]);
		}
		score = Math.max(0, Math.min(score, 1)); // Normalize the score to be between 0 and 1.

		d.scoreFunction.setElementScore(<number>d.element, score);
	}

}





