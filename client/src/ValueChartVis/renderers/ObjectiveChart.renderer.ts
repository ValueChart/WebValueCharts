/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 12:53:30
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-24 10:51:29
*/

// Import Angular Classes
import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as d3 														from 'd3';
import { Subject }													from 'rxjs/Subject';

// Import Application Classes:
import { RendererService } 											from '../services';
import { RenderEventsService }										from '../services';
import { ObjectiveChartDefinitions }								from '../definitions';
import { SortAlternativesInteraction }								from '../interactions';

// Import Model Classes:
import { User }														from '../../model';
import { WeightMap }												from '../../model';
import { Alternative }												from '../../model';
import { ScoreFunctionMap }											from '../../model';
import { ScoreFunction }											from '../../model';

// Import Types:
import { RowData, CellData, UserScoreData, RendererConfig }			from '../../types';
import { RendererUpdate }											from '../../types';
import { InteractionConfig, ViewConfig }							from '../../types';
import { ChartOrientation }											from '../../types';


// This class renders a ValueChart's Alternatives into a series of bar charts, one for each primitive objective in the ValueChart. 
// These bar charts display the utilities for each Alternative's consequences for each user in the ValueChart.
// This utility is based on the weights given to objectives, and the user determined scores assigned to points in the consequence space. 
// Each Alternative's value for each PrimitiveObjective is rendered into a rectangle whose height (or width depending on the orientation) is 
// proportional to its (weight * userScore). The rectangles for each Alternative are aligned vertically (or horizontally) so that they form a of 
// series bar charts. Rectangles for different users utilities for the same alternatives are grouped together into columns.

@Injectable()
export class ObjectiveChartRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public lastRendererUpdate: RendererUpdate;								// The most recent RendererUpdate message that the LabelRenderer has received.

	// Constants for use in rendering the summary chart.
	private USER_SCORE_SPACING: number = 10; // The spacing between user score bars, in pixels.

	// d3 Selections:
	public chart: d3.Selection<any, any, any, any>;							// The 'g' element that contains all the elements making up the objective chart.
	public rowOutlinesContainer: d3.Selection<any, any, any, any>;			// The 'g' element that contains all the row outline elements
	public rowOutlines: d3.Selection<any, any, any, any>;					// The selection of all 'rect' elements that are used outline each row.
	public rowsContainer: d3.Selection<any, any, any, any>;					// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public rows: d3.Selection<any, any, any, any>;							// The selection of 'g' elements s.t. each element is a row container.
	public alternativeLabelsContainer: d3.Selection<any, any, any, any>;	// The 'g' element that contains the alternative labels.
	public alternativeLabels: d3.Selection<any, any, any, any>;				// The selection of all 'text' elements s.t. each element is used to label each alternative in the ValueChart.
	public cells: d3.Selection<any, any, any, any>;							// The selection of all 'g' elements s.t. each element is a cell container used to contain .
	public userScores: d3.Selection<any, any, any, any>;					// The selection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	public weightOutlines: d3.Selection<any, any, any, any>;				// The selection of 'rect' elements that are used to outline user utility bars to indicate maximum possible scores in a group ValueChart. 
	public domainLabels: d3.Selection<any, any, any, any>;					// The selection of 'text' elements used to label what domain element each cell represents.
	public alternativeBoxesContainer: d3.Selection<any, any, any, any>;		// The 'g' element that holds the alternative boxes.
	public alternativeBoxes: d3.Selection<any, any, any, any>;				// The selection of transparent 'rect' elements that are placed on top of each alternative in the summary chart. They are used to implement dragging, etc. 

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this directive when it is used.
	*/
	constructor(
		private rendererService: RendererService,
		private renderEventsService: RenderEventsService,
		private sortAlternativesInteraction: SortAlternativesInteraction) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param update - The RendererUpdate message sent to the ObjectiveChart to initiate a re-rendering of the objectives breakdown.
		@returns {void}
		@description	This method is used as the observer/handler of messages from the rendering pipeline and thus controls how and when the 
						objective chart is rendered. 
	*/
	public valueChartChanged = (update: RendererUpdate) => {
		this.lastRendererUpdate = update;
		
		// If the base element of the Objective Chart is undefined, then it has not yet been rendered. We must create SVG elements for the first time.
		if (this.chart == undefined) {
			this.createObjectiveChart(update);
		}

		// If the RendererUpdate is a structural update, then update the SVG elements making up the Objective Chart.
		if (update.structuralUpdate) {
			this.createObjectiveRows(update, this.rowsContainer, this.rowOutlinesContainer, this.alternativeBoxesContainer, this.alternativeLabelsContainer);
			this.toggleDomainLabels(update.viewConfig.displayDomainValues);
		}

		// Update the lastRendererUpdate values in the attached interaction classes and render the Objective Chart.
		this.updateInteractions(update);
		this.renderObjectiveChart(update);
	}

	/*
		@param interactionConfig - The interactionConfig message sent to the ObjectiveChartRenderer to update the InteractionConfig.
		@returns {void}
		@description	This method is used as the observer/handler of messages from the interactions pipeline and thus controls how and when the 
						objective chart interactions are turned on and off.
	*/
	public interactionsChanged = (interactionConfig: InteractionConfig) => {
		this.sortAlternativesInteraction.toggleAlternativeSorting(interactionConfig.sortAlternatives, this.alternativeBoxes, this.lastRendererUpdate);
	}

	/*
		@param viewConfig - The viewConfig message sent to the ObjectiveChartRenderer to update the InteractionConfig.
		@returns {void}
		@description	This method is used as the observer/handler of messages from the view configuration pipeline and thus controls how and when the 
						objective chart view options are turned on and off.
	*/
	public viewConfigChanged = (viewConfig: ViewConfig) => {
		this.toggleDomainLabels(viewConfig.displayDomainValues);
	}


	/*
		@param u - The most recent RendererUpdate message.
		@returns {void}
		@description	Update the lastRendererUpdate fields of the interactions associated with the ObjectiveChartRenderer with the most recent RendererUpdate message.
	*/
	public updateInteractions = (u: RendererUpdate) => {
		this.sortAlternativesInteraction.lastRendererUpdate = u;
	}

	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@returns {void}
		@description	Creates the base containers and elements for the objective Chart of a ValueChart. It should be called when
						creating an objective chart for the first time, but not when updating as the basic framework of the chart never needs to be
						constructed again. Instead, call the createObjectiveRows method to add or remove rows, and user columns from the 
						objective chart.
	*/
	private createObjectiveChart(u: RendererUpdate): void {
		// Indicate that rendering of the objective chart is just starting.
		this.renderEventsService.objectiveChartDispatcher.next(0);
		// Create the root container for the objective chart.
		this.chart = u.el.append('g')
			.classed(ObjectiveChartDefinitions.CHART, true);
		// Create the container for the row outlines.
		this.rowOutlinesContainer = this.chart.append('g')
			.classed(ObjectiveChartDefinitions.ROW_OUTLINES_CONTAINER, true);
		// Create the container to hold the rows.
		this.rowsContainer = this.chart.append('g')
			.classed(ObjectiveChartDefinitions.ROWS_CONTAINER, true);
		// Create the container to hold the labels for the alternatives
		this.alternativeLabelsContainer = this.chart.append('g')
			.classed(ObjectiveChartDefinitions.ALTERNATIVE_LABELS_CONTAINER, true);
		// Create the container to hold the alternative boxes.
		this.alternativeBoxesContainer = this.chart.append('g')
			.classed(ObjectiveChartDefinitions.ALTERNATIVE_BOXES_CONTAINER, true);

		this.createObjectiveRows(u, this.rowsContainer, this.rowOutlinesContainer, this.alternativeBoxesContainer, this.alternativeLabelsContainer);
	}

	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@param rowsContainer - The 'g' element that will contain/contains the row elements for the objective chart. 
		@param rowOutlinesContainer - The 'g' element that will contain/contains the 'rect' elements used to outline each row.
		@param boxesContainer - The 'g' element that contains the transparent 'rect' elements placed on top of each alternative in the objective chart in order to intercept clicks for dragging, etc.
		@param alternativeLabelsContainer - The 'g' element that contains the 'text' elements used to label each alternative in the ValueChart.
		@returns {void}
		@description	Creates/Updates the individual rows that make up the summary chart. One row is created for each primitive objective in the ValueChart. 
						It also creates the cells cell in each row, and users score bars in each cell through a call to createObjectiveCells. It will remove any
						rows that are no longer have an associated element in the u.rows parameter, and add rows if rows contains new elements. It also will add/remove
						cells and user score bars via createObjectiveCell. ONLY this method should be used to add/remove rows, cells, and user score bars to objective chart
						when objectives, alternatives, or user are added/removed from the ValueChart. createObjectiveRows should NOT be manually called.
	*/
	private createObjectiveRows(u: RendererUpdate, rowsContainer: d3.Selection<any, any, any, any>, rowOutlinesContainer: d3.Selection<any, any, any, any>, boxesContainer: d3.Selection<any, any, any, any>, alternativeLabelsContainer: d3.Selection<any, any, any, any>): void {
		// Create the row outlines for every new PrimitiveObjective. When the graph is being created for the first time, this is every PrimitiveObjective.
		var updateRowOutlines = rowOutlinesContainer.selectAll('.' + ObjectiveChartDefinitions.ROW_OUTLINE)
			.data(u.rowData);

		// Update row outlines to conform to the data.
		updateRowOutlines.exit().remove();			// Remove row outlines that do not have a matching row in the data.
		updateRowOutlines.enter().append('rect')	// Add row outlines for rows elements that have no matching outline.
			.classed(ObjectiveChartDefinitions.ROW_OUTLINE, true)
			.classed('valuechart-outline', true);

		// Note that it is important that we re-select all row outlines before assigning them to the class field. This is because 
		// the selections used for adding and removing elements are only the added or removed elements, not ALL of the elements.
		// This is true for any situation where we need to remove and then add new elements to an existing selection.
		this.rowOutlines = rowOutlinesContainer.selectAll('.' + ObjectiveChartDefinitions.ROW_OUTLINE);	// Update the row outlines field.

		var updateRowContainers = rowsContainer.selectAll('.' + ObjectiveChartDefinitions.ROW)
			.data(u.rowData);

		// Update rows to conform to the data.
		updateRowContainers.exit().remove();			// Remove rows that do not have a matching row in he data.
		updateRowContainers.enter().append('g')			// Add rows for rows in the data which do not have elements.
			.classed(ObjectiveChartDefinitions.ROW, true);

		this.rows = rowsContainer.selectAll('.' + ObjectiveChartDefinitions.ROW);	// Update the row field.


		var updateAlternativeLabels = alternativeLabelsContainer.selectAll('.' + ObjectiveChartDefinitions.ALTERNATIVE_LABEL)
			.data(u.valueChart.getAlternatives());

		// Update the alternative labels to conform to the data.
		updateAlternativeLabels.exit().remove();				// Remove alternative labels that no longer have a matching alternative in the data.
		updateAlternativeLabels.enter().append('text')			// Add alternative labels for new alternatives.
			.classed(ObjectiveChartDefinitions.ALTERNATIVE_LABEL, true);

		this.alternativeLabels = alternativeLabelsContainer.selectAll('.' + ObjectiveChartDefinitions.ALTERNATIVE_LABEL);	// Update the alternative outlines field.


		var updateBoxes = boxesContainer.selectAll('.' + ObjectiveChartDefinitions.ALTERNATIVE_BOX)
			.data(u.valueChart.getAlternatives());

		// Update the alternative boxes to conform to the data.
		updateBoxes.exit().remove();
		updateBoxes.enter().append('rect')
			.classed(ObjectiveChartDefinitions.ALTERNATIVE_BOX, true)		// Remove alternative boxes that no longer have a matching alternative.
			.classed(ObjectiveChartDefinitions.CHART_ALTERNATIVE, true);	// Add boxes for new alternatives.

		this.alternativeBoxes = boxesContainer.selectAll('.' + ObjectiveChartDefinitions.ALTERNATIVE_BOX);

		this.createObjectiveCells(this.rows)
	}

	/*
		@param objectiveRows - The selection of rows whose cells are to be created/updated.
		@returns {void}
		@description	Creates/Updates the cells that compose each row of the objective chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective).
						It will add and delete cells and user score bars so that the objective chart is properly configured to its background data. Note that his method should NEVER be called directly
						to updated to objective chart cells and user scores bars as it provides no way of setting the background data. createObjectiveRows should ALWAYS be used instead.
	*/
	private createObjectiveCells(objectiveRows: d3.Selection<any, any, any, any>): void {
		// Create cells for any new objectives, or for new rows. Once again, if the graph is being create for the first time then this is all rows.
		var updateCells = objectiveRows.selectAll('.' + ObjectiveChartDefinitions.CELL)
			.data((d: RowData) => { return d.cells; });

		// Update cells to conform to the data.
		updateCells.exit().remove();
		updateCells.enter().append('g')
			.classed(ObjectiveChartDefinitions.CELL, true)
			.classed(ObjectiveChartDefinitions.CHART_CELL, true);


		this.cells = objectiveRows.selectAll('.' + ObjectiveChartDefinitions.CELL);

		// Create the bars for each new user score. Note that if this is a Individual ValueChart, there is only on bar in each cell, as there is only one user score for each objective value. 
		var updateUserScores = this.cells.selectAll('.' + ObjectiveChartDefinitions.USER_SCORE)
			.data((d: CellData) => { return d.userScores; });

		// Update user score bars to conform to the data. This is where user's are effectively added and deleted to/from the objective chart.
		updateUserScores.exit().remove();
		updateUserScores.enter().append('rect')
			.classed(ObjectiveChartDefinitions.USER_SCORE, true);

		this.userScores = this.cells.selectAll('.' + ObjectiveChartDefinitions.USER_SCORE);


		var updateWeightOutlines = this.cells.selectAll('.' + ObjectiveChartDefinitions.WEIGHT_OUTLINE)
			.data((d: CellData) => { return d.userScores; });

		// Update weight outlines to conform to the data. Note that weight outlines are only displayed for group ValueCharts.
		updateWeightOutlines.exit().remove();
		updateWeightOutlines.enter().append('rect')
			.classed(ObjectiveChartDefinitions.WEIGHT_OUTLINE, true);

		this.weightOutlines = this.cells.selectAll('.' + ObjectiveChartDefinitions.WEIGHT_OUTLINE);

		this.cells.selectAll('.' + ObjectiveChartDefinitions.DOMAIN_LABEL).remove();
		var updateDomainLabels = this.cells.selectAll('.' + ObjectiveChartDefinitions.DOMAIN_LABEL)
			.data((d: CellData) => { return [d]; });

		updateDomainLabels.exit().remove();
		// Update domain labels to conform to the data.
		updateDomainLabels.enter().append('text')
			.classed(ObjectiveChartDefinitions.DOMAIN_LABEL, true);

		this.domainLabels = this.cells.selectAll('.' + ObjectiveChartDefinitions.DOMAIN_LABEL);	
	}


	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@returns {void}
		@description	Updates the data underlying the objective chart, and then positions and gives widths + heights to the elements created by the createObjectiveChart method.
						It should be used to update the objective chart when the data underlying the it (u.rows) has changed, and the appearance of the objective chart needs to be updated to reflect
						this change. It should NOT be used to initially render the objective chart, or change the view orientation of the objective chart. Use renderObjectiveChart for this purpose.
	*/
	private renderObjectiveChart(u: RendererUpdate): void {
		// Position the objective chart.
		this.chart
			.attr('transform', 'translate(' + u.x + ',' + u.y + ')');

		// Update the data behind the row outlines 
		var rowOutlinesToUpdate = this.rowOutlines
			.data(u.rowData);

		// Update the data behind the rows.
		var rowsToUpdate = this.rows.data(u.rowData);

		// Update the data behind the alternative labels.
		var alternativeLabelsToUpdate = this.alternativeLabels.data(u.valueChart.getAlternatives());

		// Update the data behind the alternative boxes.
		var alternativeBoxesToUpdate: d3.Selection<any, any, any, any> = this.alternativeBoxes
			.data(u.valueChart.getAlternatives());

		// Update the data behind the cells.
		var cellsToUpdate = this.cells
			.data((d: RowData) => { return d.cells; })

		// Update the data behind the user score bars.
		var userScoresToUpdate = this.userScores
			.data((d: CellData, i: number) => { return d.userScores; });

		// Update the data behind the weight outlines. Recall that these are only displayed for group ValueCharts.
		var weightOutlinesToUpdate = this.weightOutlines
			.data((d: CellData, i: number) => { return d.userScores; });


		this.renderObjectiveChartRows(u, rowOutlinesToUpdate, rowsToUpdate, alternativeLabelsToUpdate, alternativeBoxesToUpdate, cellsToUpdate, userScoresToUpdate, weightOutlinesToUpdate);
	
		// Indicate that the objective chart is finished rendering.
		this.renderEventsService.objectiveChartDispatcher.next(1);	
	}

	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@param rowOutlines - The selection of 'rect' elements that outline the rows to be rendered.
		@param rows - The selection of 'g' elements that are the rows to be rendered. These elements should contain more 'g' elements that are the cells to be rendered. 
		@param alternativeLabels - The selection of 'text' elements for labeling alternatives. There should be one text element per alternative.
		@param alternativeBoxes - The selection of 'rect' elements to be positioned over each alternative's column in the objective chart.
		@param cells - The selection of 'g' elements that contain the user score 'rect' elements. There should be one 'g' element for each alternative in the ValueChart.
		@param userScores - The selection of 'rect' elements that are the user scores to be rendered.	
		@param weightOutlines - The selection of 'rect' elements that are the weight outlines to be rendered for each user score in the summary chart.	
		@returns {void}
		@description	Positions and gives widths + heights to the elements created by createObjectiveRows. Unlike in the summary chart we directly 
						position the row containers here because the positions of the scores (and therefore row containers) are are absolute. (no stacking).
						Note that this method should NOT be called manually. updateObjectiveChart or renderObjectiveChart should called to re-render objective rows.
	*/
	private renderObjectiveChartRows(u: RendererUpdate, rowOutlines: d3.Selection<any, any, any, any>, rows: d3.Selection<any, any, any, any>, alternativeLabels: d3.Selection<any, any, any, any>, alternativeBoxes: d3.Selection<any, any, any, any>, cells: d3.Selection<any, any, any, any>, userScores: d3.Selection<any, any, any, any>, weightOutlines: d3.Selection<any, any, any, any>): void {
		rowOutlines
			.attr('transform', (d: RowData, i: number) => {
				return this.rendererService.generateTransformTranslation(u.viewConfig.viewOrientation, 0, (u.rendererConfig.dimensionTwoScale(d.weightOffset))); // Position each of the rows based on the combined weights of the previous rows.
			})
			.attr(u.rendererConfig.dimensionOne, u.rendererConfig.dimensionOneSize)
			.attr(u.rendererConfig.dimensionTwo, (d: RowData) => {
				let maxObjectiveWeight: number = u.maximumWeightMap.getObjectiveWeight(d.objective.getId());
				return u.rendererConfig.dimensionTwoScale(maxObjectiveWeight);																				// Set the height of the row to be proportional to its weight.
			});

		rows
			.attr('transform', (d: RowData, i: number) => {
				return this.rendererService.generateTransformTranslation(u.viewConfig.viewOrientation, 0, (u.rendererConfig.dimensionTwoScale(d.weightOffset)));	// Transform each row container to have the correct y (or x) position based on the combined weights of the previous rows.
			});

		var alternativeLabelCoordOneOffset: number = ((u.viewConfig.viewOrientation === ChartOrientation.Vertical) ? 20 : 40);
		var alternativeLabelCoordTwoOffset: number = 20;

		alternativeLabels
			.text((d: Alternative) => { return d.getName(); })
			.attr(u.rendererConfig.coordinateOne, (d: any, i: number) => { return this.calculateCellCoordinateOne(d, i, u) + alternativeLabelCoordOneOffset; })
			.attr(u.rendererConfig.coordinateTwo, () => {
				return (u.viewConfig.viewOrientation === ChartOrientation.Vertical) ? u.rendererConfig.dimensionTwoSize + alternativeLabelCoordTwoOffset : alternativeLabelCoordTwoOffset;
			})
			.attr('alternative', (d: Alternative) => { return d.getId(); });

		alternativeBoxes
			.attr(u.rendererConfig.dimensionOne, (d: CellData, i: number) => { return u.rendererConfig.dimensionOneSize / u.valueChart.getAlternatives().length; })
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.dimensionTwoSize)
			.attr(u.rendererConfig.coordinateOne, (d: CellData, i: number) => { return this.calculateCellCoordinateOne(d, i, u); })
			.attr(u.rendererConfig.coordinateTwo, 0)
			.attr('alternative', (d: Alternative) => { return d.getId(); })
			.attr('id', (d: Alternative) => { return 'objective-' + d.getId() + '-box' });


		this.renderObjectiveChartCells(u, cells, userScores, weightOutlines);
	}

	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@param cells - The selection of 'g' elements that contain the user score 'rect' elements. There should be one 'g' element for each alternative in the ValueChart.
		@param userScores - The selection of 'rect' elements that are the user scores to be rendered.	
		@param weightOutlines - The selection of 'rect' elements that are the weight outlines to be rendered for each user score in the summary chart.	
		@returns {void}
		@description	Positions and gives widths + heights to the elements created by createObjectiveCells.
						Note that this method should NOT be called manually. updateObjectiveChart or renderObjectiveChart should called to re-render objective rows.
	*/
	private renderObjectiveChartCells(u: RendererUpdate, cells: d3.Selection<any, any, any, any>, userScores: d3.Selection<any, any, any, any>, weightOutlines: d3.Selection<any, any, any, any>): void {
		cells
			.attr('transform', (d: CellData, i: number) => {
				let coordinateOne: number = this.calculateCellCoordinateOne(d, i, u);
				return this.rendererService.generateTransformTranslation(u.viewConfig.viewOrientation, coordinateOne, 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getId(); });

		var domainLabelCoord: number = 5;

		this.domainLabels
			.data((d: CellData) => { return [d]; })
			.text((d: CellData, i: number) => { return '' + d.value })
			.attr(u.rendererConfig.coordinateOne, (u.rendererConfig.dimensionOneSize / u.valueChart.getAlternatives().length) / 3)
			.attr(u.rendererConfig.coordinateTwo, (d: CellData, i: number) => {
				let maxObjectiveWeight: number = 0;
				if (d.userScores.length > 0) {
					maxObjectiveWeight = u.maximumWeightMap.getObjectiveWeight(d.userScores[0].objective.getId());				
				}
				return (u.viewConfig.viewOrientation === ChartOrientation.Vertical) ? u.rendererConfig.dimensionTwoScale(maxObjectiveWeight) - domainLabelCoord : domainLabelCoord;
			});

		this.renderUserScores(u, userScores);
		this.renderWeightOutlines(u, weightOutlines);
	}

	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@param userScores - The selection of 'rect' elements that are the user scores to be rendered.	
		@returns {void}
		@description	Positions and gives widths + heights to the elements to 'rect' elements used to display user score bars in the objective chart.
						Note that this method should NOT be called manually. updateObjectiveChart or renderObjectiveChart should called to re-render objective rows.
	*/
	private renderUserScores(u: RendererUpdate, userScores: d3.Selection<any, any, any, any>): void {
		userScores
			.attr(u.rendererConfig.dimensionOne, (d: UserScoreData, i: number) => { return Math.max(this.calculateUserScoreDimensionOne(d, i, u) - this.USER_SCORE_SPACING, 0); })
			.attr(u.rendererConfig.dimensionTwo, this.calculateUserScoreDimensionTwo)
			.attr(u.rendererConfig.coordinateOne, (d: UserScoreData, i: number) => { return (this.calculateUserScoreDimensionOne(d, i, u) * i) + (this.USER_SCORE_SPACING / 2); })
			.style('fill', (d: UserScoreData, i: number) => {
				if (u.valueChart.isIndividual())
					return d.objective.getColor();
				else
					return d.user.color;
			});

		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			userScores
				.attr(u.rendererConfig.coordinateTwo, (d: UserScoreData, i: number) => {
					let maxObjectiveWeight: number = u.maximumWeightMap.getObjectiveWeight(d.objective.getId());
					let userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
					let score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId()).getScore(d.value);
					return u.rendererConfig.dimensionTwoScale(maxObjectiveWeight) - u.rendererConfig.dimensionTwoScale(score * userObjectiveWeight);
				});
		} else {
			userScores.attr(u.rendererConfig.coordinateTwo, 0);
		}
	}

	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@param weightOutlines - The selection of 'rect' elements that are the weight outlines to be rendered for each user score in the summary chart.	
		@returns {void}
		@description	Positions and gives widths + heights to the elements to 'rect' elements used to user weight outlines in the objective chart. These outlines are only
						displayed for group ValueCharts.
						Note that this method should NOT be called manually. updateObjectiveChart or renderObjectiveChart should called to re-render objective rows.
	*/
	private renderWeightOutlines(u: RendererUpdate, weightOutlines: d3.Selection<any, any, any, any>): void {
		weightOutlines
			.attr(u.rendererConfig.dimensionOne, (d: UserScoreData, i: number) => { return Math.max(this.calculateUserScoreDimensionOne(d, i, u) - (this.USER_SCORE_SPACING + 1), 0); })
			.attr(u.rendererConfig.dimensionTwo, (d: UserScoreData, i: number) => { return this.calculateWeightOutlineDimensionTwo(d, i); })
			.attr(u.rendererConfig.coordinateOne, (d: UserScoreData, i: number) => { return (this.calculateUserScoreDimensionOne(d, i, u) * i) + ((this.USER_SCORE_SPACING + 1) / 2); })
			.style('stroke-dasharray', (d: UserScoreData, i: number) => {
				let dimensionOne: number = (this.calculateUserScoreDimensionOne(d, i, u) - (this.USER_SCORE_SPACING + 1));
				let dimensionTwo: number = this.calculateWeightOutlineDimensionTwo(d, i);

				return (u.viewConfig.viewOrientation === ChartOrientation.Vertical) ?
					(dimensionOne + dimensionTwo) + ', ' + dimensionOne
					:
					(dimensionTwo + dimensionOne + dimensionTwo) + ', ' + dimensionOne;
			});


		if (u.viewConfig.viewOrientation === ChartOrientation.Vertical) {
			weightOutlines
				.attr(u.rendererConfig.coordinateTwo, (d: UserScoreData, i: number) => {
					let maxObjectiveWeight: number = u.maximumWeightMap.getObjectiveWeight(d.objective.getId());
					return u.rendererConfig.dimensionTwoScale(maxObjectiveWeight) - this.calculateWeightOutlineDimensionTwo(d, i);
				});
		} else {
			weightOutlines.attr(u.rendererConfig.coordinateTwo, 0);
		}

		this.toggleWeightOutlines(u);
	}


	/*
		@param u - The most recent RendererUpdate message that the ObjectiveChartRenderer has received.
		@returns {void}
		@description	Display or hide the weight outlines depending on the whether the ValueChart is a group or individual chart.
	*/
	private toggleWeightOutlines(u: RendererUpdate): void {
		if (u.valueChart.isIndividual()) {
			this.weightOutlines.style('display', 'none');
		} else {
			this.weightOutlines.style('display', 'block');
		}
	}

	/*
		@param displayDomainValues - Whether or not to display domain values on top of the objective chart cells.
		@returns {void}
		@description	Display or hide the domain labels for cells depending on the value of the displayDomainValues parameter.
	*/
	private toggleDomainLabels(displayDomainValues: boolean): void {
		if (displayDomainValues) {
			this.domainLabels.style('display', 'block');
		} else {
			this.domainLabels.style('display', 'none');
		}
	}

	// ========================================================================================
	// 		Anonymous functions that are used often enough to be made class fields
	// ========================================================================================
	calculateWeightOutlineDimensionTwo = (d: UserScoreData, i: number) => {
		let userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
		return Math.max(this.lastRendererUpdate.rendererConfig.dimensionTwoScale(userObjectiveWeight) - 1, 0);
	}

	// Calculate the CoordinateOne of a cell given the cells data and its index. Cells are all the same width (or height), so we simply divide the length of each row into equal amounts to find their locations.
	calculateCellCoordinateOne = (d: CellData, i: number, u: RendererUpdate) => { return i * (u.rendererConfig.dimensionOneSize / u.valueChart.getAlternatives().length); };
	// Calculate the CoordinateOne of a userScore given the userScore object and its index. userScores are just further subdivisions of cells based on the number of userScores in each cell.
	calculateUserScoreDimensionOne = (d: UserScoreData, i: number, u: RendererUpdate) => { return (u.rendererConfig.dimensionOneSize / u.valueChart.getAlternatives().length) / u.usersToDisplay.length };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: UserScoreData, i: number) => {
		let userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getId());
		let score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getId()).getScore(d.value);
		return this.lastRendererUpdate.rendererConfig.dimensionTwoScale(score * userObjectiveWeight);
	};
}

