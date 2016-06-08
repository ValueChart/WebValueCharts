/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:39:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-08 15:30:14
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';

// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunctionMap }				from '../model/ScoreFunctionMap';


@Injectable()
export class LabelRenderer {

	public labelRootSpace: any;
	public labelSpaceOutline: any;
	public labelContainer: any;
	public scoreFunctionContainer: any;

	private labelWidth: number;

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private scoreFunctionRenderer: ScoreFunctionRenderer) { }


	createLabelSpace(el: any, labelData: VCLabelData[]): void {
		this.labelRootSpace = el.append('g')
			.classed('label-rootspace', true)

		this.labelSpaceOutline = this.labelRootSpace.append('g')
			.classed('label-outline-container', true)
			.append('rect')
				.classed('label-outline', true)
				.style('fill', 'white')
				.style('stroke-width', 1)
				.style('stroke', 'grey');

		this.labelContainer = this.labelRootSpace.append('g')
			.classed('label-labels-container', true);

		this.scoreFunctionContainer = this.labelRootSpace.append('g')
			.classed('label-scorefunction-container', true);

		this.createScoreFunctions(this.scoreFunctionContainer);

		this.createLabels(el, this.labelContainer, labelData, 'rootspace');
	}

	createScoreFunctions(scoreFunctionContainer: any): void {
		var data: PrimitiveObjective[] = this.chartDataService.getValueChart().getAllPrimitiveObjectives();

		scoreFunctionContainer.selectAll('g')
			.data(data)
			.enter().append('g')
				.classed('label-scorefunction', true)
				.attr('id', (d: PrimitiveObjective) => { return 'label-' + d.getName() + '-scorefunction'; })

		data.forEach((datum: PrimitiveObjective) => {
			var el: any = scoreFunctionContainer.select('#label-' + datum.getName() + '-scorefunction');
			this.scoreFunctionRenderer.createScoreFunction(el, datum);
		});

	}

	createLabels(el: any, labelSpace: any, labelData: VCLabelData[], parentName: string): void {

		var subLabelSpaces = labelSpace.selectAll('g')
			.data(labelData)
			.enter().append('g')
				.classed('label-subspace', true)
				.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-container' })
				.attr('parent', parentName);

		subLabelSpaces.append('rect')
			.classed('label-subspace-outline', true)
			.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-outline' });

		subLabelSpaces.append('text')
			.classed('label-subspace-text', true)
			.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-text' })
			.style('font-size', '18px');


		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.subLabelData === undefined)
				return;

			this.createLabels(el, el.select('#label-' + labelDatum.objective.getName() + '-container'), labelDatum.subLabelData, labelDatum.objective.getName());
		});
	}

	renderLabelSpace(labelData: VCLabelData[], viewOrientation: string): void {
		this.labelWidth = this.chartDataService.calculateMinLabelWidth(labelData, this.renderConfigService.dimensionOneSize);

		this.labelRootSpace
			.attr('transform', () => {
				if (viewOrientation === 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, this.renderConfigService.dimensionTwoSize + 10);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, 0);
			});

		this.labelSpaceOutline
			.attr(this.renderConfigService.dimensionOne, this.renderConfigService.dimensionOneSize)
			.attr(this.renderConfigService.dimensionTwo, this.renderConfigService.dimensionTwoSize);


		this.renderScoreFunctions(viewOrientation, this.labelRootSpace.select('.label-scorefunction-container'));

		var labelSpaces = this.labelRootSpace.selectAll('g[parent=rootspace]');
		this.renderLabels(labelSpaces, labelData, viewOrientation);
	}

	renderScoreFunctions(viewOrientation: string, scoreFunctionContainer: any): void {
		var data: PrimitiveObjective[] = this.chartDataService.getValueChart().getAllPrimitiveObjectives();
		var scoreFunctionMap: ScoreFunctionMap = this.chartDataService.scoreFunctionMap;
		var width: number
		var height: number;
		var weightOffset: number = 0;

		data.forEach((datum: PrimitiveObjective) => {
			let objectiveWeight = this.chartDataService.weightMap.getNormalizedObjectiveWeight(datum.getName());
			let el: any = scoreFunctionContainer.select('#label-' + datum.getName() + '-scorefunction');
			let dimensionOneTransform: number = (this.renderConfigService.dimensionOneSize - this.labelWidth) + 1;
			let dimensionTwoTransform: number = this.renderConfigService.dimensionTwoScale(weightOffset);

			el.attr('transform', this.renderConfigService.generateTransformTranslation(viewOrientation, dimensionOneTransform, dimensionTwoTransform));

			if (viewOrientation === 'vertical') {
				width = this.labelWidth;
				height = this.renderConfigService.dimensionTwoScale(objectiveWeight);
			} else {
				width = this.renderConfigService.dimensionTwoScale(objectiveWeight);
				height = this.labelWidth;
			}

			this.scoreFunctionRenderer.renderScoreFunction(el, datum, scoreFunctionMap.getObjectiveScoreFunction(datum.getName()), width, height);

			weightOffset += objectiveWeight;
		});

	}

	renderLabels(labelSpaces: any, labelData: VCLabelData[], viewOrientation: string): void {

		var weightOffsets: number[] = [];
		var weightSum: number = 0;
		for (var i: number = 0; i < labelData.length; i++) {
			weightOffsets[i] = weightSum;
			weightSum += labelData[i].weight;
		}

		labelSpaces.select('rect')
			.style('fill', 'white')
			.style('stroke-width', (d: VCLabelData) => {
				if (d.depthOfChildren === 0)
					return 2;
				else
					return 1;
			})
			.style('stroke', (d: VCLabelData) => {
				if (d.depthOfChildren === 0)
					return (<PrimitiveObjective>d.objective).getColor();
				else
					return 'gray';
			})
			.attr(this.renderConfigService.dimensionOne, (d: VCLabelData) => {
				if (d.depthOfChildren === 0)
					return (this.renderConfigService.dimensionOneSize - this.labelWidth) - (d.depth * this.labelWidth); // Expand the last label to fill the rest of the space.
				else
					return this.labelWidth;
			})
			.attr(this.renderConfigService.dimensionTwo, (d: VCLabelData, i: number) => { return this.renderConfigService.dimensionTwoScale(d.weight); })
			.attr(this.renderConfigService.coordinateOne, 0)
			.attr(this.renderConfigService.coordinateTwo, ((d: VCLabelData, i: number) => { return this.renderConfigService.dimensionTwoScale(weightOffsets[i]); }));



		labelSpaces.select('text')
			.attr(this.renderConfigService.coordinateOne, () => {
				if (viewOrientation === 'vertical')
					return 10;
				else
					return (this.labelWidth / 2);
			})
			.attr(this.renderConfigService.coordinateTwo, (d: VCLabelData, i: number) => {
				if (viewOrientation === "vertical")
					return this.renderConfigService.dimensionTwoScale(weightOffsets[i]) + (this.renderConfigService.dimensionTwoScale(d.weight) / 2) + 5;
				else
					return this.renderConfigService.dimensionTwoScale(weightOffsets[i]) + (this.renderConfigService.dimensionTwoScale(d.weight) / 5) + 5;
			})
			.style('fill', 'black')
			.text((d: VCLabelData) => { return d.objective.getName() + ' (' + Math.round(d.weight * 100) + '%)' });


		labelData.forEach((labelDatum: VCLabelData, index: number) => {
			if (labelDatum.subLabelData === undefined)
				return;
			let subLabelSpaces = this.labelRootSpace.selectAll('g[parent=' + labelDatum.objective.getName() + ']');
			subLabelSpaces.attr('transform', this.renderConfigService.generateTransformTranslation(viewOrientation, this.labelWidth, this.renderConfigService.dimensionTwoScale(weightOffsets[index])));

			this.renderLabels(subLabelSpaces, labelDatum.subLabelData, viewOrientation);
		});
	}
}