/*
* @Author: aaronpmishkin
* @Date:   2016-12-30 18:28:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-31 15:52:56
*/

// Import Angular Classes:
import { Component, Output, Input }												from '@angular/core';
import { OnInit }																from '@angular/core';
import { EventEmitter }															from '@angular/core';


// Import Types:
import { InteractionConfig }													from '../../../../../types/Config.types';

@Component({
	selector: 'InteractionOptions',
	templateUrl: 'client/resources/modules/app/components/widgets/InteractionOptions/InteractionOptions.template.html',
	providers: []
})
export class InteractionOptionsComponent implements OnInit {

	// Pump Sorting Values:
	private PUMP_OFF: string = 'none';
	private PUMP_DECREASE: string = 'decrease';
	private PUMP_INCREASE: string = 'increase';

	// Alternative Sorting Values:
	private ALTERNATIVE_SORT_MANUAL: string = 'manual';
	private ALTERNATIVE_SORT_OBJECTIVE: string = 'objective';
	private ALTERNATIVE_SORT_ALPHABET: string = 'alphabet';
	private ALTERNATIVE_SORT_RESET: string = 'reset';
	private ALTERNATIVE_SORT_OFF: string = 'none';

	// Weight Resizing Values:
	private RESIZE_NEIGHBOR: string = 'neighbor';
	private RESIZE_SIBLINGS: string = 'siblings';
	private NO_RESIZING: string = 'none';

	@Input() chartType: string;

	@Output() interactionConfig = new EventEmitter<InteractionConfig>();
	private config: InteractionConfig;


	ngOnInit() {
		this.config = {
			weightResizeType: (this.chartType === 'interactive') ? this.RESIZE_NEIGHBOR : this.NO_RESIZING,
			reorderObjectives: false,
			sortAlternatives: this.ALTERNATIVE_SORT_OFF,
			pumpWeights: this.PUMP_OFF,
			setObjectiveColors: false,
			adjustScoreFunctions: (this.chartType === 'interactive')
		}

		this.updateInteractionConfig(this.config);
	}

	updateInteractionConfig(configObject: InteractionConfig) {
		this.interactionConfig.emit(configObject);
	}

	// ================================ Handlers for User Interaction Controls ====================================

	setWeightResizeType(resizeType: string): void {
		this.config.weightResizeType = resizeType;
		this.updateInteractionConfig(this.config);
	}


	toggleReorderObjectives(newVal: boolean): void {
		this.config.reorderObjectives = newVal;

		// Turn off all other interactions.
		this.config.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.config.pumpWeights = this.PUMP_OFF;
		this.config.setObjectiveColors = false;
		this.updateInteractionConfig(this.config);
	}

	toggleSortAlternatives(sortType: string): void {
		this.config.sortAlternatives = (this.config.sortAlternatives === sortType && (sortType === this.ALTERNATIVE_SORT_OBJECTIVE || sortType === this.ALTERNATIVE_SORT_MANUAL)) ? this.ALTERNATIVE_SORT_OFF : sortType;

		if (sortType === this.ALTERNATIVE_SORT_ALPHABET || sortType === this.ALTERNATIVE_SORT_RESET) {
			window.setTimeout(() => {
				this.config.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
			}, 10);
		}

		// Turn off all other interactions.
		this.config.reorderObjectives = false;
		this.config.pumpWeights = this.PUMP_OFF;
		this.config.setObjectiveColors = false;
		this.updateInteractionConfig(this.config);
	}

	setPumpType(pumpType: string): void {
		this.config.pumpWeights = (this.config.pumpWeights === pumpType) ? this.PUMP_OFF : pumpType;

		// Turn off all other interactions.
		this.config.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.config.reorderObjectives = false;
		this.config.setObjectiveColors = false;
		this.updateInteractionConfig(this.config);
	}

	toggleSetObjectiveColors(newVal: boolean): void {
		this.config.setObjectiveColors = newVal;

		// Turn off all other interactions.
		this.config.sortAlternatives = this.ALTERNATIVE_SORT_OFF;
		this.config.reorderObjectives = false;
		this.config.pumpWeights = this.PUMP_OFF;
		this.updateInteractionConfig(this.config);
	}

}
