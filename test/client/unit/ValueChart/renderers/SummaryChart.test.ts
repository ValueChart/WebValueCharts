/*
* @Author: aaronpmishkin
* @Date:   2017-05-20 13:14:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-20 23:17:10
*/

// Import Testing Resources:
import { Component }									from '@angular/core';
import { ComponentFixture, TestBed }					from '@angular/core/testing';
import { By }              								from '@angular/platform-browser';
import { DebugElement }    								from '@angular/core';

import { expect }										from 'chai';

// Import Libraries:
import  * as d3											from 'd3';

// Import Test Data: 
import { HotelChartData }								from '../../../../testData/HotelChartData';

// Import Application Classes:
import { SummaryChartRenderer }							from '../../../../../client/resources/modules/ValueChart/renderers/SummaryChart.renderer';
import { RendererConfigUtility }						from '../../../../../client/resources/modules/ValueChart/utilities/RendererConfig.utility';
import { RendererDataUtility }							from '../../../../../client/resources/modules/ValueChart/utilities/RendererData.utility';
import { RendererService }								from '../../../../../client/resources/modules/ValueChart/services/Renderer.service';
import { RenderEventsService }							from '../../../../../client/resources/modules/ValueChart/services/RenderEvents.service';
import { SortAlternativesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/SortAlternatives.interaction';


import { WebValueChartsParser }							from '../../../../../client/resources/modules/utilities/classes/WebValueChartsParser';

// Import Definitions Classes:
import { SummaryChartDefinitions }						from '../../../../../client/resources/modules/ValueChart/definitions/SummaryChart.definitions';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { Objective }									from '../../../../../client/resources/model/Objective';
import { User }											from '../../../../../client/resources/model/User';
import { ScoreFunction }								from '../../../../../client/resources/model/ScoreFunction';
import { WeightMap }									from '../../../../../client/resources/model/WeightMap';
import { AbstractObjective }							from '../../../../../client/resources/model/AbstractObjective';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { RowData }										from '../../../../../client/resources/types/RendererData.types';



@Component({
	selector: 'testing-stub',
	template: `<svg></svg>`
})
class TestingStub {
	constructor() { }
}


describe('SummaryChartRenderer', () => {

var sortAlternativesStub = {

	toggleAlternativeSorting: (sortAlternatives: boolean, alternativeBoxes: d3.Selection<any, any, any, any>, lastRendererUpdate: RendererUpdate) => {
		return;
	}
};

var renderEventsServiceStub = {

	summaryChartDispatcher: { next: (value: number) => { } }
};

	var fixture;
	var el: d3.Selection<any, any, any, any>;

	var rendererConfigUtility: RendererConfigUtility;
	var rendererDataUtility: RendererDataUtility;
	var summaryChartRenderer: SummaryChartRenderer;

	var hotelChart: ValueChart;
	var parser: WebValueChartsParser;
	var width: number, height: number, interactionConfig: InteractionConfig, viewConfig: ViewConfig;
	var u: RendererUpdate;
	var aaron: User;
	var bob: User;

	before(function() {

		parser = new WebValueChartsParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		viewConfig = {
			viewOrientation: 'vertical',
			displayScoreFunctions: false,
			displayTotalScores: false,
			displayScales: false,
			displayDomainValues: false,
			displayScoreFunctionValueLabels: false,
			displayAverageScoreLines: false
		};

		interactionConfig = {
			weightResizeType: 'none',
			reorderObjectives: false,
			sortAlternatives: 'none',
			pumpWeights: 'none',
			setObjectiveColors: false,
			adjustScoreFunctions: false
		};

		height = 100;
		width = 100;

		TestBed.configureTestingModule({
			providers: [ 
				RendererService, 
				RendererConfigUtility, 
				RendererDataUtility, 
				SummaryChartRenderer, 
				{ provide: RenderEventsService, useValue: renderEventsServiceStub },
				{ provide: SortAlternativesInteraction, useValue: sortAlternativesStub} ],
			declarations: [ TestingStub ]
		});

		var fixture = TestBed.createComponent(TestingStub);

		rendererConfigUtility = TestBed.get(RendererConfigUtility);
		rendererDataUtility = TestBed.get(RendererDataUtility);
		summaryChartRenderer = TestBed.get(SummaryChartRenderer);


		el = d3.select(fixture.debugElement.nativeElement.firstChild);

		u = {
			el: el,
			valueChart: hotelChart,
			viewConfig: viewConfig,
			interactionConfig: interactionConfig,
			renderRequired: { value: false },
			height: height,
			width: width,
			maximumWeightMap: null,
			rowData: null,
			labelData: null,
			rendererConfig: null
		}
	});

	describe('valueChartChanged = (update: RendererUpdate)', () => {

		before(function() {
			u = rendererDataUtility.produceMaximumWeightMap(u);
			u = rendererDataUtility.produceRowData(u);
			u = rendererConfigUtility.produceRendererConfig(u);
		});

		context('when the summary chart has not been initialized yet', () => {

			before(function() {
				summaryChartRenderer.valueChartChanged(u);
			});

			it('should initialize the summary chart by creating the necessary hierarchy of SVG containers', () => {
				expect(summaryChartRenderer.chart).to.not.be.undefined;
				expect(summaryChartRenderer.outline).to.not.be.undefined;
				expect(summaryChartRenderer.rowsContainer).to.not.be.undefined;
			});

			it('should have created exactly as many rows as there are primitive objectives in the ValueChart', () => {
				expect(summaryChartRenderer.rows.nodes()).to.have.length(u.valueChart.getAllPrimitiveObjectives().length);
			});

			it('should have created one cell per alternative per row', () => {
				summaryChartRenderer.rows.nodes().forEach((row: Element) => {
					console.log(d3.select(row));
					var cells = d3.select(row).selectAll('.' + SummaryChartDefinitions.CELL).nodes();
					expect(cells).to.have.length(u.valueChart.getAlternatives().length);
				});
			});

			it('should have created one user score per user for each cell in each row', () => {
				summaryChartRenderer.rows.nodes().forEach((row: Element) => {
					d3.select(row).selectAll('.' + SummaryChartDefinitions.CELL).nodes().forEach((cell: Element) => {
						var usersScores = d3.select(cell).selectAll('.' + SummaryChartDefinitions.USER_SCORE).nodes();
						expect(usersScores).to.have.length(u.valueChart.getUsers().length);
					});
				});
			});

			it('should position and style the SVG elements making up the summary chart', () => {
				
			});

		});

		context('when the summary chart has already been initialized', () => {
			it('should re-render the summary chart', () => {

			});
		});

		context('when the number of users in the ValueChart is increased', () => {
			it('should update the SVG elements of the summary chart to include the new users', () => {

			});
		});

		context('when the number of users in the ValueChart is decreased', () => {
			it('should update the SVG elements of the summary chart to include the new users', () => {

			});
		});

	});
});






