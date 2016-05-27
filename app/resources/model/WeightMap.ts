/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:44
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 12:35:30
*/

import { PrimitiveObjective } 			from './PrimitiveObjective';


export class WeightMap {

	private weights: Map<PrimitiveObjective, number>;

	constructor() {
		this.weights = new Map<PrimitiveObjective, number>();
	}

	getObjectiveWeight(objective: PrimitiveObjective): number {
		return this.weights.get(objective);
	}

	setObjectiveWeight(objective: PrimitiveObjective, weight: number): void {
		this.weights.set(objective, weight);
	}

	removeObjectiveWeight(objective: PrimitiveObjective): void {
		this.weights.delete(objective);
	}

	// orderedObjectives is an array of Primitive objectives whose ordering will determine the ordering of the returned weights.
	getObjectiveWeights(orderedObjectives: PrimitiveObjective[]): number[] {
		var orderedWeights: number[] = [];
		for (var i: number = 0; i < orderedObjectives.length; i++) {
			orderedWeights[i] = this.getObjectiveWeight(orderedObjectives[i]);
		}
		return orderedWeights
	}

	getNormalizedWeights(orderedObjectives: PrimitiveObjective[]): number[] {
		var normalizedWeights: number[] = [];
		var weightTotal: number = 0;
		for (var i: number = 0; i < orderedObjectives.length; i++) {
			normalizedWeights[i] = this.getObjectiveWeight(orderedObjectives[i]);
			weightTotal += normalizedWeights[i];
		}
		
		for (var i: number = 0; i < normalizedWeights.length; i++) {
			normalizedWeights[i] = normalizedWeights[i] / weightTotal;
		}

		return normalizedWeights;
	}

}