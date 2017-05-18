/*
* @Author: aaronpmishkin
* @Date:   2017-05-18 10:21:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-18 13:10:35
*/

// Import Testing Resources:
import { ComponentFixture, TestBed }		from '@angular/core/testing';
import { By }              					from '@angular/platform-browser';
import { DebugElement }    					from '@angular/core';

import { expect }							from 'chai';

// Import Test Data: 
import { HotelChartData }					from '../../../testData/HotelChartData';

// Import Application Classes:
import { ChangeDetectionService }			from '../../../../client/resources/modules/ValueChart/services/ChangeDetection.service';
import { ChartUndoRedoService }				from '../../../../client/resources/modules/ValueChart/services/ChartUndoRedo.service';
import { WebValueChartsParser }				from '../../../../client/resources/modules/utilities/classes/WebValueChartsParser';

// Import Model Classes
import { ValueChart }						from '../../../../client/resources/model/ValueChart';


var undoRedoServiceStub = {
	undoRedoDispatcher: { on: (a: string, b: any) => { return; } }
}


describe('ChangeDetectionService', () => {

	var hotelChart: ValueChart;
	var parser: WebValueChartsParser;
	var changeDetectionService: ChangeDetectionService

	beforeEach(function() {
		TestBed.configureTestingModule({
			providers: [ ChangeDetectionService, { provide: ChartUndoRedoService, useValue: undoRedoServiceStub } ]
		});

		changeDetectionService = TestBed.get(ChangeDetectionService);

		parser = new WebValueChartsParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		console.log(valueChartDocument);
		hotelChart = parser.parseValueChart(valueChartDocument);

		console.log(hotelChart, changeDetectionService);
	});


	it('should be defined', () => {
		expect(changeDetectionService).to.not.be.undefined;
	});


});