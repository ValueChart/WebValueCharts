/*
* @Author: aaronpmishkin
* @Date:   2017-05-23 14:55:18
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-23 17:41:25
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

// Import Test Data: 
import { HotelChartData }								from '../../../../testData/HotelChartData';

// Import Application Classes:
import { LabelRenderer }								from '../../../../../client/resources/modules/ValueChart/renderers/Label.renderer';
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

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { RowData, UserScoreData }						from '../../../../../client/resources/types/RendererData.types';



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

	toggleSortAlternativesByObjectiveScore: (enableSorting: boolean, rootContainer: Element, lastRendererUpdate: RendererUpdate) => {
		sortAlternativesStub.sortStatus = enableSorting;
	}
};

var resizeWeightsInteractionStub = {
	pumpType: '',
	resizeType: '',

	togglePump: (pumpType: string, primitiveObjectiveLabels: NodeListOf<Element>, lastRendererUpdate: RendererUpdate) => {
		resizeWeightsInteractionStub.pumpType = pumpType;
	},

	toggleDragToResizeWeights: (resizeType: string, rootContainer: d3.Selection<any, any, any, any>, lastRendererUpdate: RendererUpdate) => {
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

	toggleObjectiveReordering: (enableReordering: boolean, labelRootContainer: d3.Selection<any, any, any, any>, lastRendererUpdate: RendererUpdate) => {
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

			labelRenderer.valueChartChanged(u);
		});

		context('when the view orientation is set to be vertical', () => {

			context('when the summary chart has not been initialized yet and the number of users is one', () => {

				it('should work so far', () => {

				});

			});

		});
	});

});








