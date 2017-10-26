/*
* @Author: aaronpmishkin
* @Date:   2017-06-02 13:53:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:56
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
import { ResizeWeightsInteraction }						from '../../../../../client/src/ValueChartVis';

import { XmlValueChartParser }							from '../../../../../client/src/app/utilities/XmlValueChart.parser';

// Import Definitions Classes:
import { LabelDefinitions }								from '../../../../../client/src/ValueChartVis';

// Import Model Classes
import { ValueChart }									from '../../../../../client/src/model';
import { Objective }									from '../../../../../client/src/model';
import { Alternative }									from '../../../../../client/src/model';
import { PrimitiveObjective }							from '../../../../../client/src/model';
import { AlternativesRecord }							from '../../../../../client/src/types';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/src/types';
import { RendererUpdate }								from '../../../../../client/src/types';
import { LabelData }									from '../../../../../client/src/types';
import { ChartOrientation, WeightResizeType, PumpType }	from '../../../../../client/src/types';


describe('ResizeWeightsInteraction', () => {

	var rendererDataUtility: RendererDataUtility;
	var chartUndoRedoService: ChartUndoRedoService;
	var resizeWeightsInteraction: ResizeWeightsInteraction;

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
	var width: number, height: number, interactionConfig: InteractionConfig, viewConfig: ViewConfig;
	var u: RendererUpdate;

	var rootContainer: Element;

	beforeEach(function() {
		TestBed.configureTestingModule({
			providers: [ RendererDataUtility, ChartUndoRedoService, RendererService, ResizeWeightsInteraction ]
		});

		rendererDataUtility = TestBed.get(RendererDataUtility);
		chartUndoRedoService = TestBed.get(ChartUndoRedoService);
		resizeWeightsInteraction = TestBed.get(ResizeWeightsInteraction);


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
			sortAlternatives: null,
			pumpWeights: PumpType.None,
			setObjectiveColors: false,
			adjustScoreFunctions: false
		};

		height = 100;
		width = 100;

		u = {
			el: null,
			valueChart: hotelChart,
			usersToDisplay: hotelChart.getUsers(),
			reducedInformation: false,
			viewConfig: viewConfig,
			interactionConfig: interactionConfig,
			renderRequired: { value: false },
			height: height,
			width: width,
			x: 0,
			y: 0,
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

	describe('public togglePump(pumpType: PumpType, primitiveObjectiveLabels: NodeListOf<Element>, rendererUpdate: RendererUpdate): void', () => {
		
		it('should toggle the pump interaction on when the PumpType is Increase', () => {
			let labels = rootContainer.querySelectorAll('.' + LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);

			expect(resizeWeightsInteraction['clicks']).to.not.exist;
			expect(resizeWeightsInteraction['onClick']).to.not.exist;

			resizeWeightsInteraction.togglePump(PumpType.Increase, labels, u);

			expect(resizeWeightsInteraction['clicks']).to.exist;
			expect(resizeWeightsInteraction['onClick']).to.exist;
		});

		it('should toggle the pump interaction on when the PumpType is Decrease', () => {
			let labels = rootContainer.querySelectorAll('.' + LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);

			expect(resizeWeightsInteraction['clicks']).to.not.exist;
			expect(resizeWeightsInteraction['onClick']).to.not.exist;

			resizeWeightsInteraction.togglePump(PumpType.Decrease, labels, u);

			expect(resizeWeightsInteraction['clicks']).to.exist;
			expect(resizeWeightsInteraction['onClick']).to.exist;
			expect(resizeWeightsInteraction['onClick'].closed).to.be.false;

		});

		it('should toggle the pump interaction off when the PumpType is None', () => {
			let labels = rootContainer.querySelectorAll('.' + LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);

			resizeWeightsInteraction.togglePump(PumpType.Decrease, labels, u);

			expect(resizeWeightsInteraction['clicks']).to.exist;
			expect(resizeWeightsInteraction['onClick']).to.exist;
			expect(resizeWeightsInteraction['onClick'].closed).to.be.false;

			resizeWeightsInteraction.togglePump(PumpType.None, labels, u);
			expect(resizeWeightsInteraction['onClick'].closed).to.be.true;
		});
	});

	describe('onPump = (eventObject: Event)', () => {
		context('when the PumpType is Decrease', () => {
			it('should decrease the objective weight by exactly one percent', () => {
				resizeWeightsInteraction.lastRendererUpdate = u;

				let objective = u.valueChart.getAllPrimitiveObjectives()[0];
				let aaron = u.valueChart.getUsers()[0];
				let previousWeight = aaron.getWeightMap().getNormalizedObjectiveWeight(objective.getId());

				let labelDatum: LabelData = { objective: objective, weight: previousWeight, depth: null, depthOfChildren: 0, subLabelData: null }

				let selection = d3.selectAll('rect').data([labelDatum]).enter().append('rect');

				let event: any = {} 
				event.target = selection.node();
				event.pumpType = PumpType.Decrease;

				resizeWeightsInteraction['onPump'](event);

				expect(aaron.getWeightMap().getNormalizedObjectiveWeight(objective.getId())).to.equal(previousWeight - 0.01);
			});
		});

		context('when the PumpType is Increase', () => {
			it('should decrease the objective weight by exactly one percent', () => {
				resizeWeightsInteraction.lastRendererUpdate = u;

				let objective = u.valueChart.getAllPrimitiveObjectives()[0];
				let aaron = u.valueChart.getUsers()[0];
				let previousWeight = aaron.getWeightMap().getNormalizedObjectiveWeight(objective.getId());

				let labelDatum: LabelData = { objective: objective, weight: previousWeight, depth: null, depthOfChildren: 0, subLabelData: null }

				d3.select(document).selectAll('rect').remove();
				let selection = d3.selectAll('rect').data([labelDatum]).enter().append('rect');

				let event: any = {} 
				event.target = selection.node();
				event.pumpType = PumpType.Increase;

				resizeWeightsInteraction['onPump'](event);

				expect(aaron.getWeightMap().getNormalizedObjectiveWeight(objective.getId())).to.equal(previousWeight + 0.01);
			});
		});
	});

	describe('public toggleDragToResizeWeights(resizeType: WeightResizeType, rootContainer: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate): void', () => {
		
		it('should toggle the drag to resize interaction on when the WeightResizeType is Neighbors', () => {
			resizeWeightsInteraction.toggleDragToResizeWeights(WeightResizeType.Neighbors, d3.select(rootContainer), u);
		});

		it('should toggle the drag to resize on when the PumpType is the WeightResizeType is Siblings', () => {
			u.viewConfig.viewOrientation = ChartOrientation.Horizontal;
			resizeWeightsInteraction.toggleDragToResizeWeights(WeightResizeType.Siblings, d3.select(rootContainer), u);
		});

		it('should toggle the drag to resize off when the the WeightResizeType is None', () => {
			resizeWeightsInteraction.toggleDragToResizeWeights(WeightResizeType.Neighbors, d3.select(rootContainer), u);

			resizeWeightsInteraction.toggleDragToResizeWeights(WeightResizeType.None, d3.select(rootContainer), u);
		});
	});

	describe('private resizeNeighbors = (d: LabelData, i: number, deltaWeight: number, weightMap: WeightMap, siblings: LabelData[])', () => {

		context('when the neighbors whose weights are being resized are both PrimitiveObjectives', () => {
			context('when the increment (deltaWeight) is positive', () => {

				context('when the increment would not force one of the neighbors to have negative weight', () => {
					it('should increment one sibling by deltaWeight and decrement the other by deltaWeight', () => {
						let weightMap = u.valueChart.getUsers()[0].getWeightMap();

						let siblings = u.labelData[0].subLabelData[0].subLabelData;
						let aboveSibling = u.labelData[0].subLabelData[0].subLabelData[0];
						let belowSibling = u.labelData[0].subLabelData[0].subLabelData[1];
						let oldAboveSiblingWeight = aboveSibling.weight;
						let oldBelowSiblingWeight = belowSibling.weight;
												// 1 is the index of the lower sibling in the siblings array.
						resizeWeightsInteraction['resizeNeighbors'](belowSibling, 1, 0.02, weightMap, siblings);

						expect(weightMap.getObjectiveWeight(belowSibling.objective.getId())).to.equal(oldBelowSiblingWeight + 0.02);
						expect(weightMap.getObjectiveWeight(aboveSibling.objective.getId())).to.equal(oldAboveSiblingWeight - 0.02)
					});
				});

				context('when the increment would force one of the neighbors to have negative weight', () => {
					it('should increment one sibling by the weight of the other, which should be given a weight of zero', () => {
						let weightMap = u.valueChart.getUsers()[0].getWeightMap();

						let siblings = u.labelData[0].subLabelData[0].subLabelData;
						let aboveSibling = u.labelData[0].subLabelData[0].subLabelData[0];
						let belowSibling = u.labelData[0].subLabelData[0].subLabelData[1];
						let oldAboveSiblingWeight = aboveSibling.weight;
						let oldBelowSiblingWeight = belowSibling.weight;
						// 1 is the index of the lower sibling in the siblings array.
						resizeWeightsInteraction['resizeNeighbors'](belowSibling, 1, oldAboveSiblingWeight + 0.05, weightMap, siblings);

						expect(weightMap.getObjectiveWeight(belowSibling.objective.getId())).to.equal(oldBelowSiblingWeight + oldAboveSiblingWeight);
						expect(weightMap.getObjectiveWeight(aboveSibling.objective.getId())).to.equal(0)
					});
				});
			});

			context('when the increment (deltaWeight) is negative', () => {
				context('when the increment would not force one of the neighbors to have negative weight', () => {
					it('should increment one sibling by deltaWeight and decrement the other by deltaWeight', () => {
						let weightMap = u.valueChart.getUsers()[0].getWeightMap();

						let siblings = u.labelData[0].subLabelData[0].subLabelData;
						let aboveSibling = u.labelData[0].subLabelData[0].subLabelData[0];
						let belowSibling = u.labelData[0].subLabelData[0].subLabelData[1];
						let oldAboveSiblingWeight = aboveSibling.weight;
						let oldBelowSiblingWeight = belowSibling.weight;
						// 1 is the index of the lower sibling in the siblings array.
						resizeWeightsInteraction['resizeNeighbors'](belowSibling, 1, -0.02, weightMap, siblings);

						expect(weightMap.getObjectiveWeight(belowSibling.objective.getId())).to.equal(oldBelowSiblingWeight - 0.02);
						expect(weightMap.getObjectiveWeight(aboveSibling.objective.getId())).to.equal(oldAboveSiblingWeight + 0.02)
					});
				});

				context('when the increment would force one of the neighbors to have negative weight', () => {
					it('should increment one sibling by the weight of the other, which should be given a weight of zero', () => {
						let weightMap = u.valueChart.getUsers()[0].getWeightMap();

						let siblings = u.labelData[0].subLabelData[0].subLabelData;
						let aboveSibling = u.labelData[0].subLabelData[0].subLabelData[0];
						let belowSibling = u.labelData[0].subLabelData[0].subLabelData[1];
						let oldAboveSiblingWeight = aboveSibling.weight;
						let oldBelowSiblingWeight = belowSibling.weight;
						
						// 1 is the index of the lower sibling in the siblings array.
						resizeWeightsInteraction['resizeNeighbors'](belowSibling, 1, -oldBelowSiblingWeight - 0.05, weightMap, siblings);

						expect(weightMap.getObjectiveWeight(belowSibling.objective.getId())).to.equal(0);
						expect(weightMap.getObjectiveWeight(aboveSibling.objective.getId())).to.equal(oldBelowSiblingWeight + oldAboveSiblingWeight)
					});
				});
			});
		});
		context('when one of the neighbors whose weights are being resized are AbstractObjectives', () => {
			context('when the increment (deltaWeight) is positive', () => {

				context('when the increment would not force one of the neighbors to have negative weight', () => {
					it('should increment one sibling by deltaWeight and decrement the other by deltaWeight; increments to an abstract objective\'s weight should be divided evenly amongst its primitive children', () => {
						let weightMap = u.valueChart.getUsers()[0].getWeightMap();

						let siblings = u.labelData[0].subLabelData;
						let aboveSibling = u.labelData[0].subLabelData[1];
						let belowSibling = u.labelData[0].subLabelData[2];
						let oldAboveSiblingWeight = aboveSibling.weight;
						let oldChildWeightOne = aboveSibling.subLabelData[0].weight;
						let oldChildWeightTwo = aboveSibling.subLabelData[1].weight;
						let oldBelowSiblingWeight = belowSibling.weight;
						
						// 2 is the index of the lower sibling in the siblings array.
						resizeWeightsInteraction['resizeNeighbors'](belowSibling, 2, 0.02, weightMap, siblings);

						u = rendererDataUtility.produceLabelData(u);

						expect(weightMap.getObjectiveWeight(belowSibling.objective.getId())).to.equal(oldBelowSiblingWeight + 0.02);
						expect(u.labelData[0].subLabelData[1].weight).to.equal(oldAboveSiblingWeight - 0.02)
						expect(weightMap.getObjectiveWeight(u.labelData[0].subLabelData[1].subLabelData[0].objective.getId())).to.equal(oldChildWeightOne - 0.01);
						expect(weightMap.getObjectiveWeight(u.labelData[0].subLabelData[1].subLabelData[1].objective.getId())).to.equal(oldChildWeightTwo - 0.01);
					});
				});

				context('when the increment would force one of the neighbors to have negative weight', () => {
					it('should increment one sibling by the weight of the other, which should be given a weight of zero; increments to an abstract objective\'s weight should be divided evenly amongst its primitive children', () => {
						let weightMap = u.valueChart.getUsers()[0].getWeightMap();

						let siblings = u.labelData[0].subLabelData;
						let aboveSibling = u.labelData[0].subLabelData[1];
						let belowSibling = u.labelData[0].subLabelData[2];
						let oldAboveSiblingWeight = aboveSibling.weight;
						let oldChildWeightOne = aboveSibling.subLabelData[0].weight;
						let oldChildWeightTwo = aboveSibling.subLabelData[1].weight;
						let oldBelowSiblingWeight = belowSibling.weight;
						
						// 2 is the index of the lower sibling in the siblings array.
						resizeWeightsInteraction['resizeNeighbors'](belowSibling, 2, oldAboveSiblingWeight + 0.1, weightMap, siblings);

						u = rendererDataUtility.produceLabelData(u);

						expect(weightMap.getObjectiveWeight(belowSibling.objective.getId())).to.be.approximately(oldBelowSiblingWeight + oldAboveSiblingWeight, 0.00001);
						expect(u.labelData[0].subLabelData[1].weight).to.equal(0)
						expect(weightMap.getObjectiveWeight(u.labelData[0].subLabelData[1].subLabelData[0].objective.getId())).to.equal(0);
						expect(weightMap.getObjectiveWeight(u.labelData[0].subLabelData[1].subLabelData[1].objective.getId())).to.equal(0);
					});
				});
			});

			context('when the increment (deltaWeight) is negative', () => {
				context('when the increment would not force one of the neighbors to have negative weight', () => {
					it('should increment one sibling by the weight of the other, which should be given a weight of zero; increments to an abstract objective\'s weight should be divided evenly amongst its primitive children', () => {
						let weightMap = u.valueChart.getUsers()[0].getWeightMap();

						let siblings = u.labelData[0].subLabelData;
						let aboveSibling = u.labelData[0].subLabelData[1];
						let belowSibling = u.labelData[0].subLabelData[2];
						let oldAboveSiblingWeight = aboveSibling.weight;
						let oldChildWeightOne = aboveSibling.subLabelData[0].weight;
						let oldChildWeightTwo = aboveSibling.subLabelData[1].weight;
						let oldBelowSiblingWeight = belowSibling.weight;
						
						// 2 is the index of the lower sibling in the siblings array.
						resizeWeightsInteraction['resizeNeighbors'](belowSibling, 2, -0.02, weightMap, siblings);

						u = rendererDataUtility.produceLabelData(u);

						expect(weightMap.getObjectiveWeight(belowSibling.objective.getId())).to.equal(oldBelowSiblingWeight - 0.02);
						expect(u.labelData[0].subLabelData[1].weight).to.be.approximately(oldAboveSiblingWeight + 0.02, 0.00001)
						expect(weightMap.getObjectiveWeight(u.labelData[0].subLabelData[1].subLabelData[0].objective.getId())).to.be.approximately(oldChildWeightOne + 0.01, 0.00001);
						expect(weightMap.getObjectiveWeight(u.labelData[0].subLabelData[1].subLabelData[1].objective.getId())).to.be.approximately(oldChildWeightTwo + 0.01, 0.00001);
					});
				});
			});
		});
	});

	describe('private resizeSiblings = (d: LabelData, i: number, deltaWeight: number, combinedWeight: number, weightMap: WeightMap, siblings: LabelData[])', () => {

	});

	after(function() {
		TestBed.resetTestingModule();
	});
});	








