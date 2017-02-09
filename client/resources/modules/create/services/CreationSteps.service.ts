// Import Angular Classes:
import { Injectable } 							from '@angular/core';
import { Router }								from '@angular/router';
import { Observable }     						from 'rxjs/Observable';
import '../../utilities/rxjs-operators';

// ImportApplication Classes:
import { ValueChartService }					from '../../app/services/ValueChart.service';
import { ValidationService }					from '../../app/services/Validation.service';

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
	nameChanged: Observable<boolean>; // This is set by the CreateBasicInfo component.
									  // It enables the parent component (CreateValueChart)
									  // to check whether or not the name has been changed,
									  // so it can check or not check for uniqueness accordingly.

	goBack: Observable<void>;    // This is set by the CreateValueChart component.
								 // It allows CreationGuard to trigger call to "back()" in CreateValueChart.

	goNext: Observable<void>;  	 // This is set by the CreateValueChart component.
								 // It allows CreationGuard to trigger call to "next()" in CreateValueChart.

	allowedToNavigateInternally: boolean = false; // This is set by CreateValueChart indicating that navigation was triggered
												  // by a component method.
												  // This allows CreationGuard to intercept navigation triggered by browser buttons.

	step: string = ""; // The current step that CreateValueCharts is on.


	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private router: Router, 
		private valueChartService: ValueChartService, 
		private validationService: ValidationService) {

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
		@returns {void}
		@description 	Navigates to the component for the next step and returns the next step.
	*/
	next(purpose: string) {
		if (this.step === this.PRIORITIES) {
			window.onpopstate = () => { };
			(<any>window).destination = '/view/ValueChart';
			this.router.navigate(['/view/ValueChart']);				
		}
		else {
			this.step = this.nextStep[this.step];
			this.router.navigate(['createValueChart/' + purpose + '/' + this.step]);
		}
	}

	/* 	
		@returns {void}
		@description 	Navigates to the component for the previous step and returns the previous step.
	*/
	previous(purpose: string) {
		this.step = this.previousStep[this.step];
		this.router.navigate(['createValueChart/' + purpose + '/' + this.step]);
	}

	/* 	
		@returns {boolean}
		@description 	Subscribes to the Observable for step's component, which triggers validation in that component.
						Returns true iff validation passes.
	*/
	validate(): boolean {
		let valid: boolean;
		this.observables[this.step].subscribe(isValid => {
			valid = isValid;
		});
        return valid;
	}

	/* 	
		@returns {boolean}
		@description 	Subscribes to the Observable nameChanged, which triggers check for name change in CreateBasicInfo.
						Returns true iff the name has been changed.
	*/
	checkNameChanged(): boolean {
		let changed: boolean;
		this.nameChanged.subscribe(hasChanged => {
			changed = hasChanged;
		});
        return changed;
	}
}