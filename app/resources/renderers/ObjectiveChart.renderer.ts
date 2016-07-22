/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 12:53:30
* @Last Modified by:   aaronpmishkin
<<<<<<< 1b4b6a52117393309f3580747e5ebb8b5883a181
* @Last Modified time: 2016-07-21 22:04:48
=======
* @Last Modified time: 2016-06-13 16:38:20
>>>>>>> Add labels for alternatives to Objective Chart.
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ValueChartService }											from '../services/ValueChart.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { RenderEventsService }										from '../services/RenderEvents.service';

import { ObjectiveChartDefinitions }								from '../services/ObjectiveChartDefinitions.service';

// Model Classes
import { User }														from '../model/User';
import { WeightMap }												from '../model/WeightMap';
import { Alternative }												from '../model/Alternative';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';

import {RowData, CellData, UserScoreData, ViewConfig}				from '../types/ValueChartViewer.types';


// This class renders a ValueChart's Alternatives into a series of bar charts that displays the utility for each Alternative's consequences.
// This utility is based on the weights given to objectives, and the user determined scores assigned to points in the consequence space. 
// Each Alternative's value for each PrimitiveObjective is rendered into a rectangle whose height (or width depending on the orientation) is 
// proportional to its (weight * userScore). The rectangles for each Alternative are aligned vertically (or horizontally) so that they form a of 
// series bar charts, one for each Primitive Objective in the ValueChart.

@Injectable()
export class ObjectiveChartRenderer {

	private USER_SCORE_SPACING: number = 10;

	public viewConfig: ViewConfig = <ViewConfig> {};


	// d3 selections that are saved to avoid searching the DOM every time they are needed.
	public chart: d3.Selection<any>;							// The 'g' element that contains all the elements making up the objective chart.
	public rowOutlinesContainer: d3.Selection<any>;				// The 'g' element that contains all the row outline elements
	public rowOutlines: d3.Selection<any>;						// The collection of all 'rect' elements that are used outline each row.
	public rowsContainer: d3.Selection<any>;					// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public rows: d3.Selection<any>;								// The collection of 'g' elements s.t. each element is a row container.
	public alternativeLabelsContainer: d3.Selection<any>;		// The 'g' element that contains the alternative labels.
	public alternativeLabels: d3.Selection<any>;				// The collection of all 'text' elements s.t. each element is an alternative label.
	public cells: d3.Selection<any>;							// The collection of all 'g' elements s.t. each element is a cell container.
	public userScores: d3.Selection<any>;						// The collection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	public weightColumns: d3.Selection<any>;
	public objectiveDomainLabels: d3.Selection<any>;
	public alternativeBoxesContainer: d3.Selection<any>;
	public alternativeBoxes: d3.Selection<any>;


	constructor(
		private renderConfigService: RenderConfigService,
		private valueChartService: ValueChartService,
		private renderEventsService: RenderEventsService,
		private defs: ObjectiveChartDefinitions) { }

	// This function creates the base containers and elements for the Alternative Summary Chart of a ValueChart.
	createObjectiveChart(el: d3.Selection<any>, rows: RowData[]): void {
		// Create the root container for the objective chart.
		this.chart = el.append('g')
			.classed(this.defs.CHART, true);
		// Create the container for the row outlines.
		this.rowOutlinesContainer = this.chart.append('g')
			.classed(this.defs.ROW_OUTLINES_CONTAINER, true);
		// Create the container to hold the rows.
		this.rowsContainer = this.chart.append('g')
			.classed(this.defs.ROWS_CONTAINER, true);
		// Create the container to hold the labels for the alternatives
		this.alternativeLabelsContainer = this.chart.append('g')
			.classed(this.defs.ALTERNATIVE_LABELS_CONTAINER, true);

		this.alternativeBoxesContainer = this.chart.append('g')
			.classed(this.defs.ALTERNATIVE_BOXES_CONTAINER, true);


		this.createObjectiveRows(this.rowsContainer, this.rowOutlinesContainer, this.alternativeBoxesContainer, this.alternativeLabelsContainer, rows);
	}

	// This function creates the individual rows that make up the summary chart. Each row is for one primitive objective in the ValueChart
	createObjectiveRows(rowsContainer: d3.Selection<any>, rowOutlinesContainer: d3.Selection<any>, boxesContainer: d3.Selection<any>, alternativeLabelsContainer: d3.Selection<any>, rows: RowData[]): void {
		// Create the row outlines for every new PrimitiveObjective. When the graph is being created for the first time, this is every PrimitiveObjective.
		var updateRowOutlines = rowOutlinesContainer.selectAll('.' + this.defs.ROW_OUTLINE)
			.data(rows);

		updateRowOutlines.exit().remove();	
		updateRowOutlines.enter().append('rect')
			.classed(this.defs.ROW_OUTLINE, true)
			.classed('valuechart-outline', true);

		this.rowOutlines = rowOutlinesContainer.selectAll('.' + this.defs.ROW_OUTLINE);


		// Create the containers to hold the new rows.
		var updateRowContainers = rowsContainer.selectAll('.' + this.defs.ROW)
			.data(rows);

		updateRowContainers.exit().remove();
		updateRowContainers.enter().append('g')
			.classed(this.defs.ROW, true);

		this.rows = rowsContainer.selectAll('.' + this.defs.ROW);


		var updateAlternativeLabels = alternativeLabelsContainer.selectAll('.' + this.defs.ALTERNATIVE_LABEL)
			.data(this.valueChartService.alternatives);

		updateAlternativeLabels.exit().remove();
		updateAlternativeLabels.enter().append('text')
			.classed(this.defs.ALTERNATIVE_LABEL, true);

		this.alternativeLabels = alternativeLabelsContainer.selectAll('.' + this.defs.ALTERNATIVE_LABEL);


		var updateBoxes = boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(this.valueChartService.alternatives);

		updateBoxes.exit().remove();
		updateBoxes.enter().append('rect')
			.classed(this.defs.ALTERNATIVE_BOX, true)
			.classed(this.defs.CHART_ALTERNATIVE, true);

		this.alternativeBoxes = boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX);



		this.createObjectiveCells(this.rows)
	}
	// This function creates the cells that compose each row of the objective chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective)
	createObjectiveCells(objectiveRows: d3.Selection<SVGGElement>): void {
		// Create cells for any new objectives, or for new rows. Once again, if the graph is being create for the first time then this is all rows.
		var updateCells = objectiveRows.selectAll('.' + this.defs.CELL)
			.data((d: RowData) => { return d.cells; });

		updateCells.exit().remove();
		updateCells.enter().append('g')
			.classed(this.defs.CELL, true)
			.classed(this.defs.CHART_CELL, true);


		this.cells = objectiveRows.selectAll('.' + this.defs.CELL);

		// Create the bars for each new user score. Note that if this is a Individual ValueChart, there is only on bar in each cell, as there is only one user score for each objective value. 
		var updateUserScores = this.cells.selectAll('.' + this.defs.USER_SCORE)
			.data((d: CellData) => { return d.userScores; });

		updateUserScores.exit().remove();
		updateUserScores.enter().append('rect')
			.classed(this.defs.USER_SCORE, true);

		this.userScores = this.cells.selectAll('.' + this.defs.USER_SCORE);


		var updateWeightColumns = this.cells.selectAll('.' + this.defs.WEIGHT_OUTLINE)
			.data((d: CellData) => { return d.userScores; });

		updateWeightColumns.exit().remove();
		updateWeightColumns.enter().append('rect')
			.classed(this.defs.WEIGHT_OUTLINE, true);

		this.weightColumns = this.cells.selectAll('.' + this.defs.WEIGHT_OUTLINE);


		var updateDomainLabels = this.cells.selectAll('.' + this.defs.DOMAIN_LABEL)
			.data((d: CellData) => { return [d]; });

		updateDomainLabels.exit().remove();	
		updateDomainLabels.enter().append('text')
				.classed(this.defs.DOMAIN_LABEL, true);

		this.objectiveDomainLabels = this.cells.selectAll('.' + this.defs.DOMAIN_LABEL);
	}

	updateObjectiveChart(width: number, height: number, rows: RowData[], viewOrientation: string): void {
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		var rowOutlinesToUpdate = this.rowOutlines
			.data(rows);

		var rowsToUpdate = this.rows.data(rows);

		var alternativeLabelsToUpdate = this.alternativeLabels.data(this.valueChartService.alternatives);

		var alternativeBoxesToUpdate: d3.Selection<any> = this.alternativeBoxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(this.valueChartService.alternatives);

		var cellsToUpdate = rowsToUpdate.selectAll('.' + this.defs.CELL)
			.data((d: RowData) => { return d.cells; })

		var userScoresToUpdate = cellsToUpdate.selectAll('.' + this.defs.USER_SCORE)
			.data((d: CellData, i: number) => { return d.userScores; });

		var weightColumnsToUpdate = cellsToUpdate.selectAll('.' + this.defs.WEIGHT_OUTLINE)
			.data((d: CellData, i: number) => { return d.userScores; });


		this.renderObjectiveChartRows(rowOutlinesToUpdate, rowsToUpdate, alternativeLabelsToUpdate, alternativeBoxesToUpdate, cellsToUpdate, userScoresToUpdate, weightColumnsToUpdate, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by the createObjectiveChart method.
	renderObjectiveChart(width: number, height: number, viewOrientation: string): void {
		this.renderConfigService.updateViewConfig(this.viewConfig, viewOrientation, width, height);

		this.chart
			.attr('transform', () => {
				if (viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.viewConfig.dimensionOneSize, this.viewConfig.dimensionTwoSize + 10);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.viewConfig.dimensionOneSize, 0);	// TODO: Fix this.
			});

		this.renderObjectiveChartRows(this.rowOutlines, this.rows, this.alternativeLabels, this.alternativeBoxes, this.cells, this.userScores, this.weightColumns, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by createObjectiveRows. Unlike in the summary chart we directly position the row
	// containers here because the positions of the scores (and therefore row containers) is are absolute since the bar charts are not stacked. 
	renderObjectiveChartRows(rowOutlines: d3.Selection<any>, rows: d3.Selection<any>, alternativeLabels: d3.Selection<any>, alternativeBoxes: d3.Selection<any>, cells: d3.Selection<any>, userScores: d3.Selection<any>, weightColumns: d3.Selection<any>, viewOrientation: string): void {
		rowOutlines
			.attr('transform', (d: RowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.viewConfig.dimensionTwoScale(d.weightOffset))); // Position each of the rows based on the combined weights of the previous rows.
			})																																					// this is because the heights of the previous rows are proportional to their weights.
			.attr(this.viewConfig.dimensionOne, this.viewConfig.dimensionOneSize)
			.attr(this.viewConfig.dimensionTwo, (d: RowData) => {
				let maxObjectiveWeight: number = this.valueChartService.maximumWeightMap.getObjectiveWeight(d.objective.getId());
				return this.viewConfig.dimensionTwoScale(maxObjectiveWeight);																				// Set the height of the row to be proportional to its weight.
			});

		rows
			.attr('transform', (d: RowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.viewConfig.dimensionTwoScale(d.weightOffset)));	// Transform each row container to have the correct y (or x) position based on the combined weights of the previous rows.
			});

		var alternativeLabelCoordOneOffset: number = ((viewOrientation === 'vertical') ? 20 : 40);
		var alternativeLabelCoordTwoOffset: number = 20;

		alternativeLabels
			.text((d: Alternative) => { return d.getName(); })
			.attr(this.viewConfig.coordinateOne, (d: any, i: number) => { return this.calculateCellCoordinateOne(d, i) + alternativeLabelCoordOneOffset; })
			.attr(this.viewConfig.coordinateTwo, () => {
				return (viewOrientation === 'vertical') ? this.viewConfig.dimensionTwoSize + alternativeLabelCoordTwoOffset : alternativeLabelCoordTwoOffset;
			})
			.attr('alternative', (d: Alternative) => { return d.getName(); })
			.style('font-size', '20px');

		alternativeBoxes
			.attr(this.viewConfig.dimensionOne, (d: CellData, i: number) => { return this.viewConfig.dimensionOneSize / this.valueChartService.numAlternatives; })
			.attr(this.viewConfig.dimensionTwo, this.viewConfig.dimensionTwoSize)
			.attr(this.viewConfig.coordinateOne, this.calculateCellCoordinateOne)
			.attr(this.viewConfig.coordinateTwo, 0)
			.attr('alternative', (d: Alternative) => { return d.getName(); })
			.attr('id', (d: Alternative) => { return 'objective-' + d.getName() + '-box'});


		this.renderObjectiveChartCells(cells, userScores, weightColumns, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by createObjectiveCells.
	renderObjectiveChartCells(cells: d3.Selection<any>, userScores: d3.Selection<any>, weightColumns: d3.Selection<any>, viewOrientation: string): void {
		cells
			.attr('transform', (d: CellData, i: number) => {
				let coordinateOne: number = this.calculateCellCoordinateOne(d, i);
				return this.renderConfigService.generateTransformTranslation(viewOrientation, coordinateOne, 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getName();});

		var domainLabelCoord: number = 5;

		cells.selectAll('.' + this.defs.DOMAIN_LABEL)
			.data((d: CellData) => { return [d]; })
				.text((d: CellData, i: number) => { return d.value })
				.attr(this.viewConfig.coordinateOne, (this.viewConfig.dimensionOneSize / this.valueChartService.numAlternatives) / 3)
				.attr(this.viewConfig.coordinateTwo, (d: CellData, i: number) => {
					let maxObjectiveWeight: number = this.valueChartService.maximumWeightMap.getObjectiveWeight(d.userScores[0].objective.getId());
					return (viewOrientation === 'vertical') ? this.viewConfig.dimensionTwoScale(maxObjectiveWeight) - domainLabelCoord : domainLabelCoord;
				});

		this.toggleDomainLabels();

		this.renderUserScores(userScores, viewOrientation);
		this.renderWeightColumns(weightColumns, viewOrientation);

		// TODO: Remove the any wrapper when typings for d3 are updated.
		(<any> this.renderEventsService.summaryChartDispatcher).call('Rendering-Over');
	}

	renderUserScores(userScores: d3.Selection<any>, viewOrientation: string): void {
		userScores
			.style('fill', (d: UserScoreData, i: number) => { 
				if (this.valueChartService.getValueChart().isIndividual())
					return d.objective.getColor(); 
				else 
					return d.user.color;
			})
			.attr(this.viewConfig.dimensionOne, (d: UserScoreData, i: number) => { return Math.max(this.calculateUserScoreDimensionOne(d, i) - this.USER_SCORE_SPACING, 0); })
			.attr(this.viewConfig.dimensionTwo, this.calculateUserScoreDimensionTwo)
			.attr(this.viewConfig.coordinateOne, (d: UserScoreData, i: number) => { return (this.calculateUserScoreDimensionOne(d, i) * i) + (this.USER_SCORE_SPACING / 2); });


		if (viewOrientation === 'vertical') {
			userScores
				.attr(this.viewConfig.coordinateTwo, (d: UserScoreData, i: number) => {
					let maxObjectiveWeight: number = this.valueChartService.maximumWeightMap.getObjectiveWeight(d.objective.getId());
					let userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
					let score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId()).getScore(d.value);
					return this.viewConfig.dimensionTwoScale(maxObjectiveWeight) - this.viewConfig.dimensionTwoScale(score * userObjectiveWeight);
				});
		} else {
			userScores.attr(this.viewConfig.coordinateTwo, 0);
		}
	}

	renderWeightColumns(weightColumns: d3.Selection<any>, viewOrientation: string): void {
		var calculateWeightColumnDimensionTwo = (d: UserScoreData, i: number) => {
			let weightDimensionTwoOffset: number = 2;
			let userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
			return Math.max(this.viewConfig.dimensionTwoScale(userObjectiveWeight) - weightDimensionTwoOffset, 0);
		}

		weightColumns
			.attr(this.viewConfig.dimensionOne, (d: UserScoreData, i: number) => { return Math.max(this.calculateUserScoreDimensionOne(d, i) - (this.USER_SCORE_SPACING + 1), 0); })
			.attr(this.viewConfig.dimensionTwo, (d: UserScoreData, i: number) => { return calculateWeightColumnDimensionTwo(d,i); })
			.attr(this.viewConfig.coordinateOne, (d: UserScoreData, i: number) => { return (this.calculateUserScoreDimensionOne(d, i) * i) + ((this.USER_SCORE_SPACING + 1) / 2); })
			.style('stroke-dasharray', (d: UserScoreData, i: number) => { 
				let dimensionOne: number = (this.calculateUserScoreDimensionOne(d, i) - (this.USER_SCORE_SPACING + 1));
				let dimensionTwo: number = calculateWeightColumnDimensionTwo(d, i);
				
				return (viewOrientation === 'vertical') ?
					(dimensionOne + dimensionTwo) + ', ' + dimensionOne 
				:
					(dimensionTwo + dimensionOne + dimensionTwo) + ', ' + dimensionOne;  
			});

		if (viewOrientation === 'vertical') {
			weightColumns
				.attr(this.viewConfig.coordinateTwo, (d: UserScoreData, i: number) => {
					let maxObjectiveWeight: number = this.valueChartService.maximumWeightMap.getObjectiveWeight(d.objective.getId());
					return this.viewConfig.dimensionTwoScale(maxObjectiveWeight) - calculateWeightColumnDimensionTwo(d, i);
				});
		} else {
			weightColumns.attr(this.viewConfig.coordinateTwo, 0);
		}

		this.toggleWeightColumns();
	}

	toggleWeightColumns(): void {
		if (this.valueChartService.getValueChart().isIndividual()) {
			this.weightColumns.style('display', 'none');
		} else {
			this.weightColumns.style('display', 'block');			
		}
	}

	toggleDomainLabels(): void {
		if (this.renderConfigService.viewConfiguration.displayDomainValues) {
			this.objectiveDomainLabels.style('display', 'block');
		} else {
			this.objectiveDomainLabels.style('display', 'none');
		}
	}

	// Anonymous functions that are used often enough to be made class fields:

	// Calculate the CoordinateOne of a cell given the cells data and its index. Cells are all the same width (or height), so we simply divide the length of each row into equal amounts to find their locations.
	calculateCellCoordinateOne = (d: CellData, i: number) => { return i * (this.viewConfig.dimensionOneSize / this.valueChartService.numAlternatives); }; 
	// Calculate the CoordinateOne of a userScore given the userScore object and its index. userScores are just further subdivisions of cells based on the number of userScores in each cell.
	calculateUserScoreDimensionOne = (d: UserScoreData, i: number) => { return (this.viewConfig.dimensionOneSize / this.valueChartService.numAlternatives) / this.valueChartService.numUsers; };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: UserScoreData, i: number) => {
		let userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
		let score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId()).getScore(d.value);
		return this.viewConfig.dimensionTwoScale(score * userObjectiveWeight);
	};
}

