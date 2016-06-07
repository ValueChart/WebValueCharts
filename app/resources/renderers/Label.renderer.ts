/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:39:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-07 14:14:56
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';

// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';


@Injectable()
export class LabelRenderer {

	public labelRootSpace: any;
	public labelSpaceOutline: any;
	public labelContainer: any;

	private labelWidth: number;

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService) { }


	createLabelSpace(el: any, labelData: VCLabelData[]): void {
		this.labelRootSpace = el.append('g')
			.classed('labelspace-rootspace', true)

		this.labelSpaceOutline = this.labelRootSpace.append('g')
			.classed('labelspace-outline-container', true)
			.append('rect')
				.classed('lablespace-outline', true)
				.style('fill', 'white')
				.style('stroke-width', 1)
				.style('stroke', 'grey');

		this.labelContainer = this.labelRootSpace.append('g')
			.classed('label-container', true);

		this.createLabels(el, this.labelContainer, labelData, 'rootspace');
	}

	createLabels(el: any, labelSpace: any, labelData: VCLabelData[], parentName: string): void {

		var subLabelSpaces = labelSpace.selectAll('g')
			.data(labelData)
			.enter().append('g')
				.classed('labelspace-subspace', true)
				.attr('id', (d: VCLabelData) => { return 'labelspace-' + d.objective.getName() + '-container' })
				.attr('parent', parentName);

		subLabelSpaces.append('rect')
			.classed('labelspace-subspace-outline', true)
			.attr('id', (d: VCLabelData) => { return 'labelspace-' + d.objective.getName() + '-outline' });

		subLabelSpaces.append('text')
			.classed('labelspace-subspace-text', true)
			.attr('id', (d: VCLabelData) => { return 'labelspace-' + d.objective.getName() + '-text' });


		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.subLabelData === undefined)
				return;

			this.createLabels(el, el.select('#labelspace-' + labelDatum.objective.getName() + '-container'), labelDatum.subLabelData, labelDatum.objective.getName());
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

		var labelSpaces = this.labelRootSpace.selectAll('g[parent=rootspace]');
		this.renderLabels(labelSpaces, labelData, viewOrientation);
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
					return this.renderConfigService.dimensionOneSize - (d.depth * this.labelWidth); // Expand the last label to fill the rest of the space.
				else
					return this.labelWidth;
			})
			.attr(this.renderConfigService.dimensionTwo, (d: VCLabelData, i: number) => { return this.renderConfigService.dimensionTwoScale(d.weight); })
			.attr(this.renderConfigService.coordinateOne, 0)
			.attr(this.renderConfigService.coordinateTwo, ((d: VCLabelData, i: number) => { return this.renderConfigService.dimensionTwoScale(weightOffsets[i]); }));



		labelSpaces.select('text')
			.attr(this.renderConfigService.coordinateOne, (this.labelWidth / 5))
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