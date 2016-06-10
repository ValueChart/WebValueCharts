/*
* @Author: aaronpmishkin
* @Date:   2016-06-10 10:40:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-10 14:30:29
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

// This class contains the logic for creating and rendering the a DiscreteScoreFunction for an Objective as a bar chart. 

@Injectable()
export class DiscreteScoreFunctionRenderer extends ScoreFunctionRenderer {

	public barContainer: any;
	public utilityBars: any;
	public barTops: any;

	constructor(chartDataService: ChartDataService) {
		super(chartDataService);
	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to create DiscreteScoreFunction specific elements, 
	// like bars for the bar chart that is used to represent element scores.
	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		// Call the create plot method in ScoreFunctionRenderer.
		super.createPlot(plotElementsContainer, domainLabelContainer, objective, domainElements);

		// Create the discrete score function specific elements (e.g. the bars for the bar graph)
		this.barContainer = plotElementsContainer.append('g')
			.classed('scorefunction-' + objective.getName() + '-bars-container', true);

		this.createDiscretePlotElements(this.barContainer, objective, domainElements);
	}

	createDiscretePlotElements(barContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]) {
		// Create a bar for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barContainer.selectAll('.scorefunction-' + objective.getName() + '-bar')
			.data(domainElements)
			.enter().append('rect')
			.classed('scorefunction-' + objective.getName() + '-bar', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-bar';
			});


		this.utilityBars = barContainer.selectAll('.scorefunction-' + objective.getName() + '-bar');

		// Create a selectable bar top for each new element in the Objective's domain. Note that this is all elements when the plot is first created.
		barContainer.selectAll('.scorefunction-' + objective.getName() + '-bartop')
			.data(domainElements)
			.enter().append('rect')
			.classed('scorefunction-' + objective.getName() + '-bartop', true)
			.attr('id', (d: (string | number)) => {
				return 'scorefunction-' + objective.getName() + '-' + d + '-bartop';
			});

		this.barTops = barContainer.selectAll('.scorefunction-' + objective.getName() + '-bartop');

	}

	// This method overrides the createPlot method in ScoreFunctionRenderer in order to render DiscreteScoreFunction specific elements, 
	// like bars for the bar chart that is used to represent element scores.
	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[], viewOrientation: string): void {
		super.renderPlot(domainLabels, plotElementsContainer, objective, scoreFunction, domainElements, viewOrientation);

		this.renderDiscretePlot(plotElementsContainer, objective, (<DiscreteScoreFunction> scoreFunction), viewOrientation);
	}

	renderDiscretePlot(plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: DiscreteScoreFunction, viewOrientation: string): void {
		var barWidth: number = (this.dimensionOneSize / this.domainSize) / 3;
		var heightScale = d3.scale.linear()
			.domain([0, 1]);
		if (viewOrientation === 'vertical') {
			heightScale.range([0, this.domainAxisCoordinateTwo]);
		} else {
			heightScale.range([0, this.utilityAxisMaxCoordinateTwo]);

		}

		// Assign this function to a variable because it is used multiple times. This is cleaner and faster than creating multiple copies of the same anonymous function.
		var calculateBarDimensionTwo = (d: (string | number)) => { return Math.max(heightScale(scoreFunction.getScore('' + d)), this.labelOffset); };


		plotElementsContainer.select('.scorefunction-' + objective.getName() + '-bars-container')
			.selectAll('.scorefunction-' + objective.getName() + '-bar')
			.attr(this.dimensionOne, barWidth)
			.attr(this.dimensionTwo, calculateBarDimensionTwo)
			.attr(this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo, (d: (string | number)) => { 
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo; 
			})
			.style('fill', 'white')
			.style('stroke', objective.getColor())
			.style('stroke-width', 1);


		plotElementsContainer.select('.scorefunction-' + objective.getName() + '-bars-container')
			.selectAll('.scorefunction-' + objective.getName() + '-bartop')
			.attr(this.dimensionTwo, this.labelOffset)
			.attr(this.dimensionOne, barWidth)
			.attr(this.coordinateOne, this.calculatePlotElementCoordinateOne)
			.attr(this.coordinateTwo, (d: (string | number)) => {
				return (viewOrientation === 'vertical') ? this.domainAxisCoordinateTwo - calculateBarDimensionTwo(d) : this.domainAxisCoordinateTwo + calculateBarDimensionTwo(d);
			})
			.style('fill', objective.getColor());

	}

}

