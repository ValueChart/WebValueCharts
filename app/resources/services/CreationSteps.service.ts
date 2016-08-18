import { Injectable } 							from '@angular/core';
import { Router }								from '@angular/router';

@Injectable()
export class CreationStepsService {

	BASICS: string = 'BasicInfo';
	OBJECTIVES: string = 'Objectives';
	ALTERNATIVES: string = 'Alternatives';
	PREFERENCES: string = 'ScoreFunctions';
	PRIORITIES: string = 'Weights';

	nextStep: { [currentStep: string]: string; } = {};
	previousStep: { [currentStep: string]: string; } = {};

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

	next(step: string, purpose: string): string {
		if (step !== this.PRIORITIES)
			this.router.navigate(['createValueChart/' + purpose + '/' + this.nextStep[step]]);
		
		return this.nextStep[step];
	}

	previous(step: string, purpose: string): string {
		this.router.navigate(['createValueChart/' + purpose + '/' + this.previousStep[step]]);
		return this.previousStep[step];
	}
}