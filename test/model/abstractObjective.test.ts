/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 09:05:58
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 10:41:43
*/

import { AbstractObjective } 	from '../../app/resources/model/AbstractObjective';
import { PrimitiveObjective } 	from '../../app/resources/model/PrimitiveObjective';
import { Objective } 			from '../../app/resources/model/Objective';

declare var expect: any;

describe('AbstractObjective', () => {
	var rootObjectve: AbstractObjective;
	var levelTwoPrimitiveOne: PrimitiveObjective;
	var levelTwoPrimitiveTwo: PrimitiveObjective;
	var levelTwoAbstractOne: AbstractObjective;

	before(function() {
		levelTwoPrimitiveOne = new PrimitiveObjective('PrimitiveChild', 'A description goes here')
		levelTwoAbstractOne = new AbstractObjective('AbstractChild', 'A description goes here');
		levelTwoPrimitiveTwo = new PrimitiveObjective('ThirdChild', 'A description goes here');
	});

	describe('#constructor(name: string, description: string)', () => {

		context('when constructor is used', () => {
			it('should have a name, and description', () => {
				rootObjectve = new AbstractObjective('TestObjective', 'A description goes here');
				expect(rootObjectve.getName()).to.equal('TestObjective');
				expect(rootObjectve.getDescription()).to.equal('A description goes here');
			});
		});

	});

	describe('#removeSubObjective(objective: Objective)', () => {

		context('when there are no subObjectives', () => {
			it('should not remove a subObjective', () => {
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(0);
				rootObjectve.removeSubObjective(levelTwoPrimitiveOne);
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(0);
			});
		});

		context('when there is at least one subObjective', () => {

			before(function() {
				rootObjectve.addSubObjective(levelTwoPrimitiveOne);
				rootObjectve.addSubObjective(levelTwoAbstractOne);
			})

			it('should not remove an objective that is not in the list of subObjectives', () => {
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
				rootObjectve.removeSubObjective(levelTwoPrimitiveTwo);
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
			});

			it('should remove an objective that is in the list of subObjectives', () => {
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
				rootObjectve.removeSubObjective(levelTwoPrimitiveOne);
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(1);
				expect(rootObjectve.getDirectSubObjectives()[0].getName()).to.equal('AbstractChild');
			});
		});
	});

	describe('#getAllSubObjectives()', () => {

		before(function() {
			rootObjectve.addSubObjective(levelTwoPrimitiveOne);
			levelTwoAbstractOne.addSubObjective(levelTwoPrimitiveTwo);
		});

		context('when at least one subObjective has subObjectives of its own', () => {
			it('should retrieve all the subObjectives, including those of the children', () => {
				expect(rootObjectve.getAllSubObjectives()).to.have.length(3);
			});
		});

		context('when the hierarchy of objectives is complex', () => {

			before(function() {
				var levelThreeAbstractOne: AbstractObjective = new AbstractObjective('LevelThreeAbstractOne', 'A description goes here');
				var levelThreeAbstractTwo: AbstractObjective = new AbstractObjective('LevelThreeAbstractTwo', 'A description goes here');
				var levelFourAbstract: AbstractObjective = new AbstractObjective('LevelFour', 'A description goes here');
				var levelThreePrimitive: PrimitiveObjective = new PrimitiveObjective('LevelThreePrimitive', 'A description goes here');		
				var levelFourPrimitiveOne: PrimitiveObjective = new PrimitiveObjective('LevelFourPrimitiveOne', 'A description goes here');		
				var levelFourPrimitiveTwo: PrimitiveObjective = new PrimitiveObjective('LevelFourPrimitiveTwo', 'A description goes here');		
				var levelFourPrimitiveThree: PrimitiveObjective = new PrimitiveObjective('LevelFourPrimitiveThree', 'A description goes here');		
				var levelFivePrimitiveOne: PrimitiveObjective = new PrimitiveObjective('LevelFivePrimitiveOne', 'A description goes here');		

				// Level Three
				levelTwoAbstractOne.addSubObjective(levelThreePrimitive);
				levelTwoAbstractOne.addSubObjective(levelThreeAbstractOne);
				levelTwoAbstractOne.addSubObjective(levelThreeAbstractTwo);

				// Level Four
				levelThreeAbstractOne.addSubObjective(levelFourAbstract);
				levelThreeAbstractOne.addSubObjective(levelFourPrimitiveOne);
				levelThreeAbstractTwo.addSubObjective(levelFourPrimitiveTwo);
				levelThreeAbstractTwo.addSubObjective(levelFourPrimitiveThree);

				// Level Five
				levelFourAbstract.addSubObjective(levelFivePrimitiveOne);
			});

			it('should still retrieve all of the subObjectives in the hierarchy', () => {
				expect(rootObjectve.getAllSubObjectives()).to.have.length(11);
			});
		});
	});
});




