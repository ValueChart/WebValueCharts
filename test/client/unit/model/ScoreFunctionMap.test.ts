/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:14:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:48
*/

import { ScoreFunctionMap } 			from '../../../../client/src/model';
import { ScoreFunction } 				from '../../../../client/src/model';
import { PrimitiveObjective } 			from '../../../../client/src/model';
import { DiscreteScoreFunction } 		from '../../../../client/src/model';
import { ContinuousScoreFunction } 		from '../../../../client/src/model';
	
import { expect }						from 'chai';


describe('ScoreFunctionMap', () => {
	var scoreFunctionMap: ScoreFunctionMap;

	var weather: PrimitiveObjective;
	var distance: PrimitiveObjective;
	var elevation: PrimitiveObjective;

	var continuousScoreFunction: ContinuousScoreFunction;
	var discreteScoreFunction: DiscreteScoreFunction;

	before(function() {
		scoreFunctionMap = new ScoreFunctionMap();

		weather = new PrimitiveObjective('Weather', 'A description goes here');
		distance = new PrimitiveObjective('Distance', 'A description goes here');
		elevation = new PrimitiveObjective('Elevation', 'A description goes here');

		continuousScoreFunction = new ContinuousScoreFunction(0, 10);
		discreteScoreFunction = new DiscreteScoreFunction();
	});

	describe('#getObjectiveScoreFunction', () => {

		context('when there are no Objective-ScoreFunction pairs in the ScoreFunctionMap', () => {
			it('should return undefined for any Objective', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.be.undefined;
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance.getId())).to.be.undefined;
			});
		});

		context('when there are Objective-ScoreFunction pairs in the ScoreFunctionMap', () => {

			before(function() {
				scoreFunctionMap.setObjectiveScoreFunction(weather.getId(), discreteScoreFunction);
				scoreFunctionMap.setObjectiveScoreFunction(distance.getId(), continuousScoreFunction);
			});

			it('should return undefined for an Objective that is not in the ScoreFunctionMap', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(elevation.getId())).to.be.undefined;
			});

			it('should return a ScoreFunction for an Objective that is in the ScoreFunctionMap', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance.getId())).to.deep.equal(continuousScoreFunction);
			});
		});
	});

	describe('#setObjectiveScoreFunction(objective: PrimitiveObjective, weight: number)', () => {


		context('when the map is empty', () => {

			before(function() {
				scoreFunctionMap = new ScoreFunctionMap();
			});

			it('should insert the Objective into the map, and assign it a weight at the same time', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.be.undefined;
				scoreFunctionMap.setObjectiveScoreFunction(weather.getId(), discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
			});
		});

		context('when the map is not empty', () => {

			before(function() {
				scoreFunctionMap = new ScoreFunctionMap();

				scoreFunctionMap.setObjectiveScoreFunction(weather.getId(), discreteScoreFunction);
			});

			it('should insert the Objective into the map without affecting the other Objective-ScoreFunction pairs', () => {
				scoreFunctionMap.setObjectiveScoreFunction(distance.getId(), continuousScoreFunction);

				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance.getId())).to.deep.equal(continuousScoreFunction);
			});
		});

		context('when the Objective is already mapped to another ScoreFunction', () => {

			before(function() {
				scoreFunctionMap = new ScoreFunctionMap();
				
				scoreFunctionMap.setObjectiveScoreFunction(weather.getId(), discreteScoreFunction);
				scoreFunctionMap.setObjectiveScoreFunction(distance.getId(), continuousScoreFunction);
			});

			it('should overwrite the old ScoreFunction with the new one', () => {
				scoreFunctionMap.setObjectiveScoreFunction(distance.getId(), discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
			});
		});
	});

	describe('#removeObjectiveScoreFunction(objective: PrimitiveObjective)', () => {

		beforeEach(function() {
			scoreFunctionMap = new ScoreFunctionMap();
			scoreFunctionMap.setObjectiveScoreFunction(weather.getId(), discreteScoreFunction);
			scoreFunctionMap.setObjectiveScoreFunction(distance.getId(), continuousScoreFunction);
		});

		context('when the Objective-ScoreFunction pair to remove is not part of the ScoreFunctionMap', () => {
			it('should not do anything', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance.getId())).to.deep.equal(continuousScoreFunction);
				scoreFunctionMap.removeObjectiveScoreFunction(elevation.getId());
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance.getId())).to.deep.equal(continuousScoreFunction);
			});
		});

		context('when the Objective-ScoreFunction pair to remove is part of the ScoreFunctionMap', () => {
			it('should remove the objective weight', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance.getId())).to.deep.equal(continuousScoreFunction);
				scoreFunctionMap.removeObjectiveScoreFunction(distance.getId());
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather.getId())).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance.getId())).to.be.undefined;
			});
		});
	});

	describe('#getAllScoreFunctions()', () => {

		beforeEach(function() {
			scoreFunctionMap = new ScoreFunctionMap();
			scoreFunctionMap.setObjectiveScoreFunction(weather.getId(), discreteScoreFunction);
			scoreFunctionMap.setObjectiveScoreFunction(distance.getId(), continuousScoreFunction);
			scoreFunctionMap.setObjectiveScoreFunction(elevation.getId(), continuousScoreFunction);
		});

		it('should retrieve an array of all the ScoreFunctions stored within the ScoreFunctionMap', () => {
			var scoreFunctions = scoreFunctionMap.getAllScoreFunctions();

			expect(scoreFunctions).to.have.length(3);

			expect(scoreFunctions[0]).to.deep.equal(discreteScoreFunction);
			expect(scoreFunctions[1]).to.deep.equal(continuousScoreFunction);
			expect(scoreFunctions[2]).to.deep.equal(continuousScoreFunction);

		});
	});

	describe('#getAllKeyScoreFunctionPairs()', () => {

		beforeEach(function() {
			scoreFunctionMap = new ScoreFunctionMap();
			scoreFunctionMap.setObjectiveScoreFunction(weather.getId(), discreteScoreFunction);
			scoreFunctionMap.setObjectiveScoreFunction(distance.getId(), continuousScoreFunction);
			scoreFunctionMap.setObjectiveScoreFunction(elevation.getId(), continuousScoreFunction);
		});

		it('should retrieve an array of all the ScoreFunctions along with their corresponding objective names stored within the ScoreFunctionMap', () => {
			var scoreFunctions = scoreFunctionMap.getAllKeyScoreFunctionPairs();

			expect(scoreFunctions).to.have.length(3);

			expect(scoreFunctions[0]).to.deep.equal({key: weather.getId(), scoreFunction: discreteScoreFunction });
			expect(scoreFunctions[1]).to.deep.equal({key: distance.getId(), scoreFunction: continuousScoreFunction });
			expect(scoreFunctions[2]).to.deep.equal({key: elevation.getId(), scoreFunction: continuousScoreFunction });
		});
	});

});