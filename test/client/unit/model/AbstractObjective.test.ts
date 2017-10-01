/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 09:05:58
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:54
*/

import { AbstractObjective } 	from '../../../../client/src/model';
import { PrimitiveObjective } 	from '../../../../client/src/model';
import { Objective } 			from '../../../../client/src/model';

import { expect }				from 'chai';


describe('AbstractObjective', () => {
	var rootObjectve: AbstractObjective;
	var distance: PrimitiveObjective;
	var elevation: PrimitiveObjective;
	var weather: AbstractObjective;
	var precipitation: AbstractObjective;
	var forecast: AbstractObjective;
	var type: PrimitiveObjective;
	var temperature: PrimitiveObjective;
	var amount: PrimitiveObjective;
	var accuracy: PrimitiveObjective;
	var prediction: PrimitiveObjective;

	before(function() {
		distance = new PrimitiveObjective('distance', 'A description goes here')
		weather = new AbstractObjective('weather', 'A description goes here');
		elevation = new PrimitiveObjective('elevation', 'A description goes here');
	});

	describe('#constructor(name: string, description: string)', () => {

		context('when constructor is used', () => {
			it('should have a name, and description', () => {
				rootObjectve = new AbstractObjective('rootObjective', 'A description goes here');
				expect(rootObjectve.getName()).to.equal('rootObjective');
				expect(rootObjectve.getDescription()).to.equal('A description goes here');
			});
		});

	});

	describe('#removeSubObjective(objective: Objective)', () => {

		context('when there are no subObjectives', () => {
			it('should not remove a subObjective', () => {
				expect(rootObjectve.getDirectSubObjectives()).to.be.empty;;
				rootObjectve.removeSubObjective(distance);
				expect(rootObjectve.getDirectSubObjectives()).to.be.empty;;
			});
		});

		context('when there is at least one subObjective', () => {

			before(function() {
				rootObjectve.addSubObjective(distance);
				rootObjectve.addSubObjective(weather);
			})

			it('should not remove an objective that is not in the list of subObjectives', () => {
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
				rootObjectve.removeSubObjective(elevation);
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
			});

			it('should remove an objective that is in the list of subObjectives', () => {
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(2);
				rootObjectve.removeSubObjective(distance);
				expect(rootObjectve.getDirectSubObjectives()).to.have.length(1);
				expect(rootObjectve.getDirectSubObjectives()[0]).to.deep.equal(weather);
			});
		});
	});

	describe('#getAllSubObjectives()', () => {

		before(function() {
			rootObjectve = new AbstractObjective('RootObjective', 'A description goes here');
			rootObjectve.addSubObjective(weather);
			rootObjectve.addSubObjective(distance);
			weather.addSubObjective(elevation);
		});

		context('when at least one subObjective has subObjectives of its own', () => {
			it('should retrieve all the subObjectives, including those of the children', () => {
				expect(rootObjectve.getAllSubObjectives()).to.have.length(3);
			});
		});

		context('when the hierarchy of objectives is complex', () => {

			before(function() {
				rootObjectve = new AbstractObjective('RootObjective', 'A description goes here');
				distance = new PrimitiveObjective('distance', 'A description goes here')
				weather = new AbstractObjective('weather', 'A description goes here');
				elevation = new PrimitiveObjective('elevation', 'A description goes here');
				precipitation = new AbstractObjective('Precipitation', 'A description goes here');
				forecast = new AbstractObjective('Forecast', 'A description goes here');
				type = new PrimitiveObjective('Type', 'A description goes here');
				temperature = new PrimitiveObjective('Temperature', 'A description goes here');		
				amount = new PrimitiveObjective('Amount', 'A description goes here');		
				accuracy = new PrimitiveObjective('Accuracy', 'A description goes here');		
				prediction = new PrimitiveObjective('Prediction', 'A description goes here');		

				// Level two
				rootObjectve.addSubObjective(distance);
				rootObjectve.addSubObjective(weather);
				weather.addSubObjective(elevation);

				// Level Three
				weather.addSubObjective(temperature);
				weather.addSubObjective(precipitation);
				weather.addSubObjective(forecast);

				// Level Four
				precipitation.addSubObjective(type);
				precipitation.addSubObjective(amount);
				forecast.addSubObjective(accuracy);
				forecast.addSubObjective(prediction);
			});

			it('should still retrieve all of the subObjectives in the hierarchy', () => {
				expect(rootObjectve.getAllSubObjectives()).to.have.length(10);
			});
		});
	});

	describe('getAllPrimitiveSubObjectives()', () => {

		context('when the hierarchy of objectives is complex', () => {

			before(function() {
				rootObjectve = new AbstractObjective('RootObjective', 'A description goes here');
				distance = new PrimitiveObjective('distance', 'A description goes here')
				weather = new AbstractObjective('weather', 'A description goes here');
				elevation = new PrimitiveObjective('elevation', 'A description goes here');
				precipitation = new AbstractObjective('Precipitation', 'A description goes here');
				forecast = new AbstractObjective('Forecast', 'A description goes here');
				type = new PrimitiveObjective('Type', 'A description goes here');
				temperature = new PrimitiveObjective('Temperature', 'A description goes here');
				amount = new PrimitiveObjective('Amount', 'A description goes here');
				accuracy = new PrimitiveObjective('Accuracy', 'A description goes here');
				prediction = new PrimitiveObjective('Prediction', 'A description goes here');

				// Level two
				rootObjectve.addSubObjective(distance);
				rootObjectve.addSubObjective(weather);
				weather.addSubObjective(elevation);

				// Level Three
				weather.addSubObjective(temperature);
				weather.addSubObjective(precipitation);
				weather.addSubObjective(forecast);

				// Level Four
				precipitation.addSubObjective(type);
				precipitation.addSubObjective(amount);
				forecast.addSubObjective(accuracy);
				forecast.addSubObjective(prediction);
			});

			it('should still retrieve all of the subObjectives in the hierarchy', () => {
				var primitiveObjectives: PrimitiveObjective[] = rootObjectve.getAllPrimitiveSubObjectives();

				expect(primitiveObjectives).to.have.length(7);
				expect(primitiveObjectives).to.include(amount);
				expect(primitiveObjectives).to.include(accuracy);
				expect(primitiveObjectives).to.include(prediction);
				expect(primitiveObjectives).to.include(temperature);
				expect(primitiveObjectives).to.include(type);
				expect(primitiveObjectives).to.include(elevation);
				expect(primitiveObjectives).to.include(distance);
			});
		});

	});
});




