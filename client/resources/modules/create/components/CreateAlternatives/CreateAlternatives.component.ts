import { Component, OnInit }											from '@angular/core';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }											from '../../../app/services/ValueChart.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import *	as Formatter												from '../../../utilities/classes/Formatter';

// Model Classes
import { ValueChart } 													from '../../../../model/ValueChart';
import { Alternative }													from '../../../../model/Alternative';
import { PrimitiveObjective }											from '../../../../model/PrimitiveObjective';
import { ContinuousDomain }												from '../../../../model/ContinuousDomain';

@Component({
	selector: 'CreateAlternatives',
	templateUrl: 'client/resources/modules/create/components/CreateAlternatives/CreateAlternatives.template.html',
})
export class CreateAlternativesComponent implements OnInit {
    alternatives: { [altID: string]: Alternative; };
    isSelected: { [altID: string]: boolean; };
    alternativesCount: number;

    // Validation fields:
    validationTriggered: boolean = false;

	constructor(private valueChartService: ValueChartService, private creationStepsService: CreationStepsService) { }

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