/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 15:34:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-08 15:21:46
*/

import { Injectable } 					from '@angular/core';

// d3
import * as d3 							from 'd3';

import { ChartDataService }				from '../services/ChartData.service';


// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';


@Injectable()
export class ScoreFunctionRenderer {

	labelOffset: number = 10;

	constructor(private chartDataService: ChartDataService) { }

	createScoreFunction(el: any, objective: PrimitiveObjective): void {
		var objectiveName: string = objective.getName();

		el.append('g')
			.classed('scorefunction-' + objectiveName + '-outline-container', true)
			.append('rect')
				.classed('scorefunction-' + objectiveName + '-outline', true)
				.style('fill', 'white')
				.style('stroke-width', 1)
				.style('stroke', 'grey');

		var chartContainer = el.append('g')
			.classed('scorefunction-' + objectiveName + '-chart-container', true);

		var axisContainer = chartContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-axis-container', true);

		axisContainer.append('line')
			.classed('scorefunction-' + objectiveName + '-x-axis', true)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		axisContainer.append('line')
			.classed('scorefunction-' + objectiveName + '-y-axis', true)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		var labelContainer = chartContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-label-container', true);

		labelContainer.append('text')
			.classed('scorefunction-' + objectiveName + '-0-label', true);

		labelContainer.append('text')
			.classed('scorefunction-' + objectiveName + '-1-label', true);

		var domainElements: (string | number)[] = this.chartDataService.getDomainElements(objective);

		labelContainer.selectAll('.scorefunction-' + objectiveName + '-domain-labels')
			.data(domainElements)
			.enter().append('text')
				.classed('scorefunction-' + objectiveName + '-domain-labels', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objectiveName + '-' + d + '-label';
				});

		var plotContainer = chartContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-plot-container', true);

		if (objective.getDomainType() === 'continuous') {
			this.createContinuousPlot(plotContainer, objective, domainElements);
		} else if (objective.getDomainType() === 'categorical' || objective.getDomainType() === 'interval') {
			this.createDiscretePlot(plotContainer, objective, domainElements);
		}

	}

	createDiscretePlot(plotContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[] ) {
		var barContainer = plotContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-bars-container', true);

		barContainer.selectAll('.scorefunction-' + objective.getName() + '-bar')
				.data(domainElements)
				.enter().append('rect')
					.classed('scorefunction-' + objective.getName() + '-bar', true)
					.attr('id', (d: (string | number)) => {
						return 'scorefunction-' + objective.getName() + '-' + d + '-bar';
					});

		barContainer.selectAll('.scorefunction-' + objective.getName() + '-bartop')
			.data(domainElements)
			.enter().append('rect')
				.classed('scorefunction-' + objective.getName() + '-bartop', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objective.getName() + '-' + d + '-bartop';
				});
					
	}

	createContinuousPlot(plotContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]) {

		plotContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-points-container', true)
			.selectAll('circle')
				.data(domainElements)
				.enter().append('circle')
					.classed('scorefunction-' + objective.getName() + '-point', true)
					.attr('id', (d: (string | number)) => {
						return 'scorefunction-' + objective.getName() + '-' + d + '-point';
					});

		domainElements.pop();

		plotContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-fitline-container', true)
			.selectAll('line')
				.data(domainElements)
				.enter().append('line')
					.classed('scorefunction-' + objective.getName() + '-fitline', true)
					.attr('id', (d: (string | number)) => {
						return 'scorefunction-' + objective.getName() + '-' + d + '-fitline';
					});
	}

	renderScoreFunction(el: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, width: number, height: number) {
		var objectiveName: string = objective.getName();

		var domainElements: (number | string)[] = this.chartDataService.getDomainElements(objective);
		var domainSize: number = domainElements.length;

		el.select('.scorefunction-' + objectiveName + '-outline-container')
			.select('rect')
				.attr('width', width - 1)
				.attr('height', height);


		var yAxisXPosition: number = Math.max(width / 20, this.labelOffset);
		var xAxisYPosition: number = Math.min((19 / 20) * height, height - this.labelOffset);
		var yAxisTopPosition: number = Math.max(height / 20, 5);
		var xAxisRightPosition: number = Math.min((19 / 20) * width, width - this.labelOffset);

		el.select('.scorefunction-' + objectiveName + '-x-axis')
			.attr('x1', yAxisXPosition)
			.attr('y1', xAxisYPosition)
			.attr('x2', xAxisRightPosition)
			.attr('y2', xAxisYPosition);

		el.select('.scorefunction-' + objectiveName + '-y-axis')
			.attr('x1', yAxisXPosition)
			.attr('y1', xAxisYPosition)
			.attr('x2', yAxisXPosition)
			.attr('y2', yAxisTopPosition);

		var labelContainer: any = el.select('.scorefunction-' + objectiveName + '-label-container');

		labelContainer.select('.scorefunction-' + objectiveName + '-0-label')
			.text('0')
			.attr('x', yAxisXPosition - this.labelOffset)
			.attr('y', xAxisYPosition + (this.labelOffset / 2));

		labelContainer.select('.scorefunction-' + objectiveName + '-1-label')
			.text('1')
			.attr('x', yAxisXPosition - this.labelOffset)
			.attr('y', yAxisTopPosition + this.labelOffset);


		labelContainer.selectAll('.scorefunction-' + objectiveName + '-domain-labels')
			.attr('x', (d: (string | number), i: number) => { return (((xAxisRightPosition - yAxisXPosition) / domainSize) * i) + this.labelOffset; })
			.attr('y', xAxisYPosition + this.labelOffset - 2)
			.text((d: (string | number)) => { return d; })
			.style('font-size', '9px');

		var plotContainer = el.select('.scorefunction-' + objectiveName + '-plot-container');


		if (objective.getDomainType() === 'continuous') {
			this.renderContinuousPlot(plotContainer, objective, (<ContinuousScoreFunction>scoreFunction), <number[]> domainElements, width, height);
		} else if (objective.getDomainType() === 'categorical' || objective.getDomainType() === 'interval') {
			this.renderDiscretePlot(plotContainer, objective, (<DiscreteScoreFunction>scoreFunction), domainSize, width, height);
		}			
	}

	renderDiscretePlot(plotContainer: any, objective: PrimitiveObjective, scoreFunction: DiscreteScoreFunction, domainSize: number, width: number, height: number) {
		
		// Should not redo these calculations. TODO: Fix
		var yAxisXPosition: number = Math.max(width / 20, this.labelOffset);
		var xAxisYPosition: number = Math.min((19 / 20) * height, height - this.labelOffset);
		var yAxisTopPosition: number = Math.max(height / 20, 5);
		var xAxisRightPosition: number = Math.min((19 / 20) * width, width - this.labelOffset);


		var barWidth: number = (width / domainSize) / 3;
		var heightScale = d3.scale.linear()
			.domain([0, 1])
			.range([0, xAxisYPosition]);

		plotContainer.select('.scorefunction-' + objective.getName() + '-bars-container')
			.selectAll('.scorefunction-' + objective.getName() + '-bar')
				.attr('height', (d: (string | number)) => { return Math.max(heightScale(scoreFunction.getScore('' + d)), this.labelOffset); })
				.attr('width', barWidth)
				.attr('x', ((d: (string | number), i: number) => { return (((xAxisRightPosition - yAxisXPosition) / domainSize) * i) + this.labelOffset * 1.5; }))
				.attr('y', (d: (string | number)) => { return xAxisYPosition - Math.max(heightScale(scoreFunction.getScore('' + d)), this.labelOffset); })
				.style('fill', 'white')
				.style('stroke', objective.getColor())
				.style('stroke-width', 1);


		plotContainer.select('.scorefunction-' + objective.getName() + '-bars-container')
			.selectAll('.scorefunction-' + objective.getName() + '-bartop')
				.attr('height', this.labelOffset)
				.attr('width', barWidth)
				.attr('x', ((d: (string | number), i: number) => { return (((xAxisRightPosition - yAxisXPosition) / domainSize) * i) + this.labelOffset * 1.5; }))
				.attr('y', (d: (string | number)) => { return xAxisYPosition - Math.max(heightScale(scoreFunction.getScore('' + d)), this.labelOffset); })
				.style('fill', objective.getColor());

	}

	renderContinuousPlot(plotContainer: any, objective: PrimitiveObjective, scoreFunction: ContinuousScoreFunction, domainElements: number[], width: number, height: number) {
		
		var yAxisXPosition: number = Math.max(width / 20, this.labelOffset);
		var xAxisYPosition: number = Math.min((19 / 20) * height, height - this.labelOffset);
		var yAxisTopPosition: number = Math.max(height / 20, 5);
		var xAxisRightPosition: number = Math.min((19 / 20) * width, width - this.labelOffset);

		var pointRadius = this.labelOffset / 3;

		var heightScale = d3.scale.linear()
			.domain([0, 1])
			.range([0, xAxisYPosition - pointRadius]);


		plotContainer.selectAll('circle')
			.attr('cx', (d: (string | number), i: number) => { return (((xAxisRightPosition - yAxisXPosition) / domainElements.length) * i) + this.labelOffset * 1.5; })
			.attr('cy', (d: (string | number)) => { return (xAxisYPosition) - heightScale(scoreFunction.getScore(+d)); })
			.attr('r', pointRadius)
			.style('fill', objective.getColor());

		plotContainer.selectAll('line')
			.attr('x1', (d: (string | number), i: number) => { return (((xAxisRightPosition - yAxisXPosition) / domainElements.length) * i) + this.labelOffset * 1.5; })
			.attr('y1', (d: (string | number)) => { return (xAxisYPosition) - heightScale(scoreFunction.getScore(+d)); })
			.attr('x2', (d: (string | number), i: number) => { return (((xAxisRightPosition - yAxisXPosition) / domainElements.length) * (i + 1)) + this.labelOffset * 1.5; })
			.attr('y2', (d: (string | number), i: number) => { return (xAxisYPosition) - heightScale(scoreFunction.getScore(domainElements[i+1])); })
			.style('stroke', 'black')
			.style('stroke-width', 1);


	}


}

























