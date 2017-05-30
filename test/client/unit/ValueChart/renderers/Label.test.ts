/*
* @Author: aaronpmishkin
* @Date:   2017-05-23 14:55:18
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-29 15:24:01
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
import { Subject }										from 'rxjs/Subject';

// Import Test Utilities 
import { HotelChartData }								from '../../../../testData/HotelChartData';
import { randomizeUserWeights, randomizeAllUserScoreFunctions, rgbaToHex }	from '../../../../utilities/Testing.utilities';

// Import Application Classes:
import { LabelRenderer }								from '../../../../../client/resources/modules/ValueChart/renderers/Label.renderer';
import { ScoreFunctionRenderer }						from '../../../../../client/resources/modules/ValueChart/renderers/ScoreFunction.renderer';

import { RendererConfigUtility }						from '../../../../../client/resources/modules/ValueChart/utilities/RendererConfig.utility';
import { RendererDataUtility }							from '../../../../../client/resources/modules/ValueChart/utilities/RendererData.utility';
import { RendererScoreFunctionUtility }					from '../../../../../client/resources/modules/ValueChart/utilities/RendererScoreFunction.utility';
import { RendererService }								from '../../../../../client/resources/modules/ValueChart/services/Renderer.service';
import { RenderEventsService }							from '../../../../../client/resources/modules/ValueChart/services/RenderEvents.service';
import { ChartUndoRedoService }							from '../../../../../client/resources/modules/ValueChart/services/ChartUndoRedo.service';

import { SortAlternativesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/SortAlternatives.interaction';
import { ResizeWeightsInteraction }						from '../../../../../client/resources/modules/ValueChart/interactions/ResizeWeights.interaction';
import { SetObjectiveColorsInteraction }				from '../../../../../client/resources/modules/ValueChart/interactions/SetObjectiveColors.interaction';
import { ReorderObjectivesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/ReorderObjectives.interaction';
import { ExpandScoreFunctionInteraction }				from '../../../../../client/resources/modules/ValueChart/interactions/ExpandScoreFunction.interaction';

import { WebValueChartsParser }							from '../../../../../client/resources/modules/utilities/classes/WebValueChartsParser';

// Import Definitions Classes:
import { LabelDefinitions }								from '../../../../../client/resources/modules/ValueChart/definitions/Label.definitions';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { Objective }									from '../../../../../client/resources/model/Objective';
import { User }											from '../../../../../client/resources/model/User';
import { ScoreFunction }								from '../../../../../client/resources/model/ScoreFunction';
import { WeightMap }									from '../../../../../client/resources/model/WeightMap';
import { PrimitiveObjective }							from '../../../../../client/resources/model/PrimitiveObjective';
import { AbstractObjective }							from '../../../../../client/resources/model/AbstractObjective';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { LabelData }									from '../../../../../client/resources/types/RendererData.types';



@Component({
	selector: 'label-stub',
	template: `<svg></svg>`
})
class LabelStub {
	constructor() { }
}


describe('LabelRenderer', () => {

var sortAlternativesStub = {
	sortStatus: false,
	SORT_BY_OBJECTIVE: 'objective',

	toggleSortAlternativesByObjectiveScore: (enableSorting: boolean, rootContainer: Element, rendererUpdate: RendererUpdate) => {
		sortAlternativesStub.sortStatus = enableSorting;
	}
};

var resizeWeightsInteractionStub = {
	pumpType: '',
	resizeType: '',

	togglePump: (pumpType: string, primitiveObjectiveLabels: NodeListOf<Element>) => {
		resizeWeightsInteractionStub.pumpType = pumpType;
	},

	toggleDragToResizeWeights: (resizeType: string, rootContainer: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate) => {
		resizeWeightsInteractionStub.resizeType = resizeType;
	}
}

var setObjectiveColorsInteractionStub = {
	setObjectiveColors: false,

	toggleSettingObjectiveColors: (setObjectiveColors: boolean, rootContainer: Element) => {
		setObjectiveColorsInteractionStub.setObjectiveColors = setObjectiveColors;
	}

}

var reorderObjectivesInteractionStub = {
	objectivesReorderedSubject: new Subject(),
	enableReordering: false,

	toggleObjectiveReordering: (enableReordering: boolean, labelRootContainer: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate) => {
		reorderObjectivesInteractionStub.enableReordering = enableReordering;
		return reorderObjectivesInteractionStub.objectivesReorderedSubject;
	}
}


var renderEventsServiceStub = {

	labelsDispatcher: { next: (value: number) => { } }
};

var chartUndoRedoStub = {
	saveScoreFunctionRecord: (scoreFuntion: ScoreFunction, objective: Objective) => {
		return;
	}
};

	var fixture;
	var el: d3.Selection<any, any, any, any>;

	var rendererConfigUtility: RendererConfigUtility;
	var rendererDataUtility: RendererDataUtility;
	var labelRenderer: LabelRenderer;

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
				RendererScoreFunctionUtility,
				LabelRenderer, 
				{ provide: RenderEventsService, useValue: renderEventsServiceStub },
				{ provide: ChartUndoRedoService, useValue: chartUndoRedoStub },
				{ provide: SortAlternativesInteraction, useValue: sortAlternativesStub },
				{ provide: ResizeWeightsInteraction, useValue: resizeWeightsInteractionStub },
				{ provide: SetObjectiveColorsInteraction, useValue: setObjectiveColorsInteractionStub },
				{ provide: ReorderObjectivesInteraction, useValue: reorderObjectivesInteractionStub }
				],

			declarations: [ LabelStub ]
		});

		var fixture = TestBed.createComponent(LabelStub);

		rendererConfigUtility = TestBed.get(RendererConfigUtility);
		rendererDataUtility = TestBed.get(RendererDataUtility);
		labelRenderer = TestBed.get(LabelRenderer);


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
			u = rendererDataUtility.produceLabelData(u);
			u = rendererConfigUtility.produceRendererConfig(u);
		});

		context('when the view orientation is set to be vertical', () => {

			context('when the labels have not been initialized yet and the number of users is one', () => {

				before(function() {
					labelRenderer.valueChartChanged(u);
				});

				it('should initialize the labels by creating the necessary hierarchy of SVG containers', () => {
					expect(labelRenderer.rootContainer).to.not.be.undefined;
					expect(labelRenderer.labelSpaceOutline).to.not.be.undefined;
					expect(labelRenderer.labelContainer).to.not.be.undefined;
					expect(labelRenderer.labelSelections).to.not.be.undefined;
				});

				it('should have created exactly as many labels there are objectives in the ValueChart', () => {
					checkNumberOfLabels(labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives());
				});

				it('should have created one score function plot per primitive objective', () => {
					checkNumberofScoreFunctions(u.valueChart.getAllPrimitiveObjectives());
				});

				it('should position and style the SVG elements making up the labels', () => {
					checkRenderedLabels(u, labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives(), 'height');
				});	

				it('should color each primitive objective\'s label with that objective\'s color', () => {
					labelRenderer.rootContainer.selectAll('.' + LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL).nodes().forEach((label: SVGElement) => {
						var datum: LabelData = <any> d3.select(label).datum();

						if (label.tagName != "text")
							expect(rgbaToHex((<any>label).style.stroke)).to.equal(_.toLower((<PrimitiveObjective> datum.objective).getColor()));
					});
				});
			});

			context('when the weights of the user in the ValueChart are changed', () => {
				before(function() {

					aaron = randomizeUserWeights(aaron, u.valueChart);

					u.valueChart.setUser(aaron);

					viewConfig.displayScoreFunctions = false;

					u = rendererDataUtility.produceMaximumWeightMap(u);
					u = rendererDataUtility.produceLabelData(u);
					u = rendererConfigUtility.produceRendererConfig(u);

					labelRenderer.valueChartChanged(u);
				});	

				it('should re-render the labels so that the height of each label is proportional to its weight (or the total weight of its children)', () => {
					checkRenderedLabels(u, labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives(), 'height');
				});	

				context('when the score function plots are not being displayed',() => {

					it('should not re-render the score function plots', () => {
						checkRenderedScoreFunctionPlots(false, 'height');				// The height of the score function should NOT be updated by re-rendering when the score function is hidden.
					});		
				});

				context('when the score function plots toggled via the viewConfigChanged', () => {
					before(function() {
						viewConfig.displayScoreFunctions = true;
						labelRenderer.viewConfigChanged(viewConfig);
					});

					it('should re-render the score function plots immediately', () => {
						checkRenderedScoreFunctionPlots(true, 'height');				// The height of the score function should now be updated since they are no longer hidden.
					});

					context('when the weights of a user in the ValueChart are changed', () => {
						before(function() {
							aaron = randomizeUserWeights(aaron, u.valueChart);

							u = rendererDataUtility.produceMaximumWeightMap(u);
							u = rendererDataUtility.produceLabelData(u);
							u = rendererConfigUtility.produceRendererConfig(u);

							labelRenderer.valueChartChanged(u);
						});	


						it('should re-render the score function plots', () => {
							checkRenderedScoreFunctionPlots(true, 'height');
						});
					});	
				});
			});

			context('when the number of users in the ValueChart is increased to be two', () => {
				before(function() {
					bob = new User();
					bob.setWeightMap(new WeightMap());
					bob = randomizeUserWeights(bob, u.valueChart);
					bob.setScoreFunctionMap(aaron.getScoreFunctionMap());
					u.valueChart.setUser(bob);

					u = rendererDataUtility.produceMaximumWeightMap(u);
					u = rendererDataUtility.produceLabelData(u);
					u = rendererConfigUtility.produceRendererConfig(u);

					labelRenderer.valueChartChanged(u);	
				});

				it('should color each primitive objective\'s label gray since color is now used to indicate users', () => {
					labelRenderer.rootContainer.selectAll('.' + LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL).nodes().forEach((label: SVGElement) => {
						var datum: LabelData = <any> d3.select(label).datum();

						if (label.tagName != "text")
							expect((<any>label).style.stroke).to.equal('gray');
					});					
				});
			});

			context('when the number of users in the ValueCHart is decreased to be zero', () => {
				before(function() {
					u.valueChart.setUsers([]);

					u = rendererDataUtility.produceMaximumWeightMap(u);
					u = rendererDataUtility.produceLabelData(u);
					u = rendererConfigUtility.produceRendererConfig(u);

					labelRenderer.valueChartChanged(u);	
				});	

				it('should render the label area', () => {
					checkNumberOfLabels(labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives());
					checkNumberofScoreFunctions(u.valueChart.getAllPrimitiveObjectives());
					checkRenderedLabels(u, labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives(), 'height');
				});
			});
		});

		context('when the viewOrientation is set to be "horizontal"', () => {
			before(function() {

				u.valueChart.setUser(aaron);

				viewConfig.viewOrientation = 'horizontal';
				u = rendererDataUtility.produceMaximumWeightMap(u);
				u = rendererDataUtility.produceLabelData(u);
				u = rendererConfigUtility.produceRendererConfig(u);

				labelRenderer.valueChartChanged(u);	
				labelRenderer.viewConfigChanged(u.viewConfig);
			});

			it('should re-render the labels to be horizontal', () => {
				checkRenderedLabels(u, labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives(), 'width');
				checkRenderedScoreFunctionPlots(true, 'width');
			});
		});	

		context('when the order of objectives in the objective hierarchy is changed', () => {

			before(function() {
				let objectives = (<AbstractObjective> u.valueChart.getRootObjectives()[0]).getDirectSubObjectives();
				let temp: any = objectives[0];

				objectives[0] = objectives[2];
				objectives[2] = temp;

				(<AbstractObjective> u.valueChart.getRootObjectives()[0]).setDirectSubObjectives(objectives);

				labelRenderer.reordered = true;

				temp = u.labelData[0].subLabelData[0];
				u.labelData[0].subLabelData[0] = u.labelData[0].subLabelData[2];
				u.labelData[0].subLabelData[2] = temp;
				
				u = rendererDataUtility.produceMaximumWeightMap(u);
				u = rendererDataUtility.produceLabelData(u);
				u = rendererConfigUtility.produceRendererConfig(u);

				labelRenderer.valueChartChanged(u);	
			});

			it('should re-render the labels to reflect the new objective ordering', () => {
				checkNumberOfLabels(labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives());
				checkNumberofScoreFunctions(u.valueChart.getAllPrimitiveObjectives());
				checkRenderedLabels(u, labelRenderer.rootContainer, LabelDefinitions.ROOT_CONTAINER_NAME, u.valueChart.getRootObjectives(), 'width');
				checkRenderedScoreFunctionPlots(true, 'width');
			});

		});
	});

	describe('public interactionsChanged = (interactionConfig: InteractionConfig)', () => {

		context('when all of the interaction options are disabled in the interactionConfig object', () => {

			before(function() {
				labelRenderer.interactionsChanged(interactionConfig);
			});

			it('should toggle all interactions to be off/none', () => {
				expect(sortAlternativesStub.sortStatus).to.be.false;
				expect(resizeWeightsInteractionStub.pumpType).to.equal('none');
				expect(resizeWeightsInteractionStub.resizeType).to.equal('none');
				expect(setObjectiveColorsInteractionStub.setObjectiveColors).to.be.false;
				expect(reorderObjectivesInteractionStub.enableReordering).to.be.false;
			});

		});

		context('when the interaction options are enabled in the interaction configuration object', () => {
			
			before(function() {
				interactionConfig.pumpWeights = 'increase';
				interactionConfig.weightResizeType = 'neighbor';
				interactionConfig.reorderObjectives = true;
				interactionConfig.setObjectiveColors = true;
				interactionConfig.sortAlternatives = 'manual';

				labelRenderer.interactionsChanged(interactionConfig);
			});

			it('should enable the appropriate interactions', () => {
				expect(sortAlternativesStub.sortStatus).to.be.false;

				expect(resizeWeightsInteractionStub.pumpType).to.equal('increase');
				expect(resizeWeightsInteractionStub.resizeType).to.equal('neighbor');
				expect(setObjectiveColorsInteractionStub.setObjectiveColors).to.be.true;
				expect(reorderObjectivesInteractionStub.enableReordering).to.be.true;
			});

			it('should toggle sorting alternatives by objective score ONLY when sortAlternatives is set to "objective"', () => {
				interactionConfig.sortAlternatives = 'reset';
				labelRenderer.interactionsChanged(interactionConfig);
				expect(sortAlternativesStub.sortStatus).to.be.false;

				interactionConfig.sortAlternatives = 'alphabet';
				labelRenderer.interactionsChanged(interactionConfig);		
				expect(sortAlternativesStub.sortStatus).to.be.false;

				interactionConfig.sortAlternatives = 'none';
				labelRenderer.interactionsChanged(interactionConfig);		
				expect(sortAlternativesStub.sortStatus).to.be.false;

				interactionConfig.sortAlternatives = 'objective';
				labelRenderer.interactionsChanged(interactionConfig);		
				expect(sortAlternativesStub.sortStatus).to.be.true;
			});
		});

	});

	describe('public viewConfigChanged = (viewConfig: ViewConfig)', () => {

		it('should toggle the visibility of score function plots according to the viewConfig objective', () => {
			viewConfig.displayScoreFunctions = false;
			labelRenderer.viewConfigChanged(viewConfig);
			expect(labelRenderer.rootContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).style('display')).to.equal('none');

			viewConfig.displayScoreFunctions = true;
			labelRenderer.viewConfigChanged(viewConfig);
			expect(labelRenderer.rootContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).style('display')).to.equal('block');
		});
	});


	var checkNumberOfLabels = (labelContainer: d3.Selection<any, any, any, any>, parentName: string, objectives: Objective[]) => {
		
		let subLabels = labelContainer.selectAll('g[parent=' + parentName + ']').nodes();

		expect(subLabels).to.have.length(objectives.length);

		subLabels.forEach((label: SVGElement, i: number) => {
			let selection = d3.select(label);
			let datum: LabelData = <any> selection.datum();

			expect(datum.objective).to.deep.equal(objectives[i]);

			if (objectives[i].objectiveType == 'abstract') {
				checkNumberOfLabels(selection, objectives[i].getId(), (<AbstractObjective> objectives[i]).getDirectSubObjectives()); 
			}
		});
	};

	var checkNumberofScoreFunctions = (primitiveObjectives: PrimitiveObjective[]) => {
		let scoreFunctions = labelRenderer.rootContainer.selectAll('.' + LabelDefinitions.SCORE_FUNCTION).nodes();

		expect(scoreFunctions).to.have.length(primitiveObjectives.length);

		scoreFunctions.forEach((scoreFunction: SVGElement, i: number) => {
			let selection = d3.select(scoreFunction);
			let objective: PrimitiveObjective = <any> selection.datum()

			expect(objective).to.deep.equal(primitiveObjectives[i]);
		});
	}

	var checkRenderedLabels = (u: RendererUpdate, labelContainer: d3.Selection<any, any, any, any>, parentName: string, objectives: Objective[], dimension: string) => {
		let subLabels = labelContainer.selectAll('g[parent=' + parentName + ']').nodes();

		subLabels.forEach((label: SVGElement, i: number) => {
			let selection = d3.select(label);
			let datum: LabelData = <any> selection.datum();
			let outline = selection.select('.' + LabelDefinitions.SUBCONTAINER_OUTLINE)

			if (objectives[i].objectiveType == 'abstract') {
				expect(+outline.attr(dimension)).to.equal(Math.max(u.rendererConfig.dimensionTwoScale(datum.weight) - 2, 0));

				checkRenderedLabels(u, selection, objectives[i].getId(), (<AbstractObjective> objectives[i]).getDirectSubObjectives(), dimension); 
			} else {
				let weight = u.maximumWeightMap.getObjectiveWeight(objectives[i].getName());
				expect(+outline.attr(dimension)).to.equal(Math.max(u.rendererConfig.dimensionTwoScale(weight) - 2, 0));
			}
		});
	}


	// expectEqual indicates whether the height should be equal, or not. There are some cases (when score function plots are hidden) when we expressly want the heights to NOT be equal.
	var checkRenderedScoreFunctionPlots = (expectEqual: boolean, dimension: string) => {
		let scoreFunctionsOutlines = labelRenderer.rootContainer.selectAll('.' + ScoreFunctionRenderer.defs.PLOT_OUTLINE);

		scoreFunctionsOutlines.nodes().forEach((outline: SVGElement) => {
			let selection = d3.select(outline);
			let objective: PrimitiveObjective = <any> selection.datum();
			let weight = u.maximumWeightMap.getObjectiveWeight(objective.getName());
			if (expectEqual)
				expect(+selection.attr(dimension)).to.equal(u.rendererConfig.dimensionTwoScale(weight));	
			else 
				expect(+selection.attr(dimension)).to.not.equal(u.rendererConfig.dimensionTwoScale(weight));
		});
	}
});








