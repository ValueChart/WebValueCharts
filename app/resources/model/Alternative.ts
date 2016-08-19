/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-27 12:19:08
*/

import *	as Formatter																	from '../utilities/Formatter';

export class Alternative {

	private id: string;
	private name: string;
	private description: string;
	private objectiveValues: Map<string, string | number>;

	constructor(name: string, description: string) {
		this.name = name;
		this.description = description;
		this.objectiveValues = new Map<string, string | number>();
		this.id = Formatter.nameToID(this.name);
	}

	getID(): string {
		return this.id;
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
		this.id = Formatter.nameToID(this.name);
	}

	getDescription(): string {
		return this.description;
	}

	setDescription(description: string): void {
		this.description = description;
	}

	getObjectiveValue(objectiveName: string): string | number {
		return this.objectiveValues.get(objectiveName);
	}

	getAllObjectiveValuePairs(): { objectiveName: string, value: string | number }[] {
		var objectiveValuePairs: { objectiveName: string, value: string | number }[] = [];

		var mapIterator: Iterator<string> = this.objectiveValues.keys();
		var iteratorElement: IteratorResult<string> = mapIterator.next();

		while (iteratorElement.done === false) {
			objectiveValuePairs.push({ objectiveName: iteratorElement.value, value: this.objectiveValues.get(iteratorElement.value) });
			iteratorElement = mapIterator.next();
		}

		return objectiveValuePairs;
	}

	setObjectiveValue(objectiveName: string, value: string | number): void {
		this.objectiveValues.set(objectiveName, value);
	}

	removeObjective(objectiveName: string): void {
		this.objectiveValues.delete(objectiveName);
	}
}