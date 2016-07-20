/*
* @Author: aaronpmishkin
* @Date:   2016-07-19 19:57:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-20 12:16:26
*/

// Angular Resources:
import { Injectable } 												from '@angular/core';

// d3
import * as d3 																	from 'd3';

// Application Classes: 
import { ScoreFunctionViewerService }								from '../services/ScoreFunctionViewer.service';

// Model Classes:
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { ScoreFunction }											from '../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../model/DiscreteScoreFunction';

import { ElementUserScoresSummary } 						from '../types/ScoreFunctionViewer.types';



@Injectable()
export class ScoreDistributionChartRenderer {

	// d3 Selections saved as fields to avoid parsing the DOM when unnecessary. 
	public rootContainer: d3.Selection<any>;
	public chartOutline: d3.Selection<any>;
	public chartContainer: d3.Selection<any>;
	public boxplotContainers: d3.Selection<any>;
	public boxplotLabelsContainer: d3.Selection<any>;
	public boxplotLabels: d3.Selection<any>;
	public boxplotQuartileOutlines: d3.Selection<any>;
	public boxplotMaxLines: d3.Selection<any>;
	public boxplotMinLines: d3.Selection<any>;
	public boxplotMedianLines: d3.Selection<any>;
	public boxplotUpperDashedLines: d3.Selection<any>;
	public boxplotLowerDashedLines: d3.Selection<any>;
	public scoreAxisContainer: d3.Selection<any>;

	private elementUserScoresSummaries: ElementUserScoresSummary[];

	private dimensionOne: string;
	private dimensionTwo: string;
	private coordinateOne: string;
	private coordinateTwo: string;

	private dimensionOneSize: number;
	private dimensionTwoSize: number;

	private scaleDimensionOneOffset: number = 26;
	private scaleDimensionTwoOffset: number = 15;


	public static defs: any = { 
		OUTLINE_CONTAINER: 'distribution-outline-container',
		OUTLINE: 'distribution-outline',

		BOXPLOT_LABELS_CONTAINER: 'distribution-boxplot-labels-container',
		BOXPLOT_LABEL: 'distribution-boxplot-label',

		CHART_CONTAINER: 'distribution-chart-container',
		BOXPLOT_CONTAINER: 'distribution-boxplot-container',

		BOXPLOT_QUARTILE_OUTLINE: 'distribution-boxplot-quartile-outline',
		BOXPLOT_MAX_LINE: 'distribution-boxplot-max-line',
		BOXPLOT_MIN_LINE: 'distribution-boxplot-min-line',
		BOXPLOT_MEDIAN_LINE: 'distribution-boxplot-median-line',
		BOXPLOT_DASHED_LINE: 'distribution-boxplot-dashed-line',

		SCORE_AXIS_CONTAINER: 'distribution-score-axis-container',
	}

	constructor(private scoreFunctionViewerService: ScoreFunctionViewerService) { }


	createScoreDistributionChart(el: d3.Selection<any>, objective: PrimitiveObjective): void {
		this.rootContainer = el;

		var objectiveId = objective.getId();

		// Create the a container for the plot outlines, and the plot outlines itself.
		this.chartOutline = el.append('g')
			.classed(ScoreDistributionChartRenderer.defs.OUTLINE_CONTAINER, true)
			.attr('id', 'distribution-' + objectiveId + '-outline-container')
			.append('rect')
				.classed(ScoreDistributionChartRenderer.defs.OUTLINE, true)
				.attr('id', 'distribution-' + objectiveId + '-outline')
				.classed('valuechart-outline', true);

		// Create a container to hold all the elements of the plot.
		this.chartContainer = el.append('g')
			.classed(ScoreDistributionChartRenderer.defs.CHART_CONTAINER, true)
			.attr('id', 'distribution-' + objectiveId + '-chart-container');

		this.scoreAxisContainer = this.chartContainer.append('g')
			.classed(ScoreDistributionChartRenderer.defs.SCORE_AXIS_CONTAINER, true);

		var elementUserScoresSummaries: ElementUserScoresSummary[] = this.scoreFunctionViewerService.getAllElementUserScoresSummaries(objective);
		this.elementUserScoresSummaries = elementUserScoresSummaries.slice();

		this.createBoxPlots(this.chartContainer, objective, elementUserScoresSummaries);
	}


	createBoxPlots(chartContainer: d3.Selection<any>, objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[]): void {

		chartContainer.selectAll('.' + ScoreDistributionChartRenderer.defs.BOXPLOT_CONTAINER)
			.data(elementUserScoresSummaries)
			.enter().append('g')
				.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_CONTAINER, true)
				.attr('id', (d: ElementUserScoresSummary) => { return 'distribution-' + d.element + '-boxplot-container'; });

		this.boxplotContainers = chartContainer.selectAll('.' + ScoreDistributionChartRenderer.defs.BOXPLOT_CONTAINER);

		this.boxplotLabelsContainer = chartContainer.append('g')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_LABELS_CONTAINER, true)
			.attr('id', 'distribution-' + objective.getId() + '-outline')

		this.boxplotLabelsContainer.selectAll('.' + ScoreDistributionChartRenderer.defs.BOXPLOT_LABEL)
			.data(elementUserScoresSummaries)
			.enter().append('text')
				.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_LABEL, true)
				.attr('id', (d: ElementUserScoresSummary) => { return 'distribution-' + d.element + '-boxplot-label'; });

		this.boxplotLabels = this.boxplotLabelsContainer.selectAll('.' + ScoreDistributionChartRenderer.defs.BOXPLOT_LABEL);
		this.createBoxPlotElements(this.boxplotContainers, objective, elementUserScoresSummaries);

	}

	createBoxPlotElements(boxplotContainers: d3.Selection<any>, objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[]): void {

		this.boxplotQuartileOutlines = boxplotContainers.append('rect')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_QUARTILE_OUTLINE, true);

		this.boxplotMaxLines = boxplotContainers.append('line')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_MAX_LINE, true);

		this.boxplotMinLines = boxplotContainers.append('line')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_MIN_LINE, true);

		this.boxplotMedianLines = boxplotContainers.append('line')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_MEDIAN_LINE, true);

		this.boxplotUpperDashedLines = boxplotContainers.append('line')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_DASHED_LINE, true);

		this.boxplotLowerDashedLines = boxplotContainers.append('line')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_DASHED_LINE, true);
	}

	renderScoreDistributionChart(el: d3.Selection<any>, objective: PrimitiveObjective, width: number, height: number, viewOrientation: string): void {

		if (viewOrientation === 'vertical') {
			this.dimensionOne = 'width';
			this.dimensionTwo = 'height';
			this.coordinateOne = 'x';
			this.coordinateTwo = 'y';

			this.dimensionOneSize = width;
			this.dimensionTwoSize = height;
			
		} else {
			this.dimensionOne = 'height';
			this.dimensionTwo = 'width';
			this.coordinateOne = 'y';
			this.coordinateTwo = 'x';

			this.dimensionOneSize = height;
			this.dimensionTwoSize = width;
		}

		this.chartOutline
			.attr(this.dimensionOne, this.dimensionOneSize - 1)
			.attr(this.dimensionTwo, this.dimensionTwoSize);

		this.renderScoreAxis(this.scoreAxisContainer, viewOrientation);
		this.renderBoxPlots(this.boxplotContainers, objective, this.elementUserScoresSummaries, viewOrientation);
	}

	renderScoreAxis(scoreAxisContainer: d3.Selection<any>, viewOrientation: string): void {
		// Delete the elements of the previous scale:
		var elements: any = (<any> scoreAxisContainer.node()).children;
		for (var i = 0; i < elements.length; i++) {
			elements[i].remove();
		}

		// Create the new Scale:
		var scoreAxisScale: d3.Linear<number, number> = d3.scaleLinear()
			.domain([0, 1])

		var scoreAxisHeight: number = (this.dimensionTwoSize) - (2 * this.scaleDimensionTwoOffset);

		var scoreAxis: any;

		if (viewOrientation === 'vertical') {
			scoreAxisScale.range([scoreAxisHeight, 0]);
			scoreAxis = d3.axisLeft(scoreAxisScale);
			scoreAxisContainer.attr('transform', 'translate(26,' + this.scaleDimensionTwoOffset +')');
		} else {
			scoreAxisScale.range([0, scoreAxisHeight]);
			scoreAxis = d3.axisTop(scoreAxisScale);
			scoreAxisContainer.attr('transform', 'translate(' + this.scaleDimensionTwoOffset + ',' + this.scaleDimensionOneOffset + ')');
		}

		scoreAxis.ticks(20);
		scoreAxisContainer.call(scoreAxis)
			.style('font-size', 8)

	}

	renderBoxPlots(boxplotContainers: d3.Selection<any>, objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[], viewOrientation: string) {

		boxplotContainers.attr('transform', (d: ElementUserScoresSummary, i: number) => {
			let offset: number = (((this.dimensionOneSize - this.scaleDimensionOneOffset) / elementUserScoresSummaries.length) * i) + (this.scaleDimensionOneOffset + 10);
			return 'translate(' + ((viewOrientation === 'vertical') ? offset : 0) + ',' + ((viewOrientation === 'vertical') ? 0 : offset) + ')';
		});


		this.renderBoxPlotElements(objective, elementUserScoresSummaries, viewOrientation);
	}

	renderBoxPlotElements(objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[], viewOrientation: string) {
		var boxplotWidth: number = ((this.dimensionOneSize / elementUserScoresSummaries.length) / 2);

		var heightScale: d3.Linear<number, number> = d3.scaleLinear()
			.domain([0, 1])
			.range([0, this.dimensionTwoSize - (2 * this.scaleDimensionTwoOffset)]);

			console.log(heightScale, elementUserScoresSummaries);

		this.boxplotQuartileOutlines
			.attr(this.dimensionOne, boxplotWidth)
			.attr(this.dimensionTwo, (d: ElementUserScoresSummary, i: number) => { return heightScale(d.thirdQuartile - d.firstQuartile); })
			.attr(this.coordinateOne, 0)
			.attr(this.coordinateTwo, (d: ElementUserScoresSummary, i: number) => { return ((this.dimensionTwoSize) - (heightScale(d.thirdQuartile) + this.scaleDimensionTwoOffset)); })
			.style('fill', 'white')
			.style('fill-opactiy', 0)
			.style('stroke', 'black')
			.style('stroke-width', 1);

	}

}





