import { Component, Input, OnInit }										from '@angular/core';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';
import { Alternative }													from '../../model/Alternative';

@Component({
	selector: 'CreateAlternatives',
	templateUrl: 'app/resources/components/createAlternatives-component/CreateAlternatives.template.html',
	inputs: ['vc']
})
export class CreateAlternativesComponent implements OnInit {
	valueChart: ValueChart;
    alternatives: { [altID: string]: Alternative; };
    isSelected: { [altID: string]: boolean; };
    alternativesCount: number;

	constructor() { }

	ngOnInit() {
		this.alternatives = {};
		this.isSelected = {};
		this.alternativesCount = 0;

		if (this.valueChart.getAlternatives().length === 0) {
			this.addEmptyAlternative();
		}
		else {
			for (let alt of this.valueChart.getAlternatives()) {
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
		this.valueChart.setAlternatives(alternatives);
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

	@Input() set vc(value: any) {
		this.valueChart = <ValueChart>value;
	}
}