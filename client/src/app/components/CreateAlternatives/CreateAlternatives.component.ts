// Import Angular Classes:
import { Component, OnInit }											from '@angular/core';
import { Observable }     												from 'rxjs/Observable';
import { Subscriber }     												from 'rxjs/Subscriber';
import '../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }											from '../../services';
import { CreationStepsService }											from '../../services';
import { ValidationService }											from '../../services';
import *	as Formatter												from '../../utilities/Formatter';

// Import Model Classes:
import { ValueChart } 													from '../../../model';
import { Alternative }													from '../../../model';
import { PrimitiveObjective }											from '../../../model';
import { ContinuousDomain }												from '../../../model';

/*
	This component defines the UI controls for creating and editing the Alternatives of a ValueChart.
	It consists of an Angular table where each row is bound to an Alternative object in the ValueChart.
*/

@Component({
	selector: 'CreateAlternatives',
	templateUrl: './CreateAlternatives.template.html',
})
export class CreateAlternativesComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

    // The ValueChart:
	valueChart: ValueChart;

	// Alternative row fields:
    alternatives: { [altID: string]: Alternative; }; // It is necessary to track Alternatives by ID since their names may not be unique
    alternativesCount: number; // Incremented every time an Alternative is added, but never decremented; used to generate unique IDs for Alternatives

    // Validation fields:
    validationTriggered: boolean = false; // Specifies whether or not validation has been triggered (this happens when the user attempts to navigate)
										  // If true, validation messages will be shown whenever conditions fail
	errorMessages: string[]; // Validation error messages

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		public valueChartService: ValueChartService, 
		private creationStepsService: CreationStepsService, 
		private validationService: ValidationService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// ================================ Life-cycle Methods ====================================

	/* 	
		@returns {void}
		@description 	Initializes CreateAlternatives. ngOnInit is only called ONCE by Angular.
						Calling ngOnInit should be left to Angular. Do not call it manually.
	*/
	ngOnInit() {
		this.creationStepsService.observables[this.creationStepsService.ALTERNATIVES] = new Observable<boolean>((subscriber: Subscriber<boolean>) => {
            subscriber.next(this.validate());
            subscriber.complete();
        });
        this.valueChart = this.valueChartService.getValueChart();
		this.alternatives = {};
		this.alternativesCount = 0;
		this.errorMessages = [];

		if (this.valueChart.getAlternatives().length > 0) {
			for (let alt of this.valueChart.getAlternatives()) {
				this.alternatives[this.alternativesCount] = alt;
				this.alternativesCount++;
			}
			this.validationTriggered = this.validate();
		}
	}

	/*   
		@returns {void}
		@description   Destroys CreateAlternatives. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
		        requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		// Convert temporary structures to ValueChart structures
		let alternatives: Alternative[] = [];
		for (let altID of this.altKeys()) {
			alternatives.push((this.alternatives[altID]));
		}
		this.valueChart.setAlternatives(alternatives);
	}

	// ================================ Alternatives Table Methods ====================================

	/* 	
		@returns {string}
		@description 	Returns text for Objective column header.
						(Includes the range for continuous domain Objectives.)
	*/
	getColumnHeader(obj: PrimitiveObjective): string {
		if (obj.getDomainType() === 'continuous') {
			return obj.getName() + " (min: " + (<ContinuousDomain>obj.getDomain()).getMinValue() + ", max: " + (<ContinuousDomain>obj.getDomain()).getMaxValue() + ")";
		}
		else {
			return obj.getName();
		}
	}

	/* 	
		@returns {Array<string{}}
		@description 	Gets all Alternative IDs.
	*/
	altKeys(): Array<string> {
		return Object.keys(this.alternatives);
	}

	/* 	
		@returns {Array<string{}}
		@description 	Gets all Alternative names.
	*/
	getNames(): string[] {
		let names: string[] = [];
		for (let altID of this.altKeys()) {
			names.push(this.alternatives[altID].getName());
		}
		return names;
	}

	/* 	
		@returns {string[]}
		@description 	Gets all Alternative names in ID format. (Right now, it just removes whitespace.)
	*/
	getFormattedNames(): string[] {
		return this.getNames().map(x => Formatter.nameToID(x));
	}

	/* 	
		@returns {void}
		@description 	Adds a new, blank Alternative to alternatives.
						(This has the effect of inserting a new row.)
	*/
	addEmptyAlternative() {
		this.alternatives[this.alternativesCount] = new Alternative("", "");
		this.alternativesCount++;
		this.resetErrorMessages();
	}

	/* 	
		@returns {void}
		@description 	Deletes an Alternative
	*/
	deleteAlternative(altID: string) {
		delete this.alternatives[altID];
		this.resetErrorMessages();
	}

	/* 	
		@returns {number}
		@description 	Converts str to a number.
	*/
	toNumber(str: string): number {
		return Number(str);
	}

	// ================================ Validation Methods ====================================


	/* 	
		@returns {boolean}
		@description 	Checks validity of alternatives structure in the chart.
	*/
	validate(): boolean {
		this.validationTriggered = true;
		this.setErrorMessages();
		return this.errorMessages.length === 0;
	}

	/* 	
		@returns {boolean}
		@description 	Converts ObjectiveRow structure into ValueChart objective, then validates the objective structure of the ValueChart.
	*/
	setErrorMessages(): void {
		// Convert temporary structures to ValueChart structures
		let alternatives: Alternative[] = [];
		for (let altID of this.altKeys()) {
			alternatives.push((this.alternatives[altID]));
		}
		this.valueChart.setAlternatives(alternatives);

		// Validate
		this.errorMessages = this.validationService.validateAlternatives(this.valueChart);
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