/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 09:37:49
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:13:24
*/


import { ContinuousDomain } 	from "../../../../client/resources/model/ContinuousDomain";

import { expect }				from 'chai';




describe('ContinuousDomain', () => {
	var continuousDomain: ContinuousDomain;

	before(function() {
	
	});

	describe('#constructor(minValue: number, maxValue: number)', () => {

		context('when the constructor is used', () => {
			it('should have minValue, maxValue, and type defined', () => {
				continuousDomain = new ContinuousDomain(0, 10);
				
				expect(continuousDomain.getMinValue()).to.equal(0);
				expect(continuousDomain.getMaxValue()).to.equal(10);
				expect(continuousDomain).to.have.property('type','continuous');
			});
		});
	});

	describe('#setRange(minValue: number, maxValue: number)', () => {

		it('should set both the min and max value', () => {
			continuousDomain.setRange(-20, 20);
			expect(continuousDomain.getMinValue()).to.equal(-20);
			expect(continuousDomain.getMaxValue()).to.equal(20);
		});
	});

	describe('#getRange()', () => {

		it('should return the minValue as the first array element, and the max value as the second', () => {
			var range: number[] = continuousDomain.getRange();

			expect(range).to.have.length(2);
			expect(range[0]).to.equal(-20);
			expect(range[1]).to.equal(20);
		});
	});
});