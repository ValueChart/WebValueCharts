/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:14:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 16:10:38
*/

import { ScoreFunctionMap } 			from '../../app/resources/model/ScoreFunctionMap';
import { ScoreFunction } 				from '../../app/resources/model/ScoreFunction';
import { PrimitiveObjective } 			from '../../app/resources/model/PrimitiveObjective';
import { DiscreteScoreFunction } 		from '../../app/resources/model/DiscreteScoreFunction';
import { ContinuousScoreFunction } 		from '../../app/resources/model/ContinuousScoreFunction';



declare var expect: any;


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

		continuousScoreFunction = new ContinuousScoreFunction();
		discreteScoreFunction = new DiscreteScoreFunction();
	});

	describe('#getObjectiveScoreFunction', () => {

		context('when there are no Objective-ScoreFunction pairs in the ScoreFunctionMap', () => {
			it('should return undefined for any Objective', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.be.undefined;
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance)).to.be.undefined;
			});
		});

		context('when there are Objective-ScoreFunction pairs in the ScoreFunctionMap', () => {

			before(function() {
				scoreFunctionMap.setObjectiveScoreFunction(weather, discreteScoreFunction);
				scoreFunctionMap.setObjectiveScoreFunction(distance, continuousScoreFunction);
			});

			it('should return undefined for an Objective that is not in the ScoreFunctionMap', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(elevation)).to.be.undefined;
			});

			it('should return a ScoreFunction for an Objective that is in the ScoreFunctionMap', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance)).to.deep.equal(continuousScoreFunction);
			});
		});
	});

	describe('#setObjectiveScoreFunction(objective: PrimitiveObjective, weight: number)', () => {


		context('when the map is empty', () => {

			before(function() {
				scoreFunctionMap = new ScoreFunctionMap();
			});

			it('should insert the Objective into the map, and assign it a weight at the same time', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.be.undefined;
				scoreFunctionMap.setObjectiveScoreFunction(weather, discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
			});
		});

		context('when the map is not empty', () => {

			before(function() {
				scoreFunctionMap = new ScoreFunctionMap();

				scoreFunctionMap.setObjectiveScoreFunction(weather, discreteScoreFunction);
			});

			it('should insert the Objective into the map without affecting the other Objective-ScoreFunction pairs', () => {
				scoreFunctionMap.setObjectiveScoreFunction(distance, continuousScoreFunction);

				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance)).to.deep.equal(continuousScoreFunction);
			});
		});

		context('when the Objective is already mapped to another ScoreFunction', () => {

			before(function() {
				scoreFunctionMap = new ScoreFunctionMap();
				
				scoreFunctionMap.setObjectiveScoreFunction(weather, discreteScoreFunction);
				scoreFunctionMap.setObjectiveScoreFunction(distance, continuousScoreFunction);
			});

			it('should overwrite the old ScoreFunction with the new one', () => {
				scoreFunctionMap.setObjectiveScoreFunction(distance, discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
			});
		});
	});

	describe('#removeObjectiveScoreFunction(objective: PrimitiveObjective)', () => {

		beforeEach(function() {
			scoreFunctionMap = new ScoreFunctionMap();
			scoreFunctionMap.setObjectiveScoreFunction(weather, discreteScoreFunction);
			scoreFunctionMap.setObjectiveScoreFunction(distance, continuousScoreFunction);
		});

		context('when the Objective-ScoreFunction pair to remove is not part of the ScoreFunctionMap', () => {
			it('should not do anything', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance)).to.deep.equal(continuousScoreFunction);
				scoreFunctionMap.removeObjectiveScoreFunction(elevation);
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance)).to.deep.equal(continuousScoreFunction);
			});
		});

		context('when the Objective-ScoreFunction pair to remove is part of the ScoreFunctionMap', () => {
			it('should remove the objective weight', () => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance)).to.deep.equal(continuousScoreFunction);
				scoreFunctionMap.removeObjectiveScoreFunction(distance);
				expect(scoreFunctionMap.getObjectiveScoreFunction(weather)).to.deep.equal(discreteScoreFunction);
				expect(scoreFunctionMap.getObjectiveScoreFunction(distance)).to.be.undefined;
			});
		});
	});

});