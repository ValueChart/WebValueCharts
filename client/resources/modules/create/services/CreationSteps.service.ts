// Import Angular Classes:
import { Injectable } 							from '@angular/core';
import { Router }								from '@angular/router';
import { Observable }     						from 'rxjs/Observable';
import '../../utilities/rxjs-operators';

/*
	This class defines the names and orders of steps in the Creation workflow and the transitions between them.
*/

@Injectable()
export class CreationStepsService {

	// ========================================================================================
	//                   Fields
	// ========================================================================================

	BASICS: string = 'BasicInfo';
	OBJECTIVES: string = 'Objectives';
	ALTERNATIVES: string = 'Alternatives';
	PREFERENCES: string = 'ScoreFunctions';
	PRIORITIES: string = 'Weights';

	nextStep: { [currentStep: string]: string; } = {}; // Map from step to next step.
	previousStep: { [currentStep: string]: string; } = {}; // Map from step to previous step.
	observables: { [step: string]: Observable<boolean>; } = {}; // A collection of Observable objects for each step.
																// These are set by each step's component during ngInit.
																// This enables the parent component (CreateValueChart)
																// to trigger validation in its children and observe the result.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private router: Router) {

		this.nextStep[this.BASICS] = this.OBJECTIVES;
		this.nextStep[this.OBJECTIVES] = this.ALTERNATIVES;
		this.nextStep[this.ALTERNATIVES] = this.PREFERENCES;
		this.nextStep[this.PREFERENCES] = this.PRIORITIES;
		this.nextStep[this.PRIORITIES] = this.PRIORITIES;

		this.previousStep[this.BASICS] = this.BASICS;
		this.previousStep[this.OBJECTIVES] = this.BASICS;
		this.previousStep[this.ALTERNATIVES] = this.OBJECTIVES;
		this.previousStep[this.PREFERENCES] = this.ALTERNATIVES;
		this.previousStep[this.PRIORITIES] = this.PREFERENCES;
	}

	// ========================================================================================
	//                   Methods
	// ========================================================================================

	/* 	
		@returns {string}
		@description 	Navigates to the component for the next step and returns the next step.
	*/
	next(step: string, purpose: string): string {
		if (step !== this.PRIORITIES)
			this.router.navigate(['createValueChart/' + purpose + '/' + this.nextStep[step]]);

		return this.nextStep[step];
	}

	/* 	
		@returns {string}
		@description 	Navigates to the component for the previous step and returns the previous step.
	*/
	previous(step: string, purpose: string): string {
		this.router.navigate(['createValueChart/' + purpose + '/' + this.previousStep[step]]);
		return this.previousStep[step];
	}

	/* 	
		@returns {boolean}
		@description 	Subscribes to the Observable for step's component, which triggers validation in that component.
						Returns true iff validation passes.
	*/
	validate(step: string): boolean {
		let valid: boolean;
		this.observables[step].subscribe(isValid => {
			valid = isValid;
		});
        return valid;
	}
}