/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:07:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 16:44:47
*/

// Import Model Classes:
import { Memento }										from './Memento';
import { PrimitiveObjective }							from './PrimitiveObjective';


/*
	A score function is essentially a map of user assigned scores to elements of a PrimitiveObjective's domain, and is the representation of a 
	user's preferences over that objective's domain. This class is the base class for ContinuousScoreFunction and DiscreteScoreFunction. 
	It provides the base implementation of a user defined score function that these subclasses inherit and use as the basis for their 
	more complicated logic. This is abstract and should NOT be instantiated for any reason. 
*/

export abstract class ScoreFunction implements Memento {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public type: string;										// The type of ScoreFunction. This is 'discrete' for DiscreteScoreFunction and 'continuous' for ContinuousScoreFunction.
	public bestElement: string | number;						// The element of the objective's domain that has the highest score. 
	public worstElement: string | number;						// The element of the objective's domain that has the lowest score.
	protected elementScoreMap: Map<number | string, number>;	// The Map object used by this class to map user assigned scores to objective domain elements.
	public immutable = false;									// True if this ScoreFunction may not be altered by the user (determined by chart creator).

	// Default initial function types
	static FLAT: string = 'flat';
	static POSLIN: string = 'poslin';
	static NEGLIN: string = 'neglin';

	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	/*
		@returns {void}	
		@description	Constructs a new ScoreFunction. This constructor initializes the internal element-score map object, and by convention is called by 
						all the subclasses of this class as a part of their construction.
	*/
	constructor() {
		this.elementScoreMap = new Map<number | string, number>();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/*
		@returns {(string | number)[]} - All the elements in the ScoreFunction's internal elementScoreMap that have user assigned scores.
		@description	Iterators over the internal Map object to find every objective domain element that has an assigned score. This does NOT
						return the all the domain elements of the objective that the ScoreFunction is for; rather it returns the element that
						have been assigned scores.
	*/
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

	/*
		@returns {void}
		@description	Updates the bestElement and worstElement class fields to insure that they are consistent with user assigned scores.
						This method should be called whenever the score of a domain element in the ScoreFunction is changed.
	*/
	updateBestAndWorstElements() {
		var elementIterator: Iterator<number | string> = this.elementScoreMap.keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();

		var bestElementSoFar = iteratorElement.value;
		var worstElementSoFar = iteratorElement.value;
		while (iteratorElement.done === false) {
			let currentElementScore: number = this.elementScoreMap.get(iteratorElement.value);

			if (this.elementScoreMap.get(bestElementSoFar) < currentElementScore) {
				bestElementSoFar = iteratorElement.value;
			}
			if (this.elementScoreMap.get(worstElementSoFar) > currentElementScore) {
				worstElementSoFar = iteratorElement.value;
			}
			iteratorElement = elementIterator.next();
		}
		this.bestElement = bestElementSoFar;
		this.worstElement = worstElementSoFar;
	}


	/*
		@returns {Map<number | string -number>}	- The internal Map object used by the ScoreFunction to manage score-element pairs.
		@description	Returns the internal representation of scores used by this ScoreFunction. This method is most often used by change detection services 
						so that they may observe the internal score storage map. It can also be used to obtain the internal map for manual iteration.
	*/
	getElementScoreMap(): Map<number | string, number> {
		return this.elementScoreMap;
	}

	/*
		@param newMap - A new internal map object for this ScoreFunction to use its source and storage for element-score pairs.
		@returns {void}	
		@description	Replaces the internal representation of scores used by this ScoreFunction with the one provided. This method can be used to replace
						all of a ScoreFunction's internal score assignments efficiently without having to construct a new ScoreFunction (thus creating a new memory reference).
	*/
	setElementScoreMap(newMap: Map<number | string, number>): void {
		this.elementScoreMap = newMap;
		this.updateBestAndWorstElements();
	}

	removeElement(domainElement: number | string): void {
		this.elementScoreMap.delete(domainElement);
		this.updateBestAndWorstElements();
	}


	/*
		@returns {boolean} - True if rescaling was needed, False otherwise.
		@description	Rescale ScoreFunction so that the best outcome has score of 1 and worst outcome has score of 0.
	*/
	rescale(): boolean {
		var range = this.getRange();
		if (range === 0) {
			throw new Error("Objective outcome scores are all the same. (This should not be allowed.)");
		}
		if (range < 1) {
			var worstOutcomeScore = this.getScore(this.worstElement);
			for (var element of this.getAllElements()) {
				var newScore = (this.getScore(element) - worstOutcomeScore) / range;
				this.setElementScore(element, newScore);
			}
			return true;
		}
		return false;
	}

	/*
		@returns {number} - Difference between best outcome score and worst outcome score.
	*/
	getRange(): number {
		return this.getScore(this.bestElement) - this.getScore(this.worstElement);
	}

	abstract setElementScore(domainElement: number | string, score: number): void;

	abstract getScore(domainElement: number | string): number;

	// This method allows the class to satisfy the Memento interface.
	abstract getMemento(): ScoreFunction;
}
