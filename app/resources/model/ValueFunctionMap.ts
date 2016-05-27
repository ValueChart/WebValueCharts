/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:53
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 15:28:43
*/

import { ValueFunction } 			from './ValueFunction';
import { PrimitiveObjective } 		from './PrimitiveObjective';


export class ValueFunctionMap {
	
	private valueFunctions: Map<PrimitiveObjective, ValueFunction>;

	constructor() {
		this.valueFunctions = new Map<PrimitiveObjective, ValueFunction>();
	}

	getObjectiveValueFunction(objective: PrimitiveObjective): ValueFunction {
		return this.valueFunctions.get(objective);
	}

	setObjectiveValueFunction(objective: PrimitiveObjective, ValueFunction: ValueFunction): void {
		this.valueFunctions.set(objective, ValueFunction);
	}

	removeObjectiveValueFunction(objective: PrimitiveObjective): void {
		this.valueFunctions.delete(objective);
	}
}