/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 12:53:30
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-11 22:01:03
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';

// Model Classes
import { User }														from '../model/User';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';

// This class is renders a ValueChart's Alternatives into a series of bar charts that displays the utility for each Alternative's consequences.
// This utility is based on the weights given to objectives, and the user determined scores assigned to points in the consequence space. 
// Each Alternative's value for each PrimitiveObjective is rendered into a rectangle whose height (or width depending on the orientation) is 
// proportional to its (weight * userScore). The rectangles for each Alternative are aligned vertically (or horizontally) so that they form a of 
// series bar charts, one for each Primitive Objective in the ValueChart.

@Injectable()
export class ObjectiveChartRenderer {

	// d3 selections that are saved to avoid searching the DOM every time they are needed.
	public chart: any;					// The 'g' element that contains all the elements making up the objective chart.
	public rowOutlinesContainer: any;
	public rowOutlines: any;			// The collection of all 'rect' elements that are used outline each row.
	public rowsContainer: any;			// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public rows: any;					// The collection of 'g' elements s.t. each element is a row container.
	public dividingLinesContainer: any;
	public dividingLines: any;			// The collection of all the 'line' elements that are used to divide different alternative bars from each other.
	public cells: any;					// The collection of all 'g' elements s.t. each element is a cell container.
	public userScores: any;				// The collection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService) { }

	// This function creates the base containers and elements for the Alternative Summary Chart of a ValueChart.
	createObjectiveChart(el: any, rows: VCRowData[]): void {
		// Create the root container for the objective chart.
		this.chart = el.append('g')
			.classed('objective-chart', true);
		// Create the container for the row outlines.
		this.rowOutlinesContainer = this.rowOutlines = this.chart.append('g')
			.classed('objective-row-outlines-container', true);
		// Create the container to hold the rows.
		this.rowsContainer = this.chart.append('g')
			.classed('objective-rows-container', true);
		// Create the container to hold the dividing lines (dividing between different alternatives).
		this.dividingLinesContainer = this.chart.append('g')
			.classed('objective-dividers-container', true);


		this.createObjectiveRows(this.rowsContainer, this.rowOutlinesContainer, this.dividingLinesContainer, rows);
	}

	// This function creates the individual rows that make up the summary chart. Each row is for one primitive objective in the ValueChart
	createObjectiveRows( rowsContainer: any, rowOutlinesContainer: any, dividingLinesContainer: any, rows: VCRowData[]): void {
		// Create the row outlines for every new PrimitiveObjective. When the graph is being created for the first time, this is every PrimitiveObjective.
		rowOutlinesContainer.selectAll('.objective-row-outline')
			.data(rows)
			.enter().append('rect')
				.classed('objective-row-outline', true)
				.style('stroke-width', 1)
				.style('stroke', 'grey')
				.style('fill', 'white');

		// Create the containers to hold the new rows.
		rowsContainer.selectAll('.objective-row')
			.data(rows)
			.enter().append('g')
				.classed('objective-row', true);

		// Create the dividing lines for the new alternatives.
		dividingLinesContainer.selectAll('.objective-dividing-line')
			.data(this.chartDataService.getValueChart().getAlternatives())
			.enter().append('line')
				.classed('objective-dividing-line', true)
				.style('stroke-width', 1)
				.style('stroke', 'grey');

		// Select all the row outlines (not just the new ones as is done above), and save them as a class field. The same goes for the next two lines, respectively
		this.rowOutlines = this.rowOutlinesContainer.selectAll('.objective-row-outline');
		this.rows = rowsContainer.selectAll('.objective-row');
		this.dividingLines = this.rowOutlinesContainer.selectAll('.objective-dividing-line');

		this.createObjectiveCells(this.rows)
	}
	// This function creates the cells that compose each row of the objective chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective)
	createObjectiveCells(objectiveRows: any): void {
		// Create cells for any new objectives, or for new rows. Once again, if the graph is being create for the first time then this is all rows.
		objectiveRows.selectAll('.objective-cell')
			.data((d: VCRowData) => { return d.cells; })
			.enter().append('g')
				.classed('objective-cell', true);

		this.cells = objectiveRows.selectAll('.objective-cell');

		// Create the bars for each new user score. Note that if this is a Individual ValueChart, there is only on bar in each cell, as there is only one user score for each objective value. 
		this.cells.selectAll('.objective-user-scores')
			.data((d: VCCellData, i: number) => { return d.userScores; })
			.enter().append('rect')
				.classed('objective-user-scores', true);

		this.userScores = this.cells.selectAll('.objective-user-scores');
	}

	// This function positions and gives widths + heights to the elements created by the createObjectiveChart method.
	renderObjectiveChart(rows: VCRowData[], viewOrientation: string): void {
		this.chart
			.attr('transform', () => {
				if (viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, this.renderConfigService.dimensionTwoSize + 10);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, 0);	// TODO: Fix this.
			});

		this.renderObjectiveChartRows(viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by createObjectiveRows. Unlike in the summary chart we directly position the row
	// containers here because the positions of the scores (and therefore row containers) is are absolute since the bar charts are not stacked. 
	renderObjectiveChartRows(viewOrientation: string): void {
		this.rowOutlines
			.attr('transform', (d: VCRowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.renderConfigService.dimensionTwoScale(d.weightOffset))); // Position each of the rows based on the combined weights of the previous rows.
			})																																					// this is because the heights of the previous rows are proportional to their weights.
			.attr(this.renderConfigService.dimensionOne, this.renderConfigService.dimensionOneSize)
			.attr(this.renderConfigService.dimensionTwo, (d: VCRowData) => {
				var objectiveWeight: number = this.chartDataService.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
				return this.renderConfigService.dimensionTwoScale(objectiveWeight);																				// Set the height of the row to be proportional to its weight.
			});

		this.rows
			.attr('transform', (d: VCRowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.renderConfigService.dimensionTwoScale(d.weightOffset)));	// Transform each row container to have the correct y (or x) position based on the combined weights of the previous rows.
			});

		this.dividingLines
			.attr(this.renderConfigService.coordinateOne + '1', this.calculateCellCoordinateOne)
			.attr(this.renderConfigService.coordinateTwo + '1', (d: VCCellData, i: number) => { return 0; })
			.attr(this.renderConfigService.coordinateOne + '2', this.calculateCellCoordinateOne)
			.attr(this.renderConfigService.coordinateTwo + '2', (d: VCCellData, i: number) => { return this.renderConfigService.dimensionTwoSize });

		this.renderObjectiveChartCells(viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by createObjectiveCells.
	renderObjectiveChartCells(viewOrientation: string): void {
		this.cells
			.attr('transform', (d: VCCellData, i: number) => { 
				var coordinateOne: number = this.calculateCellCoordinateOne(d, i);
				return this.renderConfigService.generateTransformTranslation(viewOrientation, coordinateOne, 0); 
			})

		this.userScores
			.style('fill', (d: any, i: number) => { return d.objective.getColor(); })
			.attr(this.renderConfigService.dimensionOne, this.calculateUserScoreDimensionsOne)
			.attr(this.renderConfigService.dimensionTwo, this.calculateUserScoreDimensionTwo)
			.attr(this.renderConfigService.coordinateOne, (d: any, i: number) => { return this.calculateUserScoreDimensionsOne(d, i) * i; });

		if (viewOrientation === 'vertical') {
			this.userScores
				.attr(this.renderConfigService.coordinateTwo, (d: any, i: number) => {
					var objectiveWeight: number = this.chartDataService.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
					var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
					return this.renderConfigService.dimensionTwoScale(objectiveWeight) - this.renderConfigService.dimensionTwoScale(score * objectiveWeight);
				});
		}
	}

	// Anonymous functions that are used often enough to be made class fields:

	// Calculate the CoordinateOne of a cell given the cells data and its index. Cells are all the same width (or height), so we simply divide the length of each row into equal amounts to find their locations.
	calculateCellCoordinateOne = (d: VCCellData, i: number) => { return i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives); }; 
	// Calculate the CoordinateOne of a userScore given the userScore object and its index. userScores are just further subdivisions of cells based on the number of userScores in each cell.
	calculateUserScoreDimensionsOne = (d: any, i: number) => { return (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives) / this.chartDataService.numUsers; };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: any, i: number) => {
		var objectiveWeight: number = this.chartDataService.weightMap.getNormalizedObjectiveWeight(d.objective.getName());
		var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
		return this.renderConfigService.dimensionTwoScale(score * objectiveWeight);
	};
}

