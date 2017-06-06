/*
* @Author: aaronpmishkin
* @Date:   2017-06-02 17:39:11
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-06 15:39:33
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

// Import Application Classes:
import { RendererDataUtility }							from '../../../../../client/resources/modules/ValueChart/utilities/RendererData.utility';
import { RendererService }								from '../../../../../client/resources/modules/ValueChart/services/Renderer.service';
import { ChartUndoRedoService }							from '../../../../../client/resources/modules/ValueChart/services/ChartUndoRedo.service';
import { ReorderObjectivesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/ReorderObjectives.interaction';

import { WebValueChartsParser }							from '../../../../../client/resources/modules/utilities/classes/WebValueChartsParser';

// Import Definitions Classes:
import { LabelDefinitions }								from '../../../../../client/resources/modules/ValueChart/definitions/Label.definitions';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { Objective }									from '../../../../../client/resources/model/Objective';
import { Alternative }									from '../../../../../client/resources/model/Alternative';
import { PrimitiveObjective }							from '../../../../../client/resources/model/PrimitiveObjective';
import { AbstractObjective }							from '../../../../../client/resources/model/AbstractObjective';
import { AlternativesRecord }							from '../../../../../client/resources/types/Record.types';

// Import Types
import { ViewConfig }									from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { LabelData }									from '../../../../../client/resources/types/RendererData.types';
import { ChartOrientation }								from '../../../../../client/resources/types/Config.types';


describe('ReorderObjectivesInteraction', () => {

	var rendererDataUtility: RendererDataUtility;
	var chartUndoRedoService: ChartUndoRedoService;
	var reorderObjectivesInteraction: ReorderObjectivesInteraction;

	var hotelChart: ValueChart;
	var parser: WebValueChartsParser;
	var viewConfig: ViewConfig;
	var u: RendererUpdate;

	var rootContainer: Element;

	beforeEach(function() {
		TestBed.configureTestingModule({
			providers: [ RendererDataUtility, ChartUndoRedoService, RendererService, ReorderObjectivesInteraction ]
		});

		rendererDataUtility = TestBed.get(RendererDataUtility);
		chartUndoRedoService = TestBed.get(ChartUndoRedoService);
		reorderObjectivesInteraction = TestBed.get(ReorderObjectivesInteraction);


		parser = new WebValueChartsParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		viewConfig = {
			viewOrientation: ChartOrientation.Vertical,
			displayScoreFunctions: false,
			displayTotalScores: false,
			displayScales: false,
			displayDomainValues: false,
			displayScoreFunctionValueLabels: false,
			displayAverageScoreLines: false
		};

		u = {
			el: null,
			valueChart: hotelChart,
			usersToDisplay: hotelChart.getUsers(),
			viewConfig: viewConfig,
			interactionConfig: null,
			renderRequired: { value: false },
			height: null,
			width: null,
			maximumWeightMap: null,
			rowData: null,
			labelData: null,
			rendererConfig: null
		}

		u = rendererDataUtility.produceMaximumWeightMap(u);
		u = rendererDataUtility.produceLabelData(u);

		rootContainer = document.createElement('g');

		let resizeBar = document.createElement('line');
		resizeBar.classList.add(LabelDefinitions.SUBCONTAINER_DIVIDER);
		resizeBar.setAttribute('parent', LabelDefinitions.ROOT_CONTAINER_NAME);
		rootContainer.appendChild(resizeBar);
		let rectChild = document.createElement('rect');
		rectChild.classList.add(LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);
		resizeBar.setAttribute('parent', LabelDefinitions.ROOT_CONTAINER_NAME);
		rootContainer.appendChild(rectChild);
		let textChild = document.createElement('text');
		textChild.classList.add(LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);
		resizeBar.setAttribute('parent', LabelDefinitions.ROOT_CONTAINER_NAME);
		rootContainer.appendChild(textChild);

		d3.select(document).selectAll('rect').remove();
	});


	describe('public toggleObjectiveReordering(enableReordering: boolean, labelRootContainer: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate): Subject<boolean>', () => {

		context('when objective reordering is set to be enabled', () => {
			it('should turn on the reorder objectives interaction',  () => {
				let subject = reorderObjectivesInteraction.toggleObjectiveReordering(true, d3.select(rootContainer), u);
			
				expect(reorderObjectivesInteraction.lastRendererUpdate).to.deep.equal(u);
				expect(subject).to.exist;
			});
		});	

		context('when objective reordering is set to be disabled', () => {
			it('should turn off the reorder objectives interaction',  () => {
				let subject = reorderObjectivesInteraction.toggleObjectiveReordering(false, d3.select(rootContainer), u);

				expect(reorderObjectivesInteraction.lastRendererUpdate).to.deep.equal(u);
				expect(subject).to.exist;
			});
		});

		context('when objective reordering is first set to be disabled and then disabled', () => {
			it('should turn on and then off the reorder objectives interaction',  () => {
				let subject = reorderObjectivesInteraction.toggleObjectiveReordering(true, d3.select(rootContainer), u);

				expect(reorderObjectivesInteraction.lastRendererUpdate).to.deep.equal(u);
				expect(subject).to.exist;

				subject = reorderObjectivesInteraction.toggleObjectiveReordering(false, d3.select(rootContainer), u);
				expect(reorderObjectivesInteraction.lastRendererUpdate).to.deep.equal(u);
				expect(subject).to.exist;
			});
		});
	});

	describe('private getOrderedRootObjectives(labelData: LabelData[]): Objective[]', () => {

		it('should return a hierarchy of objectives that reflects the hierarchy of labelData', () => {

			let rootObjectives = reorderObjectivesInteraction['getOrderedRootObjectives'](u.labelData);

			var checkObjectives = (objective: Objective, labelDatum: LabelData) => {
					expect(labelDatum.objective).to.deep.equal(objective);
					if (objective.objectiveType == 'abstract') {
						var subObjectives = (<AbstractObjective> objective).getDirectSubObjectives();
						
						expect(labelDatum.subLabelData.length).to.equal(subObjectives.length);

						subObjectives.forEach((subObjective: Objective, i: number) => {
							checkObjectives(subObjective, labelDatum.subLabelData[i]);
						});

					}
				};

		});	

	});	

	after(function() {
		TestBed.resetTestingModule();
	});	

});