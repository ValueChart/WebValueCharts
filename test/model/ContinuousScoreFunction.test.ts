/*
* @Author: aaronpmishkin
* @Date:   2016-05-30 16:33:37
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-30 23:00:43
*/

import { ContinuousScoreFunction } 		from '../../app/resources/model/ContinuousScoreFunction';


declare var expect: any;


describe('ContinuousScoreFunction', () => {
	
	var roundingError: number;
	var continuousScoreFunction: ContinuousScoreFunction;

	
	before(function() {
		roundingError = 0.0001;
		continuousScoreFunction = new ContinuousScoreFunction(0, 10);
	});

	describe('getScore(domainValue: number)', () => {

		before(function() {
			continuousScoreFunction.setElementScore(0, 0);
			continuousScoreFunction.setElementScore(10, 10);
			continuousScoreFunction.setElementScore(100, 33);
			continuousScoreFunction.setElementScore(111, 8);
		});

		context('when the domain value is in the map of elements to scores', () => {
			it('should return score value that was directly mapped', () => {
				expect(continuousScoreFunction.getScore(0)).to.equal(0);
				expect(continuousScoreFunction.getScore(10)).to.equal(10);
				expect(continuousScoreFunction.getScore(100)).to.equal(33);
			});
		});

		context('when the domain value is not in map of elements to scores and a linear interopolation is used', () => {

			it('should correctly interpolate the score using a linear function defined between the closest map domain values on either side', () => {
				expect(continuousScoreFunction.getScore(5)).to.be.closeTo(5, roundingError);
				expect(continuousScoreFunction.getScore(9)).to.be.closeTo(9, roundingError);
				expect(continuousScoreFunction.getScore(61)).to.be.closeTo(23.03333, roundingError);
				expect(continuousScoreFunction.getScore(107)).to.be.closeTo(17.09091, roundingError);
			});
		});
	});
});