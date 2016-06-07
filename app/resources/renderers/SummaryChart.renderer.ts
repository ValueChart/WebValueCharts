/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:30:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-07 14:15:53
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
// Model Classes

@Injectable()
export class SummaryChartRenderer {

	public chart: any;
	public outline: any;
	public rows: any;
	public dividingLines: any;
	public cells: any;
	public userScores: any;

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService) { }


	createSummaryChart(el: any, rows: VCRowData[]): void {
		this.chart = el.append('g')
			.classed('summary-chart', true);

		this.createSummaryChartRows(this.chart, rows);
	}

	createSummaryChartRows(summaryChart: any, rows: VCRowData[]): void {
		this.outline = summaryChart.append('g')
			.classed('summary-outline-container', true)
			.append('rect')
				.classed('summary-outline', true)
				.attr('fill', 'white')
				.attr('stroke', 'grey')
				.attr('stroke-width', 1);

		this.rows = summaryChart.append('g')
			.classed('summary-rows-container', true)
			.selectAll('g')
				.data(rows)
				.enter().append('g')
					.classed('objective-col', true);

		this.dividingLines = summaryChart.append('g')
			.classed('summary-dividers-container', true)
			.selectAll('line')
				.data(this.chartDataService.getValueChart().getAlternatives())
				.enter().append('line')
					.classed('summary-dividing-line', true)
					.style('stroke-width', 1)
					.style('stroke', 'grey');

		this.createSummaryChartCells(this.rows);
	}

	createSummaryChartCells(stackedBarRows: any): void {
		this.cells = stackedBarRows.selectAll('g')
			.data((d: VCRowData) => { return d.cells; })
			.enter().append('g')
				.classed('summary-cell', true);

		this.userScores = this.cells.selectAll('rect')
			.data((d: VCCellData, i: number) => { return d.userScores; })
			.enter().append('rect')
				.classed('summary-user-scores', true);
	}

	renderSummaryChart(viewOrientation: string): void {
		this.chart
			.attr('transform', () => {
				if (viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, 0);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, this.renderConfigService.dimensionTwoSize + 10);
			});

		this.outline
			.attr(this.renderConfigService.dimensionOne, this.renderConfigService.dimensionOneSize)
			.attr(this.renderConfigService.dimensionTwo, this.renderConfigService.dimensionTwoSize);

		this.dividingLines
			.attr(this.renderConfigService.coordinateOne + '1', (d: VCCellData, i: number) => {
				return i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives);
			})
			.attr(this.renderConfigService.coordinateTwo + '1', (d: VCCellData, i: number) => { return 0; })
			.attr(this.renderConfigService.coordinateOne + '2', (d: VCCellData, i: number) => {
				return i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives);
			})
			.attr(this.renderConfigService.coordinateTwo + '2', (d: VCCellData, i: number) => { return this.renderConfigService.dimensionTwoSize });

		this.renderSummaryChartRows(viewOrientation);
	}

	renderSummaryChartRows(viewOrientation: string): void {

		this.renderSummaryChartCells(viewOrientation)
	}

	renderSummaryChartCells(viewOrientation: string): void {
		this.cells
			.attr('transform', (d: VCCellData, i: number) => { 
				return this.renderConfigService.generateTransformTranslation(viewOrientation, i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives), 0); 
			})


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
			})
			.attr(this.renderConfigService.coordinateTwo, (d: any, i: number) => {
				var objectiveWeight: number = this.chartDataService.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				if (viewOrientation == 'vertical')
					return (this.renderConfigService.dimensionTwoSize - this.renderConfigService.dimensionTwoScale(d.offset)) - this.renderConfigService.dimensionTwoScale(d.score * objectiveWeight);
				else
					return this.renderConfigService.dimensionTwoScale(d.offset);
			});

	}
}