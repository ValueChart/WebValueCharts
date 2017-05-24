// Import Angular Classes:
import { Component, OnInit, OnDestroy }										from '@angular/core';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }												from '../../../app/services/ValueChart.service';
import { CreationStepsService }												from '../../services/CreationSteps.service';
import { ValueChartHttpService }											from '../../../app/services/ValueChartHttp.service';
import { ValidationService }											from '../../../app/services/Validation.service';

// Import Model Classes:
import { ValueChart } 														from '../../../../model/ValueChart';

/*
	This component defines the UI controls for defining the basic info for a ValueChart (name, description, and password).
*/

@Component({
	selector: 'CreateBasicInfo',
	templateUrl: './CreateBasicInfo.template.html',
})
export class CreateBasicInfoComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// The ValueChart:
	valueChart: ValueChart;

	// Validation fields:
	validationTriggered: boolean;
	originalName: string;
	errorMessages: string[]; // Validation error messages

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(public valueChartService: ValueChartService,
		private creationStepsService: CreationStepsService,
		private valueChartHttpService: ValueChartHttpService,
		private validationService: ValidationService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// ================================ Life-cycle Methods ====================================

	/* 	
		@returns {void}
		@description 	Initializes CreateBasicInfo. ngOnInit is only called ONCE by Angular.
						Calling ngOnInit should be left to Angular. Do not call it manually.
	*/
	ngOnInit() {
		this.creationStepsService.observables[this.creationStepsService.BASICS] = new Observable<boolean>((subscriber: Subscriber<boolean>) => {
            subscriber.next(this.validate());
            subscriber.complete();
        });
        this.creationStepsService.nameChanged = new Observable<boolean>((subscriber: Subscriber<boolean>) => {
            subscriber.next(this.nameChanged());
            subscriber.complete();
        });
        this.valueChart = this.valueChartService.getValueChart();
        this.validationTriggered = false;
		this.originalName = this.valueChart.getName();
		this.errorMessages = [];

		if (this.valueChart.password === undefined) {
			this.valueChart.password = '';
		}
	}

	// ================================ Validation Methods ====================================

	/* 	
		@returns {boolean}
		@description 	Checks validity of basic info of the chart.
						SIDE EFFECT: sets this.errorMessages
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
		this.errorMessages = this.validationService.validateBasicInfo(this.valueChart);
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

	nameChanged(): boolean {
		return this.originalName !== this.valueChartService.getValueChart().getName();
	}
}
