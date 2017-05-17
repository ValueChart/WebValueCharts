// Import Angular Classes:
import { Component, OnInit, OnDestroy }										from '@angular/core';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }												from '../../../app/services/ValueChart.service';
import { CreationStepsService }												from '../../services/CreationSteps.service';
import { ValueChartHttpService }											from '../../../app/services/ValueChartHttp.service';

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

	// ValueChart info fields:
	valueChartDescription: string;
	valueChartPassword: string = '';

	// Validation fields:
	validationTriggered: boolean = false;
	originalName: string = '';

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
		private valueChartHttpService: ValueChartHttpService) { }

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
		this.valueChartDescription = this.valueChartService.getValueChart().getDescription();
		this.valueChartPassword = this.valueChartService.getValueChart().password ? this.valueChartService.getValueChart().password : "";
		this.originalName = this.valueChartService.getValueChart().getName();
	}

	/* 	
		@returns {void}
		@description 	Destroys CreateBasicInfo. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
						requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		this.valueChartService.getValueChart().setDescription(this.valueChartDescription);
		this.valueChartService.getValueChart().password = this.valueChartPassword;
	}

	// ================================ Validation Methods ====================================

	/* 	
		@returns {boolean}
		@description 	Validates input values.
						This should be done prior to updating the ValueChart model and saving to the database.
	*/
	validate(): boolean {
		this.validationTriggered = true;
		return this.nameValid() && this.passwordValid();
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the name contains at least one character 
						and only alphanumeric characters, spaces, hyphens, and underscores.
	*/
	nameValid(): boolean {
		let regex = new RegExp("^[\\s\\w-,.]+$");
		return (this.valueChartService.getValueChart().getName().search(regex) !== -1);
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the password contains at least one character and no spaces.
	*/
	passwordValid() {
		let regex = new RegExp("^[^\\s]+$");
		return (this.valueChartPassword.search(regex) !== -1);
	}

	nameChanged(): boolean {
		return this.originalName !== this.valueChartService.getValueChart().getName();
	}
}
