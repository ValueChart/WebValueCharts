/*
* @Author: aaronpmishkin
* @Date:   2016-05-30 09:31:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-05 15:33:52
*/

import { GroupValueChart } 		from '../../app/resources/model/GroupValueChart';
import { User } 				from '../../app/resources/model/User';
import { WeightMap }			from '../../app/resources/model/WeightMap';
import { Objective }	from '../../app/resources/model/Objective';
import { PrimitiveObjective }	from '../../app/resources/model/PrimitiveObjective';
import { AbstractObjective }	from '../../app/resources/model/AbstractObjective';


declare var expect: any;

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

describe('GroupValueChart', () => {

	var roundingError: number;

	var groupValueChart: GroupValueChart;

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

		groupValueChart = new GroupValueChart('TestGroupValueChart', 'This is for testing', 'aaron');

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