/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:47:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-30 10:53:52
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

	var distance: PrimitiveObjective;

	var weather: AbstractObjective;
	var forcastedWeather: AbstractObjective;
	var forcastedTemperature: PrimitiveObjective;
	var forcastedPrecipitation: PrimitiveObjective;
	var forcastedHumidity: PrimitiveObjective;

	var currentWeather: AbstractObjective;
	var currentTemperature: PrimitiveObjective;
	var currentPrecipitation: PrimitiveObjective;
	var currentHumidity: PrimitiveObjective;

	var cost: AbstractObjective; 
	var costInTime: PrimitiveObjective;
	var costInMoney: PrimitiveObjective;

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
			alternativeOne = new Alternative("AlternativeOne", "A description goes here");
			alternativeTwo = new Alternative("AlternativeTwo", "A description goes here");
			alternativeThree = new Alternative("AlternativeThree", "A description goes here");
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

	describe('#removeRootObjective(objective: Objective)', () => {

		before(function() {
			valueChart = new ValueChart('TestChart', 'This is a test chart', 'Aaron');
			distance = new PrimitiveObjective("Distance", "A description goes here");
			weather = new AbstractObjective("Weather", "A description goes here");
			cost = new AbstractObjective("Cost", "A description goes here");
		});

		context('when there are no root Objectives', () => {
			it('should not remove an Objective', () => {
				expect(valueChart.getRootObjectives()).to.be.empty;;
				valueChart.removeRootObjective(distance);
				expect(valueChart.getRootObjectives()).to.be.empty;;
			});
		});

		context('when there is at least one root Objective', () => {

			before(function() {
				valueChart.addRootObjective(distance);
				valueChart.addRootObjective(weather);
			});

			it('should not remove an Objective that is not in the list of root Objectives', () => {
				expect(valueChart.getRootObjectives()).to.have.length(2);
				valueChart.removeRootObjective(cost);
				expect(valueChart.getRootObjectives()).to.have.length(2);
			});

			it('should remove an Objective that is in the list of Objectives', () => {
				expect(valueChart.getRootObjectives()).to.have.length(2);
				valueChart.removeRootObjective(weather);
				expect(valueChart.getRootObjectives()).to.have.length(1);
				expect(valueChart.getRootObjectives()[0]).to.deep.equal(distance);				
			});
		});
	});

	describe('Methods for getting Objectives', () => {
		
		before(function() {
			valueChart = new ValueChart('TestChart', 'This is a test chart', 'Aaron');

			forcastedWeather = new AbstractObjective('ForcastedWeather', 'A description goes here');
			forcastedTemperature = new PrimitiveObjective('Temperature', 'A description goes here');
			forcastedPrecipitation = new PrimitiveObjective('Prcepitation', 'A description goes here');
			forcastedHumidity = new PrimitiveObjective('Humidity', 'A description goes here');

			currentWeather = new AbstractObjective('CurrentWeather', 'A description goes here');
			currentTemperature = new PrimitiveObjective('Temperature', 'A description goes here');
			currentPrecipitation = new PrimitiveObjective('Precipitation', 'A description goes here');
			currentHumidity = new PrimitiveObjective('Humidity', 'A description goes here');

			costInTime = new PrimitiveObjective('TimeCost', 'A description goes here');
			costInMoney = new PrimitiveObjective('MoneyCost', 'A description goes here');


			valueChart.addRootObjective(distance);
			valueChart.addRootObjective(weather);

			weather.addSubObjective(forcastedWeather);
			weather.addSubObjective(currentWeather);

			forcastedWeather.addSubObjective(forcastedTemperature);
			forcastedWeather.addSubObjective(forcastedPrecipitation);
			forcastedWeather.addSubObjective(forcastedHumidity);

			currentWeather.addSubObjective(currentTemperature);
			currentWeather.addSubObjective(currentPrecipitation);
			currentWeather.addSubObjective(currentHumidity);

			valueChart.addRootObjective(cost);

			cost.addSubObjective(costInTime);
			cost.addSubObjective(costInMoney);
		});

		describe('getAllObjectives()', () => {
			it('should retrieve every Objective in the ValueCharts hierarchy of Objectives', () => {
				expect(valueChart.getAllObjectives()).to.have.length(13);
			});
		});

		describe('getAllPrimitiveObjectives()', () => {
			it('should retrive every PrimitiveObjective in the ValueCharts hierarcy of Objectives', () => {
				expect(valueChart.getAllPrimitiveObjectives()).to.have.length(9);
			}); 
			it('should retrieve only objectives of the type PrimitiveObjective', () => {
				var primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();
				for (var i: number = 0; i < primitiveObjectives.length; i++) {
					expect(primitiveObjectives[i].objectiveType).to.equal('primitive');
				}
			}); 
		});
	});
});
