/*
* @Author: aaronpmishkin
* @Date:   2017-05-20 12:27:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-01 14:26:45
*/

import { ComponentFixture, TestBed }					from '@angular/core/testing';
import { By }              								from '@angular/platform-browser';
import { DebugElement }    								from '@angular/core';
import { expect }										from 'chai';

// Import Application Classes:
import { RendererConfigUtility }						from '../../../../../client/resources/modules/ValueChart/utilities/RendererConfig.utility';

// Import Model Classes:
import { WeightMap }									from '../../../../../client/resources/model/WeightMap';

// Import Types:
import { ViewConfig }									from '../../../../../client/resources/types/Config.types';
import { RendererUpdate, RendererConfig }				from '../../../../../client/resources/types/RendererData.types';
import { ChartOrientation }								from '../../../../../client/resources/types/Config.types';


describe('RendererConfigUtility', () => {

	var rendererConfigUtility: RendererConfigUtility;
	var viewConfig: ViewConfig
	var width: number, height: number;
	var u: RendererUpdate;

	beforeEach(function() {
		TestBed.configureTestingModule({
			providers: [ RendererConfigUtility ]
		});

		rendererConfigUtility = TestBed.get(RendererConfigUtility);

		viewConfig = {
			viewOrientation: ChartOrientation.Vertical,
			displayScoreFunctions: false,
			displayTotalScores: false,
			displayScales: false,
			displayDomainValues: false,
			displayScoreFunctionValueLabels: false,
			displayAverageScoreLines: false
		};

		height = 10;
		width = 10;

		u = {
			viewConfig: viewConfig,
			width: width,
			height: height,
			el: null,
			valueChart: null,
			interactionConfig: null,
			renderRequired: { value: false },
			maximumWeightMap: new WeightMap(),
			rowData: null,
			labelData: null,
			rendererConfig: null
		}

		u.maximumWeightMap['weightTotal'] = 1;

	});

	describe('produceRendererConfig(u: RendererUpdate): RendererUpdate', () => {
		var rendererConfig: RendererConfig;

		context('when the viewOrientation is "vertical"', () => {

			it('should should set the first dimension to be width/x and the second dimension to be height/y', () => {
				rendererConfig = rendererConfigUtility.produceRendererConfig(u).rendererConfig;

				expect(rendererConfig.dimensionOne).to.equal('width');
				expect(rendererConfig.dimensionTwo).to.equal('height');
				expect(rendererConfig.coordinateOne).to.equal('x');
				expect(rendererConfig.coordinateTwo).to.equal('y');
				expect(rendererConfig.dimensionOneSize).to.equal(width);
				expect(rendererConfig.dimensionTwoSize).to.equal(height);
			});

			it('should should configure the "dimensionTwoScale" property correctly', () => {
				rendererConfig = rendererConfigUtility.produceRendererConfig(u).rendererConfig;

				expect(rendererConfig.dimensionTwoScale.domain()).to.deep.equal([0, 1]);
				expect(rendererConfig.dimensionTwoScale.range()).to.deep.equal([0, height]);
			});	
		});	

		context('when the viewOrientation is "horizontal"', () => {

			it('should should set the first dimension to be height/y and the second dimension to be width/x', () => {
				u.viewConfig.viewOrientation = ChartOrientation.Horizontal
				rendererConfig = rendererConfigUtility.produceRendererConfig(u).rendererConfig;

				expect(rendererConfig.dimensionOne).to.equal('height');
				expect(rendererConfig.dimensionTwo).to.equal('width');
				expect(rendererConfig.coordinateOne).to.equal('y');
				expect(rendererConfig.coordinateTwo).to.equal('x');
				expect(rendererConfig.dimensionOneSize).to.equal(height);
				expect(rendererConfig.dimensionTwoSize).to.equal(width);
			});

			it('should should configure the "dimensionTwoScale" property correctly', () => {
				u.viewConfig.viewOrientation = ChartOrientation.Horizontal
				rendererConfig = rendererConfigUtility.produceRendererConfig(u).rendererConfig;
				
				expect(rendererConfig.dimensionTwoScale.domain()).to.deep.equal([0, 1]);
				expect(rendererConfig.dimensionTwoScale.range()).to.deep.equal([0, width]);
			});	
		});	
	});	

});