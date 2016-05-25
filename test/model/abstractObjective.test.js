/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 09:05:58
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 10:41:43
*/
"use strict";
var AbstractObjective_1 = require('../../app/resources/model/AbstractObjective');
var PrimitiveObjective_1 = require('../../app/resources/model/PrimitiveObjective');
describe('AbstractObjective', function () {
    var rootObjectve;
    var levelTwoPrimitiveOne;
    var levelTwoPrimitiveTwo;
    var levelTwoAbstractOne;
    before(function () {
        levelTwoPrimitiveOne = new PrimitiveObjective_1.PrimitiveObjective('PrimitiveChild', 'A description goes here');
        levelTwoAbstractOne = new AbstractObjective_1.AbstractObjective('AbstractChild', 'A description goes here');
        levelTwoPrimitiveTwo = new PrimitiveObjective_1.PrimitiveObjective('ThirdChild', 'A description goes here');
    });
    describe('#constructor(name: string, description: string)', function () {
        context('when constructor is used', function () {
            it('should have a name, and description', function () {
                rootObjectve = new AbstractObjective_1.AbstractObjective('TestObjective', 'A description goes here');
                expect(rootObjectve.getName()).to.equal('TestObjective');
                expect(rootObjectve.getDescription()).to.equal('A description goes here');
            });
        });
    });
    describe('#removeSubObjective(objective: Objective)', function () {
        context('when there are no subObjectives', function () {
            it('should not remove a subObjective', function () {
                expect(rootObjectve.getDirectSubObjectives()).to.have.length(0);
                rootObjectve.removeSubObjective(levelTwoPrimitiveOne);
                expect(rootObjectve.getDirectSubObjectives()).to.have.length(0);
            });
        });
        context('when there is at least one subObjective', function () {
            before(function () {
                rootObjectve.addSubObjective(levelTwoPrimitiveOne);
                rootObjectve.addSubObjective(levelTwoAbstractOne);
            });
            it('should not remove an objective that is not in the list of subObjectives', function () {
                expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
                rootObjectve.removeSubObjective(levelTwoPrimitiveTwo);
                expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
            });
            it('should remove an objective that is in the list of subObjectives', function () {
                expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
                rootObjectve.removeSubObjective(levelTwoPrimitiveOne);
                expect(rootObjectve.getDirectSubObjectives()).to.have.length(1);
                expect(rootObjectve.getDirectSubObjectives()[0].getName()).to.equal('AbstractChild');
            });
        });
    });
    describe('#getAllSubObjectives()', function () {
        before(function () {
            rootObjectve.addSubObjective(levelTwoPrimitiveOne);
            levelTwoAbstractOne.addSubObjective(levelTwoPrimitiveTwo);
        });
        context('when at least one subObjective has subObjectives of its own', function () {
            it('should retrieve all the subObjectives, including those of the children', function () {
                expect(rootObjectve.getAllSubObjectives()).to.have.length(3);
            });
        });
        context('when the hierarchy of objectives is complex', function () {
            before(function () {
                var levelThreeAbstractOne = new AbstractObjective_1.AbstractObjective('LevelThreeAbstractOne', 'A description goes here');
                var levelThreeAbstractTwo = new AbstractObjective_1.AbstractObjective('LevelThreeAbstractTwo', 'A description goes here');
                var levelFourAbstract = new AbstractObjective_1.AbstractObjective('LevelFour', 'A description goes here');
                var levelThreePrimitive = new PrimitiveObjective_1.PrimitiveObjective('LevelThreePrimitive', 'A description goes here');
                var levelFourPrimitiveOne = new PrimitiveObjective_1.PrimitiveObjective('LevelFourPrimitiveOne', 'A description goes here');
                var levelFourPrimitiveTwo = new PrimitiveObjective_1.PrimitiveObjective('LevelFourPrimitiveTwo', 'A description goes here');
                var levelFourPrimitiveThree = new PrimitiveObjective_1.PrimitiveObjective('LevelFourPrimitiveThree', 'A description goes here');
                var levelFivePrimitiveOne = new PrimitiveObjective_1.PrimitiveObjective('LevelFivePrimitiveOne', 'A description goes here');
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
            it('should still retrieve all of the subObjectives in the hierarchy', function () {
                expect(rootObjectve.getAllSubObjectives()).to.have.length(11);
            });
        });
    });
});
//# sourceMappingURL=abstractObjective.test.js.map