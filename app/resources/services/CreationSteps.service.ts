import { Injectable } 							from '@angular/core';

@Injectable()
export class CreationStepsService {

	BASICS: string = "basics";
	OBJECTIVES: string = "objectives";
	ALTERNATIVES: string = "alternatives";
	PREFERENCES: string = "preferences";
	PRIORITIES: string = "priorities";

	nextStep: { [currentStep: string]: string; } = {};
	previousStep: { [currentStep: string]: string; } = {};

	constructor() {
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

	next(step: string): string {
		return this.nextStep[step];
	}

	previous(step: string): string {
		return this.previousStep[step];
	}
}