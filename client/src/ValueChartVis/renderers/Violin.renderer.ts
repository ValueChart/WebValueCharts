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

// Import Model Classes:
import { User }														from '../../model';

// Import Types:
import { ChartOrientation }											from '../../types';


@Injectable()
export class ViolinRenderer {

	// ========================================================================================
	//                                     Fields
	// ========================================================================================

	private bandwidth: number = 0.08;
	private resolution: number = 25;
	private markerRadius: number = 3;

	public lastRendererUpdate: any;                     

	// Saved Selections:

	public plot: d3.Selection<any, any, any, any>;
	public plotOutlineContainer: d3.Selection<any, any, any, any>;
	public plotOutline: d3.Selection<any, any, any, any>;

	public plotAxesContainer: d3.Selection<any, any, any, any>;
	public weightAxisContainer: d3.Selection<any, any, any, any>;
	public densityAxisContainer: d3.Selection<any, any, any, any>;

	public plotElementsContainer: d3.Selection<any, any, any, any>;
	public upperDensityLine: d3.Selection<any, any, any, any>;
	public lowerDensityLine: d3.Selection<any, any, any, any>;
	public medianMarker: d3.Selection<any, any, any, any>;
	public quartileRect: d3.Selection<any, any, any, any>;

	public userPoints: d3.Selection<any, any, any, any>;

	private densityScale: d3.ScaleLinear<number, number>;
	private weightScale: d3.ScaleLinear<number, number>;

	public static defs = {
		PLOT: 'violin-plot-container',
		PLOT_ELEMENTS_CONTAINER: 'violin-plot-elements-container',

		PLOT_DENSITY_LINE: 'violin-density-line',
		MEDIAN_MARKER: 'violin-median-marker',
		QUARTILE_RECT: 'violin-quartile-rect',
		USER_POINT: 'violin-user-point',

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

		if (update.structuralUpdate) {
			this.createUserPoints(update);
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

		this.upperDensityLine = this.plotElementsContainer.append("path")
			.classed(ViolinRenderer.defs.PLOT_DENSITY_LINE, true);

		this.lowerDensityLine = this.plotElementsContainer.append("path")
			.classed(ViolinRenderer.defs.PLOT_DENSITY_LINE, true);

		this.quartileRect = this.plotElementsContainer.append('rect')
			.classed(ViolinRenderer.defs.QUARTILE_RECT, true);

		this.medianMarker = this.plotElementsContainer.append('circle')
			.classed(ViolinRenderer.defs.MEDIAN_MARKER, true);

		this.createUserPoints(u)
	}

	private createUserPoints(u: any): void {
		var updateUserPoints = this.plotElementsContainer.selectAll('.' + ViolinRenderer.defs.USER_POINT)
			.data(u.users);

		// Update cells to conform to the data.
		updateUserPoints.exit().remove();
		updateUserPoints.enter().append('circle')
			.classed(ViolinRenderer.defs.USER_POINT, true);

		this.userPoints = this.plotElementsContainer.selectAll('.' + ViolinRenderer.defs.USER_POINT);
	}


	renderViolinPlot(u: any) {

		this.plotElementsContainer.attr('transform', 'translate(' + ((u.viewOrientation === ChartOrientation.Vertical) ? ((u.rendererConfig.dependentAxisCoordinateOne + 4) + ',' + (u.rendererConfig.dependentAxisCoordinateTwo - .5) + ')') : ((u.rendererConfig.independentAxisCoordinateTwo - .5) + ', ' + (u.rendererConfig.dependentAxisCoordinateOne + 4) + ')')));

		this.plotOutline.attr(u.rendererConfig.dimensionOne, u.rendererConfig.dimensionOneSize)
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.dimensionTwoSize);

		// Create the new Scale for use creating the weight axis.
		this.weightScale = d3.scaleLinear()
			.domain([0, 1]);

		// Create the new Scale for use creating the density axis.
		this.densityScale = d3.scaleLinear()
			.domain([-7.5, 7.5]);

		var weightScaleWidth: number = u.rendererConfig.independentAxisCoordinateOne - u.rendererConfig.dependentAxisCoordinateOne;
		var densityScaleHeight: number = (u.viewOrientation === ChartOrientation.Vertical) ? (u.rendererConfig.independentAxisCoordinateTwo - u.rendererConfig.dependentAxisCoordinateTwo) : (u.rendererConfig.dependentAxisCoordinateTwo - u.rendererConfig.independentAxisCoordinateTwo);

		let density = this.kernelDensityEstimator(this.kernelEpanechnikov(this.bandwidth), this.weightScale.ticks(this.resolution))(u.weights);
		density.splice(0,0,[0,0]);
		var line: d3.Line<any>;
		var mirrorLine: d3.Line<any>;
		
		// The range of the scale must be inverted for the vertical axis because pixels coordinates set y to increase downwards, rather than upwards as normal.
		if (u.viewOrientation === ChartOrientation.Vertical) {
			this.weightScale.range([0, weightScaleWidth]);
			this.densityScale.range([densityScaleHeight, 0]);
			line = d3.line()
				.curve(d3.curveBasis)
				.x((d) => { return this.weightScale(d[0]); })
				.y((d) => { return this.densityScale(d[1]); });

		    mirrorLine = d3.line()
				.curve(d3.curveBasis)
				.x((d) => { return this.weightScale(d[0]); })
				.y((d) => { return this.densityScale(-1 * d[1]); });

		} else {
			this.weightScale.range([0, weightScaleWidth]);
			this.densityScale.range([0, densityScaleHeight]);
			line = d3.line()
					.curve(d3.curveBasis)
					.y((d) => { return this.weightScale(d[0]); })
					.x((d) => { return this.densityScale(d[1]); });

		    mirrorLine = d3.line()
					.curve(d3.curveBasis)
					.y((d) => { return this.weightScale(d[0]); })
					.x((d) => { return this.densityScale(-1 * d[1]); });
		}

		var color: string;
		if (u.users.length === 1)
			color = u.objective.getColor();
		else
			color = 'light-grey';

		this.upperDensityLine
		      .datum(density)
		      .attr("fill", color)
		      .attr("stroke", color)
		      .attr("fill-opacity", 0.5)
		      .attr("stroke-width", 1.5)
		      .attr("stroke-linejoin", "round")
		      .attr("d",  line);

		this.lowerDensityLine
		      .datum(density)
		      .attr("fill", color)
		      .attr("stroke", color)
		      .attr("fill-opacity", 0.5)
		      .attr("stroke-width", 1.5)
		      .attr("stroke-linejoin", "round")
		      .attr("d",  mirrorLine);


		this.quartileRect
			.attr('fill', 'grey')
			.attr('fill-opacity', 0.4)
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.attr(u.rendererConfig.dimensionOne, this.weightScale(u.thirdQuartile - u.firstQuartile))
			.attr(u.rendererConfig.dimensionTwo, Math.max((u.viewOrientation === ChartOrientation.Vertical) ? this.densityScale(4.5) : this.densityScale(-4.5), 0))
			.attr(u.rendererConfig.coordinateOne, this.weightScale(u.firstQuartile))
			.attr(u.rendererConfig.coordinateTwo, (u.viewOrientation === ChartOrientation.Vertical) ? this.densityScale(1.5) : this.densityScale(-1.5));

		this.medianMarker
			.attr('fill', 'white')
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.attr('r', this.markerRadius * 2)
			.attr('c' + u.rendererConfig.coordinateOne, this.weightScale(u.medianWeight))
			.attr('c' + u.rendererConfig.coordinateTwo, this.densityScale(0));

		this.renderUserPoints(u);
		this.renderWeightAxis(u);
		this.renderDensityAxis(u);
	}

	private renderUserPoints(u: any): void {
		this.userPoints
			.attr('r', this.markerRadius)
			.attr('c' + u.rendererConfig.coordinateOne, (d: User, i: number) => { return this.weightScale(d.getWeightMap().getObjectiveWeight(u.objective.getId())); })
			.attr('c' + u.rendererConfig.coordinateTwo, this.densityScale(0))
			.attr('fill', (d: User, i: number) => { return d.color })
			.attr('stroke', (d: User, i: number) => { return d.color })
			.attr('stroke-width', 1);
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

		if (u.viewOrientation === ChartOrientation.Vertical)
			weightAxis.ticks(4);
		else
			weightAxis.ticks(1);

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

		densityAxis.ticks(0);

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