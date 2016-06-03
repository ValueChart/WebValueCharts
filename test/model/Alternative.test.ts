/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:06
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-02 16:39:46
*/


import { Alternative }			from '../../app/resources/model/Alternative';
import { PrimitiveObjective }	from '../../app/resources/model/PrimitiveObjective';


declare var expect: any;



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
				expect(alternative.getObjectiveValue(weather)).to.be.undefined;
				alternative.setObjectiveValue(weather, "Snowy");
				expect(alternative.getObjectiveValue(weather)).to.equal("Snowy");
			});
		});

		context('when the map is not empty', () => {

			before(function() {
				alternative = new Alternative('TestAlternative', 'This alternative is for testing');
				alternative.setObjectiveValue(weather, "Snowy");
			});

			it('should insert the objective into the map without affecting the other objectives', () => {
				expect(alternative.getObjectiveValue(weather)).to.equal("Snowy");
				alternative.setObjectiveValue(distance, 100);
				expect(alternative.getObjectiveValue(weather)).to.equal("Snowy");
				expect(alternative.getObjectiveValue(distance)).to.equal(100);
			});
		});

		context('when the objective is already mapped to another value', () => {

			before(function() {
				alternative = new Alternative('TestAlternative', 'This alternative is for testing');
				alternative.setObjectiveValue(weather, "Snowy");
			});

			it('should overwrite the old value with the new one', () => {
				expect(alternative.getObjectiveValue(weather)).to.equal("Snowy");
				alternative.setObjectiveValue(weather, "Sunny");
				expect(alternative.getObjectiveValue(weather)).to.equal("Sunny");
			});
		});
	});

	describe('#removeObjective(objective: PrimitiveObjective)', () => {
		var altitude: PrimitiveObjective;

		beforeEach(function() {
			alternative = new Alternative('TestAlternative', 'This alternative is for testing');
			alternative.setObjectiveValue(weather, "Sunny");
			alternative.setObjectiveValue(distance, 100);
			altitude = new PrimitiveObjective('Altitude', 'This is also for testing');
		})

		context('when the objective to remove is not part of the Alternative', () => {
			it('should not do anything', () => {
				expect(alternative.getObjectiveValue(weather)).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance)).to.equal(100);
				alternative.removeObjective(altitude);
				expect(alternative.getObjectiveValue(weather)).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance)).to.equal(100);
			});
		});

		context('when the objective to remove is part of the Alternative', () => {
			it('should remove the objective', () => {
				expect(alternative.getObjectiveValue(weather)).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance)).to.equal(100);
				alternative.removeObjective(distance);
				expect(alternative.getObjectiveValue(weather)).to.equal("Sunny");
				expect(alternative.getObjectiveValue(distance)).to.be.undefined;
			});
		});
	});
});