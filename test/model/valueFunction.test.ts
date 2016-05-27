/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:14:27
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 15:53:17
*/

import { ValueFunctionMap } 			from '../../app/resources/model/ValueFunctionMap';
import { ValueFunction } 				from '../../app/resources/model/ValueFunction';
import { PrimitiveObjective } 			from '../../app/resources/model/PrimitiveObjective';
import { DiscreteValueFunction } 		from '../../app/resources/model/DiscreteValueFunction';
import { ContinuousValueFunction } 		from '../../app/resources/model/ContinuousValueFunction';



declare var expect: any;


describe('ValueFunctionMap', () => {
	var valueFunctionMap: ValueFunctionMap;

	var weather: PrimitiveObjective;
	var distance: PrimitiveObjective;
	var elevation: PrimitiveObjective;

	var continuousValueFunction: ContinuousValueFunction;
	var discreteValueFunction: DiscreteValueFunction;

	before(function() {
		valueFunctionMap = new ValueFunctionMap();

		weather = new PrimitiveObjective('Weather', 'A description goes here');
		distance = new PrimitiveObjective('Distance', 'A description goes here');
		elevation = new PrimitiveObjective('Elevation', 'A description goes here');

		continuousValueFunction = new ContinuousValueFunction();
		discreteValueFunction = new DiscreteValueFunction();
	});

	describe('#getObjectiveValueFunction', () => {

		context('when there are no Objective-ValueFunction pairs in the ValueFunctionMap', () => {
			it('should return undefined for any Objective', () => {
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.be.undefined;
				expect(valueFunctionMap.getObjectiveValueFunction(distance)).to.be.undefined;
			});
		});

		context('when there are Objective-ValueFunction pairs in the ValueFunctionMap', () => {

			before(function() {
				valueFunctionMap.setObjectiveValueFunction(weather, discreteValueFunction);
				valueFunctionMap.setObjectiveValueFunction(distance, continuousValueFunction);
			});

			it('should return undefined for an Objective that is not in the ValueFunctionMap', () => {
				expect(valueFunctionMap.getObjectiveValueFunction(elevation)).to.be.undefined;
			});

			it('should return a ValueFunction for an Objective that is in the ValueFunctionMap', () => {
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(distance)).to.deep.equal(continuousValueFunction);
			});
		});
	});

	describe('#setObjectiveValueFunction(objective: PrimitiveObjective, weight: number)', () => {


		context('when the map is empty', () => {

			before(function() {
				valueFunctionMap = new ValueFunctionMap();
			});

			it('should insert the Objective into the map, and assign it a weight at the same time', () => {
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.be.undefined;
				valueFunctionMap.setObjectiveValueFunction(weather, discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
			});
		});

		context('when the map is not empty', () => {

			before(function() {
				valueFunctionMap = new ValueFunctionMap();

				valueFunctionMap.setObjectiveValueFunction(weather, discreteValueFunction);
			});

			it('should insert the Objective into the map without affecting the other Objective-ValueFunction pairs', () => {
				valueFunctionMap.setObjectiveValueFunction(distance, continuousValueFunction);

				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(distance)).to.deep.equal(continuousValueFunction);
			});
		});

		context('when the Objective is already mapped to another ValueFunction', () => {

			before(function() {
				valueFunctionMap = new ValueFunctionMap();
				
				valueFunctionMap.setObjectiveValueFunction(weather, discreteValueFunction);
				valueFunctionMap.setObjectiveValueFunction(distance, continuousValueFunction);
			});

			it('should overwrite the old ValueFunction with the new one', () => {
				valueFunctionMap.setObjectiveValueFunction(distance, discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
			});
		});
	});

	describe('#removeObjectiveValueFunction(objective: PrimitiveObjective)', () => {

		beforeEach(function() {
			valueFunctionMap = new ValueFunctionMap();
			valueFunctionMap.setObjectiveValueFunction(weather, discreteValueFunction);
			valueFunctionMap.setObjectiveValueFunction(distance, continuousValueFunction);
		});

		context('when the Objective-ValueFunction pair to remove is not part of the ValueFunctionMap', () => {
			it('should not do anything', () => {
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(distance)).to.deep.equal(continuousValueFunction);
				valueFunctionMap.removeObjectiveValueFunction(elevation);
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(distance)).to.deep.equal(continuousValueFunction);
			});
		});

		context('when the Objective-ValueFunction pair to remove is part of the ValueFunctionMap', () => {
			it('should remove the objective weight', () => {
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(distance)).to.deep.equal(continuousValueFunction);
				valueFunctionMap.removeObjectiveValueFunction(distance);
				expect(valueFunctionMap.getObjectiveValueFunction(weather)).to.deep.equal(discreteValueFunction);
				expect(valueFunctionMap.getObjectiveValueFunction(distance)).to.be.undefined;
			});
		});
	});

});