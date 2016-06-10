/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-10 11:03:01
*/

import { Injectable } 					from '@angular/core';

// d3
import * as d3 							from 'd3';

// Application Classes
import { ChartDataService }				from '../services/ChartData.service';
import { ScoreFunctionRenderer }		from './ScoreFunction.renderer';


// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';


@Injectable()
export class DiscreteScoreFunctionRenderer extends ScoreFunctionRenderer {

	public barContainer: any;
	public utilityBars: any;
	public barTops: any;

	constructor(chartDataService: ChartDataService) {
		super(chartDataService);
	}


	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);

		this.barContainer = plotElementsContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-bars-container', true);

		this.createDiscretePlotElements(this.barContainer, objective, domainElements);
	}

	createDiscretePlotElements(barContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]) {

		barContainer.selectAll('.scorefunction-' + objective.getName() + '-bar')
			.data(domainElements)
			.enter().append('rect')
			.classed('scorefunction-' + objective.getName() + '-bar', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-bar';
			});

		this.utilityBars = barContainer.selectAll('.scorefunction-' + objective.getName() + '-bar');

		barContainer.selectAll('.scorefunction-' + objective.getName() + '-bartop')
			.data(domainElements)
			.enter().append('rect')
			.classed('scorefunction-' + objective.getName() + '-bartop', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-bartop';
			});

		this.barTops = barContainer.selectAll('.scorefunction-' + objective.getName() + '-bartop');

	}


	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], width: number, height: number): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, width, height);

		this.renderDiscretePlot(plotElementsContainer, objective, (<DiscreteScoreFunction>scoreFunction), width, height);
	}

	renderDiscretePlot(plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: DiscreteScoreFunction, width: number, height: number): void {
		var barWidth: number = (width / this.domainSize) / 3;

		var heightScale = d3.scale.linear()
			.domain([0, 1])
			.range([0, this.xAxisYCoordinate]);

		var calculateBarDimensionTwo = (d: (string | number)) => { return Math.max(heightScale(scoreFunction.getScore('' + d)), this.labelOffset); };


		plotElementsContainer.select('.scorefunction-' + objective.getName() + '-bars-container')
			.selectAll('.scorefunction-' + objective.getName() + '-bar')
			.attr('height', calculateBarDimensionTwo)
			.attr('width', barWidth)
			.attr('x', this.calculatePlotElementCoordinateOne)
			.attr('y', (d: (string | number)) => { return this.xAxisYCoordinate - calculateBarDimensionTwo(d); })
			.style('fill', 'white')
			.style('stroke', objective.getColor())
			.style('stroke-width', 1);


		plotElementsContainer.select('.scorefunction-' + objective.getName() + '-bars-container')
			.selectAll('.scorefunction-' + objective.getName() + '-bartop')
			.attr('height', this.labelOffset)
			.attr('width', barWidth)
			.attr('x', this.calculatePlotElementCoordinateOne)
			.attr('y', (d: (string | number)) => { return this.xAxisYCoordinate - calculateBarDimensionTwo(d); })
			.style('fill', objective.getColor());

	}

}

