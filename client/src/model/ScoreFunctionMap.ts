/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:53
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 16:14:41
*/

// Import Model Classes:
import { ScoreFunction } 			from './ScoreFunction';


/*
	This class is used to map a User's ScoreFunctions to their corresponding objectives. It is wrapper around the Map class that provides 
	additional functionality for retrieving ScoreFucntions.
*/

export class ScoreFunctionMap {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private scoreFunctions: Map<string, ScoreFunction>;	// The internal map object used to associate objective names with their assigned ScoreFunctions.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	/*
		@returns {void}	
		@description	Constructs a new ScoreFunctionmap. This constructor only initializes the internal map object of the ScoreFunctionMap.
						ScoreFunctions must be mapped to objective names manually using the setObjectiveScoreFunction() method.
	*/
	constructor() {
		this.scoreFunctions = new Map<string, ScoreFunction>();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@returns {ScoreFunction[]} - An array of all the ScoreFunctions stored by the ScoreFunctionMap.
		@description	Retrieves all the ScoreFunctions stored within the ScoreFunctionMap by iterating over the internal map object.
	*/
	getAllScoreFunctions(): ScoreFunction[] {
		var scoreFunctions: ScoreFunction[] = [];

		var scoreFunctionIterator: Iterator<ScoreFunction> = this.scoreFunctions.values();
		var iteratorElement: IteratorResult<ScoreFunction> = scoreFunctionIterator.next();

		while (iteratorElement.done === false) {

			scoreFunctions.push(iteratorElement.value);

			iteratorElement = scoreFunctionIterator.next();
		}

		return scoreFunctions;
	}

	/*
		@returns {ScoreFunction[]} - An array of all the ScoreFunctions stored by the ScoreFunctionMap with names of their corresponding objectives.
		@description	Retrieves all the ScoreFunctions along with their names of they objectives their are mapped to by iterating over the internal map object.
	*/
	getAllKeyScoreFunctionPairs(): { key: string, scoreFunction: ScoreFunction }[] {
		var scoreFunctionKeyPairs: { key: string, scoreFunction: ScoreFunction }[] = [];

		var scoreFunctionIterator: Iterator<string> = this.scoreFunctions.keys();
		var iteratorElement: IteratorResult<string> = scoreFunctionIterator.next();

		while (iteratorElement.done === false) {
			scoreFunctionKeyPairs.push({ key: iteratorElement.value, scoreFunction: this.scoreFunctions.get(iteratorElement.value) });
			iteratorElement = scoreFunctionIterator.next();
		}

		return scoreFunctionKeyPairs;
	}

	getAllScoreFunctionKeys(): string[] {
		var keys = [];
		var scoreFunctionIterator: Iterator<string> = this.scoreFunctions.keys();
		var iteratorElement: IteratorResult<string> = scoreFunctionIterator.next();

		while (iteratorElement.done === false) {
			keys.push(iteratorElement.value);
			iteratorElement = scoreFunctionIterator.next();
		}

		return keys;
	}

	getObjectiveScoreFunction(objectiveId: string): ScoreFunction {
		return this.scoreFunctions.get(objectiveId);
	}

	setObjectiveScoreFunction(objectiveId: string, ScoreFunction: ScoreFunction): void {
		this.scoreFunctions.set(objectiveId, ScoreFunction);
	}

	removeObjectiveScoreFunction(objectiveId: string): void {
		this.scoreFunctions.delete(objectiveId);
	}
}