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

	getColumnHeader(obj: PrimitiveObjective) : string {
		if (obj.getDomainType() === 'continuous') {
			return obj.getName() + " (min: " + (<ContinuousDomain>obj.getDomain()).getMinValue() + ", max: " +  (<ContinuousDomain>obj.getDomain()).getMaxValue() + ")"; 
		}
		else {
			return obj.getName();
		}
	}

	altKeys(): Array<string> {
		return Object.keys(this.alternatives);
	}

	getNames(): string[] {
		let names: string[] = [];
		for (let altID of this.altKeys()) {
			names.push(this.alternatives[altID].getName());
		}
		return names;
	}

	getFormattedNames(): string[] {
		return this.getNames().map(x => Formatter.nameToID(x));
	}

	addEmptyAlternative() {
		this.alternatives[this.alternativesCount] = new Alternative("", "");
		this.isSelected[this.alternativesCount] = false;
		this.alternativesCount++;
	}

	deleteAlternatives() {
		for (let key of this.altKeys()) {
			if (this.isSelected[key]) {
				delete this.alternatives[key];
				delete this.isSelected[key];
			}
		}
	}

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

	toggleSelectAll() {
		let allSelected = this.allSelected();
		for (let key of this.altKeys()) {
			this.isSelected[key] = !allSelected;
		}
	}

	toNumber(str: string): number {
		return Number(str);
	}

	// Validation methods:

	validate(): boolean {
		this.validationTriggered = true;
		return this.hasAlternatives() && this.allHaveNames() && this.allNamesValid()
			&& this.allNamesUnique() && this.allObjectivesHaveValues() && this.allValuesWithinRange();
	}

	hasAlternatives(): boolean {
		return this.altKeys().length > 0;
	}

	allHaveNames(): boolean {
		return this.getNames().indexOf("") === -1;
	}

	allNamesValid(): boolean {
		let regex = new RegExp("^[\\s\\w-]+$");
		for (let name of this.getNames()) {
			if (name.search(regex) === -1) {
				return false;
			}
		}
		return true;
	}

	allNamesUnique(): boolean {
		return this.getFormattedNames().length === (new Set(this.getFormattedNames())).size;
	}

	allObjectivesHaveValues(): boolean {
		for (let altID of this.altKeys()) {
			for (let objname of this.valueChartService.getPrimitiveObjectivesByName()) {
				if (!this.alternatives[altID].getObjectiveValue(objname)) {
					return false;
				}
			}
		}
		return true;
	}

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