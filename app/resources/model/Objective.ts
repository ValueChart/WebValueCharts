/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 17:44:27
*/

export interface Objective {

	objectiveType: string;

	getName(): string;

	setName(name: string): void;

	getDescription(): string;

	setDescription(description: string): void;

}