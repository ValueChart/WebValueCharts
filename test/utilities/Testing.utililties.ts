/*
* @Author: aaronpmishkin
* @Date:   2017-05-24 14:05:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-24 14:07:54
*/

// Import Libraries:
import * as _											from 'lodash';



// Import Model Classes:
import { Objective }									from '../../client/src/model';
import { User }											from '../../client/src/model';
import { WeightMap }									from '../../client/src/model';
import { PrimitiveObjective }							from '../../client/src/model';
import { AbstractObjective }							from '../../client/src/model';



export var randomizeUserWeights = (user: User, objectives: PrimitiveObjective[]): User => {
	objectives.forEach((objective: PrimitiveObjective) => {
		user.getWeightMap().setObjectiveWeight(objective.getName(), _.random(0,1));
	});

	return user;
}