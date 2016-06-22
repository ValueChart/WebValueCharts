/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:44
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-22 10:17:02
*/

import { Memento }						from './Memento'; 
import { PrimitiveObjective } 			from './PrimitiveObjective';


export class WeightMap implements Memento {

	private weights: Map<string, number>;
	private weightTotal: number;

	constructor() {
		this.weights = new Map<string, number>();
		this.weightTotal = 0;
	}

	getInternalWeightMap(): Map<string, number> {
		return this.weights;
	}

	setInternalWeightMap(newMap: Map<string, number>): void {
		this.weights = newMap;
	}

	getObjectiveWeight(objectiveName: string): number {
		return this.weights.get(objectiveName);
	}

	getNormalizedObjectiveWeight(objectiveName: string): number {
		return this.weights.get(objectiveName) / this.weightTotal;
	}

	setObjectiveWeight(objectiveName: string, weight: number): void {
		var priorWeight: number = this.weights.get(objectiveName);
		if (priorWeight !== undefined) {
			this.weightTotal -= priorWeight;
		}

		this.weights.set(objectiveName, weight);
		this.weightTotal += weight;
	}

	removeObjectiveWeight(objectiveName: string): void {
		var priorWeight: number = this.weights.get(objectiveName);
		if (priorWeight !== undefined) {
			this.weightTotal -= priorWeight;
		}

		this.weights.delete(objectiveName);
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
			orderedWeights[i] = this.getObjectiveWeight(orderedObjectives[i].getName());
		}

		return orderedWeights
	}

	getNormalizedWeights(orderedObjectives: PrimitiveObjective[]): number[] {
		var normalizedWeights: number[] = [];
		for (var i: number = 0; i < orderedObjectives.length; i++) {
			normalizedWeights[i] = this.weights.get(orderedObjectives[i].getName()) / this.weightTotal;
		}

		return normalizedWeights;
	}

	getMemento(): WeightMap {
		// Create a new WeightMap object.
		var weightMapCopy: WeightMap = new WeightMap();
		// COpy over all the properties from the WeightMap that is being saved.
		Object.assign(weightMapCopy, this);
		// Create a new internal map object.
		var internalMapCopy = new Map<string, number>();

		// Copy the internal map values we want to save to the new internal map.
		this.getInternalWeightMap().forEach((value: number, key: string) => {
			internalMapCopy.set(key, value);
		});

		// Set the internal map of the WeightMap to the copy we just made. This is important, as otherwise the internal map in the new WeightMap will be
		// a reference to the internal map in the in-use WeightMap. This means that any further changes could overwrite our saved copy.
		weightMapCopy.setInternalWeightMap(internalMapCopy);

		return weightMapCopy;
	}

}