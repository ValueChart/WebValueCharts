/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 11:10:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 14:27:46
*/

import { WeightMap } 			from '../../app/resources/model/WeightMap';
import { PrimitiveObjective } 			from '../../app/resources/model/PrimitiveObjective';

declare var expect: any;


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

	describe('#getObjectiveWeight', () => {

		context('when there are no objectives in the WeightMap', () => {
			it('should return undefined for any objective', () => {
				expect(weightMap.getObjectiveWeight(weather)).to.be.undefined;
				expect(weightMap.getObjectiveWeight(elevation)).to.be.undefined;
				expect(weightMap.getObjectiveWeight(temperature)).to.be.undefined;
			});
		});

		context('when there are objectives in the WeightMap', () => {
			
			before(function() {
				weightMap.setObjectiveWeight(weather, 2);
				weightMap.setObjectiveWeight(humidity, 1);
			});

			it('should return undefined for an objective that is not in the WeightMap', () => {
				expect(weightMap.getObjectiveWeight(distance)).to.be.undefined;
				expect(weightMap.getObjectiveWeight(elevation)).to.be.undefined;
			});

			it('should return a (unormalized) weight for an objective that is in the WeightMap', () => {
				expect(weightMap.getObjectiveWeight(weather)).to.equal(2);
				expect(weightMap.getObjectiveWeight(humidity)).to.equal(1);
			});
		});
	});

	describe('#setObjectiveWeight(objective: PrimitiveObjective, weight: number)', () => {

		before(function() {
			weightMap = new WeightMap();
		});

		context('when the objective has not been assigned a weight yet', () => {
			it('should insert the objective into the map, and assign it a weight at the same time', () => {
				expect(weightMap.getObjectiveWeight(weather)).to.be.undefined;
				weightMap.setObjectiveWeight(weather, 0.5);
				expect(weightMap.getObjectiveWeight(weather)).to.equal(0.5);
			});
		});

		context('when the map is not empty', () => {

			before(function() {
				weightMap.setObjectiveWeight(weather, 0.5);
			});

			it('should insert the objective into the map without affecting the other objectives', () => {
				expect(weightMap.getObjectiveWeight(weather)).to.equal(0.5);
				weightMap.setObjectiveWeight(distance, 10);
				expect(weightMap.getObjectiveWeight(weather)).to.equal(0.5);
				expect(weightMap.getObjectiveWeight(distance)).to.equal(10);
			});
		});

		context('when the objective is already mapped to another weight', () => {

			before(function() {
				weightMap.setObjectiveWeight(weather, 0.5);
				weightMap.setObjectiveWeight(distance, 10);
			});

			it('should overwrite the old weight with the new one', () => {
				expect(weightMap.getObjectiveWeight(weather)).to.equal(0.5);
				weightMap.setObjectiveWeight(weather, 3);
				expect(weightMap.getObjectiveWeight(weather)).to.equal(3);
			});
		});
	});

	describe('#removeObjectiveWeight(objective: PrimitiveObjective)', () => {

		beforeEach(function() {
			weightMap = new WeightMap();
			weightMap.setObjectiveWeight(weather, 3);
			weightMap.setObjectiveWeight(distance, 10);
		});

		context('when the objective weight to remove is not part of the WeightMap', () => {
			it('should not do anything', () => {
				expect(weightMap.getObjectiveWeight(weather)).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance)).to.equal(10);
				weightMap.removeObjectiveWeight(elevation);
				expect(weightMap.getObjectiveWeight(weather)).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance)).to.equal(10);
			});
		});

		context('when the objective weight to remove is part of the WeightMap', () => {
			it('should remove the objective weight', () => {
				expect(weightMap.getObjectiveWeight(weather)).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance)).to.equal(10);
				weightMap.removeObjectiveWeight(distance);
				expect(weightMap.getObjectiveWeight(weather)).to.equal(3);
				expect(weightMap.getObjectiveWeight(distance)).to.be.undefined;
			});
		});
	});

	describe('#getObjectiveWeights(orderedObjectives: PrimitiveObjective[])', () => {
		var orderedWeights: number[];

		before(function() {
			weightMap = new WeightMap();
			weightMap.setObjectiveWeight(weather, 3);
			weightMap.setObjectiveWeight(distance, 5);
			weightMap.setObjectiveWeight(elevation, 2);
			weightMap.setObjectiveWeight(temperature, 1);
			weightMap.setObjectiveWeight(humidity, 2);
		});

		context('when the desired order is the same as the order objectives were mapped in', () => {

			before(function() {
				objectiveOrder = [weather, distance, elevation, temperature, humidity];
			});

			it('should retrieve the weights in the same order as the ordered array of objectives', () => {
				orderedWeights = weightMap.getObjectiveWeights(objectiveOrder);
				expect(orderedWeights).to.have.length(5);
				expect(orderedWeights[0]).to.equal(3); // This should be the weight for weather.
				expect(orderedWeights[1]).to.equal(5); // This should be the weight for distance.
				expect(orderedWeights[2]).to.equal(2); // This should be the weight for elevation.
				expect(orderedWeights[3]).to.equal(1); // This should be the weight for temperature.
				expect(orderedWeights[4]).to.equal(2); // This should be the weight for humidity.
			});
		});


		context('when the desired order is the same as the order objectives were mapped in', () => {

			before(function() {
				objectiveOrder = [temperature, distance, humidity, weather, elevation];
			});

			it('should retrieve the weights in the same order as the ordered array of objectives given', () => {
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
				weightMap.setObjectiveWeight(weather, 3);
				weightMap.setObjectiveWeight(distance, 5);
				weightMap.setObjectiveWeight(elevation, 2);
				weightMap.setObjectiveWeight(temperature, 1);
				weightMap.setObjectiveWeight(humidity, 2);

				objectiveOrder = [weather, distance, elevation, temperature, humidity];

				weightTotal = 3 + 5 + 2 + 1 + 2;
			});

			it('should retrieve the normalized weights in the same order as the ordered array of objectives', () => {
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
				weightMap.setObjectiveWeight(weather, .1);
				weightMap.setObjectiveWeight(distance, .4);
				weightMap.setObjectiveWeight(elevation, .2);
				weightMap.setObjectiveWeight(temperature, .2);
				weightMap.setObjectiveWeight(humidity, .1);

				objectiveOrder = [temperature, distance, humidity, weather, elevation];
			});

			it('should retrieve the normalized weights in the same order as the ordered array of objectives given', () => {
				normalizedWeights = weightMap.getNormalizedWeights(objectiveOrder);

				expect(normalizedWeights).to.have.length(5);
				expect(normalizedWeights[0]).to.equal(.2); // This should be the weight for temperature.
				expect(normalizedWeights[1]).to.equal(.4); // This should be the weight for distance.
				expect(normalizedWeights[2]).to.equal(.1); // This should be the weight for humidity.
				expect(normalizedWeights[3]).to.equal(.1); // This should be the weight for weather.
				expect(normalizedWeights[4]).to.equal(.2); // This should be the weight for elevation.
			});
		});

		context('when the sum of the weights is less than 1', () => {
			before(function() {
				weightMap.setObjectiveWeight(weather, .05);
				weightMap.setObjectiveWeight(distance, .1);
				weightMap.setObjectiveWeight(elevation, .2);
				weightMap.setObjectiveWeight(temperature, .3);
				weightMap.setObjectiveWeight(humidity, .2);

				objectiveOrder = [distance, temperature, humidity, weather, elevation];

				weightTotal = 0.05 + 0.1 + 0.2 + 0.3 + 0.2;
			});

			it('should retrieve the normalized weights in the same order as the ordered array of objectives given', () => {
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