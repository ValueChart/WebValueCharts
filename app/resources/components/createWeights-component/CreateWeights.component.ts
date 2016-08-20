import { Component, OnInit }										from '@angular/core';

// Application classes:
import { ValueChartService }											from '../../services/ValueChart.service';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';
import { User }															from '../../model/User';
import { WeightMap }													from '../../model/WeightMap';
import { Objective }													from '../../model/Objective';
import { AbstractObjective }											from '../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { ScoreFunction }												from '../../model/ScoreFunction';

@Component({
	selector: 'CreateWeights',
	templateUrl: 'app/resources/components/createWeights-component/CreateWeights.template.html',
})
export class CreateWeightsComponent implements OnInit {
	user: User;
	rankedObjectives: string[];
    isRanked: { [objName: string]: boolean; };
	private services: any = {};

	constructor(
		private valueChartService: ValueChartService) { }

	ngOnInit() {
		this.services.valueChartService = this.valueChartService;
		this.rankedObjectives = [];
		this.isRanked = {};

		this.user = this.valueChartService.getCurrentUser();
		if (!this.user.getWeightMap()) {
			this.user.setWeightMap(this.getInitialWeightMap());
			for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName()) {
				this.isRanked[obj] = false;
			}
		}
		else {
			let objectives: string[] = this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName();
			let weights: number[] = this.user.getWeightMap().getObjectiveWeights(this.valueChartService.getValueChart().getAllPrimitiveObjectives());
			let pairs = objectives.map(function(e, i) { return [objectives[i], weights[i]]; });
			let sortedPairs = pairs.sort(this.compareObjectivesByWeight);
			let sortedObjectives = sortedPairs.map(function(e, i) { return sortedPairs[i][0]; });
			for (let obj of sortedObjectives) {
				this.rankObjective(<string>obj);
			}
		}
	}

	ngOnDestroy() {
		this.user.setWeightMap(this.getWeightMapFromRanks());
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
		else if (this.rankedObjectives.length < this.valueChartService.getValueChart().getAllPrimitiveObjectives().length) {
			return "From the remaining objectives, which would you prefer to change next from the worst value to the best value?";
		}
		else {
			return "All done! Click 'View Chart' to proceed.";
		}
	}

	getUnrankedObjectives(): string[] {
		let unrankedObjectives: string[] = [];
		for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName()) {
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
		for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName()) {
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

	// Create initial weight map for the Objective hierarchy with evenly distributed weights
	getInitialWeightMap(): WeightMap {
		let weightMap: WeightMap = new WeightMap();
		this.initializeWeightMap(this.valueChartService.getValueChart().getRootObjectives(), weightMap, 1);
		return weightMap;
	}

	// Recursively add entries to weight map
	private initializeWeightMap(objectives: Objective[], weightMap: WeightMap, parentWeight: number) {
		let weight = parentWeight * 1.0 / objectives.length;
		for (let obj of objectives) {
			weightMap.setObjectiveWeight(obj.getName(), weight);
			if (obj.objectiveType === 'abstract') {
				this.initializeWeightMap((<AbstractObjective>obj).getDirectSubObjectives(), weightMap, weight);
			}
		}
	}
}
