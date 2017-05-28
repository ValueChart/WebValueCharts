/*
* @Author: aaronpmishkin
* @Date:   2017-05-28 15:25:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-28 16:27:36
*/

// Import Testing Resources:
import { Component }									from '@angular/core';
import { ComponentFixture, TestBed }					from '@angular/core/testing';
import { By }              								from '@angular/platform-browser';
import { DebugElement }    								from '@angular/core';
import { ElementRef }									from '@angular/core';

import { expect }										from 'chai';
import * as sinon										from 'sinon';

// Import Libraries:
import  * as d3											from 'd3';
import * as _											from 'lodash';

// Import Test Utilities: 
import { HotelChartData }								from '../../../../testData/HotelChartData';
import { randomizeUserWeights, randomizeAllUserScoreFunctions }	from '../../../../utilities/Testing.utilities';

// Import Application Classes:
import { ValueChartDirective }							from '../../../../../client/resources/modules/ValueChart/directives/ValueChart.directive';

// Services:
import { RenderEventsService }							from '../../../../../client/resources/modules/ValueChart/services/RenderEvents.service';
import { RendererService }								from '../../../../../client/resources/modules/ValueChart/services/Renderer.service';
import { ChartUndoRedoService }							from '../../../../../client/resources/modules/ValueChart/services/ChartUndoRedo.service';
import { ChangeDetectionService }						from '../../../../../client/resources/modules/ValueChart/services/ChangeDetection.service';
// Renderers:
import { ObjectiveChartRenderer }						from '../../../../../client/resources/modules/ValueChart/renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }							from '../../../../../client/resources/modules/ValueChart/renderers/SummaryChart.renderer';
import { LabelRenderer }								from '../../../../../client/resources/modules/ValueChart/renderers/Label.renderer';
// Utilities
import { RendererDataUtility }							from '../../../../../client/resources/modules/ValueChart/utilities/RendererData.utility';
import { RendererConfigUtility }						from '../../../../../client/resources/modules/ValueChart/utilities/RendererConfig.utility';
import { RendererScoreFunctionUtility }					from '../../../../../client/resources/modules/ValueChart/utilities/RendererScoreFunction.utility';
// Interactions
import { ReorderObjectivesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }						from '../../../../../client/resources/modules/ValueChart/interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/SortAlternatives.interaction';
import { SetObjectiveColorsInteraction }				from '../../../../../client/resources/modules/ValueChart/interactions/SetObjectiveColors.interaction';
import { ExpandScoreFunctionInteraction }				from '../../../../../client/resources/modules/ValueChart/interactions/ExpandScoreFunction.interaction';

import { WebValueChartsParser }							from '../../../../../client/resources/modules/utilities/classes/WebValueChartsParser';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { User }											from '../../../../../client/resources/model/User';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { RowData, UserScoreData }						from '../../../../../client/resources/types/RendererData.types';

@Component({
	selector: 'viewer-stub',
	template: `	<ValueChart
					[valueChart]="valueChart"
					[width]="valueChartWidth"
					[height]="valueChartHeight"
					[viewConfig]="viewConfig"
					[interactionConfig]="interactionConfig"
					(undoRedo)="updateUndoRedo($event)"
					(renderEvents)="updateRenderEvents($event)">
				</ValueChart>`
})
class ViewerStub {
	
	public valueChart: ValueChart;
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

class MockElementRef extends ElementRef {}

describe('ValueChartDirective', () => {

	var valueChartDirective: ValueChartDirective;

	var hotelChart: ValueChart;
	var parser: WebValueChartsParser;
	var width: number, height: number, interactionConfig: InteractionConfig, viewConfig: ViewConfig;

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

		height = 400;
		width = 400;

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
			declarations: [ ViewerStub, ValueChartDirective ]
		});

		var fixture = TestBed.createComponent(ViewerStub);

		valueChartDirective = fixture.debugElement.injector.get(ValueChartDirective);

	});

	it('should setup properly', () => {
		
	});

});








