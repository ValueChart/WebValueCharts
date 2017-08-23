/*
* @Author: aaronpmishkin
* @Date:   2016-12-30 18:28:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-27 17:45:12
*/

// Import Angular Classes:
import { Component, Output, Input }												from '@angular/core';
import { OnInit }																from '@angular/core';
import { EventEmitter }															from '@angular/core';

// Import Types:
import { InteractionConfig, WeightResizeType, PumpType, SortAlternativesType }	from '../../../types';


@Component({
	selector: 'InteractionOptions',
	templateUrl: './InteractionOptions.template.html',
	providers: []
})
export class InteractionOptionsComponent implements OnInit {

	@Input('interactive') 
	set setType (interactive: boolean) {
		this.interactive = interactive;

		this.config = {
			weightResizeType: this.interactive ? WeightResizeType.Neighbors : WeightResizeType.None,
			reorderObjectives: false,
			sortAlternatives: SortAlternativesType.None,
			pumpWeights: PumpType.None,
			setObjectiveColors: false,
			adjustScoreFunctions: this.interactive
		}

		this.updateInteractionConfig(this.config);
	};

	@Output() interactionConfig = new EventEmitter<InteractionConfig>();
	
	public interactive: boolean;
	public config: InteractionConfig;
	public WeightResizeType = WeightResizeType;
	public PumpType = PumpType;
	public SortAlternativesType = SortAlternativesType;


	ngOnInit() {
		this.config = {
			weightResizeType: this.interactive ? WeightResizeType.Neighbors : WeightResizeType.None,
			reorderObjectives: false,
			sortAlternatives: SortAlternativesType.None,
			pumpWeights: PumpType.None,
			setObjectiveColors: false,
			adjustScoreFunctions: this.interactive
		}

		this.updateInteractionConfig(this.config);
	}

	updateInteractionConfig(configObject: InteractionConfig) {
		this.interactionConfig.emit(configObject);
	}

	// ================================ Handlers for User Interaction Controls ====================================

	setWeightResizeType(resizeType: WeightResizeType): void {
		this.config.weightResizeType = resizeType;
		this.updateInteractionConfig(this.config);
	}


	toggleReorderObjectives(newVal: boolean): void {
		this.config.reorderObjectives = newVal;

		// Turn off all other interactions.
		this.config.sortAlternatives = SortAlternativesType.None;
		this.config.pumpWeights = PumpType.None;
		this.config.setObjectiveColors = false;
		this.updateInteractionConfig(this.config);
	}

	toggleSortAlternatives(sortType: SortAlternativesType): void {
		this.config.sortAlternatives = (this.config.sortAlternatives === sortType && (sortType === SortAlternativesType.ByObjectiveScore || sortType === SortAlternativesType.Manually )) ? SortAlternativesType.None : sortType;

		if (sortType === SortAlternativesType.Alphabetically || sortType === SortAlternativesType.Default) {
			window.setTimeout(() => {
				this.config.sortAlternatives = SortAlternativesType.None;
			}, 10);
		}

		// Turn off all other interactions.
		this.config.pumpWeights = PumpType.None;
		this.config.reorderObjectives = false;
		this.config.setObjectiveColors = false;
		this.updateInteractionConfig(this.config);
	}

	setPumpType(pumpType: PumpType): void {
		this.config.pumpWeights = (this.config.pumpWeights === pumpType) ? PumpType.None : pumpType;

		// Turn off all other interactions.
		this.config.sortAlternatives = SortAlternativesType.None;
		this.config.reorderObjectives = false;
		this.config.setObjectiveColors = false;
		this.updateInteractionConfig(this.config);
	}

	toggleSetObjectiveColors(newVal: boolean): void {
		this.config.setObjectiveColors = newVal;

		// Turn off all other interactions.
		this.config.sortAlternatives = SortAlternativesType.None;
		this.config.pumpWeights = PumpType.None;
		this.config.reorderObjectives = false;
		this.updateInteractionConfig(this.config);
	}

}
