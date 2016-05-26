/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-26 13:39:34
*/


import { PrimitiveObjective } 		from './PrimitiveObjective';


export class Alternative {

	private name: string;
	private desciption: string;
	private objectiveValues: Map<PrimitiveObjective, string | number>;

	constructor(name: string, description: string) {
		this.name = name;
		this.desciption = description;
		this.objectiveValues = new Map<PrimitiveObjective, string | number>();
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

	getObjectiveValue(objective: PrimitiveObjective): string | number {
		return this.objectiveValues.get(objective);
	}

	setObjectiveValue(objective: PrimitiveObjective, value: string | number): void {
		this.objectiveValues.set(objective, value);
	}

	removeObjective(objective: PrimitiveObjective): void {
		this.objectiveValues.delete(objective);
	}
}