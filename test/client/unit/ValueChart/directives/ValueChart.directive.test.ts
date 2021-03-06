/*
* @Author: aaronpmishkin
* @Date:   2017-05-28 15:25:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:58
*/

// Import Testing Resources:
import { Component } 														from '@angular/core';
import { ComponentFixture, TestBed, } 										from '@angular/core/testing';
import { By } 																from '@angular/platform-browser';
import { DebugElement } 													from '@angular/core';
import { ElementRef } 														from '@angular/core';

import { expect } 															from 'chai';
import * as sinon 															from 'sinon';

// Import Libraries:
import * as d3 																from 'd3';
import * as _ 																from 'lodash';

// Import Test Utilities: 
import { HotelChartData } 													from '../../../../testData/HotelChartData';
import { BestPaperChartData }												from '../../../../testData/BestPaper';
import { randomizeUserWeights, randomizeAllUserScoreFunctions } 			from '../../../../utilities/Testing.utilities';

// Import Application Classes:
import { ValueChartDirective } 												from '../../../../../client/src/ValueChartVis';

// Services:
import { RenderEventsService } 												from '../../../../../client/src/ValueChartVis';
import { RendererService } 													from '../../../../../client/src/ValueChartVis';
import { ChartUndoRedoService } 											from '../../../../../client/src/ValueChartVis';
import { ChangeDetectionService } 											from '../../../../../client/src/ValueChartVis';
// Renderers:
import { ObjectiveChartRenderer } 											from '../../../../../client/src/ValueChartVis';
import { SummaryChartRenderer } 											from '../../../../../client/src/ValueChartVis';
import { LabelRenderer } 													from '../../../../../client/src/ValueChartVis';
import { ScoreFunctionRenderer } 											from '../../../../../client/src/ValueChartVis';
// Utilities
import { RendererDataUtility } 												from '../../../../../client/src/ValueChartVis';
import { RendererConfigUtility } 											from '../../../../../client/src/ValueChartVis';
import { RendererScoreFunctionUtility } 									from '../../../../../client/src/ValueChartVis';
// Interactions
import { ReorderObjectivesInteraction } 									from '../../../../../client/src/ValueChartVis';
import { ResizeWeightsInteraction } 										from '../../../../../client/src/ValueChartVis';
import { SortAlternativesInteraction } 										from '../../../../../client/src/ValueChartVis';
import { SetObjectiveColorsInteraction } 									from '../../../../../client/src/ValueChartVis';
import { ExpandScoreFunctionInteraction } 									from '../../../../../client/src/ValueChartVis';

import { XmlValueChartParser } 											from '../../../../../client/src/app/utilities/XmlValueChart.parser';

// Import Model Classes
import { ValueChart } 														from '../../../../../client/src/model';
import { User } 															from '../../../../../client/src/model';

// Import Definitions
import { LabelDefinitions } 												from '../../../../../client/src/ValueChartVis';

// Import Types
import { ViewConfig, InteractionConfig } 									from '../../../../../client/src/types';
import { RendererUpdate } 													from '../../../../../client/src/types';
import { RowData, UserScoreData } 											from '../../../../../client/src/types';
import { ChartOrientation, WeightResizeType, SortAlternativesType, PumpType }	from '../../../../../client/src/types';


@Component({
	selector: 'viewer-stub',
	template: `	<ValueChart
					[valueChart]="valueChart"
					[width]="valueChartWidth"
					[height]="valueChartHeight"
					[viewConfig]="viewConfig"
					[interactionConfig]="interactionConfig"
					[usersToDisplay]="usersToDisplay"
					(undoRedo)="updateUndoRedo($event)"
					(renderEvents)="updateRenderEvents($event)">
				</ValueChart>`
})
class ViewerStub {

	public valueChart: ValueChart;
	public usersToDisplay: User[]
	public valueChartWidth: number;
	public valueChartHeight: number;
	public viewConfig: ViewConfig;
	public interactionConfig: InteractionConfig;

	constructor() { }

	public updateUndoRedo = (eventObject: Event) => {

	}

	public updateRenderEvents = (eventObject: Event) => {

	}
}

class MockElementRef extends ElementRef { }

describe('ValueChartDirective', () => {

	// Viewer Instance:
	var viewerStub: ViewerStub;
	// Directive Instance:
	var valueChartDirective: ValueChartDirective;

	// Utility Instances:
	var rendererDataUtility: RendererDataUtility;

	// Renderer Instances:
	var objectiveChartRenderer: ObjectiveChartRenderer;
	var summaryChartRenderer: SummaryChartRenderer;
	var labelRenderer: LabelRenderer;

	// Interaction Instances:
	var reorderObjectivesInteraction: ReorderObjectivesInteraction;
	var resizeWeightsInteraction: ResizeWeightsInteraction;
	var sortAlternativesInteraction: SortAlternativesInteraction;
	var setObjectiveColorsInteraction: SetObjectiveColorsInteraction;
	var expandScoreFunctionInteraction: ExpandScoreFunctionInteraction;

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
	var width: number, height: number, interactionConfig: InteractionConfig, viewConfig: ViewConfig;

	var aaron: User;
	var bob: User;

	var fixture: ComponentFixture<ViewerStub>;

	beforeEach(() => {

		TestBed.resetTestingModule();

		viewConfig = {
    		scaleAlternatives: false,
    		displayWeightDistributions: false,
			viewOrientation: ChartOrientation.Vertical,
			displayScoreFunctions: false,
			displayTotalScores: false,
			displayScales: false,
			displayDomainValues: false,
			displayScoreFunctionValueLabels: false,
			displayAverageScoreLines: false
		};

		interactionConfig = {
			weightResizeType: WeightResizeType.None,
			reorderObjectives: false,
			sortAlternatives: SortAlternativesType.None,
			pumpWeights: PumpType.None,
			setObjectiveColors: false,
			adjustScoreFunctions: false
		};

		TestBed.configureTestingModule({
			providers: [
				ValueChartDirective,
				{ provide: ElementRef, useClass: MockElementRef },
				// Services:
				ChangeDetectionService,
				RenderEventsService,
				ChartUndoRedoService,
				RendererService,
				// Utilities:
				RendererScoreFunctionUtility,
				RendererDataUtility,
				RendererConfigUtility,
				// Renderers:
				ObjectiveChartRenderer,
				SummaryChartRenderer,
				LabelRenderer,
				// Interactions:
				ReorderObjectivesInteraction,
				ResizeWeightsInteraction,
				SortAlternativesInteraction,
				SetObjectiveColorsInteraction,
				ExpandScoreFunctionInteraction,
			],
			declarations: [ViewerStub, ValueChartDirective]
		});

		fixture = TestBed.createComponent(ViewerStub);
		viewerStub = fixture.componentInstance;

		let valueChartDirectiveElement = fixture.debugElement.query(By.directive(ValueChartDirective));
		valueChartDirective = valueChartDirectiveElement.injector.get(ValueChartDirective);

		// Retrieve injected classes from the ValueChartDirective's debug element:
		summaryChartRenderer = valueChartDirectiveElement.injector.get(SummaryChartRenderer);
		objectiveChartRenderer = valueChartDirectiveElement.injector.get(ObjectiveChartRenderer);
		labelRenderer = valueChartDirectiveElement.injector.get(LabelRenderer);

		reorderObjectivesInteraction = valueChartDirectiveElement.injector.get(ReorderObjectivesInteraction)
		resizeWeightsInteraction = valueChartDirectiveElement.injector.get(ResizeWeightsInteraction)
		sortAlternativesInteraction = valueChartDirectiveElement.injector.get(SortAlternativesInteraction)
		setObjectiveColorsInteraction = valueChartDirectiveElement.injector.get(SetObjectiveColorsInteraction)
		expandScoreFunctionInteraction = valueChartDirectiveElement.injector.get(ExpandScoreFunctionInteraction)

		rendererDataUtility = valueChartDirectiveElement.injector.get(RendererDataUtility);

		// Initialize ValueChartDirective spies:

		sinon.spy(valueChartDirective, 'createValueChart');
		sinon.spy(valueChartDirective, 'rendersCompleted');
		sinon.spy(valueChartDirective, 'ngDoCheck');

		// Initialize renderer spies:

		sinon.spy(summaryChartRenderer, 'valueChartChanged');
		sinon.spy(summaryChartRenderer, 'interactionsChanged');
		sinon.spy(summaryChartRenderer, 'viewConfigChanged');

		sinon.spy(objectiveChartRenderer, 'valueChartChanged');
		sinon.spy(objectiveChartRenderer, 'interactionsChanged');
		sinon.spy(objectiveChartRenderer, 'viewConfigChanged');

		sinon.spy(labelRenderer, 'valueChartChanged');
		sinon.spy(labelRenderer, 'interactionsChanged');
		sinon.spy(labelRenderer, 'viewConfigChanged');

		// Pass parameters to the stub component.

		viewerStub.valueChart = hotelChart;
		viewerStub.usersToDisplay = hotelChart.getUsers();
		viewerStub.interactionConfig = interactionConfig;
		viewerStub.viewConfig = viewConfig;
		viewerStub.valueChartWidth = width;
		viewerStub.valueChartHeight = height;

		fixture.detectChanges();
	});

	describe('createValueChart(): void', () => {

		before(function() {
			parser = new XmlValueChartParser();
			var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
			hotelChart = parser.parseValueChart(valueChartDocument);

			viewConfig = {
   				scaleAlternatives: false,
				viewOrientation: ChartOrientation.Vertical,
				displayWeightDistributions: false,
				displayScoreFunctions: false,
				displayTotalScores: false,
				displayScales: false,
				displayDomainValues: false,
				displayScoreFunctionValueLabels: false,
				displayAverageScoreLines: false
			};

			interactionConfig = {
				weightResizeType: WeightResizeType.None,
				reorderObjectives: false,
				sortAlternatives: SortAlternativesType.None,
				pumpWeights: PumpType.None,
				setObjectiveColors: false,
				adjustScoreFunctions: false
			};

			height = 400;
			width = 400;
		});

		context('when the ValueChartDirective is first initialized', () => {

			it('should call createValueChart exactly once to initialize the ValueChart', () => {
				expect((<sinon.SinonSpy>valueChartDirective.createValueChart).calledOnce).to.be.true;
			});

			it('should push exactly one RendererUpdate to the summary, objective, and label renderers', () => {
				expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledOnce).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledOnce).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledOnce).to.be.true;
			});


			it('should call the "rendersCompleted" method exactly once and only AFTER the renderers have finished creating the ValueChart', () => {
				expect((<sinon.SinonSpy>valueChartDirective.rendersCompleted).calledAfter(<sinon.SinonSpy>summaryChartRenderer.valueChartChanged));
				expect((<sinon.SinonSpy>valueChartDirective.rendersCompleted).calledAfter(<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged));
				expect((<sinon.SinonSpy>valueChartDirective.rendersCompleted).calledAfter(<sinon.SinonSpy>labelRenderer.valueChartChanged));
			});

			it('should push a viewConfig update to the renderers', () => {
				expect((<sinon.SinonSpy>summaryChartRenderer.viewConfigChanged).called).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.viewConfigChanged).called).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.viewConfigChanged).called).to.be.true;
			});

			it('should push a interactionConfig update to the renderers', () => {
				expect((<sinon.SinonSpy>summaryChartRenderer.interactionsChanged).called).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.interactionsChanged).called).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.interactionsChanged).called).to.be.true;
			});

			it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {
				let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
				checkCachedRendererUpdates(u);
			});
		});
	});

	describe('ngDoCheck()', () => {

		context('when all of the directive\'s input parameters are held constant (ie. no changes are made to the inputs)', () => {

			before(function() {
				parser = new XmlValueChartParser();
				var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
				hotelChart = parser.parseValueChart(valueChartDocument);

				viewConfig = {
    				scaleAlternatives: false,
    				displayWeightDistributions: false,
					viewOrientation: ChartOrientation.Vertical,
					displayScoreFunctions: false,
					displayTotalScores: false,
					displayScales: false,
					displayDomainValues: false,
					displayScoreFunctionValueLabels: false,
					displayAverageScoreLines: false
				};

				interactionConfig = {
					weightResizeType: WeightResizeType.None,
					reorderObjectives: false,
					sortAlternatives: SortAlternativesType.None,
					pumpWeights: PumpType.None,
					setObjectiveColors: false,
					adjustScoreFunctions: false
				};

				height = 400;
				width = 400;
			});

			it('ngDoCheck should NOT send new update messages to the renderers when change detection is triggered', () => {

				expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledOnce).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledOnce).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledOnce).to.be.true;

				// Trigger second round of change detection.
				fixture.detectChanges();
				expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledTwice).to.be.false;
				expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledTwice).to.be.false;
				expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledTwice).to.be.false;
			});

			it('should still have synchronized cached RendererUpdate fields in the renderer and interaction classes', () => {

				fixture.detectChanges();
				let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
				checkCachedRendererUpdates(u);
			});
		});

		context('when the input ValueChart is modified', () => {

			before(function() {
				parser = new XmlValueChartParser();
				var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
				hotelChart = parser.parseValueChart(valueChartDocument);

				viewConfig = {
    				scaleAlternatives: false,
					viewOrientation: ChartOrientation.Vertical,
					displayWeightDistributions: false,
					displayScoreFunctions: false,
					displayTotalScores: false,
					displayScales: false,
					displayDomainValues: false,
					displayScoreFunctionValueLabels: false,
					displayAverageScoreLines: false
				};

				interactionConfig = {
					weightResizeType: WeightResizeType.None,
					reorderObjectives: false,
					sortAlternatives: SortAlternativesType.None,
					pumpWeights: PumpType.None,
					setObjectiveColors: false,
					adjustScoreFunctions: false
				};

				height = 400;
				width = 400;

				aaron = hotelChart.getUsers()[0];
			});

			context('when an existing user\'s weights are changed', () => {
				it('should synchronize the changed User to the ValueChartDirective', () => {
					aaron = randomizeAllUserScoreFunctions(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();
					expect(valueChartDirective['valueChart'].getUsers()).to.have.length(1);
					expect(valueChartDirective['valueChart'].getUsers()[0]).to.deep.equal(aaron);
				});

				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {
					aaron = randomizeUserWeights(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();
					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledTwice).to.be.true;
				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {
					aaron = randomizeUserWeights(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
					checkCachedRendererUpdates(u);
				});

			});

			context('when an existing user\'s score functions are changed', () => {

				before(function() {
					parser = new XmlValueChartParser();
					var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
					hotelChart = parser.parseValueChart(valueChartDocument);

					height = 400;
					width = 400;

					aaron = hotelChart.getUsers()[0];
				});

				it('should synchronize the changed User to the ValueChartDirective', () => {
					aaron = randomizeAllUserScoreFunctions(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();

					expect(valueChartDirective['valueChart'].getUsers()).to.have.length(1);
					expect(valueChartDirective['valueChart'].getUsers()[0]).to.deep.equal(aaron);
				});

				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {
					aaron = randomizeAllUserScoreFunctions(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();

					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledTwice).to.be.true;
				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {
					aaron = randomizeAllUserScoreFunctions(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
					checkCachedRendererUpdates(u);
				});

			});

			context('when a new user is added to the ValueChart', () => {

				before(function() {
					parser = new XmlValueChartParser();
					var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
					hotelChart = parser.parseValueChart(valueChartDocument);

					height = 400;
					width = 400;

					aaron = hotelChart.getUsers()[0];
				});

				it('should synchronize the changed ValueChart to the ValueChartDirective', () => {
					aaron = randomizeAllUserScoreFunctions(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();
					fixture.detectChanges();
					expect(valueChartDirective['valueChart']).to.deep.equal(viewerStub.valueChart);
				});

				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {
					bob = createRandomTestUser(viewerStub.valueChart, 'bob');
					viewerStub.valueChart.setUser(bob);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();
					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledTwice).to.be.true;

					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledThrice).to.be.false;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledThrice).to.be.false;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledThrice).to.be.false;

				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {
					bob = createRandomTestUser(viewerStub.valueChart, 'bob');
					viewerStub.valueChart.setUser(bob);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();
					
					fixture.detectChanges();
					let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
					checkCachedRendererUpdates(u);
				});

			});

			context('when a user is deleted from the ValueChart (leaving it with no users)', () => {
				before(function() {
					parser = new XmlValueChartParser();
					var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
					hotelChart = parser.parseValueChart(valueChartDocument);

					height = 400;
					width = 400;

					aaron = hotelChart.getUsers()[0];
				});


				it('should synchronize the changed ValueChart to the ValueChartDirective', () => {
					aaron = randomizeAllUserScoreFunctions(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();
					expect(valueChartDirective['valueChart']).to.deep.equal(viewerStub.valueChart);
				});

				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {
					viewerStub.valueChart.setUsers([]);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();
					
					fixture.detectChanges();
					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledTwice).to.be.true;

					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledThrice).to.be.false;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledThrice).to.be.false;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledThrice).to.be.false;
				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {
					viewerStub.valueChart.setUsers([]);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();
					
					fixture.detectChanges();
					let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
					checkCachedRendererUpdates(u);
				});

			});

			context('when a user is deleted from the ValueChart (when it has many users)', () => {

				before(function() {
					parser = new XmlValueChartParser();
					var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
					hotelChart = parser.parseValueChart(valueChartDocument);

					height = 400;
					width = 400;

					aaron = hotelChart.getUsers()[0];
					hotelChart.setUser(createRandomTestUser(hotelChart, 'bob'));
					hotelChart.setUser(createRandomTestUser(hotelChart, 'james'));

				});

				it('should synchronize the changed ValueChart to the ValueChartDirective', () => {
					aaron = randomizeAllUserScoreFunctions(aaron, viewerStub.valueChart);
					viewerStub.valueChart.setUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();
					expect(valueChartDirective['valueChart']).to.deep.equal(viewerStub.valueChart);
				});

				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {
					viewerStub.valueChart.removeUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();

					fixture.detectChanges();
					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledTwice).to.be.true;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledTwice).to.be.true;

					expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledThrice).to.be.false;
					expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledThrice).to.be.false;
					expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledThrice).to.be.false;
				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {
					viewerStub.valueChart.removeUser(aaron);
					viewerStub.usersToDisplay = viewerStub.valueChart.getUsers();
					
					fixture.detectChanges();
					let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
					checkCachedRendererUpdates(u);
				});

			});

		});

		context('when the view orientation of the ValueChart is changed', () => {
			before(function() {
				parser = new XmlValueChartParser();
				var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
				hotelChart = parser.parseValueChart(valueChartDocument);

				height = 400;
				width = 400;
			});

			it('should re-render the valueChart in the new view orientation', () => {
				viewConfig.viewOrientation = ChartOrientation.Horizontal
				fixture.detectChanges();

				// Determine if the ValueChart sent renderer messages as a result of the changed viewOrientation.
				expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledTwice).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledTwice).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledTwice).to.be.true;

				expect(valueChartDirective['viewConfig'].viewOrientation).to.equal(ChartOrientation.Horizontal);

				let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
				checkCachedRendererUpdates(u);
			});	
		});

		context('when the view configuration is changed', () => {
			before(function() {
				parser = new XmlValueChartParser();
				var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
				hotelChart = parser.parseValueChart(valueChartDocument);

				height = 400;
				width = 400;
			});

			it('should re-render the valueChart in the new view orientation', () => {
				viewerStub.viewConfig = {
    				scaleAlternatives: false,
					viewOrientation: ChartOrientation.Vertical,
					displayWeightDistributions: false,
					displayScoreFunctions: true,
					displayTotalScores: false,
					displayScales: true,
					displayDomainValues: false,
					displayScoreFunctionValueLabels: true,
					displayAverageScoreLines: false
				};
				fixture.detectChanges();

				// Determine if the ValueChart sent renderer messages as a result of the changed viewOrientation.
				expect((<sinon.SinonSpy>summaryChartRenderer.viewConfigChanged).calledTwice).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.viewConfigChanged).calledTwice).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.viewConfigChanged).calledTwice).to.be.true;

				expect(labelRenderer.rootContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).style('display')).to.equal('block');
				expect(summaryChartRenderer.scoreTotalsContainer.style('display')).to.equal('none');
				expect(summaryChartRenderer.utilityAxisContainer.style('display')).to.equal('block');
				expect(objectiveChartRenderer.domainLabels.style('display')).to.equal('none');
				expect(summaryChartRenderer.averageLinesContainer.style('display')).to.equal('none');
			});	
		});

		context('when the interaction configuration is changed', () => {
			before(function() {
				parser = new XmlValueChartParser();
				var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
				hotelChart = parser.parseValueChart(valueChartDocument);

				height = 400;
				width = 400;
			});

			it('should re-render the valueChart in the new view orientation', () => {
				viewerStub.interactionConfig = {
					weightResizeType: WeightResizeType.Neighbors,
					reorderObjectives: true,
					sortAlternatives: SortAlternativesType.Manually,
					pumpWeights: PumpType.Increase,
					setObjectiveColors: true,
					adjustScoreFunctions: true
				};

				fixture.detectChanges();

				// TODO <@aaron>: Improve testability of interactions. As of now, there is no good way to determine if the interactions have been toggled on.
			});	
		});

		context('when the width and/or height of the ValueChart is changed', () => {
			before(function() {
				parser = new XmlValueChartParser();
				var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
				hotelChart = parser.parseValueChart(valueChartDocument);

				height = 400;
				width = 400;
			});

			it('should re-render the valueChart in the new view orientation', () => {
				viewerStub.valueChartWidth = 500;
				viewerStub.valueChartHeight = 500;

				fixture.detectChanges();

				expect(valueChartDirective['el'].attr('viewBox')).to.equal('0 -10' + ' ' + viewerStub.valueChartWidth + ' ' + viewerStub.valueChartHeight);
				expect(valueChartDirective['defaultChartComponentWidth']).to.equal(valueChartDirective.CHART_COMPONENT_RATIO * viewerStub.valueChartWidth);
				expect(valueChartDirective['defaultChartComponentHeight']).to.equal(valueChartDirective.CHART_COMPONENT_RATIO * viewerStub.valueChartHeight);
			});	
		});

	});

	after(function() {
		fixture.destroy();

		TestBed.resetTestingModule();
	});

	var createRandomTestUser = (valueChart: ValueChart, name: string) => {
		var user = new User(name);
		user.setScoreFunctionMap(valueChart.getUsers()[0].getScoreFunctionMap());
		user.setWeightMap(valueChart.getUsers()[0].getWeightMap());

		user = randomizeAllUserScoreFunctions(user, valueChart);
		user = randomizeUserWeights(user, valueChart);

		return user;
	}

	var checkCachedRendererUpdates = (u: RendererUpdate) => {

		// They should have the same attributes:
		expect(summaryChartRenderer.lastRendererUpdate.valueChart).to.deep.equal(u.valueChart);
		expect(objectiveChartRenderer.lastRendererUpdate.valueChart).to.deep.equal(u.valueChart);
		expect(labelRenderer.lastRendererUpdate.valueChart).to.deep.equal(u.valueChart);
		expect(reorderObjectivesInteraction.lastRendererUpdate.valueChart).to.deep.equal(u.valueChart);
		expect(resizeWeightsInteraction.lastRendererUpdate.valueChart).to.deep.equal(u.valueChart);
		expect(sortAlternativesInteraction.lastRendererUpdate.valueChart).to.deep.equal(u.valueChart);

		// They should be the same attribute references:
		expect(labelRenderer.lastRendererUpdate.valueChart).to.equal(u.valueChart);
		expect(summaryChartRenderer.lastRendererUpdate.valueChart).to.equal(u.valueChart);
		expect(objectiveChartRenderer.lastRendererUpdate.valueChart).to.equal(u.valueChart);
		expect(reorderObjectivesInteraction.lastRendererUpdate.valueChart).to.equal(u.valueChart);
		expect(resizeWeightsInteraction.lastRendererUpdate.valueChart).to.equal(u.valueChart);
		expect(sortAlternativesInteraction.lastRendererUpdate.valueChart).to.equal(u.valueChart);

		// Check score function updates:
		u.valueChart.getAllPrimitiveObjectives().forEach((objective) => {
			let scoreFunctionRenderer: ScoreFunctionRenderer = labelRenderer.labelSelections[objective.getId() + '-scorefunction'].renderer;

			expect(scoreFunctionRenderer.lastRendererUpdate).to.deep.equal(scoreFunctionRenderer.adjustScoreFunctionInteraction.lastRendererUpdate);
			expect(scoreFunctionRenderer.lastRendererUpdate).to.deep.equal(scoreFunctionRenderer.expandScoreFunctionInteraction.lastRendererUpdate);

			expect(scoreFunctionRenderer.lastRendererUpdate).to.equal(scoreFunctionRenderer.adjustScoreFunctionInteraction.lastRendererUpdate);
			expect(scoreFunctionRenderer.lastRendererUpdate).to.equal(scoreFunctionRenderer.expandScoreFunctionInteraction.lastRendererUpdate);
		});
	}
});








