/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 14:15:51
*/

import { Memento }				from './Memento';


export interface Objective extends Memento {

	objectiveType: string;

	getName(): string;

	setName(name: string): void;

	getDescription(): string;

	setDescription(description: string): void;

}