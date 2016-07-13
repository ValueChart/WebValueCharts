/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-13 12:43:23
*/

import { Component }													from '@angular/core';
import { OnInit, OnDestroy }											from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';
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
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { User }															from '../../model/User';
import { UserDomainElements, DomainElement }							from '../../model/ChartDataTypes';


@Component({
	selector: 'ScoreFunction',
	templateUrl: '/app/resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.template.html',
	directives: []
})
export class ScoreFunctionViewerComponent implements OnInit {

	private scoreFunctionPlotContainer: d3.Selection<any>;

	private users: User[];
	private objectiveToDisplay: PrimitiveObjective;

	private chartDataService: ChartDataService;
	private chartUndoRedoService: ChartUndoRedoService;

	private scoreFunctionRenderer: ScoreFunctionRenderer;

	constructor(private ngZone: NgZone) { }

	ngOnInit() {

		this.scoreFunctionPlotContainer = d3.select('.expanded-score-function');

		this.users = (<any> window.opener).users;
		this.objectiveToDisplay = (<any> window.opener).objectiveToPlot;

		this.chartDataService = (<any> window.opener).chartDataService;
		this.chartUndoRedoService = (<any> window.opener).chartUndoRedoService;

		if (this.objectiveToDisplay.getDomainType() === 'Continuous') {
			this.scoreFunctionRenderer = new ContinuousScoreFunctionRenderer(this.chartDataService, this.chartUndoRedoService, this.ngZone);
		} else {
			this.scoreFunctionRenderer = new DiscreteScoreFunctionRenderer(this.chartDataService, this.chartUndoRedoService, this.ngZone);

		}

		this.scoreFunctionRenderer.createScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay);
		this.scoreFunctionRenderer.renderScoreFunction(this.scoreFunctionPlotContainer, this.objectiveToDisplay, 500, 500, 'vertical');

	}
}
