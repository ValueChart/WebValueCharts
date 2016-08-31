/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 13:30:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-30 20:38:59
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';
import { NgZone }													from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';

// Import Application Classes
import { ValueChartService }										from '../services/ValueChart.service';
import { RendererDataService }										from '../services/RendererData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { LabelRenderer }											from '../renderers/Label.renderer';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

import { LabelDefinitions }											from '../services/LabelDefinitions.service';

// Import Model Classes
import { Objective }												from '../../../model/Objective';
import { PrimitiveObjective }										from '../../../model/PrimitiveObjective';
import { AbstractObjective }										from '../../../model/AbstractObjective';
import { ScoreFunctionMap }											from '../../../model/ScoreFunctionMap';
import { ScoreFunction }											from '../../../model/ScoreFunction';
import { WeightMap }												from '../../../model/WeightMap';

import {RowData, CellData, LabelData}								from '../../../types/RendererData.types';


@Injectable()
export class ResizeWeightsInteraction {

	private resizeType: string;

	constructor(
		private ngZone: NgZone,
		private renderConfigService: RenderConfigService,
		private labelRenderer: LabelRenderer,
		private valueChartService: ValueChartService,
		private rendererDataService: RendererDataService,
		private chartUndoRedoService: ChartUndoRedoService,
		private labelDefinitions: LabelDefinitions) { }

	togglePump(pumpType: string): void {
		var primitiveObjectiveLabels: JQuery = $('.' + this.labelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);
		primitiveObjectiveLabels.off('click');
		if (pumpType !== 'none') {
			primitiveObjectiveLabels.click((eventObject: Event) => {
				// Save the current state of the Weight Map.
				this.chartUndoRedoService.saveWeightMapRecord(this.valueChartService.getCurrentUser().getWeightMap());

				// Calculate the correct weight increment.
				var totalWeight: number = this.valueChartService.getCurrentUser().getWeightMap().getWeightTotal();
				var labelDatum: LabelData = d3.select(eventObject.target).datum();
				var previousWeight: number = this.valueChartService.getCurrentUser().getWeightMap().getObjectiveWeight(labelDatum.objective.getName());
				var percentChange: number = ((pumpType === 'increase') ? 0.01 : -0.01);
				var pumpAmount = (percentChange * totalWeight) / ((1 - percentChange) - (previousWeight / totalWeight));

				if (previousWeight + pumpAmount < 0) {
					pumpAmount = 0 - previousWeight;
				}

				this.valueChartService.getCurrentUser().getWeightMap().setObjectiveWeight(labelDatum.objective.getName(), previousWeight + pumpAmount);
			});
		}
	}

	toggleDragToResizeWeights(resizeType: string): void {
		var dragToResizeWeights: d3.Drag<{}> = d3.drag();
		this.resizeType = resizeType;
		if (resizeType !== 'none') {
			dragToResizeWeights
				.on('start', this.resizeWeightsStart)
				.on('drag', this.resizeWeights);
		}

		var labelSpaces = d3.select('.' + this.labelDefinitions.ROOT_CONTAINER)
			.selectAll('g[parent="' + this.labelDefinitions.ROOT_CONTAINER_NAME + '"]');

		this.toggleResizingForSublabels(labelSpaces, dragToResizeWeights, resizeType);

	}

	toggleResizingForSublabels(labelSpaces: d3.Selection<any>, dragToResizeWeights: d3.Drag<{}>, resizeType: string) {
		var labelDividers: d3.Selection<any> = labelSpaces.select('.' + this.labelDefinitions.SUBCONTAINER_DIVIDER);

		labelDividers.style('cursor', () => {
			return (resizeType !== 'none') ? (this.renderConfigService.viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize' : '';
		});

		labelDividers.call(dragToResizeWeights);

		labelSpaces.data().forEach((labelDatum: LabelData, index: number) => {
			if (labelDatum.depthOfChildren === 0)	// This label has no child labels.
				return;

			let subLabelSpaces: d3.Selection<any> = d3.select('.' + this.labelDefinitions.ROOT_CONTAINER)
				.selectAll('g[parent="' + labelDatum.objective.getId() + '"]');	// Get all sub label containers whose parent is the current label

			this.toggleResizingForSublabels(subLabelSpaces, dragToResizeWeights, resizeType);	// Toggle dragging for the sub labels.
		});
	}

	resizeWeightsStart = (d: any, i: number) => {
		// Save the current state of the Weight Map.
		this.chartUndoRedoService.saveWeightMapRecord(this.valueChartService.getMaximumWeightMap());
	}

	// Event handler for resizing weights by dragging label edges.
	resizeWeights = (d: LabelData, i: number) => {
		var weightMap: WeightMap = this.valueChartService.getCurrentUser().getWeightMap();
		var deltaWeight: number = this.labelRenderer.viewConfig.dimensionTwoScale.invert(-1 * (<any>d3.event)['d' + this.labelRenderer.viewConfig.coordinateTwo]);

		var container: d3.Selection<any> = d3.select('#label-' + d.objective.getId() + '-container');
		var parentName = (<Element>container.node()).getAttribute('parent');
		var parentContainer: d3.Selection<any> = d3.select('#label-' + parentName + '-container');
		var siblings: LabelData[] = (<LabelData>parentContainer.datum()).subLabelData;

		// Run inside the angular zone so that change detection is triggered.
		this.ngZone.run(() => {
			if (this.resizeType === 'neighbor') {
				let combinedWeight: number = d.weight + siblings[i - 1].weight;

				let siblingElementWeight: number = Math.max(Math.min(siblings[i - 1].weight - deltaWeight, combinedWeight), 0);
				let currentElementWeight: number = Math.max(Math.min(d.weight + deltaWeight, combinedWeight), 0);

				if (d.objective.objectiveType === 'abstract') {
					this.rendererDataService.incrementObjectivesWeights(d.subLabelData, weightMap, deltaWeight, combinedWeight);
				} else {
					weightMap.setObjectiveWeight(d.objective.getName(), currentElementWeight);
				}

				if (siblings[i - 1].objective.objectiveType === 'abstract') {
					this.rendererDataService.incrementObjectivesWeights(siblings[i - 1].subLabelData, weightMap, -1 * deltaWeight, combinedWeight);
				} else {
					weightMap.setObjectiveWeight(siblings[i - 1].objective.getName(), siblingElementWeight);
				}
			} else {
				let combinedWeight: number = (<LabelData>parentContainer.datum()).weight;
				let siblingsToIncrease: LabelData[] = [];
				let siblingsToDecrease: LabelData[] = [];

				if (deltaWeight < 0) {

					siblingsToIncrease = siblings.slice(0, i);
					siblingsToDecrease = siblings.slice(i);

					this.rendererDataService.incrementObjectivesWeights(siblingsToIncrease, weightMap, (-1 * deltaWeight), combinedWeight);
					this.rendererDataService.incrementObjectivesWeights(siblingsToDecrease, weightMap, (deltaWeight), combinedWeight);

				} else {
					siblingsToIncrease = siblings.slice(i);
					siblingsToDecrease = siblings.slice(0, i);

					this.rendererDataService.incrementObjectivesWeights(siblingsToIncrease, weightMap, (deltaWeight), combinedWeight);
					this.rendererDataService.incrementObjectivesWeights(siblingsToDecrease, weightMap, (-1 * deltaWeight), combinedWeight);
				}
			}
		});
	};

}