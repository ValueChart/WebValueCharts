/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-30 17:00:34
*/

import { ScoreFunction } 		from './ScoreFunction';



export class DiscreteScoreFunction implements ScoreFunction {

	public type: string;
	private elementScoreMap: Map<string, number>;

	constructor() {
		this.elementScoreMap = new Map<string, number>();
		this.type = 'discrete';
	}

	getElementScore(domainElement: string): number {
		return this.elementScoreMap.get(domainElement);
	}

	setElementScore(domainElement: string, score: number): void {
		this.elementScoreMap.set(domainElement, score);
	}

	removeElement(domainElement: string): void {
		this.elementScoreMap.delete(domainElement);
	}
}