/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:07:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-01 13:47:01
*/

import { Memento }										from './Memento';

export abstract class ScoreFunction implements Memento {

	type: string;
	protected elementScoreMap: Map<number | string, number>;

	constructor() {
		this.elementScoreMap = new Map<number | string, number>();
	}

	getAllElements(): (string | number)[] {
		var elements: (string | number)[] = [];

		var elementIterator: Iterator<number | string> = this.elementScoreMap.keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();

		while (iteratorElement.done === false) {
			elements.push(iteratorElement.value);
			iteratorElement = elementIterator.next();
		}
		return elements;
	}


	getElementScoreMap(): Map<number | string, number> {
		return this.elementScoreMap;
	}

	setElementScoreMap(newMap: Map<number | string, number>): void {
		this.elementScoreMap = newMap;
	} 

	removeElement(domainElement: number | string): void {
		this.elementScoreMap.delete(domainElement);
	}

	abstract setElementScore(domainElement: number | string, score: number): void;
	abstract getScore(domainElement: number | string): number;
	abstract getMemento(): ScoreFunction;
}