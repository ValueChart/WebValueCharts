/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 17:15:03
*/

export interface Objective {

	getName(): string;

	setName(name: string): void;

	getDescription(): string;

	setDescription(description: string): void;

}