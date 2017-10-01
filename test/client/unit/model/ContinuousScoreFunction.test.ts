/*
* @Author: aaronpmishkin
* @Date:   2016-05-30 16:33:37
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:52
*/

import { ContinuousScoreFunction } 		from '../../../../client/src/model';


import { expect }						from 'chai';




describe('ContinuousScoreFunction', () => {
	
	var roundingError: number;
	var continuousScoreFunction: ContinuousScoreFunction;

	
	before(function() {
		roundingError = 0.0001;
		
		continuousScoreFunction = new ContinuousScoreFunction(0, 10);

		continuousScoreFunction.setElementScore(0, 0);
		continuousScoreFunction.setElementScore(10, 10);
		continuousScoreFunction.setElementScore(100, 33);
		continuousScoreFunction.setElementScore(111, 8);
	});

	describe('linearInterpolation(start: { element: number, score: number }, end: { element: number, score: number }, elementToInterpolate: number)', () => {
		
		context('when the interpolation uses a positive linear function', () => {
			it('should correctly interpolate the score value for elements in the domain', () => {
				expect(ContinuousScoreFunction.linearInterpolation({ element: 0, score: 0 }, { element: 10, score: 10 }, 5)).to.be.closeTo(5, roundingError); // Linear function with slope 1, offset 0 yields 5
				expect(ContinuousScoreFunction.linearInterpolation({ element: 0, score: 0 }, { element: 10, score: 10 }, 9)).to.be.closeTo(9, roundingError); // Linear function with slope 1, offset 0 yields 9
				expect(ContinuousScoreFunction.linearInterpolation({ element: 10, score: 10 }, { element: 100, score: 33 }, 61)).to.be.closeTo(23.03333, roundingError); // this value comes from manually calculating the interpolation: (23/90) * 61 + (33 - (23/90) * 100)
			});
		});

		context('when the interpolation uses a negative linear function', () => {
			it('should correctly interpolate the score value for elements in the domain', () => {
				expect(ContinuousScoreFunction.linearInterpolation({ element: 100, score: 33 }, { element: 111, score: 8 }, 107)).to.be.closeTo(17.09091, roundingError); // this value comes from manually calculating the interpolation: (-25/11) * 107 + (8 - (-25/11) * 111)
				expect(ContinuousScoreFunction.linearInterpolation({ element: 10, score: 50 }, { element: 25, score: 0 }, 20)).to.be.closeTo(16.6667, roundingError); // this value comes from manually calculating the interpolation: (-50/15) * 20 + (0 - (-50/15) * 25)
			});
		});

		context('when the interpolation uses a flat linear function', () => {
			it('should correctly interpolate the score value for elements in the domain', () => {
				expect(ContinuousScoreFunction.linearInterpolation({ element: 0, score: 10 }, { element: 50, score: 10 }, 44)).to.be.closeTo(10, roundingError); // this value comes from manually calculating the interpolation: (0) * 10 + (10 - (0) * 44)
			});
		});
	});

	describe('getScore(domainValue: number)', () => {

		context('when the domain value is in the map of elements to scores', () => {
			it('should return score value that was directly mapped', () => {
				expect(continuousScoreFunction.getScore(0)).to.equal(0);
				expect(continuousScoreFunction.getScore(10)).to.equal(10);
				expect(continuousScoreFunction.getScore(100)).to.equal(33);
			});
		});

		context('when the domain value is not in map of elements to scores and a linear interopolation is used', () => {

			it('should correctly interpolate the score using a linear function defined between the closest mapped domain values on either side', () => {
				expect(continuousScoreFunction.getScore(5)).to.be.closeTo(5, roundingError);
				expect(continuousScoreFunction.getScore(9)).to.be.closeTo(9, roundingError);
				expect(continuousScoreFunction.getScore(61)).to.be.closeTo(23.03333, roundingError); // this value comes from manually calculating the interpolation: (23/90) * 61 + (33 - (23/90) * 100)
				expect(continuousScoreFunction.getScore(107)).to.be.closeTo(17.09091, roundingError); // this value comes from manually calculating the interpolation: (-25/11) * 107 + (8 - (-25/11) * 111)
			});
		});
	});
});