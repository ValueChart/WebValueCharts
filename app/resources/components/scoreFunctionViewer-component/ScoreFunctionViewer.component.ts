/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-19 09:37:10
*/

import { Component }													from '@angular/core';
import { OnInit, OnDestroy, DoCheck }									from '@angular/core';
import { NgZone }														from '@angular/core';

// d3
import * as d3 															from 'd3';
	
// Application classes:
import { ScoreFunctionRenderer }										from '../../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }								from '../../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }								from '../../renderers/ContinuousScoreFunction.renderer';
import { ChartDataService }												from '../../services/ChartData.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';

// Model Classes:
import { ScoreFunction }												from '../../model/ScoreFunction';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { User }															from '../../model/User';
import { UserDomainElements, DomainElement }							from '../../model/ChartDataTypes';


@Component({
	selector: 'ScoreFunction',
	templateUrl: './app/resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.template.html',
	directives: []
})
export class ScoreFunctionViewerComponent implements OnInit, DoCheck, OnDestroy {

	private scoreFunctionPlotContainer: d3.Selection<any>;

	private users: User[];
	private objectiveToDisplay: PrimitiveObjective;

	private chartDataService: ChartDataService;
	private chartUndoRedoService: ChartUndoRedoService;

	private scoreFunctionRenderer: ScoreFunctionRenderer;

	private previousScoreFunctions: ScoreFunction[];

	private opener: Window;


	constructor(private ngZone: NgZone) { }

	ngOnInit() {
		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');

		if (window) {
			this.opener = window.opener;

			this.objectiveToDisplay = (<any> window.opener).objectiveToPlot;
			this.chartDataService = (<any> window.opener).chartDataService;
			this.chartUndoRedoService = (<any> window.opener).chartUndoRedoService;
		}


		this.users = this.chartDataService.users

		this.initChangeDetection();


		if (this.objectiveToDisplay.getDomainType() === 'continuous') {
			this.scoreFunctionRenderer = new ContinuousScoreFunctionRenderer(this.chartDataService, this.chartUndoRedoService, this.ngZone);
		} else {
			this.scoreFunctionRenderer = new DiscreteScoreFunctionRenderer(this.chartDataService, this.chartUndoRedoService, this.ngZone);

		}

		this.scoreFunctionRenderer.createScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay);
		this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, 300, 300, 'vertical');

	}

	initChangeDetection(): void {
		this.previousScoreFunctions = [];

		this.users.forEach((user: User) => {
			let currentScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName()).getMemento();
			this.previousScoreFunctions.push(currentScoreFunction);
		});
	}

	detectScoreFunctionChange(previousScoreFunction: ScoreFunction, currentScoreFunction: ScoreFunction): boolean {

		var elementIterator: Iterator<number | string> = previousScoreFunction.getElementScoreMap().keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();

		while (iteratorElement.done === false) {

			if (previousScoreFunction.getScore(iteratorElement.value) !== currentScoreFunction.getScore(iteratorElement.value)) {
				return true;
			}

			iteratorElement = elementIterator.next();
		}

		return false;
	}


	ngDoCheck() {

		this.users.forEach((user: User, index: number) => {
			let currentScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(this.objectiveToDisplay.getName());
			var scoreFunctionChange: boolean = this.detectScoreFunctionChange(this.previousScoreFunctions[index], currentScoreFunction);

			if (scoreFunctionChange) {
				this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, 300, 300, 'vertical');
				// Trigger change detection in the main application:
				if (window) {
					(<any> window.opener).angularAppRef.tick();
				} else {
					this.ngOnDestroy();	// Remove the reference to this window from the parent window, seeing as this window has been destroyed.
				}

				this.previousScoreFunctions[index] = currentScoreFunction.getMemento();
			}
		})
	}

	ngOnDestroy() {
		// Remove the ScoreFunction viewer form the parent window's list of children.
		(<any> this.opener).childWindows.scoreFunctionViewer = null;
	}
}
