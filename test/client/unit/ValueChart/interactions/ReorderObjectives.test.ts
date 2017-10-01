/*
* @Author: aaronpmishkin
* @Date:   2017-06-02 17:39:11
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:57
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
import { RendererDataUtility }							from '../../../../../client/src/ValueChartVis';
import { RendererService }								from '../../../../../client/src/ValueChartVis';
import { ChartUndoRedoService }							from '../../../../../client/src/ValueChartVis';
import { ReorderObjectivesInteraction }					from '../../../../../client/src/ValueChartVis';

import { XmlValueChartParser }							from '../../../../../client/src/app/utilities/XmlValueChart.parser';

// Import Definitions Classes:
import { LabelDefinitions }								from '../../../../../client/src/ValueChartVis';

// Import Model Classes
import { ValueChart }									from '../../../../../client/src/model';
import { Objective }									from '../../../../../client/src/model';
import { Alternative }									from '../../../../../client/src/model';
import { PrimitiveObjective }							from '../../../../../client/src/model';
import { AbstractObjective }							from '../../../../../client/src/model';
import { AlternativesRecord }							from '../../../../../client/src/types';

// Import Types
import { ViewConfig }									from '../../../../../client/src/types';
import { RendererUpdate }								from '../../../../../client/src/types';
import { LabelData }									from '../../../../../client/src/types';
import { ChartOrientation }								from '../../../../../client/src/types';


describe('ReorderObjectivesInteraction', () => {

	var rendererDataUtility: RendererDataUtility;
	var chartUndoRedoService: ChartUndoRedoService;
	var reorderObjectivesInteraction: ReorderObjectivesInteraction;

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
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


		parser = new XmlValueChartParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		viewConfig = {
    		scaleAlternatives: false,
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
			x: null,
			y: null,
			maximumWeightMap: null,
			rowData: null,
			labelData: null,
			rendererConfig: null,
			structuralUpdate: null
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