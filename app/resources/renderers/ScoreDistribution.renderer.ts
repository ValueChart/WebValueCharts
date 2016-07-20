/*
* @Author: aaronpmishkin
* @Date:   2016-07-19 19:57:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-19 22:35:00
*/

// Angular Resources:
import { Injectable } 												from '@angular/core';


// Model Classes:
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { ScoreFunction }											from '../model/ScoreFunction';
import { ContinuousScoreFunction }									from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }									from '../model/DiscreteScoreFunction';

import { DomainElement, UserDomainElements } 						from '../model/ChartDataTypes';



@Injectable()
export class ScoreDistributionRenderer {

	// d3 Selections saved as fields to avoid parsing the DOM when unnecessary. 
	public rootContainer: d3.Selection<any>;
	public outline: d3.Selection<any>;
	public chartContainer: d3.Selection<any>;
	public boxPlotContainers: d3.Selection<any>;
	public boxPlotLabelsContainer: d3.Selection<any>;
	public boxPlotLabels: d3.Selection<any>;
	public boxPlotQuartileOutlines: d3.Selection<any>;
	public boxPlotMaxLines: d3.Selection<any>;
	public boxPlotMinLines: d3.Selection<any>;
	public boxPlotMedianLines: d3.Selection<any>;
	public boxPlotUpperDashedLines: d3.Selection<any>;
	public boxPlotLowerDashedLines: d3.Selection<any>;


	private usersDomainElements: UserDomainElements[];


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



	}

	constructor() { }


	createScoreDistributionChart(el: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {
		this.rootContainer = el;

		var objectiveId = objective.getId();

		// Create the a container for the plot outlines, and the plot outlines itself.
		this.outline = el.append('g')
			.classed(ScoreDistributionRenderer.defs.OUTLINE_CONTAINER, true)
			.attr('id', 'distribution-' + objectiveId + '-outline-container')
			.append('rect')
				.classed(ScoreDistributionRenderer.defs.OUTLINE, true)
				.attr('id', 'distribution-' + objectiveId + '-outline')
				.classed('valuechart-outline', true);

		// Create a container to hold all the elements of the plot.
		this.chartContainer = el.append('g')
			.classed(ScoreDistributionRenderer.defs.CHART_CONTAINER, true)
			.attr('id', 'distribution-' + objectiveId + '-chart-container');


		this.usersDomainElements = usersDomainElements.slice();

		this.createBoxPlots(this.chartContainer, objective, usersDomainElements);
	}


	createBoxPlots(chartContainer: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {

		chartContainer.selectAll('.' + ScoreDistributionRenderer.defs.BOXPLOT_CONTAINER)
			.data(usersDomainElements[0].elements)
			.enter().append('g')
				.classed(ScoreDistributionRenderer.defs.BOXPLOT_CONTAINER, true)
				.attr('id', (d: DomainElement) => { return 'distribution-' + d.element + '-boxplot-container'; });

		this.boxPlotContainers = chartContainer.selectAll('.' + ScoreDistributionRenderer.defs.BOXPLOT_CONTAINER);

		this.boxPlotLabelsContainer = chartContainer.append('g')
			.classed(ScoreDistributionRenderer.defs.BOXPLOT_LABELS_CONTAINER, true)
			.attr('id', 'distribution-' + objective.getId() + '-outline')

		this.boxPlotLabelsContainer.selectAll('.' + ScoreDistributionRenderer.defs.BOXPLOT_LABEL)
			.data(usersDomainElements[0].elements)
			.enter().append('text')
				.classed(ScoreDistributionRenderer.defs.BOXPLOT_LABEL, true)
				.attr('id', (d: DomainElement) => { return 'distribution-' + d.element + '-boxplot-label'; });

		this.boxPlotLabels = this.boxPlotLabelsContainer.selectAll('.' + ScoreDistributionRenderer.defs.BOXPLOT_LABEL)

	}

	createBoxPlotElements(boxPlotContainers: d3.Selection<any>, objective: PrimitiveObjective, usersDomainElements: UserDomainElements[]): void {

		this.boxPlotQuartileOutlines = boxPlotContainers.append('rect')
			.classed(ScoreDistributionRenderer.defs.BOXPLOT_QUARTILE_OUTLINE, true);

		this.boxPlotMaxLines = boxPlotContainers.append('line')
			.classed(ScoreDistributionRenderer.defs.BOXPLOT_MAX_LINE, true);

		this.boxPlotMinLines = boxPlotContainers.append('line')
			.classed(ScoreDistributionRenderer.defs.BOXPLOT_MIN_LINE, true);

		this.boxPlotMedianLines = boxPlotContainers.append('line')
			.classed(ScoreDistributionRenderer.defs.BOXPLOT_MEDIAN_LINE, true);

		this.boxPlotUpperDashedLines = boxPlotContainers.append('line')
			.classed(ScoreDistributionRenderer.defs.BOXPLOT_DASHED_LINE, true);

		this.boxPlotLowerDashedLines = boxPlotContainers.append('line')
			.classed(ScoreDistributionRenderer.defs.BOXPLOT_DASHED_LINE, true);
	}

}





