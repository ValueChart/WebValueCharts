/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 12:02:58
*/

import { Memento }				from './Memento';


export interface Objective extends Memento {

	objectiveType: string;


	getName(): string;

	setName(name: string): void;

	getId(): string;

	setId(name: string): void;

	getDescription(): string;

	setDescription(description: string): void;

}