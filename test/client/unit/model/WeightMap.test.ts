/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 11:10:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:44
*/

import { WeightMap } 			from '../../../../client/src/model';
import { PrimitiveObjective } 	from '../../../../client/src/model';

import { expect }				from 'chai';



describe('WeightMap', () => {
	var roundingError: number;

	var weightMap: WeightMap;

	var weather: PrimitiveObjective;
	var distance: PrimitiveObjective;
	var elevation: PrimitiveObjective;
	var temperature: PrimitiveObjective;
	var humidity: PrimitiveObjective;
	var objectiveOrder: PrimitiveObjective[] = []

	before(function() {
		roundingError = 0.0001;

		weightMap = new WeightMap();

		weather = new PrimitiveObjective('Weather', 'A description goes here');
		distance = new PrimitiveObjective('Distance', 'A description goes here');
		elevation = new PrimitiveObjective('Elevation', 'A description goes here');
		temperature = new PrimitiveObjective('Temperature', 'A description goes here');
		humidity = new PrimitiveObjective('Humidity', 'A description goes here');
	});

	describe('#getObjectiveWeight()', () => {

		context('when there are no Objective-weights pairs in the WeightMap', () => {
			it('should return undefined for any Objective', () => {
				expect(weightMap.getObjectiveWeight(weather.getName())).to.be.undefined;
				expect(weightMap.getObjectiveWeight(elevation.getName())).to.be.undefined;
				expect(weightMap.getObjectiveWeight(temperature.getName())).to.be.undefined;
			});
		});

		context('when there are Objective-weights pairs in the WeightMap', () => {

			before(function() {
				weightMap.setObjectiveWeight(weather.getName(), 2);
				weightMap.setObjectiveWeight(humidity.getName(), 1);
			});

			it('should return undefined for an Objective that is not in the WeightMap', () => {
				expect(weightMap.getObjectiveWeight(distance.getName())).to.be.undefined;
				expect(weightMap.getObjectiveWeight(elevation.getName())).to.be.undefined;
			});

			it('should return a (unormalized) weight for an Objective that is in the WeightMap', () => {
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(2);
				expect(weightMap.getObjectiveWeight(humidity.getName())).to.equal(1);
			});
		});
	});

	describe('#setObjectiveWeight(objective: PrimitiveObjective, weight: number)', () => {


		context('when the map is empty', () => {

			before(function() {
				weightMap = new WeightMap();
			});

			it('should insert the Objective into the map, and assign it a weight at the same time', () => {
				expect(weightMap.getObjectiveWeight(weather.getName())).to.be.undefined;
				expect(weightMap.getWeightTotal()).to.equal(0);
				weightMap.setObjectiveWeight(weather.getName(), 0.5);
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(0.5);
				expect(weightMap.getWeightTotal()).to.equal(0.5);
			});
		});

		context('when the map is not empty', () => {

			before(function() {
				weightMap = new WeightMap();
				weightMap.setObjectiveWeight(weather.getName(), 0.5);
			});

			it('should insert the Objective-weight pair into the map without affecting the other Objective-weight pairs', () => {
				expect(weightMap.getWeightTotal()).to.equal(0.5);
				weightMap.setObjectiveWeight(distance.getName(), 10);
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(0.5);
				expect(weightMap.getObjectiveWeight(distance.getName())).to.equal(10);
				expect(weightMap.getWeightTotal()).to.equal(10.5);
			});
		});

		context('when the Objective is already mapped to a weight', () => {

			before(function() {
				weightMap = new WeightMap();
				weightMap.setObjectiveWeight(weather.getName(), 0.5);
				weightMap.setObjectiveWeight(distance.getName(), 10);
			});

			it('should overwrite the old weight with the new one', () => {
				expect(weightMap.getWeightTotal()).to.equal(10.5);
				weightMap.setObjectiveWeight(weather.getName(), 3);
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(3);
				expect(weightMap.getWeightTotal()).to.equal(13);
			});
		});
	});

	describe('#removeObjectiveWeight(Objective: PrimitiveObjective)', () => {

		beforeEach(function() {
			weightMap = new WeightMap();
			weightMap.setObjectiveWeight(weather.getName(), 3);
			weightMap.setObjectiveWeight(distance.getName(), 10);
		});

		context('when the Objective-weight pair to remove is NOT in the WeightMap', () => {
			it('should not do anything', () => {
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance.getName())).to.equal(10);
				expect(weightMap.getWeightTotal()).to.equal(13);
				weightMap.removeObjectiveWeight(elevation.getName());
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance.getName())).to.equal(10);
				expect(weightMap.getWeightTotal()).to.equal(13);
			});
		});

		context('when the Objective-weight pair to remove is in the WeightMap', () => {
			it('should remove the Objective weight', () => {
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance.getName())).to.equal(10);
				expect(weightMap.getWeightTotal()).to.equal(13);
				weightMap.removeObjectiveWeight(distance.getName());
				expect(weightMap.getObjectiveWeight(weather.getName())).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance.getName())).to.be.undefined;
				expect(weightMap.getWeightTotal()).to.equal(3);
			});
		});
	});

	describe('#getWeightTotal()', () => {

		before(function() {
			weightMap = new WeightMap();
			weightMap.setObjectiveWeight(weather.getName(), 3);
		});

		context('when there is only one objective weight in the WeightMap', () => {
			it('should return the correct weight total', () => {
				expect(weightMap.getWeightTotal()).to.equal(3);
			});
		});

		context('when more objective weights are added to the WeightMap', () => {

			before(function() {
				weightMap.setObjectiveWeight(distance.getName(), 10);
				weightMap.setObjectiveWeight(elevation.getName(), 5)
				weightMap.setObjectiveWeight(temperature.getName(), 1)
				weightMap.setObjectiveWeight(humidity.getName(), 10);
			});

			it('should return the correct weight total', () => {
				expect(weightMap.getWeightTotal()).to.equal(3 + 10 + 5 + 1 + 10);
			});

		});

		context('when objective weights are changed', () => {

			before(function() {
				weightMap.setObjectiveWeight(temperature.getName(), 6)
				weightMap.setObjectiveWeight(humidity.getName(), 0.5);
			});

			it('should return the correct weight total', () => {
				expect(weightMap.getWeightTotal()).to.equal(3 + 10 + 5 + 6 + 0.5);
			});
		});

		context('when objective weights are removed', () => {

			before(function() {
				weightMap.removeObjectiveWeight(temperature.getName());
			});

			it('should return the correct weight total', () => {
				expect(weightMap.getWeightTotal()).to.equal(3 + 10 + 5 + 0.5);
			});
		});

	});

	describe('#recalculateWeightTotal()', () => {
		var weightTotal: number;

		before(function() {
			weightMap = new WeightMap();
			weightMap.setObjectiveWeight(weather.getName(), 3);
			weightMap.setObjectiveWeight(distance.getName(), 5);
			weightMap.setObjectiveWeight(elevation.getName(), 2);
			weightMap.setObjectiveWeight(temperature.getName(), 1);
			weightMap.setObjectiveWeight(humidity.getName(), 2);

			weightTotal = 3 + 5 + 2 + 1 + 2;
		});


		it('should return the correct weight total', () => {
			expect(weightMap.recalculateWeightTotal()).to.equal(weightTotal);
		});

	});



	describe('#getNormalizedObjectiveWeight(objective: PrimitiveObjective)', () => {
		var weightTotal: number;

		before(function() {
			weightMap = new WeightMap();
			weightMap.setObjectiveWeight(weather.getName(), 3);
			weightMap.setObjectiveWeight(distance.getName(), 5);
			weightMap.setObjectiveWeight(elevation.getName(), 2);
			weightMap.setObjectiveWeight(temperature.getName(), 1);
			weightMap.setObjectiveWeight(humidity.getName(), 2);

			weightTotal = 3 + 5 + 2 + 1 + 2;
		});

		it('should retrieve properly normalied weights', () => {
			expect(weightMap.getNormalizedObjectiveWeight(weather.getName())).to.be.closeTo(3 / weightTotal, roundingError); // This should be the weight for weather.
			expect(weightMap.getNormalizedObjectiveWeight(distance.getName())).to.be.closeTo(5 / weightTotal, roundingError); // This should be the weight for distance.
			expect(weightMap.getNormalizedObjectiveWeight(elevation.getName())).to.be.closeTo(2 / weightTotal, roundingError); // This should be the weight for elevation.
			expect(weightMap.getNormalizedObjectiveWeight(temperature.getName())).to.be.closeTo(1 / weightTotal, roundingError); // This should be the weight for temperature.
			expect(weightMap.getNormalizedObjectiveWeight(humidity.getName())).to.be.closeTo(2 / weightTotal, roundingError); // This should be the weight for humidity.		
		});
	});

	describe('#getObjectiveWeights(orderedObjectives: PrimitiveObjective[])', () => {
		var orderedWeights: number[];

		before(function() {
			weightMap = new WeightMap();
			weightMap.setObjectiveWeight(weather.getName(), 3);
			weightMap.setObjectiveWeight(distance.getName(), 5);
			weightMap.setObjectiveWeight(elevation.getName(), 2);
			weightMap.setObjectiveWeight(temperature.getName(), 1);
			weightMap.setObjectiveWeight(humidity.getName(), 2);
		});

		context('when the desired order is the same as the order Objective-weight pairs are in', () => {

			before(function() {
				objectiveOrder = [weather, distance, elevation, temperature, humidity];
			});

			it('should retrieve the weights in the same order as the ordered array of Objectives given', () => {
				orderedWeights = weightMap.getObjectiveWeights(objectiveOrder);
				expect(orderedWeights).to.have.length(5);
				expect(orderedWeights[0]).to.equal(3); // This should be the weight for weather.
				expect(orderedWeights[1]).to.equal(5); // This should be the weight for distance.
				expect(orderedWeights[2]).to.equal(2); // This should be the weight for elevation.
				expect(orderedWeights[3]).to.equal(1); // This should be the weight for temperature.
				expect(orderedWeights[4]).to.equal(2); // This should be the weight for humidity.
			});
		});


		context('when the desired order is NOT the same as the order objective-weight pairs are in', () => {

			before(function() {
				objectiveOrder = [temperature, distance, humidity, weather, elevation];
			});

			it('should retrieve the weights in the same order as the ordered array of Objectives given', () => {
				orderedWeights = weightMap.getObjectiveWeights(objectiveOrder);

				expect(orderedWeights).to.have.length(5);
				expect(orderedWeights[0]).to.equal(1); // This should be the weight for temperature.
				expect(orderedWeights[1]).to.equal(5); // This should be the weight for distance.
				expect(orderedWeights[2]).to.equal(2); // This should be the weight for humidity.
				expect(orderedWeights[3]).to.equal(3); // This should be the weight for weather.
				expect(orderedWeights[4]).to.equal(2); // This should be the weight for elevation.
			});
		});
	});


	describe('#getNormalizedWeights(orderedObjectives: PrimitiveObjective[])', () => {
		var weightTotal: number;
		var normalizedWeights: number[];

		context('when the sum of the weights is greater than 1', () => {

			before(function() {
				weightMap = new WeightMap();
				weightMap.setObjectiveWeight(weather.getName(), 3);
				weightMap.setObjectiveWeight(distance.getName(), 5);
				weightMap.setObjectiveWeight(elevation.getName(), 2);
				weightMap.setObjectiveWeight(temperature.getName(), 1);
				weightMap.setObjectiveWeight(humidity.getName(), 2);

				objectiveOrder = [weather, distance, elevation, temperature, humidity];

				weightTotal = 3 + 5 + 2 + 1 + 2;
			});

			it('should retrieve the normalized weights in the same order as the ordered array of Objectives', () => {
				normalizedWeights = weightMap.getNormalizedWeights(objectiveOrder);
				expect(normalizedWeights).to.have.length(5);

				// Use within to account for floating point rounding errors.
				expect(normalizedWeights[0]).to.be.closeTo(3 / weightTotal, roundingError); // This should be the weight for weather.
				expect(normalizedWeights[1]).to.be.closeTo(5 / weightTotal, roundingError); // This should be the weight for distance.
				expect(normalizedWeights[2]).to.be.closeTo(2 / weightTotal, roundingError); // This should be the weight for elevation.
				expect(normalizedWeights[3]).to.be.closeTo(1 / weightTotal, roundingError); // This should be the weight for temperature.
				expect(normalizedWeights[4]).to.be.closeTo(2 / weightTotal, roundingError); // This should be the weight for humidity.
			});
		});


		context('when the sum of the weights is exactly 1', () => {

			before(function() {
				weightMap.setObjectiveWeight(weather.getName(), .1);
				weightMap.setObjectiveWeight(distance.getName(), .4);
				weightMap.setObjectiveWeight(elevation.getName(), .2);
				weightMap.setObjectiveWeight(temperature.getName(), .2);
				weightMap.setObjectiveWeight(humidity.getName(), .1);

				objectiveOrder = [temperature, distance, humidity, weather, elevation];
			});

			it('should retrieve the normalized weights in the same order as the ordered array of Objectives given', () => {
				normalizedWeights = weightMap.getNormalizedWeights(objectiveOrder);

				expect(normalizedWeights).to.have.length(5);
				expect(normalizedWeights[0]).to.be.closeTo(.2, roundingError); // This should be the weight for temperature.
				expect(normalizedWeights[1]).to.be.closeTo(.4, roundingError); // This should be the weight for distance.
				expect(normalizedWeights[2]).to.be.closeTo(.1, roundingError); // This should be the weight for humidity.
				expect(normalizedWeights[3]).to.be.closeTo(.1, roundingError); // This should be the weight for weather.
				expect(normalizedWeights[4]).to.be.closeTo(.2, roundingError); // This should be the weight for elevation.
			});
		});

		context('when the sum of the weights is less than 1', () => {
			before(function() {
				weightMap.setObjectiveWeight(weather.getName(), .05);
				weightMap.setObjectiveWeight(distance.getName(), .1);
				weightMap.setObjectiveWeight(elevation.getName(), .2);
				weightMap.setObjectiveWeight(temperature.getName(), .3);
				weightMap.setObjectiveWeight(humidity.getName(), .2);

				objectiveOrder = [distance, temperature, humidity, weather, elevation];

				weightTotal = 0.05 + 0.1 + 0.2 + 0.3 + 0.2;
			});

			it('should retrieve the normalized weights in the same order as the ordered array of Objectives given', () => {
				normalizedWeights = weightMap.getNormalizedWeights(objectiveOrder);

				expect(normalizedWeights).to.have.length(5);

				// Use within to account for floating point rounding errors.
				expect(normalizedWeights[0]).to.be.closeTo(.1 / weightTotal, roundingError); // This should be the weight for distance.
				expect(normalizedWeights[1]).to.be.closeTo(.3 / weightTotal, roundingError); // This should be the weight for temperature.
				expect(normalizedWeights[2]).to.be.closeTo(.2 / weightTotal, roundingError); // This should be the weight for humidity.
				expect(normalizedWeights[3]).to.be.closeTo(.05 / weightTotal, roundingError); // This should be the weight for weather.
				expect(normalizedWeights[4]).to.be.closeTo(.2 / weightTotal, roundingError); // This should be the weight for elevation.
			});
		});

	});



});