// Import Angular Classes:
import { Component, OnInit }											from '@angular/core';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }										from '../../../app/services/ValueChart.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { CurrentUserService }											from '../../../app/services/CurrentUser.service';
import { ValidationService }                        					from '../../../app/services/Validation.service';

// Import Model Classes:
import { ValueChart } 													from '../../../../model/ValueChart';
import { User }															from '../../../../model/User';
import { WeightMap }													from '../../../../model/WeightMap';
import { Objective }													from '../../../../model/Objective';
import { AbstractObjective }											from '../../../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../../../model/PrimitiveObjective';
import { ScoreFunction }												from '../../../../model/ScoreFunction';
import { Alternative }													from '../../../../model/Alternative';
import { ContinuousDomain }												from '../../../../model/ContinuousDomain';

/*
  This component defines the UI for eliciting weights with SMARTER.
  It consists of two tables: one that shows the worst/best outcomes for each unranked Objective,
  							 and another that lists the currently ranked Objectives in order of rank.
*/

@Component({
	selector: 'CreateWeights',
	templateUrl: './CreateWeights.template.html',
})
export class CreateWeightsComponent implements OnInit {

	// ========================================================================================
	//                   Fields
	// ========================================================================================

	user: User;
	rankedObjectives: string[]; // Objectives that have already been ranked
    isRanked: { [objName: string]: boolean; }; // Indicates whether each Objective has been ranked
    updateWeights: boolean = false; // Indicates whether or not the weights should be computed and set on validate or destroy.
    						  		  // True if user changes weights in any way (clicking on a row or clicking "Reset Weights").
    						  		  // This is to ensure that previously-made adjustments to weights are preserved.


    // Validation fields:
    validationTriggered: boolean = false;
    errorMessages: string[]; // Validation error messages

	// ========================================================================================
	//                   Constructor
	// ========================================================================================

	/*
	@returns {void}
	@description   Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
	        This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService, 
		private creationStepsService: CreationStepsService,
		private validationService: ValidationService) { }

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
		this.user = this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername());

		// If weight map is empty, set all Objectives to unranked
		if (this.user.getWeightMap().getWeightTotal() === 0) {
			for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName()) {
				this.isRanked[obj] = false;
			}
		}
		// Weights have already been set by the user
		else {
			let objectives: string[] = this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName();
			let weights: number[] = this.user.getWeightMap().getObjectiveWeights(this.valueChartService.getValueChart().getAllPrimitiveObjectives());
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
			this.validate();
		}
	}

	/*   
		@returns {void}
		@description   Destroys CreateWeights. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
		        requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		// Update weight map
		if (this.updateWeights) {	
			this.user.setWeightMap(this.getWeightMapFromRanks());
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
		else if (this.rankedObjectives.length < this.valueChartService.getValueChart().getAllPrimitiveObjectives().length) {
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
		for (let alt of this.valueChartService.getValueChart().getAlternatives()) {
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
		for (let alt of this.valueChartService.getValueChart().getAlternatives()) {
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
		@returns {string}
		@description 	Returns unit string to append to best/worst outcome. 
	*/
	getUnitString(obj: PrimitiveObjective): string {
		if (obj.getDomainType() === 'continuous' && (<ContinuousDomain>obj.getDomain()).unit) {
			return " " + ((<ContinuousDomain>obj.getDomain()).unit);
		}
		return "";
	}

	/* 	
		@returns {PrimitiveObjective[]}
		@description 	Gets names of all PrimitiveObjectives that haven't been ranked. 
	*/
	getUnrankedObjectives(): PrimitiveObjective[] {
		let unrankedObjectives: PrimitiveObjective[] = [];
		for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectives()) {
			if (!this.isRanked[obj.getName()]) {
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
			this.updateWeights = true;
		}
	}

	/* 	
		@returns {void}
		@description 	Clears current ranking and sets all Objectives to unranked.
	*/
	resetRanks() {
		for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName()) {
			this.isRanked[obj] = false;
		}
		this.rankedObjectives = [];
		this.updateWeights = true;
	}

	// ================================ Ranks-to-Weights Methods ====================================

	/* 	
		@returns {WeightMap}
		@description 	Converts ranks to weights as described in Barron and Barret, 1996.
	*/
	getWeightMapFromRanks(): WeightMap {
		let weights = new WeightMap();
		let rank = 1;
		let numObjectives = this.valueChartService.getValueChart().getAllPrimitiveObjectives().length;
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
		@description 	Checks validity of the weights.
	*/
	validate(): boolean {
		this.validationTriggered = true;
		this.setErrorMessages();
		return this.errorMessages.length === 0;
	}

	/* 	
		@returns {boolean}
		@description 	Recomputes the weights based on the rankings, then validates the weights.
	*/
	setErrorMessages(): void {
		// Update weight map
		if (this.updateWeights) {
			this.user.setWeightMap(this.getWeightMapFromRanks());
		}
		// Validate
		this.errorMessages = this.validationService.validateWeights(this.valueChartService.getValueChart(), this.user);
	}

	/* 	
		@returns {void}
		@description 	Resets error messages if validation has already been triggered.
						(This is done whenever the user makes a change to the chart. This way, they get feedback while repairing errors.)
	*/
	resetErrorMessages(): void {
		if (this.validationTriggered) {
			this.setErrorMessages();
		}
	}
}
