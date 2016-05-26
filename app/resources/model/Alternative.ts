/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 17:12:29
*/


import { Objective } 		from './Objective';


export class Alternative {

	private name: string;
	private desciption: string;
	private objectiveValues: Map<Objective, string | number>;

	constructor(name: string, description: string) {
		this.name = name;
		this.desciption = description;
		this.objectiveValues = new Map<Objective, string | number>();
	}

	getName(): string {
		return this.name;
	}

	// TODO: Complete implementation of class
}