/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 13:30:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-30 14:44:10
*/

import { Injectable } 												from '@angular/core';
import { NgZone }													from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService }											from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { LabelRenderer }											from '../renderers/Label.renderer';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

// Model Classes
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { AbstractObjective }										from '../model/AbstractObjective';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';
import { WeightMap }												from '../model/WeightMap';

import {VCRowData, VCCellData, VCLabelData}							from '../model/ChartDataTypes';



@Injectable()
export class ResizeWeightsInteraction {

	constructor(
		private ngZone: NgZone,
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private chartUndoRedoService: ChartUndoRedoService) { }

	togglePump(pumpType: string): void {
		var primitiveObjectiveLabels: JQuery = $('.label-primitive-objective');
		primitiveObjectiveLabels.off('click');
		if (pumpType !== 'none') {
			primitiveObjectiveLabels.click((eventObject: Event) => {
				// Save the current state of the Weight Map.
				this.chartUndoRedoService.saveWeightMapRecord(this.chartDataService.weightMap);

				// Calculate the correct weight increment.
				var totalWeight: number = this.chartDataService.weightMap.getWeightTotal();
				var labelDatum: VCLabelData = d3.select(eventObject.target).datum();
				var previousWeight: number = this.chartDataService.weightMap.getObjectiveWeight(labelDatum.objective.getName());
				var percentChange: number = ((pumpType === 'increase') ? 0.01 : -0.01);
				var pumpAmount = (percentChange * totalWeight) / ((1 - percentChange) - (previousWeight / totalWeight));

				if (previousWeight + pumpAmount < 0) {
					pumpAmount = 0 - previousWeight;
				}

				this.chartDataService.weightMap.setObjectiveWeight(labelDatum.objective.getName(), previousWeight + pumpAmount);
			});
		}
	}

	// Event handler for resizing weights by dragging label edges.
	resizeWeights = (d: VCLabelData, i: number) => {
		var weightMap: WeightMap = this.chartDataService.weightMap;
		var deltaWeight: number = this.renderConfigService.dimensionTwoScale.invert(-1 * (<any>d3.event)['d' + this.renderConfigService.coordinateTwo]);

		var container: d3.Selection<any> = d3.select('#label-' + d.objective.getName() + '-container');
		var parentName = (<Element>container.node()).getAttribute('parent');
		var parentContainer: d3.Selection<any> = d3.select('#label-' + parentName + '-container');
		var siblings: VCLabelData[] = (<VCLabelData>parentContainer.data()[0]).subLabelData;

		var combinedWeight: number = d.weight + siblings[i - 1].weight;

		var currentElementWeight: number = Math.max(Math.min(d.weight + deltaWeight, combinedWeight), 0);
		var siblingElementWeight: number = Math.max(Math.min(siblings[i - 1].weight - deltaWeight, combinedWeight), 0);

		// Run inside the angular zone so that change detection is triggered.
		this.ngZone.run(() => {

			if (d.objective.objectiveType === 'abstract') {
				this.chartDataService.incrementAbstractObjectiveWeight(d, weightMap, deltaWeight, combinedWeight);
			} else {
				weightMap.setObjectiveWeight(d.objective.getName(), currentElementWeight);
			}


			if (siblings[i - 1].objective.objectiveType === 'abstract') {
				this.chartDataService.incrementAbstractObjectiveWeight(siblings[i - 1], weightMap, -1 * deltaWeight, combinedWeight);
			} else {
				weightMap.setObjectiveWeight(siblings[i - 1].objective.getName(), siblingElementWeight);
			}
		});
	};

}