/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 15:34:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-10 11:56:52
*/

import { Injectable } 					from '@angular/core';

// d3
import * as d3 							from 'd3';

// Application Classes
import { ChartDataService }				from '../services/ChartData.service';


// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';
import { ContinuousScoreFunction }		from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction }		from '../model/DiscreteScoreFunction';

// This class is the base class for DiscreteScoreFuntionRenderer, and ContinuousScoreFunctionRenderer. It contains the logic for creating and rendering the 
// axis, labels, and base containers of a ScoreFunction.

@Injectable()
export abstract class ScoreFunctionRenderer {

	protected domainSize: number;					// The number of domain elements the score function needs to plot.

	public rootContainer: any;						// The 'g' element that is the root container of the score function plot.
	public plotOutline: any;						// The 'rect' element that is used to outline the score function plot
	public plotContainer: any;						// The 'g' element that contains the plot itself.
	public domainLabelContainer: any;				// The 'g' element that contains the labels for each domain element. 
	public domainLabels: any;						// The collection of 'text' elements s.t. each element is a label for one domain element.
	public plotElementsContainer: any;				// The 'g' element that holds the elements making up the plot, like points and fit lines, or bars.
	public axisContainer: any;						// The 'g' element that conntains the y and x axis.
	public utilityLabelContainer: any;				// The 'g' element that contains the labels for utility axis.

	protected yAxisXCoordinate: number;				// The x coordinate of the y-axis in the plot.
	protected xAxisYCoordinate: number;				// The y coordinate of the x-axis in the plot
	protected yAxisTopCoordinate: number;			// The y coordinate of the top of the y-axis
	protected xAxisRightCoordinate: number;			// The x coordinate of the rightmost end of the x-axis.

	protected labelOffset: number = 10;	// Minimum offset of the x and y axis from the edge of the container in a score function plot.

	constructor(protected chartDataService: ChartDataService) { }

	// This function creates the base containers and elements for a score function plot.s
	createScoreFunction(el: any, objective: PrimitiveObjective): void {
		var objectiveName: string = objective.getName();

		// The root container is passed in.
		this.rootContainer = el;

		// Create the a container for the plot outlines, and the plot outlines itself.
		this.plotOutline = el.append('g')
			.classed('scorefunction-' + objectiveName + '-outline-container', true)
			.append('rect')
				.classed('scorefunction-' + objectiveName + '-outline', true)
				.style('fill', 'white')
				.style('stroke-width', 1)
				.style('stroke', 'grey');

		// Create a container to hold all the elements of the plot.
		this.plotContainer = el.append('g')
			.classed('scorefunction-' + objectiveName + '-plot-container', true);

		this.createScoreFunctionAxis(this.plotContainer, objectiveName);

		// TODO: should make this method a member of PrimitiveObjective?
		var domainElements: (string | number)[] = this.chartDataService.getDomainElements(objective);

		this.domainLabelContainer = this.plotContainer.append('g')								// Create a container to hold the domain axis labels.
			.classed('scorefunction-' + objectiveName + '-domainlabels-container', true);

		this.plotElementsContainer = this.plotContainer.append('g')								// create a container to hold all the elements of the plot, like points, lines, bars, etc.
			.classed('scorefunction-' + objectiveName + '-plotelements-container', true);

		this.createPlot(this.plotElementsContainer, this.domainLabelContainer, objective, domainElements);
	}

	// This function creates the axis of a score function plot, both x and y, and creates the utility axis labels.
	// Note that the domain labels are created in createPlot, because they are data dependent.
	createScoreFunctionAxis(plotContainer: any, objectiveName: string): void {
		
		this.axisContainer = plotContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-axis-container', true);

		this.axisContainer.append('line')
			.classed('scorefunction-' + objectiveName + '-x-axis', true)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.axisContainer.append('line')
			.classed('scorefunction-' + objectiveName + '-y-axis', true)
			.style('stroke-width', 1)
			.style('stroke', 'black');

		this.utilityLabelContainer = plotContainer.append('g')
			.classed('scorefunction-' + objectiveName + '-utilitylabel-container', true);

		this.utilityLabelContainer.append('text')
			.classed('scorefunction-' + objectiveName + '-0-label', true);

		this.utilityLabelContainer.append('text')
			.classed('scorefunction-' + objectiveName + '-1-label', true);
	}

	// This function creates the domain labels for the domain element axis. DiscreteScoreFunction and ContinuousScoreFunction extend this method in order
	// to create the specific elements they need.
	createPlot(plotElementsContainer: any, domainLabelContainer: any, objective: PrimitiveObjective, domainElements: (string | number)[]): void {
		var objectiveName = objective.getName();

		// Create one label for each element of the PrimitiveObjective's domain.
		domainLabelContainer.selectAll('.scorefunction-' + objectiveName + '-domain-labels')
			.data(domainElements)
			.enter().append('text')
				.classed('scorefunction-' + objectiveName + '-domain-labels', true)
				.attr('id', (d: (string | number)) => {
					return 'scorefunction-' + objectiveName + '-' + d + '-label';
				});

		this.domainLabels = domainLabelContainer.selectAll('.scorefunction-' + objectiveName + '-domain-labels');
	}

	// This function renders the elements created by createScoreFunction
	renderScoreFunction(el: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, width: number, height: number): void {
		var objectiveName: string = objective.getName();

		var domainElements: (number | string)[] = this.chartDataService.getDomainElements(objective);
		var domainSize: number = domainElements.length;

		this.yAxisXCoordinate = Math.max(width / 20, this.labelOffset);
		this.xAxisYCoordinate = Math.min((19 / 20) * height, height - this.labelOffset);
		this.yAxisTopCoordinate = Math.max(height / 20, 5);
		this.xAxisRightCoordinate = Math.min((19 / 20) * width, width - this.labelOffset);

		this.plotOutline
			.select('rect')
				.attr('width', width - 1)
				.attr('height', height);


		this.renderScoreFunctionAxis(this.axisContainer, this.utilityLabelContainer, objectiveName);

		this.renderPlot(this.domainLabels, this.plotElementsContainer, objective, scoreFunction, domainElements, width, height);			
	}

	// This function renders the elements created by createScoreFunctionAxis
	renderScoreFunctionAxis(axisContainer: any, utilityLabelContainer: any, objectiveName: string): void {

		axisContainer.select('.scorefunction-' + objectiveName + '-x-axis')
			.attr('x1', this.yAxisXCoordinate)
			.attr('y1', this.xAxisYCoordinate)
			.attr('x2', this.xAxisRightCoordinate)
			.attr('y2', this.xAxisYCoordinate);

		axisContainer.select('.scorefunction-' + objectiveName + '-y-axis')
			.attr('x1', this.yAxisXCoordinate)
			.attr('y1', this.xAxisYCoordinate)
			.attr('x2', this.yAxisXCoordinate)
			.attr('y2', this.yAxisTopCoordinate);

		utilityLabelContainer.select('.scorefunction-' + objectiveName + '-0-label')
			.text('0')
			.attr('x', this.yAxisXCoordinate - this.labelOffset)
			.attr('y', this.xAxisYCoordinate + (this.labelOffset / 2));

		utilityLabelContainer.select('.scorefunction-' + objectiveName + '-1-label')
			.text('1')
			.attr('x', this.yAxisXCoordinate - this.labelOffset)
			.attr('y', this.yAxisTopCoordinate + this.labelOffset);
	}

	// This function renders the elements created by createPlot. Like createPlot, it is extended by DiscreteScoreFunction and ContinuousScoreFunction in order
	// to render their specific elements.
	renderPlot(domainLabels: any, plotElementsContainer: any, objective: PrimitiveObjective, scoreFunction: ScoreFunction, domainElements: (number | string)[],  width: number, height: number): void {

		this.domainSize = domainElements.length;

		domainLabels
			.attr('x', (d: (string | number), i: number) => { return (((this.xAxisRightCoordinate - this.yAxisXCoordinate) / this.domainSize) * i) + this.labelOffset; }) // Position the domain labels at even intervals along the axis.
			.attr('y', this.xAxisYCoordinate + this.labelOffset - 2)
			.text((d: (string | number)) => { return d; })
			.style('font-size', '9px');
	}



	// Anonymous functions that are used often enough to be made class fields:

	calculatePlotElementCoordinateOne = (d: (string | number), i: number) => { return (((this.xAxisRightCoordinate - this.yAxisXCoordinate) / this.domainSize) * i) + this.labelOffset * 1.5; }



}
