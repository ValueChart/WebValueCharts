/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 12:11:00
*/

import { Injectable } 										from '@angular/core';

// Application Classes:
import { ValueChartService }								from '../../app/services/ValueChart.service';

// Model Classes
import { PrimitiveObjective }								from '../../../model/PrimitiveObjective';
import { User }												from '../../../model/User';

@Injectable()
export class UpdateObjectiveReferencesService {

	constructor(private valueChartService: ValueChartService) { }

	// Set users' WeightMaps to default
	resetWeightMaps() {
		let weightMap = this.valueChartService.getDefaultWeightMap();
		for (let user of this.valueChartService.getUsers()) {
			this.valueChartService.resetWeightMap(user, weightMap);
		}
	}

	// Reinitialize users' ScoreFunction for specified Objective
	resetScoreFunctions(obj: PrimitiveObjective) {
		let scoreFunction = this.valueChartService.getInitialScoreFunction(obj);
		for (let user of this.valueChartService.getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				scoreFunctionMap.setObjectiveScoreFunction(obj.getName(), scoreFunction);
			}
		}
	}

	// Create ScoreFunctions for new PrimitiveObjectives
	addScoreFunctions(objNames: string[]) {
		for (let objname of objNames) {
			let obj: PrimitiveObjective = <PrimitiveObjective>this.valueChartService.getObjectiveByName(objname);
			let scoreFunction = this.valueChartService.getInitialScoreFunction(obj);
			for (let user of this.valueChartService.getUsers()) {
				let scoreFunctionMap = user.getScoreFunctionMap();
				if (scoreFunctionMap) {
					scoreFunctionMap.setObjectiveScoreFunction(obj.getName(),scoreFunction);
				}
			}
		}
	}

	// Insert a new element into users' DiscreteScoreFunctions for specified Objective
	// Initialize score to 0 for now
	addElementToScoreFunctions(objName: string, element: string) {
		for (let user of this.valueChartService.getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
				if (scoreFunction) {
					scoreFunction.setElementScore(element, 0);
				}
			}
		}
	}

	// Remove element fron users' DiscreteScoreFunctions for specified Objective
	removeElementFromScoreFunctions(objName: string, element: string) {
		for (let user of this.valueChartService.getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
				if (scoreFunction) {
					scoreFunction.removeElement(element);
				}
			}
		}
	}

	// Transform users' ScoreFunctions so that the best outcome has score of 1 and worst outcome has score of 0
	rescaleScoreFunctions(objName: string) {
		for (let user of this.valueChartService.getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
				let rescaled = scoreFunction.rescale();
				if (rescaled) {
					this.valueChartService.resetWeightMap(user, this.valueChartService.getDefaultWeightMap());
				}
			}
		}
	}

	// Remove all entities that refer to specified Objectives
	removeReferences(objNames: string[]) {
		for (let objname of objNames) {
			for (let alt of this.valueChartService.getAlternatives()) {
				alt.removeObjective(name);
			}
			for (let user of this.valueChartService.getUsers()) {
				let scoreFunctionMap = user.getScoreFunctionMap();
				if (scoreFunctionMap) {
					scoreFunctionMap.removeObjectiveScoreFunction(name);
				}

			}
		}
	}

	updateObjectiveNames(oldObjNames: string[], newObjNames: string[]) {
		for (let i = 0; i < oldObjNames.length; i++) {
			let oldName: string = oldObjNames[i];
			let newName: string = newObjNames[i];

			// Update references if name has changed
			if (oldName !== newName) {
				for (let alt of this.valueChartService.getAlternatives()) {
					let objVal = alt.getObjectiveValue(oldName);
					if (objVal) {
						alt.removeObjective(oldName);
						alt.setObjectiveValue(newName, objVal);
					}
				}
				for (let user of this.valueChartService.getUsers()) {
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