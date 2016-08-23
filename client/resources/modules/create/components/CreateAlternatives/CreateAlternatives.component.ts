import { Component, OnInit }											from '@angular/core';

// Import Application Classes:
import { ValueChartService }											from '../../../app/services/ValueChart.service';


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

	constructor(private valueChartService: ValueChartService) { }

	ngOnInit() {
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
}