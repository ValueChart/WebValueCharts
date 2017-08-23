/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 20:31:40
*/

import { Memento }				from './Memento';

/*
	An objective is a criteria that is being used to evaluate a decision problem in a ValueChart. An objective is either abstract,
	meaning it can be broken down into more objectives, or primitive, meaning that is cannot be further broken down.
	This interface defines the common methods and fields that the AbstractObjective and PrimitiveObjective classes must have. 
	It is used to define a mutual type that can be used for both classes. This is very useful because Abstract and Primitive objectives
	often are used in collections together without explicitly delineating between the two types. 
*/

export interface Objective extends Memento {

	objectiveType: string;		// The type of the objective. This must always be either 'abstract' for an AbstractObjective, or 'primitive' for a PrimitiveObjective.


	getName(): string;

	setName(name: string): void;

	getId(): string;

	getDescription(): string;

	setDescription(description: string): void;

}