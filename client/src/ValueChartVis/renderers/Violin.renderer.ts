/*
* @Author: aaronpmishkin
* @Date:   2017-07-24 10:36:47
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-24 10:36:47
*/

// Import Angular Classes:
import { Injectable }                                                from '@angular/core';

// Import Libraries:
import * as d3                                                       from 'd3';
import * as _                                                        from 'lodash';


// Import Types:
import { ChartOrientation }											from '../../types';


@Injectable()
export class ViolinRenderer {

	// ========================================================================================
	//                                     Fields
	// ========================================================================================

	public lastRendererUpdate: any;                     


	// Saved Selections:

	public plot: d3.Selection<any, any, any, any>;
	public plotOutlineContainer: d3.Selection<any, any, any, any>;
	public plotOutline: d3.Selection<any, any, any, any>;

	public plotAxesContainer: d3.Selection<any, any, any, any>;
	public weightAxisContainer: d3.Selection<any, any, any, any>;
	public densityAxisContainer: d3.Selection<any, any, any, any>;

	public plotElementsContainer: d3.Selection<any, any, any, any>;

	private densityScale: d3.ScaleLinear<number, number>;
	private weightScale: d3.ScaleLinear<number, number>;

	public static defs = {
		PLOT: 'violin-plot-container',
		PLOT_ELEMENTS_CONTAINER: 'violin-plot-elements-container',

		OUTLINE_CONTAINER: 'violin-outline-container',
		PLOT_OUTLINE: 'violin-plot-outline',

		AXES_CONTAINER: 'violin-axes-container',
		WEIGHT_AXIS_CONTAINER: 'violin-weight-axis',
		DENSITY_AXIS_CONTAINER: 'violin-density-axis',
	};

	// ========================================================================================
	//                                     Constructor
	// ========================================================================================


	/*
		@returns {void}
		@description     Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this directive when it is used.
	*/
	constructor() {}


	// ========================================================================================
	//                                     Methods
	// ========================================================================================

	public weightsPlotChanged = (update: any) => {
		
		if (this.plot === undefined) {
			this.createViolin(update);
		}


		this.renderViolinPlot(update);
	}

	private createViolin(u: any) {

		this.plot = u.el.append('g')
			.classed(ViolinRenderer.defs.PLOT, true)
			.attr('id', 'violin-' + u.objectiveId + '-plot');

		this.plotOutlineContainer = this.plot.append('g')
			.classed(ViolinRenderer.defs.OUTLINE_CONTAINER, true)
			.attr('id', 'violin-' + u.objectiveId + '-outline-container');

		this.plotOutline = this.plotOutlineContainer.append('rect')
			.classed(ViolinRenderer.defs.PLOT_OUTLINE, true)
			.classed('valuechart-outline', true)
			.attr('id', 'violin-' + u.objectiveId + '-outline');

		this.plotAxesContainer = this.plot.append('g')
			.classed(ViolinRenderer.defs.AXES_CONTAINER, true)
			.attr('id', 'violin-' + u.objectiveId + '-axes-container');

		this.weightAxisContainer = this.plotAxesContainer.append('g')
			.classed(ViolinRenderer.defs.WEIGHT_AXIS_CONTAINER, true)
			.attr('id', 'violin-' + u.objectiveId + '-weight-axis-container');

		this.densityAxisContainer = this.plotAxesContainer.append('g')
			.classed(ViolinRenderer.defs.DENSITY_AXIS_CONTAINER, true)
			.attr('id', 'violin-' + u.objectiveId + '-density-axis-container');

		this.plotElementsContainer = this.plot.append('g')
			.classed(ViolinRenderer.defs.PLOT_ELEMENTS_CONTAINER, true)
			.attr('id', 'violin-' + u.objectiveId + '-elements-container');


		this.createPlot(u);
	}

	private createPlot(u: any): void {

		this.createViolinPlotElements(u);
	}


	private createViolinPlotElements(u: any) {

	}

	renderViolinPlot(u: any) {

		this.plotOutline.attr(u.rendererConfig.dimensionOne, u.rendererConfig.dimensionOneSize)
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.dimensionTwoSize);

		// Create the new Scale for use creating the weight axis.
		this.weightScale = d3.scaleLinear()
			.domain([0, u.maxWeight]);

		// Create the new Scale for use creating the density axis.
		this.densityScale = d3.scaleLinear()
			.domain([-1, 1])		// Note sure what the density maximum is...

		var weightScaleWidth: number = u.rendererConfig.independentAxisCoordinateOne - u.rendererConfig.dependentAxisCoordinateOne;
		var densityScaleHeight: number = (u.viewOrientation === ChartOrientation.Vertical) ? (u.rendererConfig.independentAxisCoordinateTwo - u.rendererConfig.dependentAxisCoordinateTwo) : (u.rendererConfig.dependentAxisCoordinateTwo - u.rendererConfig.independentAxisCoordinateTwo);

		// The range of the scale must be inverted for the vertical axis because pixels coordinates set y to increase downwards, rather than upwards as normal.
		if (u.viewOrientation === ChartOrientation.Vertical) {
			this.weightScale.range([weightScaleWidth, 0]);
			this.densityScale.range([densityScaleHeight, 0]);
		} else {
			this.weightScale.range([0, weightScaleWidth]);
			this.densityScale.range([0, densityScaleHeight]);
		}

		let density = this.kernelDensityEstimator(this.kernelEpanechnikov(7), this.weightScale.ticks(40))(u.weights);

		console.log(density, u.weights);

		this.plotElementsContainer.append("path")
		      .datum(density)
		      .attr("fill", "none")
		      .attr("stroke", "#000")
		      .attr("stroke-width", 1.5)
		      .attr("stroke-linejoin", "round")
		      .attr("d",  d3.line()
		          .curve(d3.curveBasis)
		          .x((d) => { return this.weightScale(d[0]); })
		          .y((d) => { return this.densityScale(d[1]); }));

		this.plotElementsContainer.append("path")
		      .datum(density)
		      .attr('transform', 'scale(1, -1)')
		      .attr("fill", "none")
		      .attr("stroke", "#000")
		      .attr("stroke-width", 1.5)
		      .attr("stroke-linejoin", "round")
		      .attr("d",  d3.line()
		          .curve(d3.curveBasis)
		          .x((d) => { return this.weightScale(d[0]); })
		          .y((d) => { return this.densityScale(d[1]); }));


		this.renderWeightAxis(u);
		this.renderDensityAxis(u);
	}


	private renderWeightAxis(u: any): void {
		// Delete the elements of the previous axes.
		var elements: any = this.weightAxisContainer.node().children;
		for (var i = 0; i < elements.length; i++) {
			elements[i].remove();
		}

		var weightAxis: any;

		// The range of the scale must be inverted for the vertical axis because pixels coordinates set y to increase downwards, rather than upwards as normal.
		if (u.viewOrientation === ChartOrientation.Vertical) {
			weightAxis = d3.axisBottom(this.weightScale);
		} else {
			weightAxis = d3.axisLeft(this.weightScale);
		}

		weightAxis.ticks(4);

		// Position the axis by positioning the axis container and then create it.
		this.weightAxisContainer
			.attr('transform', () => {
				return 'translate(' + ((u.viewOrientation === ChartOrientation.Vertical) ? ((u.rendererConfig.dependentAxisCoordinateOne + 4) + ',' + (u.rendererConfig.independentAxisCoordinateTwo - .5) + ')') : ((u.rendererConfig.independentAxisCoordinateTwo - .5) + ', ' + (u.rendererConfig.dependentAxisCoordinateOne + 4) + ')'));
			})
			.call(weightAxis);		
	}


	private renderDensityAxis(u: any): void {
		// Delete the elements of the previous axes.
		var elements: any = this.densityAxisContainer.node().children;
		for (var i = 0; i < elements.length; i++) {
			elements[i].remove();
		}

		var densityAxis: any;

		// The range of the scale must be inverted for the vertical axis because pixels coordinates set y to increase downwards, rather than upwards as normal.
		if (u.viewOrientation === ChartOrientation.Vertical) {
			densityAxis = d3.axisLeft(this.densityScale);
		} else {
			densityAxis = d3.axisTop(this.densityScale);
		}

		densityAxis.ticks(4);

		// Position the axis by positioning the axis container and then create it.
		this.densityAxisContainer
			.attr('transform', () => {
				return 'translate(' + ((u.viewOrientation === ChartOrientation.Vertical) ? ((u.rendererConfig.dependentAxisCoordinateOne + 4) + ',' + (u.rendererConfig.dependentAxisCoordinateTwo - .5) + ')') : ((u.rendererConfig.independentAxisCoordinateTwo - .5) + ', ' + (u.rendererConfig.dependentAxisCoordinateOne + 4) + ')'));
			})
			.call(densityAxis);
	}


	kernelDensityEstimator = (kernel: Function, X: number[]) => {
	  return function(V: number[]) {
	    return X.map(function(x: number) {
	      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
	    });
	  };
	}

	kernelEpanechnikov = (k: number) => {
	  return function(v: number) {
	    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
	  };
	}

}