// Import Angular Classes:
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
import { Alternative }													from '../../../../model/Alternative';

/*
  This component defines the UI for eliciting weights with SMARTER.
  It consists of two tables: one that shows the worst/best outcomes for each unranked Objective,
  							 and another that lists the currently ranked Objectives in order of rank.
*/

@Component({
	selector: 'CreateWeights',
	templateUrl: 'client/resources/modules/create/components/CreateWeights/CreateWeights.template.html',
})
export class CreateWeightsComponent implements OnInit {

	// ========================================================================================
	//                   Fields
	// ========================================================================================

	user: User;
	rankedObjectives: string[]; // Objectives that have already been ranked
    isRanked: { [objName: string]: boolean; }; // Indicates whether each Objective has been ranked
    updateOnDestroy: boolean = false; // Indicates whether or not the weights should be computed and set on destroy.
    						  		  // True if user changes weights in any way (clicking on a row or clicking "Reset Weights").
    						  		  // This is to ensure that previosly-made adjustments to weights are preserved.


    // Validation fields:
    validationTriggered: boolean = false;

	// ========================================================================================
	//                   Constructor
	// ========================================================================================

	/*
	@returns {void}
	@description   Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
	        This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private valueChartService: ValueChartService, private creationStepsService: CreationStepsService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// ================================ Life-cycle Methods ====================================

	/* 	
		@returns {void}
		@description 	Initializes CreateWeights. ngOnInit is only called ONCE by Angular.
						Calling ngOnInit should be left to Angular. Do not call it manually.
	*/
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
		// Weights have already been set by the user
		else {
			this.validationTriggered = true;
			let objectives: string[] = this.valueChartService.getPrimitiveObjectivesByName();
			let weights: number[] = this.user.getWeightMap().getObjectiveWeights(this.valueChartService.getPrimitiveObjectives());
			let pairs = objectives.map(function(e, i) { return [objectives[i], weights[i]]; });
			let sortedPairs = pairs.sort(this.compareObjectivesByWeight);
			for (let pair of sortedPairs) {
				if (pair[1] === undefined) {
					this.isRanked[pair[0]] = false;
				}
				else {
					this.rankObjective(<string>pair[0], false);
				}
			}
		}
	}

	/* 	
		@returns {void}
		@description 	Destroys CreateWeights. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
						requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		if (this.updateOnDestroy) {	
			this.valueChartService.setWeightMap(this.user, this.getWeightMapFromRanks());
		}
	}

	// ================================ SMARTER Methods ====================================

	/* 	
		@returns {string}
		@description 	Returns instruction text based on current stage of ranking.
	*/
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

	/* 	
		@returns {number}
		@description 	Comparator function for Objective weights.
						Returns 1 if the first is ranked above the second, 0 if they are ranked the same (should never happen), and -1 otherwise.
						This is used to sort the ranked Objectives table.
	*/
	compareObjectivesByWeight(pair1: [string, number], pair2: [string, number]): number {
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

	/* 	
		@returns {string or number}
		@description 	Gets best Alternative outcome for Objective. Used to fill the Best Outcome column.
	*/
	getBestOutcome(objName: string): string | number {
		let bestOutcome;
		let bestOutcomeScore = 0;
		let scoreFunction: ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		for (let alt of this.valueChartService.getAlternatives()) {
			let outcome = alt.getObjectiveValue(objName);
			let outcomeScore = scoreFunction.getScore(outcome);
			if (outcomeScore > bestOutcomeScore) {
				bestOutcome = outcome;
				bestOutcomeScore = outcomeScore;
			}
		}
		if (bestOutcome === undefined) {
			bestOutcome = this.getWorstOutcome(objName);
		}
		return bestOutcome;
	}

	/* 	
		@returns {string or number}
		@description 	Gets worst Alternative outcome for Objective. Used to fill the Worst Outcome column.
	*/
	getWorstOutcome(objName: string): string | number {
		let worstOutcome;
		let worstOutcomeScore = 1;
		let scoreFunction: ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		for (let alt of this.valueChartService.getAlternatives()) {
			let outcome = alt.getObjectiveValue(objName);
			let outcomeScore = scoreFunction.getScore(outcome);
			if (outcomeScore < worstOutcomeScore) {
				worstOutcome = outcome;
				worstOutcomeScore = outcomeScore;
			}
		}
		if (worstOutcome === undefined) {
			worstOutcome = this.getBestOutcome(objName);
		}
		return worstOutcome;
	}

	/* 	
		@returns {string[]}
		@description 	Gets names of all PrimitiveObjectives that haven't been ranked. 
	*/
	getUnrankedObjectives(): string[] {
		let unrankedObjectives: string[] = [];
		for (let obj of this.valueChartService.getPrimitiveObjectivesByName()) {
			if (!this.isRanked[obj]) {
				unrankedObjectives.push(obj);
			}
		}
		return unrankedObjectives;
	}

	/* 	
		@returns {void}
		@description 	Ranks an Objective by adding it to rankedObjectives.
						Its rank is its index in rankedObjectives.
						Parameter 'clicked' indicates whether or not this was called by a user clicking on a row
	*/
	rankObjective(primObj: string, clicked: boolean) {
		this.rankedObjectives.push(primObj);
		this.isRanked[primObj] = true;
		if (clicked) {
			this.updateOnDestroy = true;
		}
	}

	/* 	
		@returns {void}
		@description 	Clears current ranking and sets all Objectives to unranked.
	*/
	resetRanks() {
		for (let obj of this.valueChartService.getPrimitiveObjectivesByName()) {
			this.isRanked[obj] = false;
		}
		this.rankedObjectives = [];
		this.updateOnDestroy = true;
	}

	// ================================ Ranks-to-Weights Methods ====================================

	/* 	
		@returns {WeightMap}
		@description 	Converts ranks to weights as described in Barron and Barret, 1996.
	*/
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

	/* 	
		@returns {WeightMap}
		@description 	Computes summation described in Barron and Barret, 1996.
	*/
	computeSum(k: number, K: number): number {
		let sum = 0.0;
		let i = k;
		while (i <= K) {
			sum += 1 / i;
			i++;
		}
		return sum;
	}

	// ================================ Validation Methods ====================================

	/* 	
		@returns {boolean}
		@description 	Validate Weights.
						This should be done prior to updating the ValueChart model and saving to the database.
	*/
	validate(): boolean {
		this.validationTriggered = true;
		return this.allRanked();
	}

	/* 	
		@returns {boolean}
		@description 	Returns true if all Objectives have been ranked, false otherwise.
	*/
	allRanked(): boolean {
		for (let objName of Object.keys(this.isRanked)) {
			if (!this.isRanked[objName]) {
				return false;
			}
		}
		return true;
	}
}
