/*
* @Author: aaronpmishkin
* @Date:   2016-07-19 19:57:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-16 20:55:20
*/

// Angular Resources:
import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes: 
import { ScoreFunctionViewerService }								from '../services/ScoreFunctionViewer.service';

// Model Classes:
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { ScoreFunction }											from '../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../model/DiscreteScoreFunction';

import { ElementUserScoresSummary } 								from '../types/ScoreFunctionViewer.types';



@Injectable()
export class ScoreDistributionChartRenderer {

	// d3 Selections saved as fields to avoid parsing the DOM when unnecessary. 
	public rootContainer: d3.Selection<any>;
	public chartOutline: d3.Selection<any>;
	public chartContainer: d3.Selection<any>;
	public boxplotContainers: d3.Selection<any>;
	public boxplotQuartileOutlines: d3.Selection<any>;
	public boxplotMaxLines: d3.Selection<any>;
	public boxplotMinLines: d3.Selection<any>;
	public boxplotMedianLines: d3.Selection<any>;
	public boxplotUpperDashedLines: d3.Selection<any>;
	public boxplotLowerDashedLines: d3.Selection<any>;
	public axesContainer: d3.Selection<any>;
	public scoreAxisContainer: d3.Selection<any>;
	public domainAxisContainer: d3.Selection<any>;
	public domainAxis: d3.Selection<any>;
	public domainLabelsContainer: d3.Selection<any>;
	public domainLabels: d3.Selection<any>;


	private elementUserScoresSummaries: ElementUserScoresSummary[];

	private dimensionOne: string;
	private dimensionTwo: string;
	private coordinateOne: string;
	private coordinateTwo: string;

	private dimensionOneSize: number;
	private dimensionTwoSize: number;

	private coordinateOneOffset: number = 26;
	private coordinateTwoOffset: number = 15;


	public static defs: any = { 
		OUTLINE_CONTAINER: 'distribution-outline-container',
		OUTLINE: 'distribution-outline',


		CHART_CONTAINER: 'distribution-chart-container',
		BOXPLOT_CONTAINERS_CONTAINER: 'distribution-boxplot-containers-container',
		BOXPLOT_CONTAINER: 'distribution-boxplot-container',

		BOXPLOT_QUARTILE_OUTLINE: 'distribution-boxplot-quartile-outline',
		BOXPLOT_MAX_LINE: 'distribution-boxplot-max-line',
		BOXPLOT_MIN_LINE: 'distribution-boxplot-min-line',
		BOXPLOT_MEDIAN_LINE: 'distribution-boxplot-median-line',
		BOXPLOT_DASHED_LINE: 'distribution-boxplot-dashed-line',

		AXES_CONTAINER: 'distribution-axes-container',
		SCORE_AXIS_CONTAINER: 'distribution-score-axis-container',
		DOMAIN_AXIS_CONTAINER: 'distribution-domain-axis-container',

		DOMAIN_AXIS: 'distribution-domain-axis',
		DOMAIN_LABELS_CONTAINER: 'distribution-domain-labels-container',
		DOMAIN_LABEL: 'distribution-domain-label',
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

		this.axesContainer = this.chartContainer.append('g')
			.classed(ScoreDistributionChartRenderer.defs.AXES_CONTAINER, true)
			.attr('id', 'distribution-' + objective.getId() + '-axes-container');


		this.scoreAxisContainer = this.axesContainer.append('g')
			.classed(ScoreDistributionChartRenderer.defs.SCORE_AXIS_CONTAINER, true)
			.attr('id', 'distribution-' + objective.getId() + '-score-axis-container');


		this.domainAxisContainer = this.axesContainer.append('g')
			.classed(ScoreDistributionChartRenderer.defs.DOMAIN_AXIS_CONTAINER, true)
			.attr('id', 'distribution-' + objective.getId() + '-domain-axis-container');



		var elementUserScoresSummaries: ElementUserScoresSummary[] = this.scoreFunctionViewerService.getAllElementUserScoresSummaries(objective);
		this.elementUserScoresSummaries = elementUserScoresSummaries.slice();

		this.createDomainAxis(this.domainAxisContainer, objective, elementUserScoresSummaries);
		this.createBoxPlots(this.chartContainer, objective, elementUserScoresSummaries);
	}

	createDomainAxis(domainAxisContainer: d3.Selection<any>, objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[]): void {

		this.domainAxis = domainAxisContainer.append('line')
			.classed(ScoreDistributionChartRenderer.defs.DOMAIN_AXIS, true)
			.attr('id', 'distribution-' + objective.getId() + '-domain-axis');

		this.domainLabelsContainer = domainAxisContainer.append('g')
			.classed(ScoreDistributionChartRenderer.defs.DOMAIN_LABELS_CONTAINER, true)
			.attr('id', 'distribution-' + objective.getId() + 'domain-labels-container')

		this.domainLabelsContainer.selectAll('.' + ScoreDistributionChartRenderer.defs.DOMAIN_LABEL)
			.data(elementUserScoresSummaries)
			.enter().append('text')
				.classed(ScoreDistributionChartRenderer.defs.DOMAIN_LABEL, true)
				.attr('id', (d: ElementUserScoresSummary) => { return 'distribution-' + d.element + '-domain-label'; });

		this.domainLabels = this.domainLabelsContainer.selectAll('.' + ScoreDistributionChartRenderer.defs.DOMAIN_LABEL);
	}


	createBoxPlots(chartContainer: d3.Selection<any>, objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[]): void {

		chartContainer.append('g')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_CONTAINERS_CONTAINER, true)
			.attr('id', 'distribution-' + objective.getId() + '-boxplot-containers-container')
			.selectAll('.' + ScoreDistributionChartRenderer.defs.BOXPLOT_CONTAINER)
				.data(elementUserScoresSummaries)
				.enter().append('g')
					.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_CONTAINER, true)
					.attr('id', (d: ElementUserScoresSummary) => { return 'distribution-' + d.element + '-boxplot-container'; });

		this.boxplotContainers = chartContainer.selectAll('.' + ScoreDistributionChartRenderer.defs.BOXPLOT_CONTAINER);

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
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_DASHED_LINE, true)
			.classed('dashed-line', true);

		this.boxplotLowerDashedLines = boxplotContainers.append('line')
			.classed(ScoreDistributionChartRenderer.defs.BOXPLOT_DASHED_LINE, true)
			.classed('dashed-line', true);

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

		this.renderAxes(this.axesContainer, viewOrientation);
		this.renderBoxPlots(this.boxplotContainers, objective, this.elementUserScoresSummaries, viewOrientation);
	}

	renderAxes(axesContainer: d3.Selection<any>, viewOrientation: string): void {
		// Delete the elements of the previous scale:

		this.renderDomainAxis(this.domainAxis, this.domainLabels, viewOrientation);
		this.renderScoreAxis(this.scoreAxisContainer, viewOrientation);

	}

	renderDomainAxis(domainAxis: d3.Selection<any>, domainLabels: d3.Selection<any>, viewOrientation: string): void {

		var calculateDomainAxisCoordinateTwo = () => { 
			return (viewOrientation === 'vertical') ? 
				(this.dimensionTwoSize - this.coordinateTwoOffset) + 0.5
			:
				this.coordinateTwoOffset;
		};

		var labelOffset: number = 8;

		domainAxis
			.attr(this.coordinateOne + '1', this.coordinateOneOffset)
			.attr(this.coordinateTwo + '1', calculateDomainAxisCoordinateTwo)
			.attr(this.coordinateOne + '2', this.dimensionOneSize)
			.attr(this.coordinateTwo + '2', calculateDomainAxisCoordinateTwo)
			.style('stroke-wdith', 2)
			.style('stroke', 'black');

		domainLabels
			.text((d: ElementUserScoresSummary) => { return d.element })
			.attr(this.coordinateOne, (d: ElementUserScoresSummary, i: number) => { return this.calculateBoxPlotCoordinateOne(i) + labelOffset; })
			.attr(this.coordinateTwo, () => { return  calculateDomainAxisCoordinateTwo() + ((viewOrientation === 'vertical') ? (this.coordinateTwoOffset / 2) : -(this.coordinateTwoOffset / 2)); })
			.style('font-size', 8);

	}

	renderScoreAxis(scoreAxisContainer: d3.Selection<any>, viewOrientation: string): void {
		var elements: any = (<any> scoreAxisContainer.node()).children;
		for (var i = 0; i < elements.length; i++) {
			elements[i].remove();
		}

		// Create the new Scale:
		var scoreAxisScale: d3.Linear<number, number> = d3.scaleLinear()
			.domain([0, 1])

		var scoreAxisHeight: number = (this.dimensionTwoSize) - (1.5 * this.coordinateTwoOffset);

		var scoreAxis: any;

		if (viewOrientation === 'vertical') {
			scoreAxisScale.range([scoreAxisHeight, 0]);
			scoreAxis = d3.axisLeft(scoreAxisScale);
			scoreAxisContainer.attr('transform', 'translate(' + this.coordinateOneOffset + ',' + (this.coordinateTwoOffset / 2) +')');
		} else {
			scoreAxisScale.range([0, scoreAxisHeight]);
			scoreAxis = d3.axisTop(scoreAxisScale);
			scoreAxisContainer.attr('transform', 'translate(' + (this.coordinateTwoOffset / 2) + ',' + this.coordinateOneOffset + ')');
		}

		scoreAxis.ticks(20);
		scoreAxisContainer.call(scoreAxis)
			.style('font-size', 8);
	}

	renderBoxPlots(boxplotContainers: d3.Selection<any>, objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[], viewOrientation: string) {

		boxplotContainers.attr('transform', (d: ElementUserScoresSummary, i: number) => {
			let offset: number = this.calculateBoxPlotCoordinateOne(i);
			return 'translate(' + ((viewOrientation === 'vertical') ? offset : 0) + ',' + ((viewOrientation === 'vertical') ? 0 : offset) + ')';
		});


		this.renderBoxPlotElements(objective, elementUserScoresSummaries, viewOrientation);
	}

	renderBoxPlotElements(objective: PrimitiveObjective, elementUserScoresSummaries: ElementUserScoresSummary[], viewOrientation: string) {
		var boxplotWidth: number = ((this.dimensionOneSize / elementUserScoresSummaries.length) / 2);

		var heightScale: d3.Linear<number, number> = d3.scaleLinear()
			.domain([0, 1])
			.range([0, (this.dimensionTwoSize - (1.5 * this.coordinateTwoOffset)) - 1]);


		var calculateCoordinateTwoPosition = (score: number) => { return this.dimensionTwoSize - (heightScale(score) + this.coordinateTwoOffset); };

		this.boxplotQuartileOutlines
			.attr(this.dimensionOne, boxplotWidth)
			.attr(this.dimensionTwo, (d: ElementUserScoresSummary, i: number) => { return heightScale(d.thirdQuartile - d.firstQuartile); })
			.attr(this.coordinateOne, 0)
			.attr(this.coordinateTwo, (d: ElementUserScoresSummary, i: number) => { return calculateCoordinateTwoPosition(d.thirdQuartile); })
			.style('fill', 'white')
			.style('fill-opactiy', 0)
			.style('stroke', '#5a5757')
			.style('stroke-width', 1);


		this.boxplotMedianLines
			.attr(this.coordinateOne + '1', 0)
			.attr(this.coordinateTwo + '1', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.median); })
			.attr(this.coordinateOne + '2', boxplotWidth)
			.attr(this.coordinateTwo + '2', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.median); })
			.style('stroke', 'black')
			.style('stroke-width', 2);


		this.boxplotMaxLines
			.attr(this.coordinateOne + '1', 0)
			.attr(this.coordinateTwo + '1', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.max); })
			.attr(this.coordinateOne + '2', boxplotWidth)
			.attr(this.coordinateTwo + '2', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.max); })
			.style('stroke', 'black')
			.style('stroke-width', 2);

		this.boxplotMinLines
			.attr(this.coordinateOne + '1', 0)
			.attr(this.coordinateTwo + '1', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.min); })
			.attr(this.coordinateOne + '2', boxplotWidth)
			.attr(this.coordinateTwo + '2', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.min); })
			.style('stroke', 'black')
			.style('stroke-width', 2);

		this.boxplotUpperDashedLines
			.attr(this.coordinateOne + '1', boxplotWidth / 2)
			.attr(this.coordinateTwo + '1', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.max); })
			.attr(this.coordinateOne + '2', boxplotWidth / 2)
			.attr(this.coordinateTwo + '2', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.thirdQuartile) })


		this.boxplotLowerDashedLines
			.attr(this.coordinateOne + '1', boxplotWidth / 2)
			.attr(this.coordinateTwo + '1', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.firstQuartile) })
			.attr(this.coordinateOne + '2', boxplotWidth / 2)
			.attr(this.coordinateTwo + '2', (d: ElementUserScoresSummary) => { return calculateCoordinateTwoPosition(d.min); })

	}

	calculateBoxPlotCoordinateOne = (index: number) => (((this.dimensionOneSize - this.coordinateOneOffset) / this.elementUserScoresSummaries.length) * index) + (this.coordinateOneOffset + 10);

}





