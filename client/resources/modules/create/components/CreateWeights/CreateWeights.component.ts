import { Component, OnInit }											from '@angular/core';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }											from '../../../app/services/ValueChart.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';

// Import Model Classes:
import { ValueChart } 													from '../../../../model/ValueChart';
import { User }															from '../../../../model/User';
import { WeightMap }													from '../../../../model/WeightMap';
import { Objective }													from '../../../../model/Objective';
import { AbstractObjective }											from '../../../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../../../model/PrimitiveObjective';
import { ScoreFunction }												from '../../../../model/ScoreFunction';

@Component({
	selector: 'CreateWeights',
	templateUrl: 'client/resources/modules/create/components/CreateWeights/CreateWeights.template.html',
})
export class CreateWeightsComponent implements OnInit {
	user: User;
	rankedObjectives: string[];
    isRanked: { [objName: string]: boolean; };

    // Validation fields:
    validationTriggered: boolean = false;

	constructor(
		private valueChartService: ValueChartService, private creationStepsService: CreationStepsService) { }

	ngOnInit() {
		this.creationStepsService.observables[this.creationStepsService.PRIORITIES] = new Observable<boolean>((subscriber: Subscriber<boolean>) => {
            subscriber.next(this.validate());
            subscriber.complete();
        });
		this.rankedObjectives = [];
		this.isRanked = {};
		this.user = this.valueChartService.getCurrentUser();

		// If weight map is uninitialized or has been reset, set all Objectives to unranked
		if (!this.user.getWeightMap() || this.valueChartService.wasWeightMapReset(this.user)) {
			for (let obj of this.valueChartService.getPrimitiveObjectivesByName()) {
				this.isRanked[obj] = false;
			}		
		}
		else {
			let objectives: string[] = this.valueChartService.getPrimitiveObjectivesByName();
			let weights: number[] = this.user.getWeightMap().getObjectiveWeights(this.valueChartService.getPrimitiveObjectives());
			let pairs = objectives.map(function(e, i) { return [objectives[i], weights[i]]; });
			let sortedPairs = pairs.sort(this.compareObjectivesByWeight);
			let sortedObjectives = sortedPairs.map(function(e, i) { return sortedPairs[i][0]; });
			for (let obj of sortedObjectives) {
				this.rankObjective(<string>obj);
			}
		}
	}

	ngOnDestroy() {
		this.valueChartService.setWeightMap(this.user, this.getWeightMapFromRanks());
	}

	compareObjectivesByWeight(pair1: [string, number], pair2: [string, number]) {
		if (pair1[1] < pair2[1]) {
			return 1;
		}
		else if (pair1[1] === pair2[1]) {
			return 0;
		}
		else {
			return -1;
		}
	}

	getPrioritiesText(): string {
		if (this.rankedObjectives.length === 0) {
			return "Imagine the worst case scenario highlighted in red. Click on the objective you would most prefer to change from the worst to the best based on the values in the table below.";
		}
		else if (this.rankedObjectives.length < this.valueChartService.getPrimitiveObjectives().length) {
			return "From the remaining objectives, which would you prefer to change next from the worst value to the best value?";
		}
		else {
			return "All done! Click 'View Chart' to proceed.";
		}
	}

	getUnrankedObjectives(): string[] {
		let unrankedObjectives: string[] = [];
		for (let obj of this.valueChartService.getPrimitiveObjectivesByName()) {
			if (!this.isRanked[obj]) {
				unrankedObjectives.push(obj);
			}
		}
		return unrankedObjectives;
	}

	rankObjective(primObj: string) {
		this.rankedObjectives.push(primObj);
		this.isRanked[primObj] = true;
	}

	resetRanks() {
		for (let obj of this.valueChartService.getPrimitiveObjectivesByName()) {
			this.isRanked[obj] = false;
		}
		this.rankedObjectives = [];
	}

	getWeightMapFromRanks(): WeightMap {
		let weights = new WeightMap();
		let rank = 1;
		let numObjectives = this.rankedObjectives.length;
		for (let obj of this.rankedObjectives) {
			let weight = this.computeSum(rank, numObjectives) / numObjectives;
			weights.setObjectiveWeight(obj, weight);
			rank++;
		}
		return weights;
	}

	computeSum(k: number, K: number) {
		let sum = 0.0;
		let i = k;
		while (i <= K) {
			sum += 1 / i;
			i++;
		}
		return sum;
	}

	getBestOutcome(objName: string): string | number {
		let scoreFunction: ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		return scoreFunction.bestElement;
	}

	getWorstOutcome(objName: string): string | number {
		let scoreFunction: ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		return scoreFunction.worstElement;
	}

	// Validation methods:

	validate(): boolean {
		this.validationTriggered = true;
		return this.allRanked();
	}

	allRanked(): boolean {
		for (let objName of Object.keys(this.isRanked)) {
			if (!this.isRanked[objName]) {
				return false;
			}
		}
		return true;
	}
}
