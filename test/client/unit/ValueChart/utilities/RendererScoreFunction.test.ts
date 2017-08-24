/*
* @Author: aaronpmishkin
* @Date:   2017-05-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:51
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

// Import Test Utilities: 
import { HotelChartData }								from '../../../../testData/HotelChartData';
import { randomizeUserScoreFunction }					from '../../../../utilities/Testing.utilities';

// Import Application Classes:
import { RendererScoreFunctionUtility }					from '../../../../../client/resources/modules/ValueChart/utilities/RendererScoreFunction.utility';
import { XmlValueChartParser }							from '../../../../../client/resources/modules/utilities/classes/XmlValueChart.parser';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { Objective }									from '../../../../../client/resources/model/Objective';
import { User }											from '../../../../../client/resources/model/User';
import { ScoreFunction }								from '../../../../../client/resources/model/ScoreFunction';
import { WeightMap }									from '../../../../../client/resources/model/WeightMap';
import { PrimitiveObjective }							from '../../../../../client/resources/model/PrimitiveObjective';
import { AbstractObjective }							from '../../../../../client/resources/model/AbstractObjective';

// Import Types
import { ScoreFunctionUpdate }							from '../../../../../client/resources/types/RendererData.types';
import { DomainElement, ScoreFunctionData }				from '../../../../../client/resources/types/RendererData.types'; 
import { ScoreFunctionDataSummary }						from '../../../../../client/resources/types/RendererData.types';
import { ChartOrientation }								from '../../../../../client/resources/types/Config.types';


describe('RendererScoreFunctionUtility', () => {

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
	var rendererScoreFunctionUtility: RendererScoreFunctionUtility;
	var width: number, height: number;
	var u: ScoreFunctionUpdate;
	var aaron: User;
	var bob: User;

	var elements: (string | number)[];

	before(function() {
		TestBed.configureTestingModule({
			providers: [ RendererScoreFunctionUtility ]
		});

		rendererScoreFunctionUtility = TestBed.get(RendererScoreFunctionUtility);

		parser = new XmlValueChartParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);


		height = 100;
		width = 100;

		let objective = hotelChart.getAllPrimitiveObjectives()[0];


		aaron = hotelChart.getUsers()[0];
		aaron.color = "#0000FF";

		elements = aaron.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId()).getAllElements();


		u = {
			viewOrientation: ChartOrientation.Vertical,
			height: height,
			width: width,
			scoreFunctions: [],
			objective: objective,
			colors: [],
			el: null,
			rendererConfig: null,
			interactionConfig: null,
			heightScale: null,
			scoreFunctionData: null,
			styleUpdate: null,
			individual: null
		}
	});

	describe('public produceScoreFunctionData = (u: ScoreFunctionUpdate): ScoreFunctionUpdate', () => {

		context('when there are no score functions (ie. there are no users the in the ValuChart', () => {

			before(function() {
				u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
			});

			it('the ScoreFunctionData produced should be an empty array', () => {
				expect(u.scoreFunctionData).to.have.length(0);
			});

		});

		context('when there is one score function (ie. there is one user in the ValueChart', () => {

			before(function() {
				u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())];
				u.colors = [aaron.color];
			
				u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
			});

			it('should produce ScoreFunctionData for the single score function', () => {
				expect(u.scoreFunctionData).to.have.length(1);

				checkScoreFunctionData(u);
			});

			context('when the one user\'s score function is changed', () => {
				let oldReference: ScoreFunctionData[];

				before(function() {
					oldReference = u.scoreFunctionData

					aaron = randomizeUserScoreFunction(aaron, u.objective);
					u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())];

					u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
				});

				it('should return the cached version of the ScoreFunctionData (i.e. the ScoreFunctionData memory reference should not change', () => {
					expect(oldReference).to.equal(u.scoreFunctionData);
				});

				it('should produce correct ScoreFunctionData', () => {
					checkScoreFunctionData(u);
				});

			});

			context('when the one user\'s color is changed', () => {
				let oldReference: ScoreFunctionData[];

				before(function() {
					oldReference = u.scoreFunctionData

					aaron.color = '#0FF000'
					u.colors = [aaron.color];

					u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
				});

				it('should return a new version of the ScoreFunctionData (i.e. the ScoreFunctionData memory reference should change', () => {
					expect(oldReference).to.not.equal(u.scoreFunctionData);
				});

				it('should produce correct ScoreFunctionData', () => {
					checkScoreFunctionData(u);
				})

			});
		});

		context('when there are two score functions (ie. two users in the ValueChart', () => {
			let oldReference: ScoreFunctionData[];

			before(function() {
				bob = new User();

				bob.setScoreFunctionMap(aaron.getScoreFunctionMap());
				bob = randomizeUserScoreFunction(bob, u.objective);

				oldReference = u.scoreFunctionData;

				u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId()), bob.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())];
				u.colors = [aaron.color, bob.color];

				u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
			});

			it('should should return a new version of the ScoreFuncitonData (i.e. the ScoreFunctionData memory reference should change', () => {
				expect(oldReference).to.not.equal(u.scoreFunctionData);
			});

			it('should produce correct ScoreFunctionData', () => {
				checkScoreFunctionData(u);
			});	
		});	

		context('when a different objective score function is used', () => {

			before(function() {
				u.objective = hotelChart.getAllPrimitiveObjectives()[1];
				elements = aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId()).getAllElements();

				u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId()), bob.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())];
				u.colors = [aaron.color, bob.color];

				u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
			});

			it('should produce correct ScoreFunctionData', () => {
				checkScoreFunctionData(u);
			});
		});
	});


	describe('produceViewConfig = (u: ScoreFunctionUpdate): ScoreFunctionUpdate', () => {

		context('when the view orientation is "vertical"', () => {
			before(function() {
				u.viewOrientation = ChartOrientation.Vertical;

				u = rendererScoreFunctionUtility.produceViewConfig(u);
			});

			it('should generate a scoreFunctionConfig where dimension one is x/width and dimension two is y/height', () => {
				expect(u.rendererConfig.labelOffset).to.equal(25);

				expect(u.rendererConfig.dimensionOne).to.equal('width');
				expect(u.rendererConfig.dimensionTwo).to.equal('height');
				expect(u.rendererConfig.coordinateOne).to.equal('x');
				expect(u.rendererConfig.coordinateTwo).to.equal('y');

				expect(u.rendererConfig.dimensionOneSize).to.equal(u.width);
				expect(u.rendererConfig.dimensionTwoSize).to.equal(u.height);
			});

			it('should configure the heightScale so that the domain is [0, 1], and the range is [0, height]', () => {
				expect(u.heightScale.domain()).to.deep.equal([0, 1]);

				expect(u.heightScale.range()).to.deep.equal([0, u.rendererConfig.domainAxisCoordinateTwo - u.rendererConfig.utilityAxisMaxCoordinateTwo]);
			});
		});

		context('when the view orientation is "horizontal"', () => {
			before(function() {
				u.viewOrientation = ChartOrientation.Horizontal;

				u = rendererScoreFunctionUtility.produceViewConfig(u);
			});

			it('should generate a scoreFunctionConfig where dimension one is y/height and dimension two is x/width', () => {
				expect(u.rendererConfig.labelOffset).to.equal(25);

				expect(u.rendererConfig.dimensionOne).to.equal('height');
				expect(u.rendererConfig.dimensionTwo).to.equal('width');
				expect(u.rendererConfig.coordinateOne).to.equal('y');
				expect(u.rendererConfig.coordinateTwo).to.equal('x');

				expect(u.rendererConfig.dimensionOneSize).to.equal(u.height);
				expect(u.rendererConfig.dimensionTwoSize).to.equal(u.width);
			});

			it('should configure the heightScale so that the domain is [0, 1], and the range is [0, height]', () => {
				expect(u.heightScale.domain()).to.deep.equal([0, 1]);

				expect(u.heightScale.range()).to.deep.equal([u.rendererConfig.domainAxisCoordinateTwo, u.rendererConfig.utilityAxisMaxCoordinateTwo]);
			});
		});

	});

	describe('public getAllScoreFunctionDataSummaries(objective: PrimitiveObjective, scoreFunctions: ScoreFunction[]): ScoreFunctionDataSummary[]', () => {
			
		var objective: PrimitiveObjective;
		var scoreFunctions: ScoreFunction[];
		var scoreFunctionDataSummaries: ScoreFunctionDataSummary[];

		context('when there are zero score functions (i.e. there are zero users in the ValueChart)', () => {
			before(function() {
				objective = hotelChart.getAllPrimitiveObjectives()[0];
				scoreFunctions = [];
				scoreFunctionDataSummaries = rendererScoreFunctionUtility.getAllScoreFunctionDataSummaries(objective, scoreFunctions);

				elements = aaron.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId()).getAllElements();
			});


			it('should return an empty array of ScoreFunctionDataSummaries', () => {
				expect(scoreFunctionDataSummaries).to.have.length(0);
			});
		});

		context('when is one score function (ie. there is one user in the ValueChart)', () => {
			before(function() {
				objective = hotelChart.getAllPrimitiveObjectives()[0];
				scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId())];

				scoreFunctionDataSummaries = rendererScoreFunctionUtility.getAllScoreFunctionDataSummaries(objective, scoreFunctions);
			});

			it('should produce cCoreFunctionDataSummaries that exactly reflect that one score function', () => {
				checkScoreFunctionDataSummaries(scoreFunctionDataSummaries, scoreFunctions);
			});
		});

		context('when there are two score functions (ie. there are two users in the ValueChart)', () => {
			before(function() {
				objective = hotelChart.getAllPrimitiveObjectives()[0];
				scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId()), bob.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId())];

				scoreFunctionDataSummaries = rendererScoreFunctionUtility.getAllScoreFunctionDataSummaries(objective, scoreFunctions);
			});

			it('should produce ScoreFunctionDataSummaries that exactly reflect that one score function', () => {
				checkScoreFunctionDataSummaries(scoreFunctionDataSummaries, scoreFunctions);
			});
		});
	});



	var checkScoreFunctionData = (u: ScoreFunctionUpdate) => {
		u.scoreFunctionData.forEach((datum: ScoreFunctionData, i: number) => {

			expect(datum.scoreFunction).to.deep.equal(u.scoreFunctions[i]);
			expect(datum.color).to.equal(u.colors[i]);
			expect(datum.elements).to.have.length(elements.length);

			datum.elements.forEach((element: DomainElement, j: number) => {
				expect(element.scoreFunction).to.deep.equal(u.scoreFunctions[i]);
				expect(element.color).to.equal(u.colors[i]);
				expect(element.element).to.equal(elements[j]);
			});
		});
	};

	var checkScoreFunctionDataSummaries = (summaries: ScoreFunctionDataSummary[], scoreFunctions: ScoreFunction[]) => {
		expect(summaries).to.have.length(elements.length);


		summaries.forEach((summary: ScoreFunctionDataSummary, i: number) => {
			expect(summary.element).to.equal(elements[i]);

			let scores = _.map(scoreFunctions, (scoreFunction) => {
				return scoreFunction.getScore(summary.element);
			});

			scores.sort((a: number, b: number) => {
				if (a < b)
					return -1;
				else
					return 1;
			});


			expect(summary.min).to.equal(_.min(scores));
			expect(summary.max).to.equal(_.max(scores));
			expect(summary.median).to.equal(d3.median(scores));
			expect(summary.firstQuartile).to.equal(d3.quantile(scores, 0.25));
			expect(summary.thirdQuartile).to.equal(d3.quantile(scores, 0.75));
		});
	};
});




















