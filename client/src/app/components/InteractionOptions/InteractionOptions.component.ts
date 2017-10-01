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


/*
	The InteractionOptions component implements a UI widget for toggling ValueChart Visualization interactions on and off.
	It sets creates and outputs an InteractionConfig instance that can be directly input into the ValueChartDirective to set
	the visualization's interaction settings.  

	This component is currently only used by the ValueChartViewer.
*/

@Component({
	selector: 'InteractionOptions',
	templateUrl: './InteractionOptions.template.html',
	providers: []
})
export class InteractionOptionsComponent implements OnInit {

	// Whether or the not preference modifying interactions will be permitted. These interactions include:
	//	- The pump tool; - resizing weights by dragging; - adjusting score functions by dragging; 
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

	@Output() interactionConfig = new EventEmitter<InteractionConfig>();		// The event emitter that outputs a new InteractionConfig whenever 
																				// the user interacts with the widget and changes a setting.
	
	public interactive: boolean;
	public config: InteractionConfig;											// The internal InteractionConfig instance.
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
