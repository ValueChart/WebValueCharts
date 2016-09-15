// Import Angular Classes:
import { Component, OnInit }											from '@angular/core';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }											from '../../../app/services/ValueChart.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import *	as Formatter												from '../../../utilities/classes/Formatter';

// Import Model Classes:
import { ValueChart } 													from '../../../../model/ValueChart';
import { Alternative }													from '../../../../model/Alternative';
import { PrimitiveObjective }											from '../../../../model/PrimitiveObjective';
import { ContinuousDomain }												from '../../../../model/ContinuousDomain';

/*
	This component defines the UI controls for creating and editing the Alternatives of a ValueChart.
	It consists of an Angular table where each row is bound to an Alternative object in the ValueChart.
*/

@Component({
	selector: 'CreateAlternatives',
	templateUrl: 'client/resources/modules/create/components/CreateAlternatives/CreateAlternatives.template.html',
})
export class CreateAlternativesComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

    alternatives: { [altID: string]: Alternative; }; // It is necessary to track Alternatives by ID since their names may not be unique
    isSelected: { [altID: string]: boolean; }; // Specifies whether the row corresponding to each Alternative is currently selected
    alternativesCount: number; // Incremented every time an Alternative is added, but never decremented; used to generate unique IDs for Alternatives

    // Validation fields:
    validationTriggered: boolean = false; // Specifies whether or not validation has been triggered (this happens when the user attempts to navigate)
										  // If true, validation messages will be shown whenever conditions fail

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private valueChartService: ValueChartService, private creationStepsService: CreationStepsService) { }

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
		this.alternatives = {};
		this.isSelected = {};
		this.alternativesCount = 0;

		if (this.valueChartService.getAlternatives().length === 0) {
			this.addEmptyAlternative();
		}
		else {
			for (let alt of this.valueChartService.getAlternatives()) {
				this.alternatives[this.alternativesCount] = alt;
				this.alternativesCount++;
			}
		}
	}

	/* 	
		@returns {void}
		@description 	Destroys CreateAlternatives. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
						requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		let alternatives: Alternative[] = [];
		for (let altID of this.altKeys()) {
			alternatives.push((this.alternatives[altID]));
		}
		this.valueChartService.setAlternatives(alternatives);
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
		this.isSelected[this.alternativesCount] = false;
		this.alternativesCount++;
	}

	/* 	
		@returns {void}
		@description 	Deletes all selected Alternatives
	*/
	deleteAlternatives() {
		for (let key of this.altKeys()) {
			if (this.isSelected[key]) {
				delete this.alternatives[key];
				delete this.isSelected[key];
			}
		}
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff all Alternatives are selected.
	*/
	allSelected(): boolean {
		if (this.altKeys().length === 0) {
			return false;
		}
		for (let key of this.altKeys()) {
			if (!this.isSelected[key]) {
				return false;
			}
		}
		return true;
	}

	/* 	
		@returns {void}
		@description 	Deselects all Alternatives if all are selected, selects all otherwise.
	*/
	toggleSelectAll() {
		let allSelected = this.allSelected();
		for (let key of this.altKeys()) {
			this.isSelected[key] = !allSelected;
		}
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
		@description 	Validates Alternatives.
						This should be done prior to updating the ValueChart model and saving to the database.
	*/
	validate(): boolean {
		this.validationTriggered = true;
		return this.hasAlternatives() && this.allHaveNames() && this.allNamesValid()
			&& this.allNamesUnique() && this.allObjectivesHaveValues() && this.allValuesWithinRange();
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff there is at least one Alternative.
	*/
	hasAlternatives(): boolean {
		return this.altKeys().length > 0;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every Alternative has a name that isn't the empty string.
	*/
	allHaveNames(): boolean {
		return this.getNames().indexOf("") === -1;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every Altenrativehas a name that contains at least one character
						and only alphanumeric characters, spaces, hyphens, and underscores.
	*/
	allNamesValid(): boolean {
		let regex = new RegExp("^[\\s\\w-]+$");
		for (let name of this.getNames()) {
			if (name.search(regex) === -1) {
				return false;
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff all Alternatives names are unique after converting to ID format.
	*/
	allNamesUnique(): boolean {
		return this.getFormattedNames().length === (new Set(this.getFormattedNames())).size;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff a value has been set/selected in evern Objective column for every Alternative.
	*/
	allObjectivesHaveValues(): boolean {
		for (let altID of this.altKeys()) {
			for (let objname of this.valueChartService.getPrimitiveObjectivesByName()) {
				if (this.alternatives[altID].getObjectiveValue(objname) === undefined) {
					return false;
				}
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the values entered for every continuous Objective for every Alternative are within the set range.
	*/
	allValuesWithinRange(): boolean {
		for (let altID of this.altKeys()) {
			for (let obj of this.valueChartService.getPrimitiveObjectives()) {
				if (obj.getDomainType() === 'continuous') {
					let dom: ContinuousDomain = <ContinuousDomain>obj.getDomain();
					let objValue = this.alternatives[altID].getObjectiveValue(obj.getName());
					if (objValue > dom.getMaxValue() || objValue < dom.getMinValue()) {
						return false;
					}
				}
			}
		}
		return true;
	}
}