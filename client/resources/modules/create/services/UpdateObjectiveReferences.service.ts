// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Application Classes:
import { ValueChartService }								from '../../app/services/ValueChart.service';

// Import Model Classes:
import { PrimitiveObjective }								from '../../../model/PrimitiveObjective';
import { User }												from '../../../model/User';
import { CategoricalDomain }								from '../../../model/CategoricalDomain';
import { ContinuousDomain }									from '../../../model/ContinuousDomain';
import { ScoreFunction }									from '../../../model/ScoreFunction';
import { DiscreteScoreFunction }							from '../../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }							from '../../../model/ContinuousScoreFunction';

/*
	This class provides methods to update the ValueChart model when the Objective structure changes.
*/

@Injectable()
export class UpdateObjectiveReferencesService {

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private valueChartService: ValueChartService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@returns {void}
		@description 	Resets the Objective weights to their default values.
	*/
	resetWeightMaps() {
		let weightMap = this.valueChartService.getDefaultWeightMap();
		for (let user of this.valueChartService.getValueChart().getUsers()) {
			this.valueChartService.resetWeightMap(user, weightMap);
		}
	}

	/*
		@returns {void}
		@description 	Resets Users' ScoreFunctions for obj to default.
	*/
	resetScoreFunctions(obj: PrimitiveObjective) {
		for (let user of this.valueChartService.getValueChart().getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				scoreFunctionMap.setObjectiveScoreFunction(obj.getName(), obj.getDefaultScoreFunction().getMemento());
			}
		}
	}

	/*
		@returns {void}
		@description 	Adds new ScoreFunctions for each Objective in objNames to users' scoreFunctionMaps.
	*/
	addScoreFunctions(objNames: string[]) {
		for (let objname of objNames) {
			let obj: PrimitiveObjective = <PrimitiveObjective>this.valueChartService.getObjectiveByName(objname);
			for (let user of this.valueChartService.getValueChart().getUsers()) {
				let scoreFunctionMap = user.getScoreFunctionMap();
				if (scoreFunctionMap) {
					scoreFunctionMap.setObjectiveScoreFunction(objname, obj.getDefaultScoreFunction().getMemento());
				}
			}
		}
	}

	/*
		@returns {void}
		@description 	Inserts a new element into users' DiscreteScoreFunctions for specified Objective.
						(For now, the score of this element is initialized to 0.5.)
	*/
	addElementToScoreFunctions(objName: string, element: string) {
		for (let user of this.valueChartService.getValueChart().getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
				if (scoreFunction) {
					scoreFunction.setElementScore(element, 0.5);
				}
			}
		}
	}

	/*
		@returns {void}
		@description 	Removes element from users' DiscreteScoreFunctions for specified Objective.
	*/
	removeElementFromScoreFunctions(objName: string, element: string) {
		for (let user of this.valueChartService.getValueChart().getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
				if (scoreFunction) {
					scoreFunction.removeElement(element);
				}
			}
		}
	}

	/*
		@returns {void}
		@description 	 Transforms users' ScoreFunctions so that the best outcome has score of 1 and worst outcome has score of 0.
	*/
	rescaleScoreFunctions(objName: string) {
		for (let user of this.valueChartService.getValueChart().getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
				if (scoreFunction.getRange() > 0) {
					let rescaled = scoreFunction.rescale();
					if (rescaled) {
						this.valueChartService.resetWeightMap(user, this.valueChartService.getDefaultWeightMap());
					}
				}
			}
		}
	}

	/*
		@returns {void}
		@description 	 Check each Alternative's value for obj. Clear if no longer valid.
	*/
	clearAlternativeValues(obj: PrimitiveObjective) {
		for (let alt of this.valueChartService.getValueChart().getAlternatives()) {
			if (obj.getDomainType() === "continuous") {
				let dom = <ContinuousDomain>obj.getDomain();
				let altVal: number = Number(alt.getObjectiveValue(obj.getName()));
				if (altVal < dom.getMinValue() || altVal > dom.getMaxValue()) {
					alt.removeObjective(obj.getName());
				}
			}
			else {
				let altVal: string = String(alt.getObjectiveValue(obj.getName()));
				if ((<CategoricalDomain>obj.getDomain()).getElements().indexOf(altVal) === -1) {
					alt.removeObjective(obj.getName());
				}
			}
		}
	}

	/*
		@returns {void}
		@description 	 Removes all references to the Objectives in objNames.
	*/
	removeReferences(objNames: string[]) {
		for (let objname of objNames) {
			for (let alt of this.valueChartService.getValueChart().getAlternatives()) {
				alt.removeObjective(objname);
			}
			for (let user of this.valueChartService.getValueChart().getUsers()) {
				let scoreFunctionMap = user.getScoreFunctionMap();
				if (scoreFunctionMap) {
					scoreFunctionMap.removeObjectiveScoreFunction(objname);
				}

			}
		}
	}

	/*
		@returns {void}
		@description 	 Updates all references to Objectives in oldObjNames to newObjNames.
	*/
	updateObjectiveNames(oldObjNames: string[], newObjNames: string[]) {
		for (let i = 0; i < oldObjNames.length; i++) {
			let oldName: string = oldObjNames[i];
			let newName: string = newObjNames[i];

			// Update references if name has changed
			if (oldName !== newName) {
				for (let alt of this.valueChartService.getValueChart().getAlternatives()) {
					let objVal = alt.getObjectiveValue(oldName);
					if (objVal) {
						alt.removeObjective(oldName);
						alt.setObjectiveValue(newName, objVal);
					}
				}
				for (let user of this.valueChartService.getValueChart().getUsers()) {
					let scoreFunctionMap = user.getScoreFunctionMap();
					if (scoreFunctionMap) {
						let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(oldName);
						if (scoreFunction) {
							scoreFunctionMap.removeObjectiveScoreFunction(oldName);
							scoreFunctionMap.setObjectiveScoreFunction(newName, scoreFunction);
						}
					}
					let weightMap = user.getWeightMap();
					if (weightMap) {
						let weight = weightMap.getObjectiveWeight(oldName);
						if (weight) {
							weightMap.removeObjectiveWeight(oldName);
							weightMap.setObjectiveWeight(newName, weight);
						}
					}
				}
			}
		}
	}
}