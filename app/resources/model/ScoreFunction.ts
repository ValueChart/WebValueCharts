/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:07:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-19 11:02:16
*/

import { Memento }										from './Memento';

export abstract class ScoreFunction implements Memento {

	public type: string;
	public bestElement: string | number;
	public worstElement: string | number;
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

	findBestElement(): void {
		var elementIterator: Iterator<number | string> = this.elementScoreMap.keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();

		var bestElementSoFar = iteratorElement.value;
		while (iteratorElement.done === false) {
			let currentElementScore: number = this.elementScoreMap.get(iteratorElement.value);

			if (this.elementScoreMap.get(bestElementSoFar) < currentElementScore) {
				bestElementSoFar = iteratorElement.value;
			}
			iteratorElement = elementIterator.next();
		}
		this.bestElement = bestElementSoFar;
	}

	findWorstElement(): void {
		var elementIterator: Iterator<number | string> = this.elementScoreMap.keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();

		var worstElementSoFar = iteratorElement.value;
		while (iteratorElement.done === false) {
			let currentElementScore: number = this.elementScoreMap.get(iteratorElement.value);

			if (this.elementScoreMap.get(worstElementSoFar) > currentElementScore) {
				worstElementSoFar = iteratorElement.value;
			}
			iteratorElement = elementIterator.next();
		}
		this.worstElement = worstElementSoFar;
	}

	updateBestAndWorstElements(updatedDomainElement: string | number, updatedScore: number) {
		if (updatedDomainElement === this.bestElement)
			this.findBestElement();
		if (updatedDomainElement === this.worstElement)
			this.findWorstElement();

		if (this.bestElement === undefined || updatedScore > this.elementScoreMap.get(this.bestElement))
			this.bestElement = updatedDomainElement;
		if (this.worstElement === undefined || updatedScore < this.elementScoreMap.get(this.worstElement))
			this.worstElement = updatedDomainElement;
	}

	getElementScoreMap(): Map<number | string, number> {
		return this.elementScoreMap;
	}

	setElementScoreMap(newMap: Map<number | string, number>): void {
		this.elementScoreMap = newMap;
	}

	removeElement(domainElement: number | string): void {
		this.elementScoreMap.delete(domainElement);

		if (domainElement === this.worstElement)
			this.findWorstElement();

		if (domainElement === this.bestElement)
			this.findBestElement();
	}

	// Rescale ScoreFunction so that the best outcome has score of 1 and worst outcome has score of 0
	// Returns true if rescaling was needed, false otherwise
	rescale(): boolean {
		var bestOutcomeScore = this.getScore(this.bestElement);
		var worstOutcomeScore = this.getScore(this.worstElement);
		if (bestOutcomeScore !== 1 || worstOutcomeScore !== 0) {
			var range = bestOutcomeScore - worstOutcomeScore;
			if (range === 0) {
				throw "Objective outcome scores are all the same. (This should not be allowed.)";
			}
			for (var element of this.getAllElements()) {
				var newScore = (this.getScore(element) - worstOutcomeScore) / range;
				this.setElementScore(element, newScore);
			}
			return true;
		}
		return false;
	}

	abstract setElementScore(domainElement: number | string, score: number): void;
	abstract getScore(domainElement: number | string): number;
	abstract getMemento(): ScoreFunction;
}