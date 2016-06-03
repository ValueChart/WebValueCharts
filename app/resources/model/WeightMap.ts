/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:44
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-03 10:45:15
*/

import { PrimitiveObjective } 			from './PrimitiveObjective';


export class WeightMap {

	private weights: Map<PrimitiveObjective, number>;
	private weightTotal: number;

	constructor() {
		this.weights = new Map<PrimitiveObjective, number>();
		this.weightTotal = 0;
	}

	getObjectiveWeight(objective: PrimitiveObjective): number {
		return this.weights.get(objective);
	}

	getNormalizedObjectiveWeight(objective: PrimitiveObjective): number {
		return this.weights.get(objective) / this.weightTotal;
	}

	setObjectiveWeight(objective: PrimitiveObjective, weight: number): void {
		var priorWeight: number = this.weights.get(objective);
		if (priorWeight !== undefined) {
			this.weightTotal -= priorWeight;
		}

		this.weights.set(objective, weight);
		this.weightTotal += weight;
	}

	removeObjectiveWeight(objective: PrimitiveObjective): void {
		var priorWeight: number = this.weights.get(objective);
		if (priorWeight !== undefined) {
			this.weightTotal -= priorWeight;
		}

		this.weights.delete(objective);
	}

	recalculateWeightTotal(): number {
		var weightIterator: Iterator<number> = this.weights.values();
		var weight: IteratorResult<number> = weightIterator.next();
		var sumOfWeights = 0;

		while (weight.done === false) {
			sumOfWeights += weight.value;
			weight = weightIterator.next();
		}

		return sumOfWeights;
	}

	getWeightTotal(): number {
		return this.weightTotal;
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
		for (var i: number = 0; i < orderedObjectives.length; i++) {
			normalizedWeights[i] = this.weights.get(orderedObjectives[i]) / this.weightTotal;
		}

		return normalizedWeights;
	}

}