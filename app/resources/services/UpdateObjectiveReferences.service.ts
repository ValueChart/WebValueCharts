/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-19 21:24:50
*/

import { Injectable } 										from '@angular/core';

// Application Classes:
import { ValueChartService }								from './ValueChart.service';

// Model Classes
import { PrimitiveObjective }								from '../model/PrimitiveObjective';

@Injectable()
export class UpdateObjectiveReferencesService {

	constructor(private valueChartService: ValueChartService) { }

	// Initialize ScoreFunctions for new PrimitiveObjectives
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