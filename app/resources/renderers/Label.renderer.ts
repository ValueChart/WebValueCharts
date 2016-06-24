/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:39:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-24 13:50:51
*/

import { Injectable } 												from '@angular/core';
import { NgZone }													from '@angular/core';

// d3 and JQuery
import * as d3 														from 'd3';
import * as $														from 'jquery';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';

import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }							from '../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }							from '../renderers/ContinuousScoreFunction.renderer';
import { ReorderObjectivesInteraction }								from '../interactions/ReorderObjectives.interaction';

import { ResizeWeightsInteraction }												from '../interactions/ResizeWeights.interaction';

// Model Classes
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { AbstractObjective }										from '../model/AbstractObjective';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';
import { WeightMap }												from '../model/WeightMap';


// This class renders a ValueChart's hierarchical objective structure into labels for an objective chart. Each objective is rendered into a 
// rectangle whose width (or height depending on the orientation) is proportional to its weight. The rectangles are positioned in such a
// way that they act as labels for the objectives in the objective chart.

@Injectable()
export class LabelRenderer {

	// d3 selections that are saved to avoid searching the DOM every time they are needed.
	public rootContainer: d3.Selection<any>;				// the 'g' element that is the root container of the Label area.
	public labelSpaceOutline: d3.Selection<any>;			// the 'rect' element that is the outline of the label area.
	public labelContainer: d3.Selection<any>;				// the 'g' element that contains the hierarchical label structure.
	public scoreFunctionContainer: d3.Selection<any>;		// the 'g' element that contains the score function plots for each PrimitiveObjective in the ValueChart.

	private labelWidth: number;				// The min of the labels, calculated based on maximum depth of the objective hierarchy and the amount of 
											// space that the label area occupies.
	private displayScoreFunctions: boolean;

	public scoreFunctionRenderers: any;

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private chartUndoRedoService: ChartUndoRedoService,
		private resizeWeightsInteraction: ResizeWeightsInteraction,
		private ngZone: NgZone) { 
	}

	// Create the base containers and elements for the labels.
	createLabelSpace(el: d3.Selection<any>, labelData: VCLabelData[], objectiveData: PrimitiveObjective[]): void {
		// Create the root container which will hold all label related SVG elements.
		this.rootContainer = el.append('g')
			.classed('label-root-container', true)

		// Create the outline box for the label area. Append the styles here because they will not change.
		this.labelSpaceOutline = this.rootContainer.append('g')
			.classed('label-outline-container', true)
			.append('rect')
				.classed('label-outline', true)
				.classed('valuechart-outline', true);

		// Create the container which will hold all labels.
		this.labelContainer = this.rootContainer.append('g')
			.classed('label-labels-container', true);

		// Create the container which will the hold Score Functions plots for each PrimitiveObjective.
		this.scoreFunctionContainer = this.rootContainer.append('g')
			.classed('label-scorefunction-container', true);

		// Recursively create the labels based on the Objective structure.
		this.createLabels(el, this.labelContainer, labelData, 'rootcontainer');

		// Create the score Functions.
		this.createScoreFunctions(this.scoreFunctionContainer, objectiveData);
	}

	// This function recursively creates labels for an array of Objectives that have been put into labelData format.
	createLabels(el: d3.Selection<any>, labelContainer: d3.Selection<any>, labelData: VCLabelData[], parentName: string): void {
		// Create a new container for each element in labelData.
		var newLabelContainers: d3.Selection<any> = labelContainer.selectAll('g[parent=parentName]')
			.data(labelData)
			.enter().append('g')
				.classed('label-subcontainer', true)
				.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-container' })
				.attr('parent', parentName);	// Set the name parent objective on the 'g', or 'rootcontainer' if it has not parent objective. 

		// Append an outline rectangle for label container that was just created.
		newLabelContainers.append('rect')
			.classed('label-subcontainer-outline', true)
			.classed('valuechart-label-outline', true)
			.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-outline' });

		// Append a text element for each label container that was just created. These text elements will be the labels themselves.
		newLabelContainers.append('text')
			.classed('label-subcontainer-text', true)
			.classed('valuechart-label-text', true)
			.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-text' });

		newLabelContainers.append('line')
			.classed('label-subcontainer-divider', true)
			.classed('valuechart-label-divider', true)
			.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-divider' });


		// Call createLabels on the children of each AbstractObjective in labelData. This is how the hierarchical structure is "parsed".
		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.subLabelData === undefined) {
				el.select('#label-' + labelDatum.objective.getName() + '-outline')
					.classed('label-primitive-objective', true);

				el.select('#label-' + labelDatum.objective.getName() + '-text')
					.classed('label-primitive-objective', true);
				return;	
			}

			this.createLabels(el, el.select('#label-' + labelDatum.objective.getName() + '-container'), labelDatum.subLabelData, labelDatum.objective.getName());
		});
	}

	updateLabelSpace(labelData: VCLabelData[], parentName: string, viewOrientation: string, objective: PrimitiveObjective[]) {
		// Calculate the width of the labels that are going to be created based on width of the area available, and the greatest depth of the Objective Hierarchy
		this.displayScoreFunctions = this.renderConfigService.viewConfiguration.displayScoreFunctions;
		var labelSpaces = this.rootContainer.selectAll('g[parent=' + parentName + ']').data(labelData).order();
		this.renderLabels(labelSpaces, labelData, viewOrientation, true);

		var scoreFunctionContainer: d3.Selection<any> = this.rootContainer.select('.label-scorefunction-container');

		if (this.displayScoreFunctions) {
			// Render the score function plots.
			scoreFunctionContainer.style('display', 'block');
			this.renderScoreFunctions(viewOrientation, scoreFunctionContainer, objective);
		} else {
			scoreFunctionContainer.style('display', 'none');
		}
	}

	// This function positions and gives widths + heights to the elements created by the createLabelSpace method.
	renderLabelSpace(labelData: VCLabelData[], viewOrientation: string, objective: PrimitiveObjective[]): void {

		// Calculate the width of the labels that are going to be created based on width of the area available, and the greatest depth of the Objective Hierarchy
		this.displayScoreFunctions = this.renderConfigService.viewConfiguration.displayScoreFunctions;
		this.labelWidth = this.chartDataService.calculateMinLabelWidth(labelData, this.renderConfigService.dimensionOneSize, this.displayScoreFunctions);
		// Position the root container for the label area. This positions all of its child elements as well.
		// Unfortunately, we cannot use the generateTransformTranslation method here because positioning the labels does not merely involve a switch of x an y coordinates.
		this.rootContainer
			.attr('transform', () => {
				if (viewOrientation === 'vertical')
					return 'translate(0,' + (this.renderConfigService.dimensionTwoSize + 10) + ')';	
				else
					return 'translate(0,0)';
			});
			
		// Set the width and height of labelSpaceOutline 'rect' to the width and hight of the label area.
		this.labelSpaceOutline
			.attr(this.renderConfigService.dimensionOne, this.renderConfigService.dimensionOneSize)
			.attr(this.renderConfigService.dimensionTwo, this.renderConfigService.dimensionTwoSize);

		// Render the labels, starting with the labels for the highest level AbstractObjectives, which are in the 'g' directly under the root container.
		var labelSpaces = this.rootContainer.selectAll('g[parent=rootcontainer]');
		this.renderLabels(labelSpaces, labelData, viewOrientation, false);

		var scoreFunctionContainer: d3.Selection<any>  = this.rootContainer.select('.label-scorefunction-container');

		if (this.displayScoreFunctions) {
			// Render the score function plots.
			scoreFunctionContainer.style('display', 'block');
			this.renderScoreFunctions(viewOrientation, scoreFunctionContainer, objective);
		} else {
			scoreFunctionContainer.style('display', 'none');
		}
		
	}

	// This function recursively renders labels for an array of Objectives that have been put into labelData format. It works very similarly to createLabels.
	renderLabels(labelSpaces: d3.Selection<any>, labelData: VCLabelData[], viewOrientation: string, isDataUpdate: boolean): void {
		// Calculate the weight offsets for this level of the Objective hierarchy, NOT counting children of other Abstract objectives at the same level.
		var weightOffsets: number[] = [];
		var weightSum: number = 0;	// The weight offset for the first objective at this level is 0.
		for (var i: number = 0; i < labelData.length; i++) {
			weightOffsets[i] = weightSum;
			weightSum += labelData[i].weight;
		}

		this.renderLabelOutline(labelSpaces.select('.label-subcontainer-outline'), weightOffsets, viewOrientation);	// Render the outlining rectangle.

		this.renderLabelText(labelSpaces.select('.label-subcontainer-text'), weightOffsets, viewOrientation)	// Render the text within the label

		this.renderLabelDividers(labelSpaces.select('.label-subcontainer-divider'), weightOffsets, viewOrientation);


		// Recursively render the labels that are children of this label (ie. the labels of the objectives that are children of those objectives in labelData)
		labelData.forEach((labelDatum: VCLabelData, index: number) => {
			if (labelDatum.depthOfChildren === 0)	// This label has no child labels.
				return;
			let subLabelSpaces: d3.Selection<any> = this.rootContainer.selectAll('g[parent=' + labelDatum.objective.getName() + ']');	// Get all sub label containers whose parent is the current label
			
			let scaledWeightOffset: number = this.renderConfigService.dimensionTwoScale(weightOffsets[index]); // Determine the y (or x) offset for this label's children based on its weight offset.
			let labelTransform: string = this.renderConfigService.generateTransformTranslation(viewOrientation, this.labelWidth, scaledWeightOffset); // Generate the transformation.
			subLabelSpaces.attr('transform', labelTransform); // Apply the transformation to the sub label containers who are children of this label so that they inherit its position.
			if (isDataUpdate)
				this.renderLabels(subLabelSpaces.data(labelDatum.subLabelData), labelDatum.subLabelData, viewOrientation, true);	// Render the sub labels using the data update selection.
			else
				this.renderLabels(subLabelSpaces, labelDatum.subLabelData, viewOrientation, false);	// Render the sub labels.

		});
	}

	// Render the outline of a label.
	renderLabelOutline(labelOutlines: d3.Selection<any>, weightOffsets: number[], viewOrientation: string): void {
		// Render the styles of the outline rectangle.

		labelOutlines.style('fill', 'white')
			.style('stroke', (d: VCLabelData) => {
				return (d.depthOfChildren === 0) ? (<PrimitiveObjective>d.objective).getColor() : 'gray';	// PrimitiveObjective's should have their own color. Abstract Objectives should be gray.
			});

		labelOutlines
			.attr(this.renderConfigService.dimensionOne, this.determineLabelWidth)
			.attr(this.renderConfigService.coordinateOne, 0)									// Have to set CoordinateOne to be 0, or when we re-render in a different orientation the switching of the width and height can cause an old value to be retained
			.attr(this.renderConfigService.dimensionTwo, (d: VCLabelData, i: number) => {
				return Math.max(this.renderConfigService.dimensionTwoScale(d.weight) - 2, 0);					// Determine the height (or width) as a function of the weight
			})
			.attr(this.renderConfigService.coordinateTwo, ((d: VCLabelData, i: number) => {
				return this.renderConfigService.dimensionTwoScale(weightOffsets[i]);			// Determine the y position (or x) offset from the top of the containing 'g' as function of the combined weights of the previous objectives. 
			}));
	}

	// Render the text of a label.
	renderLabelText(labelTexts: d3.Selection<any>, weightOffsets: number[], viewOrientation: string): void {

		var textOffset: number = 5;
		// Determine the position of the text within the box depending on the orientation
		labelTexts.attr(this.renderConfigService.coordinateOne, () => {
				return (viewOrientation === 'vertical') ? 10 : (this.labelWidth / 2); 
			})
			.attr(this.renderConfigService.coordinateTwo, (d: VCLabelData, i: number) => {
				return (viewOrientation === "vertical") ?
					this.renderConfigService.dimensionTwoScale(weightOffsets[i]) + (this.renderConfigService.dimensionTwoScale(d.weight) / 2) + textOffset
					:
					this.renderConfigService.dimensionTwoScale(weightOffsets[i]) + (this.renderConfigService.dimensionTwoScale(d.weight) / 5) + textOffset;
			})
			.text((d: VCLabelData) => { return d.objective.getName() + ' (' + (Math.round((d.weight / this.chartDataService.weightMap.getWeightTotal()) * 1000) / 10) + '%)' });	// Round the weight number to have 2 decimal places only.

	}

	renderLabelDividers(labelDividers: d3.Selection<any>, weightOffsets: number[], viewOrientation: string): void {

		var calculateDimensionTwoOffset = (d: VCLabelData, i: number) => {
			return this.renderConfigService.dimensionTwoScale(weightOffsets[i]) - 2;					// Determine the height (or width) as a function of the weight
		};

		labelDividers
			.attr(this.renderConfigService.coordinateOne + '1', 0)
			.attr(this.renderConfigService.coordinateOne + '2', (d: VCLabelData, i: number) => {		 // Expand the last label to fill the rest of the space.
				return (i === 0) ? 0 : this.determineLabelWidth(d);
			})
			.attr(this.renderConfigService.coordinateTwo + '1', calculateDimensionTwoOffset)
			.attr(this.renderConfigService.coordinateTwo + '2', calculateDimensionTwoOffset)
			.style('cursor', () => {
				return (viewOrientation === 'vertical') ? 'ns-resize' : 'ew-resize';
			});

		var dragToResizeWeights = d3.behavior.drag();

		dragToResizeWeights.on('dragstart', (d: any, i: number) => {
			// Save the current state of the Weight Map.
			this.chartUndoRedoService.saveWeightMapState(this.chartDataService.weightMap);
		})
		.on('drag', this.resizeWeightsInteraction.resizeWeights);

		labelDividers.call(dragToResizeWeights);
	}

	// This function creates a score function plot for each Primitive Objective in the ValueChart using the ScoreFunctionRenderer.
	createScoreFunctions(scoreFunctionContainer: d3.Selection<any>, data: PrimitiveObjective[]): void {
		// Create a 'g' element to contain each score function plot.
		
		this.scoreFunctionRenderers = {}

		var newScoreFunctionPlots: d3.Selection<any> = scoreFunctionContainer.selectAll('.label-scorefunction')
			.data(data)
			.enter().append('g')
				.classed('label-scorefunction', true)
				.attr('id', (d: PrimitiveObjective) => { return 'label-' + d.getName() + '-scorefunction'; })

		// Use the ScoreFunctionRenderer to create each score function.
		newScoreFunctionPlots[0].forEach((scoreFunctionPlot: Element) => {
			var el: d3.Selection<any> = d3.select(scoreFunctionPlot);
			var datum: PrimitiveObjective = el.data()[0];

			if (datum.getDomainType() === 'categorical' || datum.getDomainType() === 'interval')
				this.scoreFunctionRenderers[datum.getName()] = new DiscreteScoreFunctionRenderer(this.chartDataService, this.chartUndoRedoService, this.ngZone);
			else 
				this.scoreFunctionRenderers[datum.getName()] = new ContinuousScoreFunctionRenderer(this.chartDataService, this.chartUndoRedoService, this.ngZone);

			this.scoreFunctionRenderers[datum.getName()].createScoreFunction(el, datum);	
		});
	}
	// This function calls uses the ScoreFunctionRenderer to position and give widths + heights to the score functions created by the createScoreFunctions method.
	renderScoreFunctions(viewOrientation: string, scoreFunctionContainer: d3.Selection<any>, data: PrimitiveObjective[]): void {
		var scoreFunctionMap: ScoreFunctionMap = this.chartDataService.scoreFunctionMap;
		var width: number
		var height: number;
		var weightOffset: number = 0;
		var el: d3.Selection<any>;
		var datum: PrimitiveObjective;
		var objectiveWeight: number;
		var scoreFunction: ScoreFunction;
		var dimensionOneTransform: number;
		var dimensionTwoTransform: number;



		// Select all the score function plot containers:
		var scoreFunctionsPlots = scoreFunctionContainer.selectAll('.label-scorefunction');

		scoreFunctionsPlots[0].forEach((scoreFunctionPlot: Element) => {
			el = d3.select(scoreFunctionPlot);																// Convert the element into a d3 selection.
			datum = el.data()[0];																			// Get the data for this score function from the selection
			objectiveWeight = this.chartDataService.weightMap.getObjectiveWeight(datum.getName());
			scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(datum.getName());
			dimensionOneTransform = (this.renderConfigService.dimensionOneSize - this.labelWidth) + 1;		// Determine the dimensions the score function will occupy
			dimensionTwoTransform = this.renderConfigService.dimensionTwoScale(weightOffset);				// ^^

			// Place the score function plot in the correct location.
			el.attr('transform', this.renderConfigService.generateTransformTranslation(viewOrientation, dimensionOneTransform, dimensionTwoTransform));

			if (viewOrientation === 'vertical') {
				width = this.labelWidth;
				height = this.renderConfigService.dimensionTwoScale(objectiveWeight);
			} else {
				width = this.renderConfigService.dimensionTwoScale(objectiveWeight);
				height = this.labelWidth;
			}

			this.scoreFunctionRenderers[datum.getName()].renderScoreFunction(el, datum, scoreFunction, width, height, viewOrientation);
			this.scoreFunctionRenderers[datum.getName()].toggleValueLabels(this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels);

			weightOffset += objectiveWeight;
		});
	}

	toggleScoreFunctionValueLabels(): void {
		for(var field in this.scoreFunctionRenderers) {
			this.scoreFunctionRenderers[field].toggleValueLabels(this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels);
		}
	}

	toggleSettingObjectiveColors(setObjectiveColors: boolean): void {
		var primitiveObjectiveLabels: JQuery = $('.label-primitive-objective');
		primitiveObjectiveLabels.off('click');
		if (setObjectiveColors) {
			primitiveObjectiveLabels.click((eventObject: Event) => {
				var targetObjective: PrimitiveObjective = d3.select(eventObject.target).datum().objective;
				var colorPicker = $('#primitiveObjective-color-picker');
				colorPicker.off('change');
				
				colorPicker.change((e: Event) => {
					var color: string = (<any> e.target).value;
					targetObjective.setColor(color);
					this.chartDataService.colorsHaveChanged = true;
				});

				colorPicker.click();
			});
		}
	}

	// Anonymous functions for setting selection attributes that are used enough to be made class fields

	determineLabelWidth = (d: VCLabelData) => {		 // Expand the last label to fill the rest of the space.
		var scoreFunctionOffset: number = ((this.displayScoreFunctions) ? this.labelWidth : 0);
		var retValue = (d.depthOfChildren === 0) ?
			(this.renderConfigService.dimensionOneSize - scoreFunctionOffset) - (d.depth * this.labelWidth)
			:
			this.labelWidth;

		return retValue;
	};

}