/*
* @Author: aaronpmishkin
* @Date:   2017-05-23 12:44:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-23 14:53:52
*/

// Import Testing Resources:
import { Component }									from '@angular/core';
import { ComponentFixture, TestBed }					from '@angular/core/testing';
import { By }              								from '@angular/platform-browser';
import { DebugElement }    								from '@angular/core';

import { expect }										from 'chai';

// Import Libraries:
import  * as d3											from 'd3';
import * as _											from 'lodash';

// Import Test Data: 
import { HotelChartData }								from '../../../../testData/HotelChartData';

// Import Application Classes:
import { ObjectiveChartRenderer }							from '../../../../../client/resources/modules/ValueChart/renderers/ObjectiveChart.renderer';
import { RendererConfigUtility }						from '../../../../../client/resources/modules/ValueChart/utilities/RendererConfig.utility';
import { RendererDataUtility }							from '../../../../../client/resources/modules/ValueChart/utilities/RendererData.utility';
import { RendererService }								from '../../../../../client/resources/modules/ValueChart/services/Renderer.service';
import { RenderEventsService }							from '../../../../../client/resources/modules/ValueChart/services/RenderEvents.service';
import { SortAlternativesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/SortAlternatives.interaction';

import { WebValueChartsParser }							from '../../../../../client/resources/modules/utilities/classes/WebValueChartsParser';
8
// Import Definitions Classes:
import { ObjectiveChartDefinitions }						from '../../../../../client/resources/modules/ValueChart/definitions/ObjectiveChart.definitions';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { Objective }									from '../../../../../client/resources/model/Objective';
import { User }											from '../../../../../client/resources/model/User';
import { ScoreFunction }								from '../../../../../client/resources/model/ScoreFunction';
import { WeightMap }									from '../../../../../client/resources/model/WeightMap';
import { PrimitiveObjective }							from '../../../../../client/resources/model/PrimitiveObjective';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { RowData, UserScoreData }						from '../../../../../client/resources/types/RendererData.types';



@Component({
	selector: 'testing-stub',
	template: `<svg></svg>`
})
class TestingStub {
	constructor() { }
}


describe('ObjectiveChartRenderer', () => {

var sortAlternativesStub = {

	sortStatus: '',

	toggleAlternativeSorting: (sortAlternatives: string, alternativeBoxes: d3.Selection<any, any, any, any>, lastRendererUpdate: RendererUpdate) => {
		sortAlternativesStub.sortStatus = sortAlternatives;
		return;
	}
};

var renderEventsServiceStub = {

	objectiveChartDispatcher: { next: (value: number) => { } }
};

	var fixture;
	var el: d3.Selection<any, any, any, any>;

	var rendererConfigUtility: RendererConfigUtility;
	var rendererDataUtility: RendererDataUtility;
	var objectiveChartRenderer: ObjectiveChartRenderer;

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
				ObjectiveChartRenderer, 
				{ provide: RenderEventsService, useValue: renderEventsServiceStub },
				{ provide: SortAlternativesInteraction, useValue: sortAlternativesStub} ],
			declarations: [ TestingStub ]
		});

		var fixture = TestBed.createComponent(TestingStub);

		rendererConfigUtility = TestBed.get(RendererConfigUtility);
		rendererDataUtility = TestBed.get(RendererDataUtility);
		objectiveChartRenderer = TestBed.get(ObjectiveChartRenderer);


		el = d3.select(fixture.debugElement.nativeElement.firstChild);

		el.classed('ValueChart svg-content-valuechart', true)
			.attr('viewBox', '0 -10' + ' ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMinYMin meet');

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

		aaron = hotelChart.getUsers()[0];
	});

	describe('public valueChartChanged = (update: RendererUpdate)', () => {

		before(function() {
			u = rendererDataUtility.produceMaximumWeightMap(u);
			u = rendererDataUtility.produceRowData(u);
			u = rendererConfigUtility.produceRendererConfig(u);
		});

		context('when the view orientation is set to be vertical', () => {

			context('when the objective chart has not been initialized yet and the number of users is one', () => {

				before(function() {
					objectiveChartRenderer.valueChartChanged(u);
				});

				it('should initialize the objective chart by creating the necessary hierarchy of SVG containers', () => {
					expect(objectiveChartRenderer.chart).to.not.be.undefined;
					expect(objectiveChartRenderer.alternativeBoxesContainer).to.not.be.undefined;
					expect(objectiveChartRenderer.rowsContainer).to.not.be.undefined;
				});

				it('should have created exactly as many rows as there are primitive objectives in the ValueChart', () => {
					checkNumberOfRows(u.valueChart.getAllPrimitiveObjectives().length);
				});

				it('should have created one cell per alternative per row', () => {
					checkNumberOfCells(u.valueChart.getAlternatives().length);
				});

				it('should have created one user score per user for each cell in each row', () => {
					checkNumberOfUserScores(u.valueChart.getUsers().length);
				});

				it('should position and style the SVG elements making up the objective chart', () => {
					checkRenderedUserScores(u);
				});	

				it('should not display weight outlines since there is only one user', () => {
					expect(objectiveChartRenderer.weightOutlines.style('display')).to.equal('none');
				});
			});

			context('when the number of users in the ValueChart is increased to be two', () => {
				before(function() {
					bob = new User('Bob');

					let bobsWeights = new WeightMap();
					let bobsScoreFunctions = u.valueChart.getUsers()[0].getScoreFunctionMap();

					u.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective) => {
						bobsWeights.setObjectiveWeight(objective.getName(), _.random(0,1));
					});

					bob.setWeightMap(bobsWeights);
					bob.setScoreFunctionMap(bobsScoreFunctions);

					u.valueChart.setUser(bob);

					u = rendererDataUtility.produceMaximumWeightMap(u);
					u = rendererDataUtility.produceRowData(u);
					u = rendererConfigUtility.produceRendererConfig(u);
					objectiveChartRenderer.valueChartChanged(u);
				});

				it('should update the SVG elements of the objective chart to include the new users', () => {
					checkNumberOfUserScores(u.valueChart.getUsers().length);
				});

				it('should re-render the objective chart and correctly position and style the SVG elements', () => {
					checkRenderedUserScores(u);
				});

				it('should display the weight outlines for each user since there is more than one user', () => {
					expect(objectiveChartRenderer.weightOutlines.style('display')).to.equal('block');
				});

				it('should give each user\'s weight outline for each objective a height proportional to the user\'s objective weight', () => {
					objectiveChartRenderer.weightOutlines.nodes().forEach((weightOutline: Element) => {
						let selection = d3.select(weightOutline);
						let datum = (<UserScoreData> selection.datum());
						let weight = datum.user.getWeightMap().getObjectiveWeight(datum.objective.getName());

						let height: number = u.rendererConfig.dimensionTwoScale(weight);

						expect(+selection.attr('height')).to.be.approximately(height, 2);		// Use approximately here to account for the offset of 2 applied to weight outline heights during rendering. 
					});
				});
			});

			context('when the number of users in the ValueChart is decreased to be one', () => {
				before(function() {
					u.valueChart.removeUser(aaron);

					u = rendererDataUtility.produceMaximumWeightMap(u);
					u = rendererDataUtility.produceRowData(u);
					u = rendererConfigUtility.produceRendererConfig(u);

					objectiveChartRenderer.valueChartChanged(u);
				});


				it('should update the SVG elements of the objective chart to include the new users', () => {
					checkNumberOfUserScores(u.valueChart.getUsers().length);
				});

				it('should re-render the objective chart and correctly position and style the SVG elements', () => {
					checkRenderedUserScores(u);
				});

				it('should hide the weight outlines again since there is only one user', () => {
					expect(objectiveChartRenderer.weightOutlines.style('display')).to.equal('none');
				});
			});

			context('when the weights of the users in the ValueChart are changed', () => {
				before(function() {
					let bobsWeights = bob.getWeightMap();
					
					u.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective) => {
						bobsWeights.setObjectiveWeight(objective.getName(), _.random(0,1));
					});

					u = rendererDataUtility.produceMaximumWeightMap(u);
					u = rendererDataUtility.produceRowData(u);
					u = rendererConfigUtility.produceRendererConfig(u);

					objectiveChartRenderer.valueChartChanged(u);
				});

				it('should re-render to the objective chart to reflect the new weights', () => {
					checkRenderedUserScores(u);
				});
			});
		});

		context('when the view orientation is set to be horizontal', () => {

			before(function() {
				viewConfig.viewOrientation = 'horizontal';

				u = rendererDataUtility.produceMaximumWeightMap(u);
				u = rendererDataUtility.produceRowData(u);
				u = rendererConfigUtility.produceRendererConfig(u);

				objectiveChartRenderer.valueChartChanged(u);
			});

			it('should re-render the objective chart to be in the horizontal orientation', () => {
				checkRenderedUserScores(u);
			});
		});
	});

	describe('public viewConfigChanged = (viewConfig: ViewConfig)', () => {

		context('when all of the view options are disabled in the viewConfig object', () => {
			it('should hide all optional SVG elements for those view options', () => {
				objectiveChartRenderer.viewConfigChanged(viewConfig);

				checkViewToggles();
			});
		});

		context('when the viewConfig object is changed to enable some view options', () => {
			before(function() {
				viewConfig.displayScales = true;
				viewConfig.displayTotalScores = true;
				viewConfig.displayScoreFunctions = true;
			});

			it('should display the SVG elements for the enabled view options', () => {
				objectiveChartRenderer.viewConfigChanged(viewConfig);

				checkViewToggles();
			});
		});
	});

	describe('public viewConfigChanged = (viewConfig: ViewConfig)', () => {

		context('when all of the interaction options are disabled in the interactionConfig objective', () => {
			it('should change the sort alternatives interaction to "none"', () => {
				objectiveChartRenderer.interactionsChanged(interactionConfig);
				expect(sortAlternativesStub.sortStatus).to.equal('none');
			});
		});

		context('when the interactionConfig option sortAlternatives is set to "alphabet"', () => {
			before(function() {
				interactionConfig.sortAlternatives = 'alphabet';
			});

			it('should change the sort alternatives interaction to "alphabet"', () => {
				objectiveChartRenderer.interactionsChanged(interactionConfig);
				expect(sortAlternativesStub.sortStatus).to.equal('alphabet');
			});
		});

		context('when the interactionConfig option sortAlternatives is set to "manual"', () => {
			before(function() {
				interactionConfig.sortAlternatives = 'manual';
			});

			it('should change the sort alternatives interaction to "manual"', () => {
				objectiveChartRenderer.interactionsChanged(interactionConfig);
				expect(sortAlternativesStub.sortStatus).to.equal('manual');
			});
		});
	});


	var checkNumberOfRows = (n: number) => {
		expect(objectiveChartRenderer.rows.nodes()).to.have.length(n);
	}

	var checkNumberOfCells = (n: number) => {
		objectiveChartRenderer.rows.nodes().forEach((row: SVGElement) => {
			let cells = row.querySelectorAll('.' + ObjectiveChartDefinitions.CELL);
			expect(cells).to.have.length(n);
		});
	}

	var checkNumberOfUserScores = (n: number) => {
		objectiveChartRenderer.rows.nodes().forEach((row: SVGElement) => {
			(<any> row.querySelectorAll('.' + ObjectiveChartDefinitions.CELL)).forEach((cell: SVGElement) => {
				let usersScores = d3.select(cell).selectAll('.' + ObjectiveChartDefinitions.USER_SCORE).nodes();
				expect(usersScores).to.have.length(n);
			});
		});
	}

	var checkRenderedUserScores = (u: RendererUpdate) => {

		objectiveChartRenderer.rows.nodes().forEach((row: SVGElement) => {
			let rowSelection = d3.select(row);
			let rowData: RowData = <any> rowSelection.datum();
			let rowOffset = u.rendererConfig.dimensionTwoScale(rowData.weightOffset);

			if (u.viewConfig.viewOrientation == 'vertical')
				expect(rowSelection.attr('transform')).to.equal('translate(0,' + rowOffset + ')');
			else 
				expect(rowSelection.attr('transform')).to.equal('translate(' + rowOffset + ',0)');

			(<any> row.querySelectorAll('.' + ObjectiveChartDefinitions.CELL)).forEach((cell: SVGElement) => {
				(<any> cell.querySelectorAll('.' + ObjectiveChartDefinitions.USER_SCORE)).forEach((userScore: SVGElement) => {
					let selection = d3.select(userScore);
					let datum: UserScoreData = <any> selection.datum();
					let score: number = datum.user.getScoreFunctionMap().getObjectiveScoreFunction(datum.objective.getName()).getScore(datum.value);
					let weight: number = datum.user.getWeightMap().getObjectiveWeight(datum.objective.getName());

					if (u.viewConfig.viewOrientation == 'vertical') {
						expect(selection.attr('height')).to.equal(u.rendererConfig.dimensionTwoScale(score * weight).toString());
					} else {
						expect(selection.attr('width')).to.equal(u.rendererConfig.dimensionTwoScale(score * weight).toString());
					}
				});	
			});
		});
	}

	var checkViewToggles = () => {
		if (viewConfig.displayDomainValues) {
			expect(objectiveChartRenderer.objectiveDomainLabels.style('display')).to.equal('block');
		} else {
			expect(objectiveChartRenderer.objectiveDomainLabels.style('display')).to.equal('none');			
		}
	}
});






