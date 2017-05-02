/*
* @Author: aaronpmishkin
* @Date:   2016-06-01 11:59:55
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 12:15:51
*/

import { IntervalDomain } 		from '../../client/resources/model/IntervalDomain';

import { expect }				from 'chai';



describe('IntervalDomain', () => {
	var intervalDomain: IntervalDomain;

	describe('constructor(min: number, max:number, interval: number)', () => {
		
		context('when the constructor is used', () => {
			it('should define the min value, max value, and interval of the IntervalDomain object', () => {
				intervalDomain = new IntervalDomain(0, 10, 1);

				expect(intervalDomain.getRange()).to.deep.equal([0, 10]);
				expect(intervalDomain.getInterval()).to.equal(1);
			});
		});
	});

	describe('getElements()', () => {

		context('when the interval is an integer', () => {

			before(function() {
				intervalDomain = new IntervalDomain(0, 10, 1);
			});

			it('should return an array with the min value, the max value, and all the values inbetween that are exactly separated by the interval', () => {
				expect(intervalDomain.getElements()).to.deep.equal(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
			});

		});

		context('when the interval is a floating point number', () => {

			before(function() {
				intervalDomain = new IntervalDomain(5.9, 8.65, 0.55);
			});

			it('should return an array with the min value, the max value, and all the values inbetween that are exactly separated by the interval', () => {
				expect(intervalDomain.getElements()).to.deep.equal(['5.9', '6.45', '7', '7.55', '8.1', '8.65']);
			});

		});
	});
});