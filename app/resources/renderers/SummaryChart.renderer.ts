/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:30:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-21 22:05:02
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ValueChartService }										from '../services/ValueChart.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { SummaryChartDefinitions }									from '../services/SummaryChartDefinitions.service';

// Model Classes
import { User }														from '../model/User';
import { Alternative }												from '../model/Alternative';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';

import {RowData, CellData, UserScoreData, ViewConfig}				from '../types/ValueChartViewer.types';


// This class renders a ValueChart's Alternatives into a stacked bar chart that summarizes the utility of each Alternative based on
// objective weights, and the user determined scores assigned to points in the consequence space. Each Alternative's value for each PrimitiveObjective 
// is rendered into a rectangle whose height (or width depending on the orientation) is proportional to its (weight * userScore). 
// The rectangles for each Alternative are aligned vertically (or horizontally) so that they form a stacked bar chart and act as a summary for the Alternative's total utility.

@Injectable()
export class SummaryChartRenderer {

	private USER_SCORE_SPACING: number = 10;

	public viewConfig: ViewConfig = <ViewConfig> {};
	

	// d3 selections that are saved to avoid searching the DOM every time they are needed.
	public chart: d3.Selection<any>;						// The 'g' element that contains all the elements making up the summary chart.
	public outline: d3.Selection<any>;						// The 'rect' element that outlines the summary chart.
	public rowsContainer: d3.Selection<any>;				// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public rows: d3.Selection<any>;							// The collection of all 'g' elements s.t. each element is a row container.
	public cells: d3.Selection<any>;						// The collection of all 'g' elements s.t. each element is a cell container.
	public userScores: d3.Selection<any>;					// The collection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	public scoreTotalsContainer: d3.Selection<any>;
	public scoreTotalsSubContainers: d3.Selection<any>;
	public scoreTotals: d3.Selection<any>;
	public utilityAxisContainer: d3.Selection<any>;
	public alternativeBoxesContainer: d3.Selection<any>;
	public alternativeBoxes: d3.Selection<any>;

	private summaryChartScale: any;

	constructor(
		private renderConfigService: RenderConfigService,
		private valueChartService: ValueChartService,
		private defs: SummaryChartDefinitions) { }

	// This function creates the base containers and elements for the Alternative Summary Chart of a ValueChart.
	createSummaryChart(el: d3.Selection<any>, rows: RowData[]): void {

		// Create the base container for the chart.
		this.chart = el.append('g')
			.classed(this.defs.CHART, true);

		// Create the rectangle which acts as an outline for the chart.
		this.outline = this.chart.append('g')
			.classed(this.defs.OUTLINE_CONTAINER, true)
			.append('rect')
			.classed(this.defs.OUTLINE, true)
			.classed('valuechart-outline', true)

		// Create the container that holds all the row containers.
		this.rowsContainer = this.chart.append('g')
			.classed(this.defs.ROWS_CONTAINER, true);

		this.scoreTotalsContainer = this.chart.append('g')
			.classed(this.defs.SCORE_TOTAL_CONTAINER, true);

		this.utilityAxisContainer = this.chart.append('g')
			.classed(this.defs.UTILITY_AXIS_CONTAINER, true)
			.classed('utility-axis', true);

		this.alternativeBoxesContainer = this.chart.append('g')
			.classed(this.defs.ALTERNATIVE_BOXES_CONTAINER, true);

		this.createSummaryChartRows(this.rowsContainer, this.alternativeBoxesContainer, this.scoreTotalsContainer, rows);
	}

	// This function creates the individual rows that make up the summary chart. Each row is for one primitive objective in the ValueChart
	// and the rows are stacked on each other in order to create a stacked bar chart. 
	createSummaryChartRows(rowsContainer: d3.Selection<any>, boxesContainer: d3.Selection<any>, scoreTotalsContainer: d3.Selection<any>, rows: RowData[]): void {
		// Create rows for every new PrimitiveObjective. If the rows are being created for this first time, this is all of the PrimitiveObjectives in the ValueChart.
		var updateRows = rowsContainer.selectAll('.' + this.defs.ROW)
			.data(rows);

		updateRows.exit().remove();
		updateRows.enter().append('g')
			.classed(this.defs.ROW, true);

		this.rows = rowsContainer.selectAll('.' + this.defs.ROW);

		var alternatives: Alternative[] = this.valueChartService.getAlternatives();

		var updateSubContainers = scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.data((rows[0].cells));

		updateSubContainers.exit().remove();
		updateSubContainers.enter().append('g')
			.classed(this.defs.SCORE_TOTAL_SUBCONTAINER, true);

		this.scoreTotalsSubContainers = scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER);


		var updateScoreTotals = this.scoreTotalsSubContainers.selectAll('.' + this.defs.SCORE_TOTAL)
			.data((d: CellData) => { return d.userScores; });

		updateScoreTotals.exit().remove();
		updateScoreTotals.enter().append('text')
			.classed(this.defs.SCORE_TOTAL, true);

		this.scoreTotals = this.scoreTotalsSubContainers.selectAll('.' + this.defs.SCORE_TOTAL);


		var updateAlternativeBoxes = boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(this.valueChartService.getAlternatives());

		updateAlternativeBoxes.exit().remove();
		updateAlternativeBoxes.enter().append('rect')
			.classed(this.defs.ALTERNATIVE_BOX, true)
			.classed(this.defs.CHART_ALTERNATIVE, true);

		this.alternativeBoxes = boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX);



		this.createSummaryChartCells(this.rows);
	}

	// This function creates the cells that compose each row of the summary chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective)
	createSummaryChartCells(stackedBarRows: d3.Selection<any>): void {
		// Create cells for each new Alternative in every old or new row. If the cells are being created for this first time, this is done for all Alternatives and all rows.
		var updateCells = stackedBarRows.selectAll('.' + this.defs.CELL)
			.data((d: RowData) => { return d.cells; });

		updateCells.exit().remove();
		updateCells.enter().append('g')
			.classed(this.defs.CELL, true)
			.classed(this.defs.CHART_CELL, true);

		// Save all the cells as a field of the class.
		this.cells = stackedBarRows.selectAll('.' + this.defs.CELL);

		// Create the bars for each new user score. Note that if this is a Individual ValueChart, there is only on bar in each cell, as there is only one user score for each objective value. 
		var updateUserScores = this.cells.selectAll('.' + this.defs.USER_SCORE)
			.data((d: CellData, i: number) => { return d.userScores; });

		updateUserScores.exit().remove();
		updateUserScores.enter().append('rect')
			.classed(this.defs.USER_SCORE, true);

		// Save all the user scores bars as a field of the class.
		this.userScores = this.cells.selectAll('.' + this.defs.USER_SCORE);
	}

	updateSummaryChart(width: number, height: number, rows: RowData[], viewOrientation: string): void {
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		var alternatives: Alternative[] = this.valueChartService.getAlternatives();

		var cellsToUpdate: d3.Selection<any> = this.rows.data(rows).selectAll('.' + this.defs.CELL)
			.data((d: RowData) => { return d.cells; })
			
		var userScoresToUpdate: d3.Selection<any> = cellsToUpdate.selectAll('.' + this.defs.USER_SCORE)
			.data((d: CellData, i: number) => { return d.userScores; });

		var alternativeBoxesToUpdate: d3.Selection<any> = this.alternativeBoxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(alternatives);

		var scoreTotalsToUpdate: d3.Selection<any> = this.scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.data(() => { return (viewOrientation === 'vertical') ? rows[0].cells : rows[rows.length - 1].cells; })
			.selectAll('.' + this.defs.SCORE_TOTAL)
				.data((d: CellData) => { return d.userScores; });

		this.renderSummaryChartRows(alternativeBoxesToUpdate, scoreTotalsToUpdate, cellsToUpdate, userScoresToUpdate, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by the createSummaryChart method.
	renderSummaryChart(width: number, height: number, rows: RowData[], viewOrientation: string): void {
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		// Position the chart in the viewport. All the chart's children will inherit this position.
		this.summaryChartScale = d3.scaleLinear()
			.range([0, this.viewConfig.dimensionTwoSize]);

		this.chart
			.attr('transform', () => {
				if (viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.viewConfig.dimensionOneSize, 0);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.viewConfig.dimensionOneSize, this.viewConfig.dimensionTwoSize + 10);
			});
		// Give the proper width and height to the chart outline. 
		this.outline
			.attr(this.viewConfig.dimensionOne, this.viewConfig.dimensionOneSize)
			.attr(this.viewConfig.dimensionTwo, this.viewConfig.dimensionTwoSize);

		this.scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.data(() => { return (viewOrientation === 'vertical') ? rows[0].cells : rows[rows.length - 1].cells; })
				.selectAll('.' + this.defs.SCORE_TOTAL)
				.data((d: CellData) => { return d.userScores; });

		this.scoreTotals = this.scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.selectAll('.' + this.defs.SCORE_TOTAL);
		
		this.renderUtilityAxis(viewOrientation);

		this.toggleUtilityAxis();

		this.renderSummaryChartRows(this.alternativeBoxes, this.scoreTotals, this.cells, this.userScores, viewOrientation);
	}


	renderUtilityAxis(viewOrientation: string): void {
		var uilityScale: d3.Linear<number, number> = d3.scaleLinear()
			.domain([0, 100])
			

		var utilityAxis: any;

		if (viewOrientation === 'vertical') {
			uilityScale.range([this.viewConfig.dimensionTwoSize, 0]);
			utilityAxis = d3.axisLeft(uilityScale);
		}
		else {
			uilityScale.range([0, this.viewConfig.dimensionTwoSize]);
			utilityAxis = d3.axisTop(uilityScale);
		}

		this.utilityAxisContainer
			.attr('transform', this.renderConfigService.generateTransformTranslation(viewOrientation, -20, 0))
			.call(utilityAxis);
	}

	// This function positions and gives widths + heights to the elements created by createSummaryChartRows. Note that we don't position the row
	// containers here because the positions of the scores (and therefore row containers) is not absolute, but depends on the heights of other user scores.
	renderSummaryChartRows(alternativeBoxes: d3.Selection<any>, scoreTotals: d3.Selection<any>, cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		alternativeBoxes
			.attr(this.viewConfig.dimensionOne, (d: CellData, i: number) => { return this.viewConfig.dimensionOneSize / this.valueChartService.getNumAlternatives(); })
			.attr(this.viewConfig.dimensionTwo, this.viewConfig.dimensionTwoSize)
			.attr(this.viewConfig.coordinateOne, this.calculateCellCoordinateOne)
			.attr(this.viewConfig.coordinateTwo, 0)
			.attr('alternative', (d: Alternative) => { return d.getName(); })
			.attr('id', (d: Alternative) => { return 'summary-' + d.getName() + '-box'});


		this.scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.attr('transform', (d: CellData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, this.calculateCellCoordinateOne(d, i), 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getName(); });

		this.renderScoreTotalLabels(scoreTotals, viewOrientation);

		this.toggleScoreTotals();

		this.renderSummaryChartCells(cells, userScores, viewOrientation)
	}

	renderScoreTotalLabels(scoreTotals: d3.Selection<any>, viewOrientation: string): void {

		var verticalOffset: number = 15;
		var horizontalOffset: number = 10;

		scoreTotals
			.text((d: UserScoreData, i: number) => { return Math.round(100 * (this.calculateTotalScore(d)) / d.user.getWeightMap().getWeightTotal()); })
			.attr(this.viewConfig.coordinateOne, (d: UserScoreData, i: number) => {
				var userScoreBarSize = this.calculateUserScoreDimensionOne(d, i);
				return (userScoreBarSize * i) + (userScoreBarSize / 2) - horizontalOffset;
			})
			.attr(this.viewConfig.coordinateTwo, (d: UserScoreData, i: number) => {
				this.summaryChartScale.domain([0, d.user.getWeightMap().getWeightTotal()]);

				return (viewOrientation === 'vertical') ?
					this.viewConfig.dimensionTwoSize - this.summaryChartScale(this.calculateTotalScore(d)) - verticalOffset
					:
					(this.summaryChartScale(this.calculateTotalScore(d)) + verticalOffset);
			})
			.attr(this.viewConfig.coordinateTwo + '1', this.calculateTotalScore)
			.style('font-size', 22)
			.classed(this.defs.BEST_SCORE, false);


			this.highlightBestUserScores();
	}

	highlightBestUserScores() {
		var maxUserScores: any = {};
		this.valueChartService.getUsers().forEach((user: User) => {
			maxUserScores[user.getUsername()] = 0;
		});

		var bestTotalScoreSelections: any = {};
		this.chart.selectAll('.' + this.defs.SCORE_TOTAL).nodes().forEach((element: Element) => {
			if (element.nodeName === 'text') {
				let selection: d3.Selection<any> = d3.select(element);
				let userScore: UserScoreData = selection.datum();
				let scoreValue: number = this.calculateTotalScore(userScore);
				if (scoreValue > maxUserScores[userScore.user.getUsername()]) {
					maxUserScores[userScore.user.getUsername()] = scoreValue;
					bestTotalScoreSelections[userScore.user.getUsername()] = selection;
				}
			}
		});

		this.valueChartService.getUsers().forEach((user: User) => {
			bestTotalScoreSelections[user.getUsername()].classed(this.defs.BEST_SCORE, true);
		});
	}


	// This function positions and gives widths + heights to the elements created by createSummaryChartCells.
	renderSummaryChartCells(cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		// Position each row's cells next to each other in the row.  
		cells
			.attr('transform', (d: CellData, i: number) => { 
				return this.renderConfigService.generateTransformTranslation(viewOrientation, this.calculateCellCoordinateOne(d,i), 0); 
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getName();});

		// Position and give heights and widths to the user scores.
		userScores
			.style('fill', (d: UserScoreData, i: number) => { 
				if (this.valueChartService.isIndividual())
					return d.objective.getColor(); 
				else 
					return d.user.color;
			})
			.attr(this.viewConfig.dimensionOne, (d: UserScoreData, i: number) => { return Math.max(this.calculateUserScoreDimensionOne(d, i) - this.USER_SCORE_SPACING, 0); })
			.attr(this.viewConfig.dimensionTwo, this.calculateUserScoreDimensionTwo)
			.attr(this.viewConfig.coordinateOne, (d: UserScoreData, i: number) => { return (this.calculateUserScoreDimensionOne(d, i) * i) + (this.USER_SCORE_SPACING / 2); })
			

		userScores.attr(this.viewConfig.coordinateTwo, (d: UserScoreData, i: number) => {
				var userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
				var score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId()).getScore(d.value);
				this.summaryChartScale.domain([0, d.user.getWeightMap().getWeightTotal()]);
				if (viewOrientation == 'vertical')
					// If the orientation is vertical, then increasing height is to the down (NOT up), and we need to set an offset for this coordinate so that the bars are aligned at the cell bottom, not top.
					return (this.viewConfig.dimensionTwoSize - this.summaryChartScale(d.offset)) - this.summaryChartScale(score * userObjectiveWeight);
				else
					return this.summaryChartScale(d.offset); // If the orientation is horizontal, then increasing height is to the right, and the only offset is the combined (score * weight) of the previous bars.
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
	calculateCellCoordinateOne = (d: CellData, i: number) => { return i * (this.viewConfig.dimensionOneSize / this.valueChartService.getNumAlternatives()); }; 
	// The width (or height) should be such that the user scores for one cell fill that cell.
	calculateUserScoreDimensionOne = (d: UserScoreData, i: number) => { return (this.viewConfig.dimensionOneSize / this.valueChartService.getNumAlternatives()) / this.valueChartService.getNumUsers() };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: UserScoreData, i: number) => {
		var userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
		var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId()).getScore(d.value);
		this.summaryChartScale.domain([0, d.user.getWeightMap().getWeightTotal()]);

		return this.summaryChartScale(score * userObjectiveWeight);
	};

	calculateTotalScore = (d: UserScoreData) => {
			var scoreFunction: ScoreFunction = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId());
			var score = scoreFunction.getScore(d.value) * (d.user.getWeightMap().getObjectiveWeight(d.objective.getId()));
			return score + d.offset;
		};

}