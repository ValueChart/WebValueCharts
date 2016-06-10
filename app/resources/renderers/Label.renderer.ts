/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:39:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-10 13:19:49
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { ScoreFunctionRenderer }									from '../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }							from '../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }							from '../renderers/ContinuousScoreFunction.renderer';



// Model Classes
import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunctionMap }				from '../model/ScoreFunctionMap';
import { ScoreFunction }				from '../model/ScoreFunction';


// This class is renders a ValueChart's hierarchical objective structure into labels for an objective chart. Each objective is rendered into a 
// rectangle whose width (or height depending on the orientation) is proportional to its weight. The rectangles are positioned in such a
// way that they act as labels for the objectives in the objective chart.

@Injectable()
export class LabelRenderer {

	// d3 selections that are saved to avoid searching the DOM every time they are needed.
	public rootContainer: any;				// the 'g' element that is the root container of the Label area.
	public labelSpaceOutline: any;			// the 'rect' element that is the outline of the label area.
	public labelContainer: any;				// the 'g' element that contains the hierarchical label structure.
	public scoreFunctionContainer: any;		// the 'g' element that contains the score function plots for each PrimitiveObjective in the ValueChart.

	private labelWidth: number;				// The min of the labels, calculated based on maximum depth of the objective hierarchy and the amount of 
											// space that the label area occupies.

	public scoreFunctionRenderers: any;

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService) { }

	// Create the base containers and elements for the labels.
	createLabelSpace(el: any, labelData: VCLabelData[], objectiveData: PrimitiveObjective[]): void {
		// Create the root container which will hold all label related SVG elements.
		this.rootContainer = el.append('g')
			.classed('label-root-container', true)

		// Create the outline box for the label area. Append the styles here because they will not change.
		this.labelSpaceOutline = this.rootContainer.append('g')
			.classed('label-outline-container', true)
			.append('rect')
				.classed('label-outline', true)
				.style('fill', 'white')
				.style('stroke-width', 1)
				.style('stroke', 'grey');

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
	createLabels(el: any, labelContainer: any, labelData: VCLabelData[], parentName: string): void {
		// Create a new container for each element in labelData.
		var newLabelContainers: any = labelContainer.selectAll('g[parent=parentName]')
			.data(labelData)
			.enter().append('g')
				.classed('label-subcontainer', true)
				.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-container' })
				.attr('parent', parentName);	// Set the name parent objective on the 'g', or 'rootcontainer' if it has not parent objective. 

		// Append an outline rectangle for label container that was just created.
		newLabelContainers.append('rect')
			.classed('label-subcontainer-outline', true)
			.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-outline' });

		// Append a text element for each label container that was just created. These text elements will be the labels themselves.
		newLabelContainers.append('text')
			.classed('label-subcontainer-text', true)
			.attr('id', (d: VCLabelData) => { return 'label-' + d.objective.getName() + '-text' })
			.style('font-size', '18px');

		// Call createLabels on the children of each AbstractObjective in labelData. This is how the hierarchical structure is "parsed".
		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.subLabelData === undefined)
				return;

			this.createLabels(el, el.select('#label-' + labelDatum.objective.getName() + '-container'), labelDatum.subLabelData, labelDatum.objective.getName());
		});
	}

	// This function positions and gives widths + heights to the elements created by the createLabelSpace method.
	renderLabelSpace(labelData: VCLabelData[], viewOrientation: string, objectiveData: PrimitiveObjective[]): void {
		// Calculate the width of the labels that are going to be created based on width of the area available, and the greatest depth of the Objective Hierarchy
		this.labelWidth = this.chartDataService.calculateMinLabelWidth(labelData, this.renderConfigService.dimensionOneSize);

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
		this.renderLabels(labelSpaces, labelData, viewOrientation);

		// Render the score function plots.
		this.renderScoreFunctions(viewOrientation, this.rootContainer.select('.label-scorefunction-container'), objectiveData);

	}

	// This function recursively renders labels for an array of Objectives that have been put into labelData format. It works very similarly to createLabels.
	renderLabels(labelSpaces: any, labelData: VCLabelData[], viewOrientation: string): void {
		// Calculate the weight offsets for this level of the Objective hierarchy, NOT counting children of other Abstract objectives at the same level.
		var weightOffsets: number[] = [];
		var weightSum: number = 0;	// The weight offset for the first objective at this level is 0.
		for (var i: number = 0; i < labelData.length; i++) {
			weightOffsets[i] = weightSum;
			weightSum += labelData[i].weight;
		}

		this.renderLabelOutline(labelSpaces.select('.label-subcontainer-outline'), weightOffsets);	// Render the outlining rectangle.

		this.renderLabelText(labelSpaces.select('.label-subcontainer-text'), weightOffsets, viewOrientation)	// Render the text within the label

		// Recursively render the labels that are children of this label (ie. the labels of the objectives that are children of those objectives in labelData)
		labelData.forEach((labelDatum: VCLabelData, index: number) => {
			if (labelDatum.depthOfChildren === 0)	// This label has no child labels.
				return;
			let subLabelSpaces = this.rootContainer.selectAll('g[parent=' + labelDatum.objective.getName() + ']');	// Get all sub label containers whose parent is the current label
			
			let scaledWeightOffset: number = this.renderConfigService.dimensionTwoScale(weightOffsets[index]); // Determine the y (or x) offset for this label's children based on its weight offset.
			let labelTransform: string = this.renderConfigService.generateTransformTranslation(viewOrientation, this.labelWidth, scaledWeightOffset); // Generate the transformation.
			subLabelSpaces.attr('transform', labelTransform); // Apply the transformation to the sub label containers who are children of this label so that they inherit its position.

			this.renderLabels(subLabelSpaces, labelDatum.subLabelData, viewOrientation);	// Render the sub labels.
		});
	}

	// Render the outline of a label.
	renderLabelOutline(rectEl: any, weightOffsets: number[]): any {
		// Render the styles of the outline rectangle.
		rectEl.style('fill', 'white')
			.style('stroke-width', (d: VCLabelData) => {
				return (d.depthOfChildren === 0) ? 2 : 1;	// PrimitiveObjectives should have thicker lines
			})
			.style('stroke', (d: VCLabelData) => {
				return (d.depthOfChildren === 0) ? (<PrimitiveObjective>d.objective).getColor() : 'gray';	// PrimitiveObjective's should have their own color. Abstract Objectives should be gray.
			});

		rectEl.attr(this.renderConfigService.dimensionOne, (d: VCLabelData) => {		 // Expand the last label to fill the rest of the space.
				return (d.depthOfChildren === 0) ?
					(this.renderConfigService.dimensionOneSize - this.labelWidth) - (d.depth * this.labelWidth) 
				: 
					this.labelWidth;
			})
			.attr(this.renderConfigService.coordinateOne, 0)									// Have to set CoordinateOne to be 0, or when we re-render in a different orientation the switching of the width and height can cause an old value to be retained
			.attr(this.renderConfigService.dimensionTwo, (d: VCLabelData, i: number) => {
				return this.renderConfigService.dimensionTwoScale(d.weight);					// Determine the height (or width) as a function of the weight
			})
			.attr(this.renderConfigService.coordinateTwo, ((d: VCLabelData, i: number) => {
				return this.renderConfigService.dimensionTwoScale(weightOffsets[i]);			// Determine the y position (or x) offset from the top of the containing 'g' as function of the combined weights of the previous objectives. 
			}));																				// The first objective should have no offset from the top of the containing 'g'. This is NOT the weight offset computed for all objectives at this level.
	}

	// Render the text of a label.
	renderLabelText(textEl: any, weightOffsets: number[], viewOrientation: string): any {

		var textOffset: number = 5;
		// Determine the position of the text within the box depending on the orientation
		textEl.attr(this.renderConfigService.coordinateOne, () => {
				return (viewOrientation === 'vertical') ? 10 : (this.labelWidth / 2); 
			})
			.attr(this.renderConfigService.coordinateTwo, (d: VCLabelData, i: number) => {
				return (viewOrientation === "vertical") ?
					this.renderConfigService.dimensionTwoScale(weightOffsets[i]) + (this.renderConfigService.dimensionTwoScale(d.weight) / 2) + textOffset
					:
					this.renderConfigService.dimensionTwoScale(weightOffsets[i]) + (this.renderConfigService.dimensionTwoScale(d.weight) / 5) + textOffset;
			})
			.style('fill', 'black')
			.text((d: VCLabelData) => { return d.objective.getName() + ' (' + Math.round(d.weight * 100) + '%)' });	// Round the weight number to have 2 decimal places only.

	}

	// This function creates a score function plot for each Primitive Objective in the ValueChart using the ScoreFunctionRenderer.
	createScoreFunctions(scoreFunctionContainer: any, data: PrimitiveObjective[]): void {
		// Create a 'g' element to contain each score function plot.
		
		this.scoreFunctionRenderers = {}

		var newScoreFunctionPlots: any = scoreFunctionContainer.selectAll('.label-scorefunction')
			.data(data)
			.enter().append('g')
			.classed('label-scorefunction', true)
			.attr('id', (d: PrimitiveObjective) => { return 'label-' + d.getName() + '-scorefunction'; })

		// Use the ScoreFunctionRenderer to create each score function.
		newScoreFunctionPlots[0].forEach((scoreFunctionPlot: any) => {
			var el: any = d3.select(scoreFunctionPlot);
			var datum: PrimitiveObjective = el.data()[0];

			if (datum.getDomainType() === 'categorical' || datum.getDomainType() === 'interval')
				this.scoreFunctionRenderers[datum.getName()] = new DiscreteScoreFunctionRenderer(this.chartDataService);
			else 
				this.scoreFunctionRenderers[datum.getName()] = new ContinuousScoreFunctionRenderer(this.chartDataService);

			this.scoreFunctionRenderers[datum.getName()].createScoreFunction(el, datum);	
		});

	}
	// This function calls uses the ScoreFunctionRenderer to position and give widths + heights to the score functions created by the createScoreFunctions method.
	renderScoreFunctions(viewOrientation: string, scoreFunctionContainer: any, data: PrimitiveObjective[]): void {
		var scoreFunctionMap: ScoreFunctionMap = this.chartDataService.scoreFunctionMap;
		var width: number
		var height: number;
		var weightOffset: number = 0;
		var el: any;
		var datum: PrimitiveObjective;
		var objectiveWeight: number;
		var scoreFunction: ScoreFunction;
		var dimensionOneTransform: number;
		var dimensionTwoTransform: number;



		// Select all the score function plot containers:
		var scoreFunctionsPlots = scoreFunctionContainer.selectAll('.label-scorefunction');

		scoreFunctionsPlots[0].forEach((scoreFunctionPlot: any) => {
			el = d3.select(scoreFunctionPlot);																// Convert the element into a d3 selection.
			datum = el.data()[0];																			// Get the data for this score function from the selection
			objectiveWeight = this.chartDataService.weightMap.getNormalizedObjectiveWeight(datum.getName());
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

			weightOffset += objectiveWeight;
		});
	}
}