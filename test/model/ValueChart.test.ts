/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:47:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-28 10:44:27
*/


import { ValueChart } 			from '../../app/resources/model/ValueChart';
import { Alternative } 			from '../../app/resources/model/Alternative';
import { User } 				from '../../app/resources/model/User';
import { Objective } 			from '../../app/resources/model/Objective';
import { PrimitiveObjective } 	from '../../app/resources/model/PrimitiveObjective';
import { AbstractObjective } 	from '../../app/resources/model/AbstractObjective';
import { WeightMap }			from '../../app/resources/model/WeightMap';


var expect: any = require('chai').expect;
;

describe('ValueChart', () => {

	context('Individual ValueChart Methods:', () => {

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

	context('Group Value Chart Methods:', () => {
		// Constants:

		// Aaron
		var aaronDistanceWeight: number = 1;
		var aaronTemperatureWeight: number = 1;
		var aaronPrecipitationWeight: number = 1;
		var aaronHumidityWeight: number = 1;
		var aaronCostInTimeWeight: number = 1;
		var aaronCostInMoneyWeight: number = 1;

		// Samuel
		var samuelDistanceWeight: number = 2;
		var samuelTemperatureWeight: number = 2;
		var samuelPrecipitationWeight: number = 3;
		var samuelHumidityWeight: number = 2;
		var samuelCostInTimeWeight: number = 1;
		var samuelCostInMoneyWeight: number = 1;

		// Emily
		var emilyDistanceWeight: number = 1;
		var emilyTemperatureWeight: number = 1;
		var emilyPrecipitationWeight: number = 1;
		var emilyHumidityWeight: number = 1;
		var emilyCostInTimeWeight: number = 6;
		var emilyCostInMoneyWeight: number = 6;

		var aaronTotalWeight: number = 6
		var samueTotallWeight: number = 11;
		var emilyTotalWeight: number = 16;

		// Variables:

		var roundingError: number;

		var groupValueChart: ValueChart;

		var aaron: User;
		var samuel: User;
		var emily: User;

		var aaronWeightMap: WeightMap;
		var samuelWeightMap: WeightMap;
		var emilyWeightMap: WeightMap;

		var weather: AbstractObjective;
		var distance: PrimitiveObjective;

		var temperature: PrimitiveObjective;
		var precipitation: PrimitiveObjective;
		var humidity: PrimitiveObjective;

		var cost: AbstractObjective;
		var costInTime: PrimitiveObjective;
		var costInMoney: PrimitiveObjective;


		before(function() {

			roundingError = 0.0001;

			groupValueChart = new ValueChart('TestValueChart', 'This is for testing', 'aaron');

			aaron = new User('aaron');
			samuel = new User('samuel');
			emily = new User('emily');

			aaronWeightMap = new WeightMap();
			samuelWeightMap = new WeightMap();
			emilyWeightMap = new WeightMap();

			distance = new PrimitiveObjective("Distance", "A description goes here");
			weather = new AbstractObjective("Weather", "A description goes here");
			cost = new AbstractObjective("Cost", "A description goes here");

			temperature = new PrimitiveObjective('Temperature', 'A description goes here');
			precipitation = new PrimitiveObjective('Precipitation', 'A description goes here');
			humidity = new PrimitiveObjective('Humidity', 'A description goes here');

			costInTime = new PrimitiveObjective('TimeCost', 'A description goes here');
			costInMoney = new PrimitiveObjective('MoneyCost', 'A description goes here');

			groupValueChart.addRootObjective(distance);
			groupValueChart.addRootObjective(weather);
			groupValueChart.addRootObjective(cost);

			weather.addSubObjective(temperature);
			weather.addSubObjective(precipitation);
			weather.addSubObjective(humidity);

			cost.addSubObjective(costInTime);
			cost.addSubObjective(costInMoney);
		});

		describe('calculateAverageWeightMap()', () => {

			before(function() {
				aaronWeightMap.setObjectiveWeight(distance.getName(), aaronDistanceWeight);
				aaronWeightMap.setObjectiveWeight(temperature.getName(), aaronTemperatureWeight);
				aaronWeightMap.setObjectiveWeight(precipitation.getName(), aaronPrecipitationWeight);
				aaronWeightMap.setObjectiveWeight(humidity.getName(), aaronHumidityWeight);
				aaronWeightMap.setObjectiveWeight(costInMoney.getName(), aaronCostInMoneyWeight);
				aaronWeightMap.setObjectiveWeight(costInTime.getName(), aaronCostInTimeWeight);

				samuelWeightMap.setObjectiveWeight(distance.getName(), samuelDistanceWeight);
				samuelWeightMap.setObjectiveWeight(temperature.getName(), samuelTemperatureWeight);
				samuelWeightMap.setObjectiveWeight(precipitation.getName(), samuelPrecipitationWeight);
				samuelWeightMap.setObjectiveWeight(humidity.getName(), samuelHumidityWeight);
				samuelWeightMap.setObjectiveWeight(costInMoney.getName(), samuelCostInMoneyWeight);
				samuelWeightMap.setObjectiveWeight(costInTime.getName(), samuelCostInTimeWeight);

				emilyWeightMap.setObjectiveWeight(distance.getName(), emilyDistanceWeight);
				emilyWeightMap.setObjectiveWeight(temperature.getName(), emilyTemperatureWeight);
				emilyWeightMap.setObjectiveWeight(precipitation.getName(), emilyPrecipitationWeight);
				emilyWeightMap.setObjectiveWeight(humidity.getName(), emilyHumidityWeight);
				emilyWeightMap.setObjectiveWeight(costInMoney.getName(), emilyCostInMoneyWeight);
				emilyWeightMap.setObjectiveWeight(costInTime.getName(), emilyCostInTimeWeight);

				aaron.setWeightMap(aaronWeightMap);
				samuel.setWeightMap(samuelWeightMap);
				emily.setWeightMap(emilyWeightMap);
			});

			context('When there is only one user', () => {

				before(function() {
					groupValueChart.addUser(aaron);
				});

				it('should produce a weight map that is the same as that users', () => {
					var averageWeightMap: WeightMap = groupValueChart.calculateAverageWeightMap();

					expect(averageWeightMap.getObjectiveWeight(distance.getName())).to.be.closeTo( 		aaronDistanceWeight 	/ aaronTotalWeight, roundingError);
					expect(averageWeightMap.getObjectiveWeight(temperature.getName())).to.be.closeTo( 	aaronTemperatureWeight 	/ aaronTotalWeight, roundingError);
					expect(averageWeightMap.getObjectiveWeight(precipitation.getName())).to.be.closeTo( 	aaronPrecipitationWeight/ aaronTotalWeight, roundingError);
					expect(averageWeightMap.getObjectiveWeight(humidity.getName())).to.be.closeTo( 		aaronHumidityWeight 	/ aaronTotalWeight, roundingError);
					expect(averageWeightMap.getObjectiveWeight(costInMoney.getName())).to.be.closeTo( 	aaronCostInMoneyWeight 	/ aaronTotalWeight, roundingError);
					expect(averageWeightMap.getObjectiveWeight(costInTime.getName())).to.be.closeTo( 		aaronCostInTimeWeight 	/ aaronTotalWeight, roundingError);
				});

			});

			context('When there are two users', () => {

				before(function() {
					groupValueChart.setUsers([aaron, samuel]);
				});

				it('should produce a weight map that is an average of the two users', () => {
					var averageWeightMap: WeightMap = groupValueChart.calculateAverageWeightMap();

					expect(averageWeightMap.getObjectiveWeight(distance.getName())).to.be.closeTo((( 		aaronDistanceWeight 	/ aaronTotalWeight ) + ( samuelDistanceWeight 	/ samueTotallWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(temperature.getName())).to.be.closeTo((( 	aaronTemperatureWeight 	/ aaronTotalWeight ) + ( samuelTemperatureWeight/ samueTotallWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(precipitation.getName())).to.be.closeTo((( aaronPrecipitationWeight/ aaronTotalWeight ) + ( samuelPrecipitationWeight/ samueTotallWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(humidity.getName())).to.be.closeTo((( 		aaronHumidityWeight 	/ aaronTotalWeight ) + ( samuelHumidityWeight 	/ samueTotallWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(costInMoney.getName())).to.be.closeTo((( 	aaronCostInMoneyWeight 	/ aaronTotalWeight ) + ( samuelCostInMoneyWeight/ samueTotallWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(costInTime.getName())).to.be.closeTo((( 	aaronCostInTimeWeight 	/ aaronTotalWeight ) + ( samuelCostInTimeWeight / samueTotallWeight )) / groupValueChart.getUsers().length, roundingError);

				});

			});

			context('When there are more than two users', () => {

				before(function() {
					groupValueChart.setUsers([aaron, samuel, emily]);
				});

				it('should produce a weight map that is an average of the two users', () => {
					var averageWeightMap: WeightMap = groupValueChart.calculateAverageWeightMap();

					expect(averageWeightMap.getObjectiveWeight(distance.getName())).to.be.closeTo((( 		aaronDistanceWeight 	/ aaronTotalWeight ) + ( samuelDistanceWeight 	/ samueTotallWeight ) + ( emilyDistanceWeight 		/ emilyTotalWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(temperature.getName())).to.be.closeTo((( 	aaronTemperatureWeight 	/ aaronTotalWeight ) + ( samuelTemperatureWeight/ samueTotallWeight ) + ( emilyTemperatureWeight 	/ emilyTotalWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(precipitation.getName())).to.be.closeTo((( aaronPrecipitationWeight/ aaronTotalWeight ) + ( samuelPrecipitationWeight/ samueTotallWeight ) + ( emilyPrecipitationWeight 	/ emilyTotalWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(humidity.getName())).to.be.closeTo((( 		aaronHumidityWeight 	/ aaronTotalWeight ) + ( samuelHumidityWeight 	/ samueTotallWeight ) + ( emilyHumidityWeight 		/ emilyTotalWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(costInMoney.getName())).to.be.closeTo((( 	aaronCostInMoneyWeight 	/ aaronTotalWeight ) + ( samuelCostInMoneyWeight/ samueTotallWeight ) + ( emilyCostInMoneyWeight 	/ emilyTotalWeight )) / groupValueChart.getUsers().length, roundingError);
					expect(averageWeightMap.getObjectiveWeight(costInTime.getName())).to.be.closeTo((( 	aaronCostInTimeWeight 	/ aaronTotalWeight ) + ( samuelCostInTimeWeight / samueTotallWeight ) + ( emilyCostInTimeWeight 	/ emilyTotalWeight )) / groupValueChart.getUsers().length, roundingError);

				});
			});
		});

	});
});
