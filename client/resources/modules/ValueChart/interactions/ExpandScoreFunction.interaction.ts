/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:40:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-23 17:54:01
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';
import { Observable }												from 'rxjs/Observable';
import { Subscription } 											from 'rxjs/Subscription';
import '../../utilities/rxjs-operators';

// Import Application Classes:
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';
import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';

// Import Model Classes:
import { User }														from '../../../model/User';
import { ScoreFunction }											from '../../../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../../../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../../../model/DiscreteScoreFunction';
import { Objective }												from '../../../model/Objective';
import { PrimitiveObjective }										from '../../../model/PrimitiveObjective';

import { ScoreFunctionData, DomainElement }							from '../../../types/RendererData.types';
import { ScoreFunctionUpdate, ScoreFunctionConfig }					from '../../../types/RendererData.types';


/*
	This class implements the Expand Score Function Plot ValueChart user interaction. When it is toggled on (via the toggleExpandScoreFunction method),
	double clicking on an embedded ScoreFunction plot (also called utility graph) will expand it into a pop-up window. This pop-up window
	will show a larger version of the plot, and also allows users to view box plots of user score distributions. The ScoreFunction plot will
	have dragging to change user scores enabled if the current ValueChart is individual. Additionally, the pop-up is linked to the main application, and 
	changing user scores in the plot will cause the user scores in the main application to change, and the ValueChart to update.
*/

@Injectable()
export class ExpandScoreFunctionInteraction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private lastRendererUpdate: ScoreFunctionUpdate;

	private SCORE_FUNCTION_ROUTE: string = document.baseURI + 'scoreFunction/plot';		// The route that is matched to the ScoreFunctionViewer. This is the
																					// route that the pop-up window will navigate to when it is opened.

	private WINDOW_OPTIONS: string = 'menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes,width=600,height=600';	// The options string for the pop-up window.

	public popUpRef: any;		// A class field used to reference the active pop-up window.
	
	private clicks: Observable<Event>;
	private onClick: Subscription;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private chartUndoRedoService: ChartUndoRedoService) { }



	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/*
		@param enableExpanding - Whether or not to enable double clicking on a ScoreFunction plot to expand it into a pop-up window.
		@returns {void}
		@description 	Toggles double clicking on a ScoreFunction plot to expand it into a pop-up window. 
	*/
	toggleExpandScoreFunction(enableExpanding: boolean, scoreFunctionPlots: NodeListOf<Element>, lastRendererUpdate: ScoreFunctionUpdate): void {
		this.lastRendererUpdate = lastRendererUpdate;
		// Initialize the observable that is used to detect clicks and notifies handlers.
		this.clicks = Observable.fromEvent(scoreFunctionPlots, 'dblclick');

		if (this.onClick != undefined)
			this.onClick.unsubscribe();

		if (enableExpanding) {
			this.onClick = this.clicks.subscribe(this.expandScoreFunction)
		}

	}

	/*
		@param objective - The objective to display ScoreFunction plots for.
		@returns {void}
		@description	Opens a pop-up window that displays plots of user defined ScoreFunction for the given objective in a larger space. This makes them
						more visible and easier to interact with than the small ScoreFunction plots embedded in a ValueChart. The pop-up also allows users
						to view distributions of user assigned scores via a set of box plots.
	*/
	openPopUp(objective: PrimitiveObjective): void {
		// Pass relevant data to the pop-up by attaching it to the window object. These
		// variables will be accessible to child window via its window.opener field, which is 
		// a reference to this window.
		(<any>window).scoreFunctions = this.lastRendererUpdate.scoreFunctions;
		(<any>window).colors = this.lastRendererUpdate.colors;
		(<any>window).objectiveToPlot = objective;
		(<any>window).chartUndoRedoService = this.chartUndoRedoService;
		(<any>window).enableInteraction = false; // Setting interaction to false wholesale temporarily
														// Need to find a clean way to pass parameter in from ValueChartViewer										

		// Open the pop-up. Note that this.popUpRef is a reference to the child window.
		this.popUpRef = window.open(this.SCORE_FUNCTION_ROUTE,
			'Expanded' + objective.getId() + 'ScoreFunction',
			this.WINDOW_OPTIONS);

		// Save the reference to the child window.
		(<any>window).childWindows = (<any>window).childWindows || {};
		(<any>window).childWindows.scoreFunctionViewer = this.popUpRef;
	}

	// This is defined as a field rather than a method to avoid creating a new scope.
	private expandScoreFunction = (eventObject: Event) => {
		var objective: PrimitiveObjective = <any> d3.select(<any> eventObject.target).datum();
		this.openPopUp(objective);
	}
}