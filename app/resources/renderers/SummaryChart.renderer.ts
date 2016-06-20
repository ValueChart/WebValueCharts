/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:30:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-20 13:25:41
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';

// Model Classes
import { User }														from '../model/User';
import { Alternative }												from '../model/Alternative';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';

// This class renders a ValueChart's Alternatives into a stacked bar chart that summarizes the utility of each Alternative based on
// objective weights, and the user determined scores assigned to points in the consequence space. Each Alternative's value for each PrimitiveObjective 
// is rendered into a rectangle whose height (or width depending on the orientation) is proportional to its (weight * userScore). 
// The rectangles for each Alternative are aligned vertically (or horizontally) so that they form a stacked bar chart and act as a summary for the Alternative's total utility.

@Injectable()
export class SummaryChartRenderer {

	// d3 selections that are saved to avoid searching the DOM every time they are needed.
	public chart: d3.Selection<any>;					// The 'g' element that contains all the elements making up the summary chart.
	public outline: d3.Selection<any>;					// The 'rect' element that outlines the summary chart.
	public rowsContainer: d3.Selection<any>;			// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public dividingLineContainer: d3.Selection<any>;	// The 'g' element that contains the lines that divide different alternatives bars from each other. 
	public rows: d3.Selection<any>;						// The collection of all 'g' elements s.t. each element is a row container.
	public dividingLines: d3.Selection<any>;			// The collection of all 'line' elements that are used to divide different alternative bars from each other.
	public cells: d3.Selection<any>;					// The collection of all 'g' elements s.t. each element is a cell container.
	public userScores: d3.Selection<any>;				// The collection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	public scoreTotalsContainer: d3.Selection<any>;
	public scoreTotalsSubContainers: d3.Selection<any>;
	public scoreTotals: d3.Selection<any>;
	public utilityAxisContainer: d3.Selection<any>;

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService) { }

	// This function creates the base containers and elements for the Alternative Summary Chart of a ValueChart.
	createSummaryChart(el: d3.Selection<any>, rows: VCRowData[]): void {
		// Create the base container for the chart.
		this.chart = el.append('g')
			.classed('summary-chart', true);

		// Create the rectangle which acts as an outline for the chart.
		this.outline = this.chart.append('g')
			.classed('summary-outline-container', true)
			.append('rect')
			.classed('summary-outline', true)
			.classed('valuechart-outline', true)

		// Create the container that holds all the row containers.
		this.rowsContainer = this.chart.append('g')
			.classed('summary-rows-container', true);

		// Create the container that holds the dividing lines.
		this.dividingLineContainer = this.chart.append('g')
			.classed('summary-dividers-container', true);

		this.scoreTotalsContainer = this.chart.append('g')
			.classed('summary-totalscores-container', true);

		this.utilityAxisContainer = this.chart.append('g')
			.classed('summary-utilityaxis-container', true)
			.classed('utility-axis', true);


		this.createSummaryChartRows(this.rowsContainer, this.dividingLineContainer, this.scoreTotalsContainer, rows);
	}

	// This function creates the individual rows that make up the summary chart. Each row is for one primitive objective in the ValueChart
	// and the rows are stacked on each other in order to create a stacked bar chart. 
	createSummaryChartRows(rowsContainer: d3.Selection<any>, dividingLineContainer: d3.Selection<any>, scoreTotalsContainer: d3.Selection<any>, rows: VCRowData[]): void {
		// Create rows for every new PrimitiveObjective. If the rows are being created for this first time, this is all of the PrimitiveObjectives in the ValueChart.
		var newRows: d3.Selection<any> = rowsContainer.selectAll('.summary-row')
			.data(rows)
			.enter().append('g')
				.classed('summary-row', true);

		var alternatives: Alternative[] = this.chartDataService.alternatives;

		// Create the lines that divide different Alternatives form each other.
		dividingLineContainer.selectAll('.summary-dividing-line')
			.data(alternatives)
			.enter().append('line')
				.classed('summary-dividing-line', true)
				.classed('valuechart-dividing-line', true);

		var subContainers = scoreTotalsContainer.selectAll('.summary-scoretotal-subcontainer')
			.data((rows[0].cells))
			.enter().append('g')
				.classed('summary-scoretotal-subcontainer', true);

		subContainers.selectAll('.summary-score-total')
			.data((d: VCCellData) => { return d.userScores; })
			.enter().append('text')
				.classed('summary-score-total', true);

		// Save all the rows as a field of the class. This is done separately from creating the rows as newRows is the selection of newly created rows containers,
		// NOT all row containers. A similar argument explains why the dividing lines are saved here as well.
		this.rows = rowsContainer.selectAll('.summary-row');
		this.dividingLines = dividingLineContainer.selectAll('.summary-dividing-line');
		this.scoreTotalsSubContainers = scoreTotalsContainer.selectAll('.summary-scoretotal-subcontainer');
		this.scoreTotals = this.scoreTotalsSubContainers.selectAll('.summary-score-total');

		this.createSummaryChartCells(this.rows);
	}

	// This function creates the cells that compose each row of the summary chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective)
	createSummaryChartCells(stackedBarRows: d3.Selection<any>): void {
		// Create cells for each new Alternative in every old or new row. If the cells are being created for this first time, this is done for all Alternatives and all rows.
		stackedBarRows.selectAll('.summary-cell')
			.data((d: VCRowData) => { return d.cells; })
			.enter().append('g')
				.classed('summary-cell', true);

		// Save all the cells as a field of the class.
		this.cells = stackedBarRows.selectAll('.summary-cell');

		// Create the bars for each new user score. Note that if this is a Individual ValueChart, there is only on bar in each cell, as there is only one user score for each objective value. 
		this.cells.selectAll('.summary-user-scores')
			.data((d: VCCellData, i: number) => { return d.userScores; })
			.enter().append('rect')
				.classed('summary-user-scores', true);

		// Save all the user scores bars as a field of the class.
		this.userScores = this.cells.selectAll('.summary-user-scores');
	}

	updateSummaryChart(rows: VCRowData[], viewOrientation: string): void {

		var alternatives: Alternative[] = this.chartDataService.alternatives;

		var cellsToUpdate: d3.Selection<any> = this.rows.data(rows).selectAll('.summary-cell')
			.data((d: VCRowData) => { return d.cells; })
			
		var userScoresToUpdate: d3.Selection<any> = cellsToUpdate.selectAll('.summary-user-scores')
			.data((d: VCCellData, i: number) => { return d.userScores; });

		var dividingLinesToUpdate: d3.Selection<any> = this.dividingLineContainer.selectAll('.summary-dividing-line')
			.data(alternatives);

		var scoreTotalsToUpdate: d3.Selection<any> = this.scoreTotalsContainer.selectAll('.summary-scoretotal-subcontainer')
			.data(() => { return (viewOrientation === 'vertical') ? rows[0].cells : rows[rows.length - 1].cells; })
			.selectAll('.summary-score-total')
				.data((d: VCCellData) => { return d.userScores; });

		this.renderSummaryChartRows(dividingLinesToUpdate, scoreTotalsToUpdate, cellsToUpdate, userScoresToUpdate, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by the createSummaryChart method.
	renderSummaryChart(rows: VCRowData[], viewOrientation: string): void {
		// Position the chart in the viewport. All the chart's children will inherit this position.
		this.chart
			.attr('transform', () => {
				if (viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, 0);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, this.renderConfigService.dimensionTwoSize + 10);
			});
		// Give the proper width and height to the chart outline. 
		this.outline
			.attr(this.renderConfigService.dimensionOne, this.renderConfigService.dimensionOneSize)
			.attr(this.renderConfigService.dimensionTwo, this.renderConfigService.dimensionTwoSize);

		this.scoreTotalsContainer.selectAll('.summary-scoretotal-subcontainer')
			.data(() => { return (viewOrientation === 'vertical') ? rows[0].cells : rows[rows.length - 1].cells; })
				.selectAll('.summary-score-total')
				.data((d: VCCellData) => { return d.userScores; });

		this.scoreTotals = this.scoreTotalsContainer.selectAll('.summary-scoretotal-subcontainer')
			.selectAll('.summary-score-total');
		
		this.renderUtilityAxis(viewOrientation);

		this.toggleUtilityAxis();

		this.renderSummaryChartRows(this.dividingLines, this.scoreTotals, this.cells, this.userScores, viewOrientation);
	}


	renderUtilityAxis(viewOrientation: string): void {
		var uilityScale = d3.scale.linear()
			.domain([0, 100])
			

		var utilityAxis: any = d3.svg.axis()
			.scale(uilityScale)
			.ticks(10)

		if (viewOrientation === 'vertical') {
			uilityScale.range([this.renderConfigService.dimensionTwoSize, 0]);
			utilityAxis.orient("left"); // Render it as a y axis with the ticks to the left of the axis.
		}
		else {
			uilityScale.range([0, this.renderConfigService.dimensionTwoSize]);
			utilityAxis.orient("top"); // Render it as an x-axis with the ticks above the axis.
		}

		this.utilityAxisContainer
			.attr('transform', this.renderConfigService.generateTransformTranslation(viewOrientation, -20, 0))
			.call(utilityAxis);
	}

	// This function positions and gives widths + heights to the elements created by createSummaryChartRows. Note that we don't position the row
	// containers here because the positions of the scores (and therefore row containers) is not absolute, but depends on the heights of other user scores.
	renderSummaryChartRows(dividingLines: d3.Selection<any>, scoreTotals: d3.Selection<any>, cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		// Position the dividing lines so that they evenly divide the available space into columns, one for each Alternative.
		dividingLines
			.attr(this.renderConfigService.coordinateOne + '1', this.calculateCellCoordinateOne)
			.attr(this.renderConfigService.coordinateTwo + '1', 0)
			.attr(this.renderConfigService.coordinateOne + '2', this.calculateCellCoordinateOne)
			.attr(this.renderConfigService.coordinateTwo + '2', (d: VCCellData, i: number) => { return this.renderConfigService.dimensionTwoSize });


		this.scoreTotalsSubContainers
			.attr('transform', (d: VCCellData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, this.calculateCellCoordinateOne(d, i), 0);
			});

		this.renderScoreTotals(scoreTotals, viewOrientation);

		this.toggleScoreTotals();

		this.renderSummaryChartCells(cells, userScores, viewOrientation)
	}

	renderScoreTotals(scoreTotals: d3.Selection<any>, viewOrientation: string): void {

		var calculateTotalScore = (d: any) => {
			var scoreFunction: ScoreFunction = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName());
			var score = scoreFunction.getScore(d.value) * (this.chartDataService.weightMap.getObjectiveWeight(d.objective.getName()));
			return score + d.offset;
		};

		var verticalOffset: number = 15;
		var horizontalOffset: number = 10;

		scoreTotals
			.text((d: any, i: number) => { return Math.round(100 * (calculateTotalScore(d)) / this.chartDataService.weightMap.getWeightTotal()); })
			.attr(this.renderConfigService.coordinateOne, (d: any, i: number) => {
				var userScoreBarSize = this.calculateUserScoreDimensionOne(d, i);
				return (userScoreBarSize * i) + (userScoreBarSize / 2) - horizontalOffset;
			})
			.attr(this.renderConfigService.coordinateTwo, (d: any, i: number) => {
				return (viewOrientation === 'vertical') ?
					this.renderConfigService.dimensionTwoSize - this.renderConfigService.dimensionTwoScale(calculateTotalScore(d)) - verticalOffset
					:
					(this.renderConfigService.dimensionTwoScale(calculateTotalScore(d)) + verticalOffset);
			})
			.attr(this.renderConfigService.coordinateTwo + '1', calculateTotalScore)
			.style('font-size', 22)
			.classed('best-score-label', false);


		var maxScore: number = 0;
		var bestTotalScore: d3.Selection<any>;

		(<any>this.chart.selectAll('.summary-score-total')[0]).forEach((element: Element) => {
			if (element.nodeName === 'text') {
				let selection: d3.Selection<any> = d3.select(element);
				let score: number = calculateTotalScore(selection.datum());
				if (score > maxScore) {
					maxScore = score;
					bestTotalScore = selection;
				}
			}
		});

		bestTotalScore.classed('best-score-label', true);
	}


	// This function positions and gives widths + heights to the elements created by createSummaryChartCells.
	renderSummaryChartCells(cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		// Position each row's cells next to each other in the row.  
		cells
			.attr('transform', (d: VCCellData, i: number) => { 
				return this.renderConfigService.generateTransformTranslation(viewOrientation, this.calculateCellCoordinateOne(d,i), 0); 
			})

		// Position and give heights and widths to the user scores.
		userScores
			.style('fill', (d: any, i: number) => { return d.objective.getColor(); })
			.attr(this.renderConfigService.dimensionOne, this.calculateUserScoreDimensionOne)
			.attr(this.renderConfigService.dimensionTwo, this.calculateUserScoreDimensionTwo)
			.attr(this.renderConfigService.coordinateOne, (d: any, i: number) => { return (this.calculateUserScoreDimensionOne(d, i) * i); })
			

		userScores.attr(this.renderConfigService.coordinateTwo, (d: any, i: number) => {
				var objectiveWeight: number = this.chartDataService.weightMap.getObjectiveWeight(d.objective.getName());
				var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);

				if (viewOrientation == 'vertical')
					// If the orientation is vertical, then increasing height is to the down (NOT up), and we need to set an offset for this coordinate so that the bars are aligned at the cell bottom, not top.
					return (this.renderConfigService.dimensionTwoSize - this.renderConfigService.dimensionTwoScale(d.offset)) - this.renderConfigService.dimensionTwoScale(score * objectiveWeight);
				else
					return this.renderConfigService.dimensionTwoScale(d.offset); // If the orientation is horizontal, then increasing height is to the right, and the only offset is the combined (score * weight) of the previous bars.
			});
	}

	toggleUtilityAxis(): void {
		if (this.renderConfigService.viewConfiguration.displayScales) {
			this.utilityAxisContainer.style('display', 'block');
		} else {
			this.utilityAxisContainer.style('display', 'none');
		}
	}

	toggleScoreTotals(): void {
		if (this.renderConfigService.viewConfiguration.displayTotalScores) {
			this.scoreTotalsContainer.style('display', 'block');
		} else {
			this.scoreTotalsContainer.style('display', 'none');
		}
	}

	// Anonymous functions that are used often enough to be made class fields:

	// Calculate the CoordinateOne of a cell given the cells data and its index. Cells are all the same width (or height), so we simply divide the length of each row into equal amounts to find their locations.
	calculateCellCoordinateOne = (d: VCCellData, i: number) => { return i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives); }; 
	// The width (or height) should be such that the user scores for one cell fill that cell.
	calculateUserScoreDimensionOne = (d: any, i: number) => { return (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives) / this.chartDataService.numUsers };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: any, i: number) => {
		var objectiveWeight: number = this.chartDataService.weightMap.getObjectiveWeight(d.objective.getName());
		var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
		return this.renderConfigService.dimensionTwoScale(score * objectiveWeight);
	};

}