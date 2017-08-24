/*
* @Author: aaronpmishkin
* @Date:   2017-05-24 14:05:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-24 14:07:54
*/

// Import Libraries:
import * as _											from 'lodash';



// Import Model Classes:
import { Objective }									from '../../client/resources/model/Objective';
import { User }											from '../../client/resources/model/User';
import { WeightMap }									from '../../client/resources/model/WeightMap';
import { PrimitiveObjective }							from '../../client/resources/model/PrimitiveObjective';
import { AbstractObjective }							from '../../client/resources/model/AbstractObjective';



export var randomizeUserWeights = (user: User, objectives: PrimitiveObjective[]): User => {
	objectives.forEach((objective: PrimitiveObjective) => {
		user.getWeightMap().setObjectiveWeight(objective.getId(), _.random(0,1));
	});

	return user;
}