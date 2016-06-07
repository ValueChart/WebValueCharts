/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 12:53:30
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-07 14:16:33
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
// Model Classes

@Injectable()
export class ObjectiveChartRenderer {

	public chart: any;
	public rowOutlines: any;
	public rows: any;
	public dividingLines: any;
	public cells: any;
	public userScores: any;
	

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService) { }


	createObjectiveChart(el: any, rows: VCRowData[]): void {
		this.chart = el.append('g')
			.classed('objective-chart', true)

		this.createObjectiveRows(this.chart, rows);
	}

	createObjectiveRows(objectiveChart: any, rows: VCRowData[]): void {
		this.rowOutlines = objectiveChart.append('g')
			.classed('objective-row-outlines-container', true)
			.selectAll('rect')
				.data(rows)
				.enter().append('rect')
					.classed('objective-row-outline', true)
					.style('stroke-width', 1)
					.style('stroke', 'grey')
					.style('fill', 'white');

		this.rows = objectiveChart.append('g')
			.classed('objective-rows-container', true)
			.selectAll('g')
				.data(rows)
				.enter().append('g')
					.classed('objective-row', true);

		this.dividingLines = objectiveChart.append('g')
			.classed('objective-dividers-container', true)
			.selectAll('line')
				.data(this.chartDataService.getValueChart().getAlternatives())
				.enter().append('line')
					.classed('objective-dividing-line', true)
					.style('stroke-width', 1)
					.style('stroke', 'grey');

		this.createObjectiveCells(this.rows)

	}

	createObjectiveCells(objectiveRows: any): void {
		this.cells = objectiveRows.selectAll('g')
			.data((d: VCRowData) => { return d.cells; })
			.enter().append('g')
				.classed('objective-cell', true);

		this.userScores = this.cells.selectAll('rect')
			.data((d: VCCellData, i: number) => { return d.userScores; })
			.enter().append('rect')
				.classed('objective-user-scores', true);
	}

	renderObjectiveChart(rows: VCRowData[], viewOrientation: string): void {
		this.chart
			.attr('transform', () => {
				if (viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, this.renderConfigService.dimensionTwoSize + 10);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, 0);	// TODO: Fix this.
			});

		this.dividingLines
			.attr(this.renderConfigService.coordinateOne + '1', (d: VCCellData, i: number) => { return i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives); })
			.attr(this.renderConfigService.coordinateTwo + '1', (d: VCCellData, i: number) => { return 0; })
			.attr(this.renderConfigService.coordinateOne + '2', (d: VCCellData, i: number) => { return i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives); })
			.attr(this.renderConfigService.coordinateTwo + '2', (d: VCCellData, i: number) => { return this.renderConfigService.dimensionTwoSize });

		this.renderObjectiveChartRows(viewOrientation);
	}

	// Render the rows of the ValueChart
	renderObjectiveChartRows(viewOrientation: string): void {
		this.rowOutlines
			.attr('transform', (d: VCRowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.renderConfigService.dimensionTwoScale(d.weightOffset)));
			})
			.attr(this.renderConfigService.dimensionOne, this.renderConfigService.dimensionOneSize)
			.attr(this.renderConfigService.dimensionTwo, (d: VCRowData) => {
				var objectiveWeight: number = this.chartDataService.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				return this.renderConfigService.dimensionTwoScale(objectiveWeight);
			});

		this.rows
			.attr('transform', (d: VCRowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.renderConfigService.dimensionTwoScale(d.weightOffset)));
			});

		this.renderObjectiveChartCells(viewOrientation);
	}

	// Don't worry about this for now.
	renderObjectiveChartCells(viewOrientation: string): void {
		this.cells
			.attr('transform', (d: VCCellData, i: number) => { return this.renderConfigService.generateTransformTranslation(viewOrientation, i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives), 0); })

		this.userScores
			.style('fill', (d: any, i: number) => { return d.objective.getColor(); })
			.attr(this.renderConfigService.dimensionOne, (d: any, i: number) => {
				return (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives) / this.chartDataService.numUsers;
			})
			.attr(this.renderConfigService.dimensionTwo, (d: any, i: number) => {
				var objectiveWeight: number = this.chartDataService.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				return this.renderConfigService.dimensionTwoScale(d.score * objectiveWeight);
			})
			.attr(this.renderConfigService.coordinateOne, (d: any, i: number) => {
				return ((this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives) / this.chartDataService.numUsers) * i;
			});

		if (viewOrientation === 'vertical') {
			this.userScores
				.attr(this.renderConfigService.coordinateTwo, (d: any, i: number) => {
					var objectiveWeight: number = this.chartDataService.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
					return this.renderConfigService.dimensionTwoScale(objectiveWeight) - this.renderConfigService.dimensionTwoScale(d.score * objectiveWeight);
				});
		}
	}


}

