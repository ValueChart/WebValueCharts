/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:30:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 12:03:02
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Import Application Classes:
import { ValueChartService }										from '../services/ValueChart.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { RenderEventsService }										from '../services/RenderEvents.service';
import { SummaryChartDefinitions }									from '../services/SummaryChartDefinitions.service';

// Import Model Classes:
import { User }														from '../../../model/User';
import { Alternative }												from '../../../model/Alternative';
import { ScoreFunctionMap }											from '../../../model/ScoreFunctionMap';
import { ScoreFunction }											from '../../../model/ScoreFunction';

import {RowData, CellData, UserScoreData, ViewConfig}				from '../../../types/RendererData.types';


// This class renders a ValueChart's Alternatives into a stacked bar chart that summarizes the utilities users 
// assign to each Alternative based on their objective weights, and the user determined scores assigned to the 
// alternative' consequences. For each user, each Alternative's value for each PrimitiveObjective is rendered 
// into a rectangle whose height (or width depending on the orientation) is proportional to its (weight * userScore). 
// The rectangles for each Alternative are aligned vertically (or horizontally, depending on the ValueChart's orientation) 
// so that they form a stacked bar chart. Different users' stacked bars for the same Alternatives are grouped together into 
// columns (or rows).

@Injectable()
export class SummaryChartRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Constants for use in rendering the summary chart.
	private USER_SCORE_SPACING: number = 10;				// The spacing between user score bars, in pixels.

	// The viewConfig object for this renderer. It is configured using the renderConfigService.
	public viewConfig: ViewConfig = <ViewConfig>{};

	// d3 Selections:
	public chart: d3.Selection<any>;						// The 'g' element that contains all the elements making up the summary chart.
	public outline: d3.Selection<any>;						// The 'rect' element that outlines the summary chart.
	public rowsContainer: d3.Selection<any>;				// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public rows: d3.Selection<any>;							// The selection of all 'g' elements s.t. each element is a row container.
	public cells: d3.Selection<any>;						// The selection of all 'g' elements s.t. each element is a cell container.
	public userScores: d3.Selection<any>;					// The selection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	public scoreTotalsContainer: d3.Selection<any>;			// The 'g' element that holds the containers for user score text elements.
	public scoreTotalsSubContainers: d3.Selection<any>;		// The selection of 'g' elements that hold the user score text elements. There is one container per cell.
	public scoreTotals: d3.Selection<any>;					// The selection of 'text' elements used to display the total utility of each alternative for each user.
	public utilityAxisContainer: d3.Selection<any>;			// The 'g' element that holds the optional utility (y) axis that can be displayed to the left of the summary chart. 
	public alternativeBoxesContainer: d3.Selection<any>;	// The 'g' element that holds the alternative boxes.
	public alternativeBoxes: d3.Selection<any>;				// The selection of transparent 'rect' elements that are placed on top of each alternative in the summary chart. They are used to implement dragging, etc.

	// Misc. Fields:
	private summaryChartScale: any;							// The linear scale used to translate utilities into pixels for determining bar heights and positions. 

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this directive when it is used.
	*/
	constructor(
		private renderConfigService: RenderConfigService,
		private renderEventsService: RenderEventsService,
		private valueChartService: ValueChartService,
		private defs: SummaryChartDefinitions) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param el - The element that is will be used as the parent of the summary chart.
		@param rows - The data that the summary chart is going to represent. Must be of the type RowData.
		@returns {void}
		@description 	Creates the base containers and all elements for the Alternative Summary Chart of a ValueChart. It should be called when
						creating a summary chart for the first time, but not when updating as the basic framework of the chart never needs to be
						constructed again.
	*/
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
	
		// Fire the Construction Over event on completion of construction.
		(<any>this.renderEventsService.summaryChartDispatcher).call('Construction-Over');
	}

	/*
		@param rowsContainer - The 'g' element that contains/will contain the rows of the summary chart.
		@param boxesContainer - The 'g' element that contains/will contain the alternatives boxes (these are transparent boxes above each alternative used to implement dragging, etc).
		@param scoreTotalsContainer - The 'g' element that contains/will contain the score total subcontainers.
		@param rows - The data to be used when constructing/updating the rows.
		@returns {void}
		@description 	Creates or updates the individual row (and cell) elements that make up the summary chart. There is one row for each primitive objective in the ValueChart, with
						the rows stacked on each other in order to create a stacked bar chart. It can create all of the summary chart rows for the first time, as well as update the summary 
						chart rows by removing and adding rows to conform to the structure of the rows parameter. It also updates summary chart cells through a call to createSummaryChartCells.
						Updating cells should ALWAYS be done through a call to this method, rather than by directly calling createSummaryChartCells.
	*/
	createSummaryChartRows(rowsContainer: d3.Selection<any>, boxesContainer: d3.Selection<any>, scoreTotalsContainer: d3.Selection<any>, rows: RowData[]): void {
		// Create rows for every new PrimitiveObjective. If the rows are being created for this first time, this is all of the PrimitiveObjectives in the ValueChart.
		var updateRows = rowsContainer.selectAll('.' + this.defs.ROW)
			.data(rows);

		// Update rows to conform to the data.
		updateRows.exit().remove();				// Remove row containers that do not have a matching data element.
		updateRows.enter().append('g')			// Add row containers for data elements that have no matching container.
			.classed(this.defs.ROW, true);

		// Note that it is important that we re-select all rows before assigning them to the class field. This is because
		// the selections used for adding and removing elements are only the added or removed elements, not ALL of the elements.
		// This is true for any situation where we need to remove and then add new elements to an existing selection.
		this.rows = rowsContainer.selectAll('.' + this.defs.ROW);	// Update the row field.

		var alternatives: Alternative[] = this.valueChartService.getAlternatives();

		var updateSubContainers = scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.data((rows[0].cells));

		// Update score total sub-containers to conform to the data.
		updateSubContainers.exit().remove();	// Remove score total sub-containers that do not have a matching alternative.
		updateSubContainers.enter().append('g')	// Add score total sub-containers for alternatives that have no matching sub-container.
			.classed(this.defs.SCORE_TOTAL_SUBCONTAINER, true);

		this.scoreTotalsSubContainers = scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER); // Update the sub-container field.


		var updateScoreTotals = this.scoreTotalsSubContainers.selectAll('.' + this.defs.SCORE_TOTAL)
			.data((d: CellData) => { return d.userScores; });

		// Update score totals to conform to the data.
		updateScoreTotals.exit().remove();	// Remove score totals that do not have a matching user.
		updateScoreTotals.enter().append('text') // Add score totals for users that do not have matching score totals.
			.classed(this.defs.SCORE_TOTAL, true);

		this.scoreTotals = this.scoreTotalsSubContainers.selectAll('.' + this.defs.SCORE_TOTAL);	// Update the score totals field.


		var updateAlternativeBoxes = boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(this.valueChartService.getAlternatives());

		// Update alternative boxes to conform to the data.
		updateAlternativeBoxes.exit().remove();				// Remove alternative boxes that do not have a matching alternative.
		updateAlternativeBoxes.enter().append('rect')		// Add alternative boxes for alternatives that do not have a box.
			.classed(this.defs.ALTERNATIVE_BOX, true)
			.classed(this.defs.CHART_ALTERNATIVE, true);

		this.alternativeBoxes = boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX);	// Update alternative boxes field.

		this.createSummaryChartCells(this.rows);
	}
	/*
		@param stackedBarRows - The selection of summary chart rows. Each one is a 'g' element that contains, or will contain, row cells.
		@returns {void}
		@description	Creates or updates the cells that compose each row of the summary chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective).
						It updates existing cells by adding and removing cells to conform to the data assigned to each row. It updates user scores by adding and remove user scores to conform to the number 
						of users assigned to each cell in the row data. Row data cannot be assigned in this method, which is why cells and user scores should ALWAYS be updated by calling createSummaryChartRows,
						 rather than this method.
	*/
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

	/*
		@param width - The width the summary chart should be rendered in. Together with height this parameter determines the size of the summary chart.
		@param height - The height the summary chart should be rendered in. Together with width this parameter determines the size of the summary chart. 
		@param rows - The data that the summary chart is intended to display.
		@param viewOrientation - The orientation the summary chart should be rendered with. Either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Updates the data underlying the summary chart, and then positions and gives widths + heights to the elements created by the createSummaryChart method.
						It should be used to update the summary chart when the data underlying the it (rows) has changed, and the appearance of the summary chart needs to be updated to reflect
						this change. It should NOT be used to initially render the summary chart, or change the view orientation of the summary chart. Use renderSummaryChart for this purpose.

	*/
	updateSummaryChart(width: number, height: number, rows: RowData[], viewOrientation: string): void {
		// Update the summary chart view configuration with the new width, height, and orientation. This method modifies this.viewConfig in place.
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		var alternatives: Alternative[] = this.valueChartService.getAlternatives();

		// Update the data behind the cells.
		var cellsToUpdate: d3.Selection<any> = this.rows.data(rows).selectAll('.' + this.defs.CELL)
			.data((d: RowData) => { return d.cells; })

		// Update the data behind the user scores.
		var userScoresToUpdate: d3.Selection<any> = cellsToUpdate.selectAll('.' + this.defs.USER_SCORE)
			.data((d: CellData, i: number) => { return d.userScores; });

		// Update the data behind the alternative boxes.
		var alternativeBoxesToUpdate: d3.Selection<any> = this.alternativeBoxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(alternatives);

		// Update the data behind the score totals.
		var scoreTotalsToUpdate: d3.Selection<any> = this.scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.data(() => { return (viewOrientation === 'vertical') ? rows[0].cells : rows[rows.length - 1].cells; })
			.selectAll('.' + this.defs.SCORE_TOTAL)
			.data((d: CellData) => { return d.userScores; });

		// Render the summary chart using the selections with updated data.
		this.renderSummaryChartRows(alternativeBoxesToUpdate, scoreTotalsToUpdate, cellsToUpdate, userScoresToUpdate, viewOrientation);
	
		// Fire the Rendering Over event on completion of rendering.
		(<any>this.renderEventsService.summaryChartDispatcher).call('Rendering-Over');
	}

	/*
		@param width - The width the summary chart should be rendered in. Together with height this parameter determines the size of the summary chart.
		@param height - The height the summary chart should be rendered in. Together with width this parameter determines the size of the summary chart. 
		@param rows - The data that the summary chart is intended to display.
		@param viewOrientation - The orientation the summary chart should be rendered with. Either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Positions and gives widths + heights to the elements created by the createSummaryChart method. It should be used to display the summary chart 
						for the first time after creation, and to change the orientation of the summary chart. It does NOT update the data underlying the summary chart, and as such should not be used in response to changes 
						to the underlying ValueChart data. 

	*/
	renderSummaryChart(width: number, height: number, rows: RowData[], viewOrientation: string): void {
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		// Position the chart in the viewport. All the chart's children will inherit this position.
		this.summaryChartScale = d3.scaleLinear()
			.range([0, this.viewConfig.dimensionTwoSize]);

		// Position the entire chart in the view box.
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
	
		// Fire the Rendering Over event on completion of rendering.
		(<any>this.renderEventsService.summaryChartDispatcher).call('Rendering-Over');
	}

	/*
		@param viewOrientation - The orientation the summary chart should be rendered with. Either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Renders the utility axis of the summary chart. Note that this will not override toggleUtilityAxis, which should
						be used to change the visibility of the utility axis. 

	*/
	renderUtilityAxis(viewOrientation: string): void {
		// Create the linear scale that the utility axis will represent.
		var uilityScale: d3.Linear<number, number> = d3.scaleLinear()
			.domain([0, 100])	// The domain of the utility axis is from 0 to 100.


		var utilityAxis: any;

		// Position the utility axis properly depending on the current view orientation. 
		if (viewOrientation === 'vertical') {
			uilityScale.range([this.viewConfig.dimensionTwoSize, 0]);
			utilityAxis = d3.axisLeft(uilityScale);
		} else {
			uilityScale.range([0, this.viewConfig.dimensionTwoSize]);
			utilityAxis = d3.axisTop(uilityScale);
		}

		this.utilityAxisContainer
			.attr('transform', this.renderConfigService.generateTransformTranslation(viewOrientation, -20, 0))
			.call(utilityAxis);
	}

	/*
		@params alternativeBoxes -  The selection of 'rect' elements to be rendered as alternatives boxes on top of each alternative's column.
		@params scoreTotals -  The selection of score totals to be rendered. This should be a selection of 'text' elements.
		@params cells - The selection of 'g' elements that make up the summary chart cells to be rendered. Each cell should have one user score per user.
		@params userScores - The selection of 'rect' user scores to be rendered. There should be one user score per alternative per user.
		@param viewOrientation - The orientation the summary chart should be rendered with. Either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Positions and gives widths + heights to the elements created by createSummaryChartRows. Note that it does not position the row 
						containers because the positions of the scores (and therefore row containers) is not absolute, but depends on the heights of other user scores.
						Note that this method should NOT be called manually. updateSummaryChart or renderSummaryChart should called to re-render objective rows.
	*/
	renderSummaryChartRows(alternativeBoxes: d3.Selection<any>, scoreTotals: d3.Selection<any>, cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		// Give dimensions to the alternative boxes so that each one completely covers on alternative column. Position them exactly above those columns. This is so that they can be the targets of any user clicks on top of those columns.
		alternativeBoxes
			.attr(this.viewConfig.dimensionOne, (d: CellData, i: number) => { return this.viewConfig.dimensionOneSize / this.valueChartService.getNumAlternatives(); })
			.attr(this.viewConfig.dimensionTwo, this.viewConfig.dimensionTwoSize)
			.attr(this.viewConfig.coordinateOne, this.calculateCellCoordinateOne)
			.attr(this.viewConfig.coordinateTwo, 0)
			.attr('alternative', (d: Alternative) => { return d.getId(); })
			.attr('id', (d: Alternative) => { return 'summary-' + d.getId() + '-box' });

		// Position the score total containers.
		this.scoreTotalsContainer.selectAll('.' + this.defs.SCORE_TOTAL_SUBCONTAINER)
			.attr('transform', (d: CellData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, this.calculateCellCoordinateOne(d, i), 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getId(); });

		this.renderScoreTotalLabels(scoreTotals, viewOrientation);

		this.toggleScoreTotals();

		this.renderSummaryChartCells(cells, userScores, viewOrientation)
	}


	/*
		@param scoreTotals - The selection of text elements being used as score totals. There should be one text element per user per alternative.
		@param viewOrientation - The orientation the summary chart should be rendered with. Either 'vertical', or 'horizontal'.
		@returns {void}
		@description	Positions and assigns the proper text to the summary chart's score labels that are displayed above each user's stacked bar 
						for each alternative. Note that this method should NOT be called manually. updateSummaryChart or renderSummaryChart should 
						called to re-render objective rows.
	*/
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

	/*
		@returns {void}
		@description	Changes the color of the score total label for the best alternative for each user to be yellow. This should 
						be exactly one highlighted score total label per user.
	*/
	highlightBestUserScores() {
		var maxUserScores: any = {};
		this.valueChartService.getUsers().forEach((user: User) => {
			maxUserScores[user.getUsername()] = -1;
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

	/*
		@param cells - The selection of cells that are to be rendered. Each cell should have one user score per user.
		@param userScores - The selection of userScores that are to be rendered. There should be one user score per alternative per user.
		@param viewOrientation - The orientation the summary chart should be rendered with. Either 'vertical', or 'horizontal'.
		@returns {void}
		@description	This function positions and gives widths + heights to the elements created by createSummaryChartCells. 
						Note that this method should NOT be called manually. updateSummaryChart or renderSummaryChart should 
						called to re-render objective rows.

	*/
	renderSummaryChartCells(cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		// Position each row's cells next to each other in the row.  
		cells
			.attr('transform', (d: CellData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, this.calculateCellCoordinateOne(d, i), 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getId(); });

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
			var userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getName());
			var score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
			this.summaryChartScale.domain([0, d.user.getWeightMap().getWeightTotal()]);
			if (viewOrientation == 'vertical')
				// If the orientation is vertical, then increasing height is to the down (NOT up), and we need to set an offset for this coordinate so that the bars are aligned at the cell bottom, not top.
				return (this.viewConfig.dimensionTwoSize - this.summaryChartScale(d.offset)) - this.summaryChartScale(score * userObjectiveWeight);
			else
				return this.summaryChartScale(d.offset); // If the orientation is horizontal, then increasing height is to the right, and the only offset is the combined (score * weight) of the previous bars.
		});
	}

	/*
		@returns {void}
		@description	Display or hide the utility axis depending on the value of the displayScales attribute on the ValueChartDirective.
	*/
	toggleUtilityAxis(): void {
		if (this.renderConfigService.viewConfig.displayScales) {
			this.utilityAxisContainer.style('display', 'block');
		} else {
			this.utilityAxisContainer.style('display', 'none');
		}
	}

	/*
		@returns {void}
		@description	Display or hide the score totals depending on the value of the displayTotalScores attribute on the ValueChartDirective.
	*/
	toggleScoreTotals(): void {
		if (this.renderConfigService.viewConfig.displayTotalScores) {
			this.scoreTotalsContainer.style('display', 'block');
		} else {
			this.scoreTotalsContainer.style('display', 'none');
		}
	}

	// ========================================================================================
	// 			Anonymous functions that are used often enough to be made class fields
	// ========================================================================================


	// Calculate the CoordinateOne of a cell given the cells data and its index. Cells are all the same width (or height), so we simply divide the length of each row into equal amounts to find their locations.
	calculateCellCoordinateOne = (d: CellData, i: number) => { return i * (this.viewConfig.dimensionOneSize / this.valueChartService.getNumAlternatives()); };
	// The width (or height) should be such that the user scores for one cell fill that cell.
	calculateUserScoreDimensionOne = (d: UserScoreData, i: number) => { return (this.viewConfig.dimensionOneSize / this.valueChartService.getNumAlternatives()) / this.valueChartService.getNumUsers() };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: UserScoreData, i: number) => {
		var userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getName());
		var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
		this.summaryChartScale.domain([0, d.user.getWeightMap().getWeightTotal()]);

		return this.summaryChartScale(score * userObjectiveWeight);
	};

	calculateTotalScore = (d: UserScoreData) => {
		var scoreFunction: ScoreFunction = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName());
		var score = scoreFunction.getScore(d.value) * (d.user.getWeightMap().getObjectiveWeight(d.objective.getName()));
		return score + d.offset;
	};

}