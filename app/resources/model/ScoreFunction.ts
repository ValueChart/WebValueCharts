/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:07:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-22 10:11:59
*/

import { Memento }										from './Memento';

export abstract class ScoreFunction implements Memento {

	type: string;
	protected elementScoreMap: Map<number | string, number>;

	constructor() {
		this.elementScoreMap = new Map<number | string, number>();
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