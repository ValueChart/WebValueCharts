/*
* @Author: aaronpmishkin
* @Date:   2017-05-24 14:05:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-25 14:39:35
*/

// Import Libraries:
import * as _											from 'lodash';



// Import Model Classes:
import { ValueChart }									from '../../client/src/model';
import { Objective }									from '../../client/src/model';
import { User }											from '../../client/src/model';
import { WeightMap }									from '../../client/src/model';
import { PrimitiveObjective }							from '../../client/src/model';
import { AbstractObjective }							from '../../client/src/model';



export var randomizeUserWeights = (user: User, valueChart: ValueChart): User => {
	valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective) => {
		user.getWeightMap().setObjectiveWeight(objective.getName(), _.round(_.random(true), 3));
	});

	user.getWeightMap().normalize();

	return user;
};

export var randomizeUserScoreFunction = (user: User, objective: PrimitiveObjective): User => {
	let	scoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
	let elements = scoreFunction.getAllElements();

	elements.forEach((element) => {
		scoreFunction.setElementScore(element, _.round(_.random(true), 3));
	});
	scoreFunction.rescale();

	return user;
};

export var randomizeAllUserScoreFunctions  = (user: User, valueChart: ValueChart) => {
	valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective) => {
		user = randomizeUserScoreFunction(user, objective);
	});

	return user;
};

export var rgbaToHex = (rgb: any) => {
 	rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 	return (rgb && rgb.length === 4) ? "#" +
  		("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  		("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  		("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
};