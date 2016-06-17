/*
* @Author: aaronpmishkin
* @Date:   2016-06-17 09:05:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-17 10:49:55
*/

import { Injectable } 												from '@angular/core';
import { NgZone }													from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { LabelRenderer }											from '../renderers/Label.renderer';



// Model Classes
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { AbstractObjective }										from '../model/AbstractObjective';

@Injectable()
export class ReorderObejctivesRenderer {
	private ignoreReorder: boolean;

	private primitiveObjectives: PrimitiveObjective[]

	private reorderObjectiveMouseOffset: number;
	private dimensionTwoChange: number = 0;

	private containerToReorder: d3.Selection<any>;
	private parentObjectiveName: string;
	private parentContainer: d3.Selection<any>;
	private siblingContainers: d3.Selection<any>;

	private objectiveDimensionTwo: number;
	private objectiveCoordTwoOffset: number;
	private maxCoordinateTwo: number;

	private currentObjectiveIndex: number;
	private newObjectiveIndex: number;
	private jumpPoints: number[];

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private labelRenderer: LabelRenderer) { }

	startReorderObjectives = (d: VCLabelData, i: number) => {
		this.ignoreReorder = false;
		this.reorderObjectiveMouseOffset = undefined;
		this.dimensionTwoChange = 0;

		this.containerToReorder = d3.select('#label-' + d.objective.getName() + '-container');
		this.parentObjectiveName = (<Element>this.containerToReorder.node()).getAttribute('parent');

		if (this.parentObjectiveName === 'rootcontainer') {
			this.ignoreReorder = true;
			return;
		}

		this.parentContainer = d3.select('#label-' + this.parentObjectiveName + '-container');
		this.siblingContainers = this.parentContainer.selectAll('g[parent=' + this.parentObjectiveName + ']');

		this.siblingContainers.style('opacity', 0.5);
		this.containerToReorder.style('opacity', 1);

		var parentOutline: d3.Selection<any> = this.parentContainer.select('rect');
		var currentOutline: d3.Selection<any> = this.containerToReorder.select('rect');

		this.objectiveDimensionTwo = +currentOutline.attr(this.renderConfigService.dimensionTwo);
		this.maxCoordinateTwo = +parentOutline.attr(this.renderConfigService.dimensionTwo) - this.objectiveDimensionTwo;
		this.objectiveCoordTwoOffset = +currentOutline.attr(this.renderConfigService.coordinateTwo);
		this.currentObjectiveIndex = this.siblingContainers[0].indexOf(this.containerToReorder.node());

		this.newObjectiveIndex = this.currentObjectiveIndex;
		this.jumpPoints = [0];

		this.siblingContainers.select('rect')[0].forEach((el: Element) => {
			if (el !== undefined) {
				let selection: d3.Selection<any> = d3.select(el);
				let jumpPoint: number = (+selection.attr(this.renderConfigService.dimensionTwo) / 2) + +selection.attr(this.renderConfigService.coordinateTwo);
				this.jumpPoints.push(jumpPoint);
			}
		});

		this.jumpPoints.push(this.renderConfigService.dimensionTwoSize);
	}

	reorderObjectives = (d: VCLabelData, i: number) => {
		if (this.ignoreReorder) {
			return;
		}

		var deltaCoordinateTwo: number = (<any>d3.event)[this.renderConfigService.coordinateTwo];

		if (this.reorderObjectiveMouseOffset === undefined) {
			this.reorderObjectiveMouseOffset = deltaCoordinateTwo;
		}

		deltaCoordinateTwo = deltaCoordinateTwo - this.reorderObjectiveMouseOffset;

		// Make sure that the label does not exit the bounds of the label area.
		if (deltaCoordinateTwo + this.dimensionTwoChange + this.objectiveCoordTwoOffset < 0) {
			deltaCoordinateTwo = 0 - this.dimensionTwoChange - this.objectiveCoordTwoOffset;
		} else if (deltaCoordinateTwo + this.dimensionTwoChange + this.objectiveCoordTwoOffset > this.maxCoordinateTwo) {
			deltaCoordinateTwo = this.maxCoordinateTwo - this.dimensionTwoChange - this.objectiveCoordTwoOffset;
		}

		this.dimensionTwoChange += deltaCoordinateTwo;

		var labelDimensionTwoOffset: number = (this.dimensionTwoChange > 0) ? this.objectiveDimensionTwo : 0;

		for (var i = 0; i < this.jumpPoints.length; i++) {
			if (this.dimensionTwoChange + deltaCoordinateTwo + labelDimensionTwoOffset > (this.jumpPoints[i] - this.objectiveCoordTwoOffset)
				&& this.dimensionTwoChange + deltaCoordinateTwo + labelDimensionTwoOffset < (this.jumpPoints[i + 1] - this.objectiveCoordTwoOffset)) {
				this.newObjectiveIndex = i;
				break;
			}
		}

		if (this.dimensionTwoChange > 0)
			this.newObjectiveIndex--;

		var currentTransform: string = this.containerToReorder.attr('transform');
		var commaIndex: number = currentTransform.indexOf(',');
		// Pull the current transform coordinates form the string. + is a quick operation that converts them into numbers.
		var xTransform: number = +currentTransform.substring(currentTransform.indexOf('(') + 1, commaIndex);
		var yTransform: number = +currentTransform.substring(commaIndex + 1, currentTransform.indexOf(')'));

		var labelTransform: string = this.generateNewTransform(xTransform, yTransform, deltaCoordinateTwo);


		this.containerToReorder.attr('transform', labelTransform);

		this.adjustScoreFunctionPosition(this.labelRenderer.scoreFunctionContainer, deltaCoordinateTwo, d.objective);

	}

	endReorderObjectives = (d: VCLabelData, i: number) => {
		if (this.ignoreReorder) {
			return;
		}

		var parentData: VCLabelData = this.parentContainer.datum();

		if (this.newObjectiveIndex !== this.currentObjectiveIndex) {
			let temp: VCLabelData = parentData.subLabelData[this.currentObjectiveIndex];
			parentData.subLabelData.splice(this.currentObjectiveIndex, 1);
			parentData.subLabelData.splice(this.newObjectiveIndex, 0, temp);
		}

		var labelData: VCLabelData[] = d3.select('g[parent=rootcontainer]').data();

		var primitiveObjectives: PrimitiveObjective[] = this.getOrderedObjectives(labelData);

		(<Element>d3.select('.label-root-container').node()).remove();

		this.chartDataService.reorderRows(primitiveObjectives);

		this.labelRenderer.createLabelSpace(d3.select('.ValueChart'), labelData, primitiveObjectives);
		this.labelRenderer.renderLabelSpace(labelData, this.renderConfigService.viewOrientation, primitiveObjectives);
	}

	generateNewTransform(previousXTransform: number, previousYTransform: number, deltaCoordinateTwo: number): string {
		if (this.renderConfigService.viewOrientation === 'vertical') {
			return 'translate(' + previousXTransform + ',' + (previousYTransform + deltaCoordinateTwo) + ')';
		} else {
			return 'translate(' + (previousXTransform + deltaCoordinateTwo) + ',' + previousYTransform + ')';
		}
	}

	getOrderedObjectives(labelData: VCLabelData[]): PrimitiveObjective[] {
		var primitiveObjectives: PrimitiveObjective[] = [];
		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.depthOfChildren === 0) {
				primitiveObjectives.push(<PrimitiveObjective>labelDatum.objective);
			} else {
				primitiveObjectives = primitiveObjectives.concat(this.getOrderedObjectives(labelDatum.subLabelData));
			}
		});
		return primitiveObjectives;

	}

	adjustScoreFunctionPosition(container: d3.Selection<any>, deltaCoordinateTwo: number, objective: Objective): void {
		if (objective.objectiveType === 'abstract') {
			(<AbstractObjective>objective).getAllSubObjectives().forEach((subObjective: Objective) => {
				this.adjustScoreFunctionPosition(container, deltaCoordinateTwo, subObjective);
			});
		} else {
			var scoreFunction: d3.Selection<any> = this.labelRenderer.rootContainer.select('#label-' + objective.getName() + '-scorefunction');
			let currentTransform: string = scoreFunction.attr('transform');
			let commaIndex: number = currentTransform.indexOf(',');
			let xTransform: number = +currentTransform.substring(currentTransform.indexOf('(') + 1, commaIndex);
			let yTransform: number = +currentTransform.substring(commaIndex + 1, currentTransform.indexOf(')'));
			let scoreFunctionTransform: string = this.generateNewTransform(xTransform, yTransform, deltaCoordinateTwo);
			scoreFunction.attr('transform', scoreFunctionTransform);
		}
	}

}