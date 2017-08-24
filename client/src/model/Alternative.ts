/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 16:58:49
*/

// Import Utility Classes:
import * as Formatter			from '../app/utilities/Formatter';
import * as _					from 'lodash';

/*
	This class is the data representation of a decision option in a ValueChart. It uses an internal map object to associate 
	decision consequences with PrimitiveObjectives in the ValueChart. Each instance of the Alternative class must be a complete 
	mapping of a consequence to each PrimitiveObjective in the ValueChart to be valid, and each consequence must be within the 
	domain of the corresponding PrimitiveObjective. It is best to think about Alternatives as points in the consequence space 
	defined by the ValueChart's set of PrimitiveObjectives.
*/

export class Alternative {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private name: string;									// The name of the Alternative
	private id: string;										// The name of the Alternative formatted for use as a HTML id.
	private description: string;							// The description of the alternative.
	private objectiveValues: Map<string, string | number>;	// The internal Map objective used to match consequences to the id of the associated PrimitiveObjective.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@param name - The name of the Alternative.
		@param description - The description of the Alternative.
		@returns {void}	
		@description	Constructs a new Alternative with no consequences. Objective consequences for the new 
						Alternative must he added manually using the setObjectiveValue method.
	*/
	constructor(name: string, description: string) {
		this.name = name;
		this.description = description;
		this.objectiveValues = new Map<string, string | number>();
		this.id = _.uniqueId(Formatter.nameToID(this.name) + '_');
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	getId(): string {
		return this.id;
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
	}

	getDescription(): string {
		return this.description;
	}

	setDescription(description: string): void {
		this.description = description;
	}

	getObjectiveValue(objectiveId: string): string | number {
		return this.objectiveValues.get(objectiveId);
	}

	/*
		@returns {{ objectiveId: string, value: string | number }[]} - The collection of the Alternative's consequence paired with the associated objective's id.
		@description	Iterates over the objectiveValues to return an array of objective ids paired with the Alternative's 
						consequence for that objective.
	*/
	getAllObjectiveValuePairs(): { objectiveId: string, value: string | number }[] {
		var objectiveValuePairs: { objectiveId: string, value: string | number }[] = [];

		var mapIterator: Iterator<string> = this.objectiveValues.keys();
		var iteratorElement: IteratorResult<string> = mapIterator.next();

		while (iteratorElement.done === false) {
			objectiveValuePairs.push({ objectiveId: iteratorElement.value, value: this.objectiveValues.get(iteratorElement.value) });
			iteratorElement = mapIterator.next();
		}

		return objectiveValuePairs;
	}

	getObjectiveKeys(): string[] {
		var objectiveKeys = [];

		var mapIterator: Iterator<string> = this.objectiveValues.keys();
		var iteratorElement: IteratorResult<string> = mapIterator.next();

		while (iteratorElement.done === false) {
			objectiveKeys.push(iteratorElement.value);
			iteratorElement = mapIterator.next();
		}

		return objectiveKeys;
	}

	setObjectiveValue(objectiveId: string, value: string | number): void {
		this.objectiveValues.set(objectiveId, value);
	}

	removeObjective(objectiveId: string): void {
		this.objectiveValues.delete(objectiveId);
	}
}