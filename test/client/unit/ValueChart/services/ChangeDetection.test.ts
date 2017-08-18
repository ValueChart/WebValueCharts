/*
* @Author: aaronpmishkin
* @Date:   2017-05-18 10:21:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:53
*/

// Import Testing Resources:
import { ComponentFixture, TestBed }		from '@angular/core/testing';
import { By }              					from '@angular/platform-browser';
import { DebugElement }    					from '@angular/core';

import { expect }							from 'chai';

// Import Test Data: 
import { HotelChartData }					from '../../../../testData/HotelChartData';

// Import Application Classes:
import { ChangeDetectionService }			from '../../../../../client/resources/modules/ValueChart/services/ChangeDetection.service';
import { XmlValueChartParser }				from '../../../../../client/resources/modules/utilities/classes/XmlValueChart.parser';

// Import Model Classes
import { ValueChart }						from '../../../../../client/resources/model/ValueChart';
import { User }								from '../../../../../client/resources/model/User';
import { AbstractObjective }				from '../../../../../client/resources/model/AbstractObjective';

// Import Types
import { ViewConfig, InteractionConfig }	from '../../../../../client/resources/types/Config.types';
import { ChartOrientation, WeightResizeType, SortAlternativesType, PumpType }	from '../../../../../client/resources/types/Config.types';

describe('ChangeDetectionService', () => {

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
	var changeDetectionService: ChangeDetectionService;
	var width: number, height: number, interactionConfig: InteractionConfig, viewConfig: ViewConfig;
	var usersToDisplay: User[];

	beforeEach(function() {
		TestBed.configureTestingModule({
			providers: [ ChangeDetectionService ]
		});

		changeDetectionService = TestBed.get(ChangeDetectionService);

		parser = new XmlValueChartParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		usersToDisplay = hotelChart.getUsers();

		viewConfig = {
    scaleAlternatives: false,
			viewOrientation: ChartOrientation.Vertical,
			displayScoreFunctions: false,
			displayTotalScores: false,
			displayScales: false,
			displayDomainValues: false,
			displayScoreFunctionValueLabels: false,
			displayAverageScoreLines: false
		};

		interactionConfig = {
			weightResizeType: WeightResizeType.None,
			reorderObjectives: false,
			sortAlternatives: SortAlternativesType.None,
			pumpWeights: PumpType.None,
			setObjectiveColors: false,
			adjustScoreFunctions: false
		};

		height = 10;
		width = 10;

		changeDetectionService.startChangeDetection(hotelChart, width, height, viewConfig, interactionConfig, usersToDisplay);
	});


	describe('startChangeDetection(valueChart: ValueChart, width: number, height: number, viewConfig: ViewConfig, interactionConfig: InteractionConfig): void', () => {

		it('should initialize exact copies of the inputs with different memory references', () => {
			// The fields of the record objects should be exactly the same as the input objects.
			expect(changeDetectionService.valueChartRecord).to.deep.equal(hotelChart);
			expect(changeDetectionService.widthRecord).to.deep.equal(width);
			expect(changeDetectionService.widthRecord).to.deep.equal(height);
			expect(changeDetectionService.viewConfigRecord).to.deep.equal(viewConfig);
			expect(changeDetectionService.interactionConfigRecord).to.deep.equal(interactionConfig);

			// There references of the record objects should be different from the input objects.
			expect(changeDetectionService.valueChartRecord).to.not.equal(hotelChart);
			expect(changeDetectionService.viewConfigRecord).to.not.equal(viewConfig);
			expect(changeDetectionService.interactionConfigRecord).to.not.equal(interactionConfig);
		});
	});

	describe('detectStructuralChanges(valueChart: ValueChart, usersToDisplay: user[]): boolean', () => {

		context('when the input values are not different from the saved records', () => {
			it('should detect no changes', () => {
				expect(changeDetectionService.detectStructuralChanges(hotelChart, usersToDisplay)).to.be.false;
			});	
		});

		context('when the ValueChart is modified from the saved records', () => {
			it('should detect that the ValueChart is different when a small, deep change is made', () => {
				hotelChart.getAllPrimitiveObjectives()[0].setDescription('A new description');

				expect(changeDetectionService.detectStructuralChanges(hotelChart, usersToDisplay)).to.be.true;
			});

			it('should create an updated record of the ValueChart', () => {
				hotelChart.getAllPrimitiveObjectives()[0].setDescription('A new description');

				changeDetectionService.detectStructuralChanges(hotelChart, usersToDisplay);				

				expect(changeDetectionService.valueChartRecord).to.be.deep.equal(hotelChart);
				expect(changeDetectionService.valueChartRecord).to.not.equal(hotelChart);
			});

			it('should detect that the ValueChart is different when a new user is added', () => {
				var bill = new User('Bill');
				hotelChart.setUser(bill);

				expect(changeDetectionService.detectStructuralChanges(hotelChart, usersToDisplay)).to.be.true;
			});
		});

		context('when the alternative/objective orders are changed', () => {
			it('should detect the change in alternative order', () => {
				var alternatives = hotelChart.getAlternatives();
				var temp = alternatives[0];
				alternatives[0] = alternatives[2];
				alternatives[2] = temp;

				expect(changeDetectionService.detectStructuralChanges(hotelChart, usersToDisplay)).to.be.true;
			});	


			it('should detect the change in objective order', () => {
				var rootObjective = <AbstractObjective> hotelChart.getRootObjectives()[0];

				var children = rootObjective.getAllSubObjectives();
				var temp = children[0];
				children[0] = children[1];
				children[1] = temp;

				rootObjective.setDirectSubObjectives(children);
				hotelChart.setRootObjectives([rootObjective]);

				expect(changeDetectionService.detectStructuralChanges(hotelChart, usersToDisplay)).to.be.true;
			});
		});
	});

	describe('detectChanges(valueChart: ValueChart, viewConfig: ViewConfig, interactionConfig: InteractionConfig, renderRequired: boolean): boolean', () => {
		
		it('should detect that the ValueChart is different when a user\'s WeightMap is changed', () => {
			var bill = new User('Bill');
			hotelChart.setUser(bill);

			var area = hotelChart.getAllPrimitiveObjectives()[0].getName();
			expect(hotelChart.getUsers()[0].getWeightMap().getObjectiveWeight(area)).to.equal(0.2);
			hotelChart.getUsers()[0].getWeightMap().setObjectiveWeight(area, 0.3);
			expect(changeDetectionService.detectChanges(hotelChart, viewConfig, interactionConfig, false)).to.be.true;
		});

		it('should return true when the "renderRequired" parameter is true', () => {
			expect(changeDetectionService.detectChanges(hotelChart, viewConfig, interactionConfig, false)).to.be.false;
			expect(changeDetectionService.detectChanges(hotelChart, viewConfig, interactionConfig, true)).to.be.true;
		});

		context('when the view orientation and or score function display settings have been changed', () => {
			it('should detect the changes in view orientation', () => {
				viewConfig.viewOrientation = ChartOrientation.Horizontal;
				expect(changeDetectionService.detectChanges(hotelChart, viewConfig, interactionConfig, false)).to.be.true;
			});

			it('should detect the changes in score function display', () => {
				viewConfig.displayScoreFunctions = true;
				expect(changeDetectionService.detectChanges(hotelChart, viewConfig, interactionConfig, false)).to.be.true;
			});		
		});
	});

	describe('detectWidthHeightChanges(width: number, height: number): boolean', () => {
		it('should detect that the height/width are different when they are modified from the recorded values', () => {
			height = 20;
			expect(changeDetectionService.detectWidthHeightChanges(width, height)).to.be.true;
			width = 45;
			expect(changeDetectionService.detectWidthHeightChanges(width, height)).to.be.true;
		});

		it('should create an updated record of the width and height after detecting changes', () => {
			height = 20;
			width = 45;

			expect(changeDetectionService.widthRecord).to.not.equal(width);
			expect(changeDetectionService.heightRecord).to.not.equal(height);

			expect(changeDetectionService.detectWidthHeightChanges(width, height)).to.be.true;

			expect(changeDetectionService.widthRecord).to.equal(width);
			expect(changeDetectionService.heightRecord).to.equal(height);
		});

		it('should not detect changes to the height and width when they are the same as the recorded values', () => {
			width = 10;
			expect(changeDetectionService.detectWidthHeightChanges(width, height)).to.be.false;
		});
	});

	describe('detectViewConfigChanges(viewConfig: ViewConfig): boolean', () => {
		it('should detect that the viewConfig is different when it is modified from the recorded value', () => {
			viewConfig.displayScales = true;
			viewConfig.displayAverageScoreLines = true;
			expect(changeDetectionService.detectViewConfigChanges(viewConfig)).to.be.true;
			
			viewConfig.viewOrientation = ChartOrientation.Horizontal;
			expect(changeDetectionService.detectViewConfigChanges(viewConfig)).to.be.true;
		});

		it('should create an updated record of the viewConfig after detecting changes', () => {
			viewConfig.displayScales = true;
			viewConfig.displayAverageScoreLines = true;
			viewConfig.viewOrientation = ChartOrientation.Vertical

			expect(changeDetectionService.viewConfigRecord).to.not.deep.equal(viewConfig);

			changeDetectionService.detectViewConfigChanges(viewConfig);

			expect(changeDetectionService.viewConfigRecord).to.deep.equal(viewConfig);
			expect(changeDetectionService.viewConfigRecord).to.not.equal(viewConfig);
		});

		it('should not detect changes to the viewConfig when it is the same as the recorded value', () => {
			expect(changeDetectionService.detectViewConfigChanges(viewConfig)).to.be.false;
		});
	});

	describe('detectInteractionConfigChanges(interactionConfig: InteractionConfig): boolean', () => {
		it('should detect that the interactionConfig is different when it is modified from the recorded values', () => {
			interactionConfig.pumpWeights = PumpType.Increase
			expect(changeDetectionService.detectInteractionConfigChanges(interactionConfig)).to.be.true;
			interactionConfig.reorderObjectives = true;
			interactionConfig.weightResizeType = WeightResizeType.Neighbors
			expect(changeDetectionService.detectInteractionConfigChanges(interactionConfig)).to.be.true;
		});

		it('should create an updated record of the interactionConfig after detecting changes', () => {
			interactionConfig.pumpWeights = PumpType.Increase
			interactionConfig.reorderObjectives = true;
			interactionConfig.weightResizeType = WeightResizeType.Neighbors

			expect(changeDetectionService.interactionConfigRecord).to.not.deep.equal(interactionConfig);

			changeDetectionService.detectInteractionConfigChanges(interactionConfig)

			expect(changeDetectionService.interactionConfigRecord).to.deep.equal(interactionConfig);
			expect(changeDetectionService.interactionConfigRecord).to.not.equal(interactionConfig);
		});

		it('should not detect changes when the interactionConfig is the same as the recorded value', () => {
			interactionConfig.weightResizeType = WeightResizeType.None;
			expect(changeDetectionService.detectInteractionConfigChanges(interactionConfig)).to.be.false;
		});
	});

	after(function() {
		TestBed.resetTestingModule();
	});



});