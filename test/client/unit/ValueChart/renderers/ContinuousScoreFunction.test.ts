/*
* @Author: aaronpmishkin
* @Date:   2017-05-25 10:27:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:55
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
import { randomizeUserScoreFunction, rgbaToHex }		from '../../../../utilities/Testing.utilities';


// Import Application Classes:
import { ContinuousScoreFunctionRenderer }				from '../../../../../client/src/ValueChartVis';
import { RendererScoreFunctionUtility }					from '../../../../../client/src/ValueChartVis';
import { ChartUndoRedoService }							from '../../../../../client/src/ValueChartVis';

import { ExpandScoreFunctionInteraction }				from '../../../../../client/src/ValueChartVis';
import { AdjustScoreFunctionInteraction }				from '../../../../../client/src/ValueChartVis';

import { XmlValueChartParser }							from '../../../../../client/src/app/utilities/XmlValueChart.parser';

// Import Model Classes
import { ValueChart }									from '../../../../../client/src/model';
import { Objective }									from '../../../../../client/src/model';
import { User }											from '../../../../../client/src/model';
import { ScoreFunction }								from '../../../../../client/src/model';
import { WeightMap }									from '../../../../../client/src/model';
import { PrimitiveObjective }							from '../../../../../client/src/model';
import { AbstractObjective }							from '../../../../../client/src/model';
import { ContinuousDomain }								from '../../../../../client/src/model';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/src/types';
import { ScoreFunctionUpdate }							from '../../../../../client/src/types';
import { RowData, UserScoreData }						from '../../../../../client/src/types';
import { ChartOrientation }								from '../../../../../client/src/types';


@Component({
	selector: 'continuous-score-function-stub',
	template: `<svg></svg>`
})
class ContinuousStub {
	constructor() { }
}


describe('ContinuousScoreFunctionRenderer', () => {

	var defs = ContinuousScoreFunctionRenderer.defs;

	var chartUndoRedoStub = {
		saveScoreFunctionRecord: (scoreFuntion: ScoreFunction, objective: Objective) => {
			return;
		}
	};


	var fixture: ComponentFixture<ContinuousStub>;
	var el: d3.Selection<any, any, any, any>;

	var rendererScoreFunctionUtility: RendererScoreFunctionUtility;
	var scoreFunctionRenderer: ContinuousScoreFunctionRenderer;
	var adjustScoreFunctionInteraction: AdjustScoreFunctionInteraction;
	var expandScoreFunctionInteraction: ExpandScoreFunctionInteraction;

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
	var width: number, height: number;
	var u: ScoreFunctionUpdate;
	var aaron: User;
	var bob: User;

	var elements: (number | string)[];

	before(function() {
		TestBed.resetTestingModule();

		parser = new XmlValueChartParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		height = 100;
		width = 100;

		TestBed.configureTestingModule({
			providers: [ 
				RendererScoreFunctionUtility,
				ContinuousScoreFunctionRenderer, 
				{ provide: ChartUndoRedoService, useValue: chartUndoRedoStub } ],
			declarations: [ ContinuousStub ]
		});

		fixture = TestBed.createComponent(ContinuousStub);

		rendererScoreFunctionUtility = TestBed.get(RendererScoreFunctionUtility);
		scoreFunctionRenderer = TestBed.get(ContinuousScoreFunctionRenderer);
		adjustScoreFunctionInteraction = scoreFunctionRenderer['adjustScoreFunctionInteraction'];
		expandScoreFunctionInteraction = scoreFunctionRenderer['expandScoreFunctionInteraction'];


		el = d3.select(fixture.debugElement.nativeElement.firstChild);

		el.classed('ValueChart svg-content-valuechart', true)
			.attr('viewBox', '0 -10' + ' ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMinYMin meet');

		let objective = hotelChart.getAllPrimitiveObjectives()[1];


		aaron = hotelChart.getUsers()[0];
		aaron.color = "#0000FF";

		elements = aaron.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId()).getAllElements();


		u = {
			el: el,
			viewOrientation: ChartOrientation.Vertical,
			interactionConfig: { adjustScoreFunctions: false, expandScoreFunctions: false },
			height: height,
			width: width,
			rendererConfig: null,
			scoreFunctions: [aaron.getScoreFunctionMap().getObjectiveScoreFunction(objective.getId())],
			objective: objective,
			colors: [aaron.color],
			heightScale: null,
			scoreFunctionData: null,
			styleUpdate: false,
			individual: true
		}
	});


	describe('scoreFunctionChanged = (update: ScoreFunctionUpdate)', () => {

		before(function() {
			u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
			u = rendererScoreFunctionUtility.produceViewConfig(u);	
		});

		context('when the view orientation is set to be vertical', () => { 

			context('when the discrete score function plot has not been initialized yet and the number of users is one', () => { 

				before(function() {
					scoreFunctionRenderer.scoreFunctionChanged(u);
				});

				it('should initialize the score function plot by creating the necessary hierarchy of SVG containers', () => { 
					expect(scoreFunctionRenderer.rootContainer).to.not.be.undefined;
					expect(scoreFunctionRenderer.outlineContainer).to.not.be.undefined;
					expect(scoreFunctionRenderer.plotContainer).to.not.be.undefined;
					expect(scoreFunctionRenderer.plotElementsContainer).to.not.be.undefined;
					expect(scoreFunctionRenderer.userContainers).to.not.be.undefined;
					expect(scoreFunctionRenderer.axisContainer).to.not.be.undefined;

					expect(scoreFunctionRenderer.linesContainer).to.not.be.undefined;
					expect(scoreFunctionRenderer.pointsContainer).to.not.be.undefined;
				});

				it('should have created exactly as many sets of bars as there are elements in the objective\'s domain', () => { 
					checkNumberOfPointSets(u);
				});

				it('should have created one bar per user per element in the objective\'s domain', () => { 
					checkNumberOfUserPoints(u);
				});

				it('should have created the axes of the score function plot', () => { 
					expect(scoreFunctionRenderer.utilityAxisContainer).to.not.be.undefined;
					expect(scoreFunctionRenderer.unitsLabel).to.not.be.undefined;
					expect(scoreFunctionRenderer.unitsLabel.node().textContent).to.equal((<ContinuousDomain> u.objective.getDomain()).unit); 		// The score function discrete/categorical so it should have not units.
					expect(scoreFunctionRenderer.domainAxis).to.not.be.undefined;
				});

				it('should position and style the elements making up the score function plot', () => {
					checkRenderedAxes(u);
					checkRenderedUserPoints(u, 'x', 'y');
				});

				it('should color the score function plot elements to indicate the objective it is for', () => {
					expect(rgbaToHex(scoreFunctionRenderer.plottedPoints.style('fill'))).to.equal(_.toLower(u.objective.getColor()));
				});
			});

			context('when the number of users is increased to be two', () => {

				before(function() {
					bob = new User();
					bob.setScoreFunctionMap(aaron.getScoreFunctionMap());
					bob.setWeightMap(aaron.getWeightMap());
					bob = randomizeUserScoreFunction(bob, u.objective);
					bob.color = "#FF0000";

					hotelChart.setUser(bob);

					u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId()), bob.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())]
					u.colors = [aaron.color, bob.color];
					u.individual = false;
					u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
					u = rendererScoreFunctionUtility.produceViewConfig(u);	
					scoreFunctionRenderer.scoreFunctionChanged(u);

				});

				it('should create new SVG elements so that there is one bar in the bar chart per user per element in the objective\'s domain', () => { 
					checkNumberOfPointSets(u);
					checkNumberOfUserPoints(u);
				});


				it('should re-render the score function plot and correctly position and style its SVG elements without error', () => {
					checkRenderedUserPoints(u, 'x', 'y');
					checkRenderedAxes(u);
				});

				it('should color the score function plot elements to indicate the user they correspond to', () => {
					scoreFunctionRenderer.userContainers.nodes().forEach((userContainer: SVGAElement, i: number) => {
						let selection = d3.select(userContainer);

						expect(rgbaToHex(selection.selectAll('.' + defs.POINT).style('fill'))).to.equal(_.toLower(hotelChart.getUsers()[i].color));
					});

				});

				context('when one of the user\'s colors is changed', () => {

					before(function() {
						aaron.color = "#00FF00";
						u.colors = [aaron.color, bob.color];

						u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
						u = rendererScoreFunctionUtility.produceViewConfig(u);	
						scoreFunctionRenderer.scoreFunctionChanged(u);
					});

					it('should update the colors of the score function plots to reflect the user\'s new color', () => {
						scoreFunctionRenderer.userContainers.nodes().forEach((userContainer: SVGAElement, i: number) => {
							let selection = d3.select(userContainer);

							expect(rgbaToHex(selection.selectAll('.' + defs.POINT).style('fill'))).to.equal(_.toLower(hotelChart.getUsers()[i].color));
						});
					});	
				});	
			});

			context('when the user score functions are modified', () => {

				before(function() {
					bob = randomizeUserScoreFunction(bob, u.objective);

					u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId()), bob.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())]
					
					u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
					u = rendererScoreFunctionUtility.produceViewConfig(u);	
					scoreFunctionRenderer.scoreFunctionChanged(u);
				});

				it('should re-render the score function plot and correctly position and style its SVG elements without error', () => {
					checkRenderedUserPoints(u, 'x', 'y');
				});

			});

			context('when the number of users is reduced to be one again', () => {
				before(function() {
					u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())];
					u.colors = [aaron.color];
					u.individual = true;

					u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
					u = rendererScoreFunctionUtility.produceViewConfig(u);	
					scoreFunctionRenderer.scoreFunctionChanged(u);				
				});

				it('should re-render the score function plot and correctly position and style its SVG elements without error', () => {
					checkRenderedUserPoints(u, 'x', 'y');
					checkRenderedAxes(u);
				});

				it('should color the score function plot elements to indicate the objective it is for', () => {
					expect(rgbaToHex(scoreFunctionRenderer.plottedPoints.style('fill'))).to.equal(_.toLower(u.objective.getColor()));
				});
			});

			context('when the number of users is decreased to be zero', () => {
				
				before(function() {
					u.scoreFunctions = [];
					u.colors = [];
					u.individual = false;

					u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
					u = rendererScoreFunctionUtility.produceViewConfig(u);	
					scoreFunctionRenderer.scoreFunctionChanged(u);
				});

				it('should update the SVG elements to have one bar per user per element in the objective\'s domain (this is zero bars)', () => { 
					checkNumberOfPointSets(u);
					checkNumberOfUserPoints(u);
				});

				it('should re-render the score function plot and correctly position and style its SVG elements without error', () => {
					checkRenderedUserPoints(u, 'x', 'y');
				});	
			});

		});	

		context('when the view orientation is set to be horizontal', () => {

			before(function() {
				u.scoreFunctions = [aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId())];
				u.colors = [aaron.color];

				u.viewOrientation = ChartOrientation.Horizontal;

				u = rendererScoreFunctionUtility.produceScoreFunctionData(u);
				u = rendererScoreFunctionUtility.produceViewConfig(u);	
				scoreFunctionRenderer.scoreFunctionChanged(u);
			});

			it('should re-render the score function plot and correctly position and style its SVG elements without error', () => {
				checkRenderedAxes(u);
				checkRenderedUserPoints(u, 'y', 'x');
			});
		});
	});

	describe('public viewConfigChanged = (displayScoreFunctionValueLabels: boolean)', () => {

		before(function() {
			scoreFunctionRenderer.viewConfigChanged(false);
		});

		context('when the all of the view options are disabled in the viewConfig object', () => {
			it('should hide all of the optional SVG elements for those view options', () => {
				expect(scoreFunctionRenderer.pointLabelContainer.style('display')).to.equal('none');
			});
		});

		context('when the "displayScoreFunctionValueLabels" view option is enabled', () => {
			before(function() {
				scoreFunctionRenderer.viewConfigChanged(true);
			});


			it('should display value labels in the score function plot', () => {
				expect(scoreFunctionRenderer.pointLabelContainer.style('display')).to.equal('block');
			});
		});
	});

	describe('public interactionConfigChanged = (interactionConfig: any)', () => {
		before(function() {
			scoreFunctionRenderer.interactionConfigChanged(u.interactionConfig);
		});

		context('when all of the interaction options are disabled in the interactionConfig object', () => {
			it('should set the score interaction functions to be disabled', () => {
				expect(expandScoreFunctionInteraction.enableExpanding).to.be.false;
				expect(adjustScoreFunctionInteraction.adjustScoreFunctions).to.be.false;
			});
		});

		context('when the interaction options are enabled in the interactionConfig object', () => {
			before(function() {
				u.interactionConfig = { adjustScoreFunctions: true, expandScoreFunctions: true }
				scoreFunctionRenderer.interactionConfigChanged(u.interactionConfig);
			});

			it('should set the score function interactions to be enabled', () => {
				expect(expandScoreFunctionInteraction.enableExpanding).to.be.true;
				expect(adjustScoreFunctionInteraction.adjustScoreFunctions).to.be.true;
			});
		});
	});

	after(function() {
		fixture.destroy();

		TestBed.resetTestingModule();
	});



	var checkNumberOfPointSets = (u: ScoreFunctionUpdate) => {
		scoreFunctionRenderer.userContainers.nodes().forEach((userContainer: SVGAElement, i: number) => {
			let points = d3.select(userContainer).selectAll('.' + defs.POINT).nodes();
			let fitLines = d3.select(userContainer).selectAll('.' + defs.FITLINE).nodes();
			let numberOfDomainElements = aaron.getScoreFunctionMap().getObjectiveScoreFunction(u.objective.getId()).getAllElements().length;
			expect(points).to.have.length(numberOfDomainElements);
			expect(fitLines).to.have.length(numberOfDomainElements - 1);
		});
	};


	var checkNumberOfUserPoints = (u: ScoreFunctionUpdate) => {
		expect(scoreFunctionRenderer.userContainers.nodes()).to.have.length(u.scoreFunctions.length);
	};

	var checkRenderedUserPoints = (u: ScoreFunctionUpdate, coordinateOne: string, coordinateTwo: string) => {
		scoreFunctionRenderer.userContainers.nodes().forEach((userContainer: SVGAElement, i: number) => {
			let points = d3.select(userContainer).selectAll('.' + defs.POINT).nodes();
			let fitLines = d3.select(userContainer).selectAll('.' + defs.FITLINE).nodes()
			
			points.forEach((point: SVGElement, j: number) => {
				let pointSelection = d3.select(point);
				let score = u.scoreFunctions[i].getScore(elements[j]);

				expect(+pointSelection.attr('c' + coordinateTwo)).to.equal(calculatePointCoordinateTwo(u, score, coordinateTwo));

				if (j < points.length - 1) {
					let fitLinesSelection = d3.select(fitLines[j]);

					let previousPoint = pointSelection;
					let nextPoint = d3.select(points[j+1]);

					expect(fitLinesSelection.attr(coordinateOne + '1')).to.equal(pointSelection.attr('c' + coordinateOne));
					expect(fitLinesSelection.attr(coordinateOne + '2')).to.equal(nextPoint.attr('c' + coordinateOne));

					expect(fitLinesSelection.attr(coordinateTwo + '1')).to.equal(pointSelection.attr('c' + coordinateTwo));
					expect(fitLinesSelection.attr(coordinateTwo + '2')).to.equal(nextPoint.attr('c' + coordinateTwo));
				}
			});

		});
	};

	var calculatePointCoordinateTwo = (u: ScoreFunctionUpdate, score: number, coordinate: string) => {
		return (coordinate == 'y') ? (u.rendererConfig.independentAxisCoordinateTwo) - u.heightScale(score) : u.heightScale(score);
	};

	var checkRenderedAxes = (u: ScoreFunctionUpdate) => {

		scoreFunctionRenderer.domainLabels.nodes().forEach((label: SVGElement, i: number) => {
			expect(label.textContent).to.equal(_.toString(elements[i]));
		});

		let utilityAxes = scoreFunctionRenderer.utilityAxisContainer.selectAll('.domain').nodes();
		let ticks = scoreFunctionRenderer.utilityAxisContainer.selectAll('.tick').nodes();

		expect(utilityAxes).to.have.length(1);	// There should be only one utility axis.
		expect(ticks).to.have.length(2);		// There should be two ticks on the utility axis.
	};
});