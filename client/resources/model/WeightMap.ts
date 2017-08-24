/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:44
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-17 12:44:28
*/

// Import Model Classes:
import { Memento }						from './Memento';
import { PrimitiveObjective } 			from './PrimitiveObjective';



/*
	This class is the representation of user assigned objective weights in a ValueChart. A Map object that associates objective ids with their
	assigned weights serves as the core of this class and the storage place of user weights. The class providers method that expand the functionality
	of the built-in Map class to provide weight normalization, consistent tracking of the weight total, and retrieving all objective weights in a
	specific order. This class should be used whenever information about user assigned waits needs to be recorded or represented. 
*/

export class WeightMap implements Memento {

	// ========================================================================================
	// 									Fields
	// ========================================================================================


	private weights: Map<string, number>;		// The internal map object used to associate objective ids with their assigned weight.
	private weightTotal: number;				// The total of all weights in the weights objective. This total is used for normalization.


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}	
		@description	Constructs a new, empty WeightMap object with a weight total of 0. Objective weights should be added manually using the 
						setObjectiveWeight method. 
	*/
	constructor() {
		this.weights = new Map<string, number>();
		this.weightTotal = 0;
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@returns {Map<string-number>} - The internal map used to store with weights with their associated objectives.
		@description	Returns the internal representation of weights used by this WeightMap. This method is most often used by change detection services 
						so that they may observe the internal weights storage map. It can also be used to obtain the internal map for manual iteration.
	*/
	getInternalWeightMap(): Map<string, number> {
		return this.weights;
	}

	/*
		@param newMap - A new internal map object for this WeightMap to use its source and storage for weights.
		@returns {void}	
		@description	Replaces the internal representation of weights used by this WeightMap with the one provided. This method can be used to replace
						all of WeightMaps internal weight assignments efficiently without having to construct a new WeightMap (thus creating a new memory reference).
	*/
	setInternalWeightMap(newMap: Map<string, number>): void {
		this.weights = newMap;
	}

	getObjectiveWeight(objectiveId: string): number {
		return this.weights.get(objectiveId);
	}

	getNormalizedObjectiveWeight(objectiveId: string): number {
		return this.weights.get(objectiveId) / this.weightTotal;
	}

	setObjectiveWeight(objectiveId: string, weight: number): void {
		var priorWeight: number = this.weights.get(objectiveId);
		if (priorWeight !== undefined) {
			this.weightTotal -= priorWeight;
		}

		this.weights.set(objectiveId, weight);
		this.weightTotal += weight;
	}

	removeObjectiveWeight(objectiveId: string): void {
		var priorWeight: number = this.weights.get(objectiveId);
		if (priorWeight !== undefined) {
			this.weightTotal -= priorWeight;
		}

		this.weights.delete(objectiveId);
	}


	/*
		@returns {number} - The total of the weights for all objectives in this WeightMap.	
		@description	Manually iterators over the internal weight representation to obtain the weight total. This method should NOT be used unless necessary 
						as it is inefficient and the WeightMap class correctly keeps track of the current weight total in the weightTotal field.
	*/
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

	/*
		@returns {number} - The total of the weights for all objectives in this WeightMap.	
		@description	Returns the total of all objective weights in the WeightMap as maintained by the class. This method should almost always be used rather than
						recalculateWeightTotal.
	*/
	getWeightTotal(): number {
		return this.weightTotal;
	}

	/*
		@param orderedObjectives - An array of Primitive objectives whose ordering will be used determine the ordering of the returned weights.
		@returns {number[]} - An array of weights ordered according to the array of objectives that was input.
		@description	Returns an ordered array of weights stored in the WeightMap. The order of the array depends on the order of the PrimitiveObjectives
						that were provided. If objective X is at index i in the input array, then the weight for that objective will be at index i in the output array.
	*/
	getObjectiveWeights(orderedObjectives: PrimitiveObjective[]): number[] {
		var orderedWeights: number[] = [];
		for (var i: number = 0; i < orderedObjectives.length; i++) {
			orderedWeights[i] = this.getObjectiveWeight(orderedObjectives[i].getId());
		}

		return orderedWeights
	}

	/*
		@param orderedObjectives - An array of Primitive objectives whose ordering will be used determine the ordering of the returned weights.
		@returns {number[]} - An array of normalized weights ordered according to the array of objectives that was input. Normalized means that weights sum to 1. Note that weights will only be normalized if the array of objectives includes all objectives in the weight map.
		@description	Returns an ordered array of normalized weights stored in the WeightMap. The order of the array depends on the order of the PrimitiveObjectives
						that were provided. If objective X is at index i in the input array, then the weight for that objective will be at index i in the output array.
						Note that weights will only be normalized if the array of objectives includes all objectives in the weight map. This method should only be used 
						when objectives weights must expressly be normalized and all of them must be obtained at once. Otherwise, getObjectiveWeights or getNormalizedObjectiveWeight should be used.
	*/
	getNormalizedWeights(orderedObjectives: PrimitiveObjective[]): number[] {
		var normalizedWeights: number[] = [];
		for (var i: number = 0; i < orderedObjectives.length; i++) {
			normalizedWeights[i] = this.weights.get(orderedObjectives[i].getId()) / this.weightTotal;
		}

		return normalizedWeights;
	}


	/*
		@returns void- 
		@description	Normalize all objective weights in the WeightMap so that they sum to 1. Update the internal 'weightTotal' field accordingly.
	*/
	normalize(): void {
		var objectiveIterator: Iterator<string> = this.weights.keys();
		var key: IteratorResult<string> = objectiveIterator.next();

		while (key.done === false) {
			this.weights.set(key.value, this.getNormalizedObjectiveWeight(key.value));
			key = objectiveIterator.next();
		}

		this.weightTotal = 1;
	}

	/*
		@returns {WeightMap} - A WeightMap that is an exact copy of this WeightMap.
		@description	Returns a copy (AKA a memento) of the WeightMap. This copy is stored in a different memory location and will not be changed if the original
						WeightMap is changed. This method should be used to create copies of WeightMaps when user weights needs to be preserved and stored.
	*/
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