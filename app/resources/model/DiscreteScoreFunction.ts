/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-21 14:33:40
*/

import { ScoreFunction } 		from './ScoreFunction';



export class DiscreteScoreFunction implements ScoreFunction {

	public type: string;
	private elementScoreMap: Map<string, number>;

	constructor() {
		this.elementScoreMap = new Map<string, number>();
		this.type = 'discrete';
	}

	getElementScoreMap(): Map<string, number> {
		return this.elementScoreMap;
	}

	setElementScoreMap(newMap: Map<string, number>): void {
		this.elementScoreMap = newMap;
	} 

	getScore(domainElement: string): number {
		return this.elementScoreMap.get(domainElement);
	}

	setElementScore(domainElement: string, score: number): void {
		this.elementScoreMap.set(domainElement, score);
	}

	removeElement(domainElement: string): void {
		this.elementScoreMap.delete(domainElement);
	}
}