/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:47:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 14:16:39
*/


import { ValueChart } 			from '../../app/resources/model/ValueChart';
import { Alternative } 			from '../../app/resources/model/Alternative';
import { User } 				from '../../app/resources/model/User';
import { Objective } 			from '../../app/resources/model/Objective';
import { PrimitiveObjective } 	from '../../app/resources/model/PrimitiveObjective';
import { AbstractObjective } 	from '../../app/resources/model/AbstractObjective';


declare var expect: any;


describe('ValueChart', () => {
	var valueChart: ValueChart;
	var alternativeOne: Alternative;
	var alternativeTwo: Alternative;
	var alternativeThree: Alternative;

	var objectiveOne: PrimitiveObjective;
	var objectiveTwo: AbstractObjective;
	var objectiveThree: AbstractObjective; 

	describe('#constructor(name: string, description: string, creator: string)', () => {

		context('when constructor is used', () => {
			it('should have a name, description and creator', () => {
				valueChart = new ValueChart('TestChart', 'This is a test chart', 'Aaron');
				expect(valueChart.getName()).to.equal('TestChart');
				expect(valueChart.getDescription()).to.equal('This is a test chart');
				expect(valueChart.getCreator()).to.equal('Aaron');
			});
		});

	});

	describe('#removeAlternative(alternative: Alternative)', () => {

		before(function() {
			alternativeOne = new Alternative("AlternativeOne", "A descriptiong goes here");
			alternativeTwo = new Alternative("AlternativeTwo", "A descriptiong goes here");
			alternativeThree = new Alternative("AlternativeThree", "A descriptiong goes here");
		});

		context('when there are no Alternatives', () => {
			it('should not remove a Alternative', () => {
				expect(valueChart.getAlternatives()).to.be.empty;;
				valueChart.removeAlternative(alternativeOne);
				expect(valueChart.getAlternatives()).to.be.empty;;
			});
		});

		context('when there is at least one Alternative', () => {

			before(function() {
				valueChart.addAlternative(alternativeOne);
				valueChart.addAlternative(alternativeTwo);
			});

			it('should not remove an Alternative that is not in the list of Alternatives', () => {
				expect(valueChart.getAlternatives()).to.have.length(2);
				valueChart.removeAlternative(alternativeThree);
				expect(valueChart.getAlternatives()).to.have.length(2);
			});

			it('should remove an Alternative that is in the list of Alternatives', () => {
				expect(valueChart.getAlternatives()).to.have.length(2);
				valueChart.removeAlternative(alternativeTwo);
				expect(valueChart.getAlternatives()).to.have.length(1);
				expect(valueChart.getAlternatives()[0]).to.deep.equal(alternativeOne);
			});
		});
	});

	describe('#removeObjective(objective: Objective)', () => {

		before(function() {
			objectiveOne = new PrimitiveObjective("ObjectiveOne", "A descriptiong goes here");
			objectiveTwo = new AbstractObjective("ObjectiveTwo", "A descriptiong goes here");
			objectiveThree = new AbstractObjective("ObjectiveThree", "A descriptiong goes here");
		});

		context('when there are no Objectives', () => {
			it('should not remove a Objective', () => {
				expect(valueChart.getObjectives()).to.be.empty;;
				valueChart.removeObjective(objectiveOne);
				expect(valueChart.getObjectives()).to.be.empty;;
			});
		});

		context('when there is at least one Objective', () => {

			before(function() {
				valueChart.addObjective(objectiveOne);
				valueChart.addObjective(objectiveTwo);
			});

			it('should not remove an Objective that is not in the list of Objectives', () => {
				expect(valueChart.getObjectives()).to.have.length(2);
				valueChart.removeObjective(objectiveThree);
				expect(valueChart.getObjectives()).to.have.length(2);
			});

			it('should remove an Objective that is in the list of Objectives', () => {
				expect(valueChart.getObjectives()).to.have.length(2);
				valueChart.removeObjective(objectiveTwo);
				expect(valueChart.getObjectives()).to.have.length(1);
				expect(valueChart.getObjectives()[0]).to.deep.equal(objectiveOne);				
			});
		});
	});
});
