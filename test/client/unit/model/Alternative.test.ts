/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:06
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:54
*/


import { Alternative }			from '../../../../client/src/model';
import { PrimitiveObjective }	from '../../../../client/src/model';


import { expect }				from 'chai';

describe('Alternative', () => {
	var alternative: Alternative;
	var weather: PrimitiveObjective;
	var distance: PrimitiveObjective;

	before(function() {
		weather = new PrimitiveObjective("weather", "This is also for testing");
		distance = new PrimitiveObjective("distance", "This is also for testing");
	})

	describe('#constructor(name: string, description: string)', () => {

		context('when constructor is used', () => {
			it('should have a name, description and creator', () => {
				alternative = new Alternative('TestAlternative', 'This alternative is for testing');
				expect(alternative.getName()).to.equal('TestAlternative');
				expect(alternative.getDescription()).to.equal('This alternative is for testing');
			});
		});
	});

	describe('#setObjectiveValue(objective: PrimitiveObjective, value: string | number)', () => {

		before(function() {
			alternative = new Alternative('TestAlternative', 'This alternative is for testing');
		});

		context('when the objective has not been assigned a value yet', () => {
			it('should insert the objective into the map, and assign it a value at the same time', () => {
				expect(alternative.getObjectiveValue(weather.getId())).to.be.undefined;
				alternative.setObjectiveValue(weather.getId(), "Snowy");
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Snowy");
			});
		});

		context('when the map is not empty', () => {

			before(function() {
				alternative = new Alternative('TestAlternative', 'This alternative is for testing');
				alternative.setObjectiveValue(weather.getId(), "Snowy");
			});

			it('should insert the objective into the map without affecting the other objectives', () => {
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Snowy");
				alternative.setObjectiveValue(distance.getId(), 100);
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Snowy");
				expect(alternative.getObjectiveValue(distance.getId())).to.equal(100);
			});
		});

		context('when the objective is already mapped to another value', () => {

			before(function() {
				alternative = new Alternative('TestAlternative', 'This alternative is for testing');
				alternative.setObjectiveValue(weather.getId(), "Snowy");
			});

			it('should overwrite the old value with the new one', () => {
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Snowy");
				alternative.setObjectiveValue(weather.getId(), "Sunny");
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Sunny");
			});
		});
	});

	describe('#removeObjective(objective: PrimitiveObjective)', () => {
		var altitude: PrimitiveObjective;

		beforeEach(function() {
			alternative = new Alternative('TestAlternative', 'This alternative is for testing');
			alternative.setObjectiveValue(weather.getId(), "Sunny");
			alternative.setObjectiveValue(distance.getId(), 100);
			altitude = new PrimitiveObjective('Altitude', 'This is also for testing');
		})

		context('when the objective to remove is not part of the Alternative', () => {
			it('should not do anything', () => {
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance.getId())).to.equal(100);
				alternative.removeObjective(altitude.getId());
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance.getId())).to.equal(100);
			});
		});

		context('when the objective to remove is part of the Alternative', () => {
			it('should remove the objective', () => {
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance.getId())).to.equal(100);
				alternative.removeObjective(distance.getId());
				expect(alternative.getObjectiveValue(weather.getId())).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance.getId())).to.be.undefined;
			});
		});
	});

	describe('#getAllObjectiveValuePairs()', () => {
		var altitude: PrimitiveObjective;

		beforeEach(function() {
			altitude = new PrimitiveObjective('altitude', 'This is also for testing');
			alternative = new Alternative('TestAlternative', 'This alternative is for testing');
			alternative.setObjectiveValue(weather.getId(), "Sunny");
			alternative.setObjectiveValue(distance.getId(), 100);
			alternative.setObjectiveValue(altitude.getId(), 10000);
		})

		it('should return the all the Alternative\'s consquences paired with the name of the objectives they are for', () => {
			var pairs: any[] = alternative.getAllObjectiveValuePairs();

			expect(pairs).to.have.length(3);

			expect(pairs[0].objectiveId).to.equal(weather.getId());
			expect(pairs[0].value).to.equal('Sunny');

			expect(pairs[1].objectiveId).to.equal(distance.getId());
			expect(pairs[1].value).to.equal(100);

			expect(pairs[2].objectiveId).to.equal(altitude.getId());
			expect(pairs[2].value).to.equal(10000);
		});
	});
});