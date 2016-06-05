/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-05 15:20:20
*/

export class Alternative {

	private name: string;
	private desciption: string;
	private objectiveValues: Map<string, string | number>;

	constructor(name: string, description: string) {
		this.name = name;
		this.desciption = description;
		this.objectiveValues = new Map<string, string | number>();
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
	}

	getDescription(): string {
		return this.desciption;
	}

	setDescription(desciption: string): void {
		this.desciption = desciption;
	}

	getObjectiveValue(objectiveName: string): string | number {
		return this.objectiveValues.get(objectiveName);
	}

	setObjectiveValue(objectiveName: string, value: string | number): void {
		this.objectiveValues.set(objectiveName, value);
	}

	removeObjective(objectiveName: string): void {
		this.objectiveValues.delete(objectiveName);
	}
}