/*
* @Author: aaronpmishkin
* @Date:   2016-05-30 16:33:48
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:51
*/

import { DiscreteScoreFunction } 		from '../../../../client/resources/model/DiscreteScoreFunction';


import { expect }						from 'chai';




describe('DiscreteScoreFunction', () => {
	var discreteScoreFunction: DiscreteScoreFunction;
	var sunny: string;
	var raining: string;
	var cloudy: string;
	var snowing: string;

	before(function() {
		discreteScoreFunction = new DiscreteScoreFunction();

		sunny = 'sunny';
		raining = 'raining';
		cloudy = 'cloudy';
		snowing = 'snowing';
	});

	describe('#getScore()', () => {

		context('when there are no element-score pairs in the DiscreteScoreFunction', () => {
			it('should return undefined for any domain element', () => {
				expect(discreteScoreFunction.getScore(sunny)).to.be.undefined;
				expect(discreteScoreFunction.getScore(raining)).to.be.undefined;
				expect(discreteScoreFunction.getScore(snowing)).to.be.undefined;
			});
		});

		context('when there are element-score pairs in the DiscreteScoreFunction', () => {

			before(function() {
				discreteScoreFunction.setElementScore(sunny, 2);
				discreteScoreFunction.setElementScore(snowing, 1);
			});

			it('should return undefined for a domain element that is not in the DiscreteScoreFunction', () => {
				expect(discreteScoreFunction.getScore(cloudy)).to.be.undefined;
				expect(discreteScoreFunction.getScore(raining)).to.be.undefined;
			});

			it('should return a score for a domain element that is in the DiscreteScoreFunction', () => {
				expect(discreteScoreFunction.getScore(sunny)).to.equal(2);
				expect(discreteScoreFunction.getScore(snowing)).to.equal(1);
			});
		});
	});

	describe('#setElementScore(domainElement: string, score: number)', () => {


		context('when the discrete score function is "empty"', () => {

			before(function() {
				discreteScoreFunction = new DiscreteScoreFunction();
			});

			it('should insert the domain element into the map, and assign it a score at the same time', () => {
				expect(discreteScoreFunction.getScore(sunny)).to.be.undefined;
				discreteScoreFunction.setElementScore(sunny, 0.5);
				expect(discreteScoreFunction.getScore(sunny)).to.equal(0.5);
			});
		});

		context('when the discrete score function is not "empty"', () => {

			before(function() {
				discreteScoreFunction = new DiscreteScoreFunction();
				discreteScoreFunction.setElementScore(sunny, 0.5);
			});

			it('should insert the element-score pair into the map without affecting the other element-score pairs', () => {
				discreteScoreFunction.setElementScore(raining, 10);
				expect(discreteScoreFunction.getScore(sunny)).to.equal(0.5);
				expect(discreteScoreFunction.getScore(raining)).to.equal(10);
			});
		});

		context('when the domain element is already mapped to a score', () => {

			before(function() {
				discreteScoreFunction = new DiscreteScoreFunction();
				discreteScoreFunction.setElementScore(sunny, 0.5);
				discreteScoreFunction.setElementScore(raining, 10);
			});

			it('should overwrite the old score with the new one', () => {
				discreteScoreFunction.setElementScore(sunny, 3);
				expect(discreteScoreFunction.getScore(sunny)).to.equal(3);
			});
		});
	});

	describe('#removeElement(domainElement: string)', () => {

		beforeEach(function() {
			discreteScoreFunction = new DiscreteScoreFunction();
			discreteScoreFunction.setElementScore(sunny, 3);
			discreteScoreFunction.setElementScore(raining, 10);
		});

		context('when the element-score pair to remove is NOT in the DiscreteScoreFunction', () => {
			it('should not do anything', () => {
				expect(discreteScoreFunction.getScore(sunny)).to.equal(3);
				expect(discreteScoreFunction.getScore(raining)).to.equal(10);
				discreteScoreFunction.removeElement(cloudy);
				expect(discreteScoreFunction.getScore(sunny)).to.equal(3);
				expect(discreteScoreFunction.getScore(raining)).to.equal(10);
			});
		});

		context('when the element-score pair to remove is in the DiscreteScoreFunction', () => {
			it('should remove the element-score pair', () => {
				expect(discreteScoreFunction.getScore(sunny)).to.equal(3);
				expect(discreteScoreFunction.getScore(raining)).to.equal(10);
				discreteScoreFunction.removeElement(raining);
				expect(discreteScoreFunction.getScore(sunny)).to.equal(3);
				expect(discreteScoreFunction.getScore(raining)).to.be.undefined;
			});
		});
	});

});