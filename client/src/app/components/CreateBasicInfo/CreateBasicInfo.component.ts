// Import Angular Classes:
import { Component, OnInit, OnDestroy }										from '@angular/core';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import * as _																from 'lodash';

import '../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }												from '../../services';
import { CreationStepsService }												from '../../services';
import { CurrentUserService }												from '../../services';
import { ValidationService }												from '../../services';
import { ValueChartHttp }													from '../../http';

// Import Model Classes:
import { ValueChart, ChartType } 											from '../../../model';
import { User }																from '../../../model';
import { Objective }														from '../../../model';

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
	public displayModal = false;

	// Chart type:
	public ChartType = ChartType;
	public type: ChartType;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		public currentUserService: CurrentUserService,
		public valueChartService: ValueChartService,
		private creationStepsService: CreationStepsService,
		private valueChartHttp: ValueChartHttp,
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
        this.creationStepsService.nameChanged = this.nameChanged;
        this.valueChart = this.valueChartService.getValueChart();
        this.type = this.valueChart.getType();
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
	*/
	validate(): boolean {
		// Update name and description of root Objective
		if (this.valueChart.getAllObjectives().length > 0) {
			let rootObjective: Objective = this.valueChart.getRootObjectives()[0];
			rootObjective.setName(this.valueChart.getName());
			rootObjective.setDescription(this.valueChart.getDescription());
		}
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

	nameChanged = (): boolean => {
		return this.originalName !== this.valueChart.getName();
	}

	// ================================ Convert Chart Type ====================================

	confirmConvert() {
		let numUsers = this.valueChart.getUsers().length;
		if (numUsers > 1 || (numUsers === 1 && !this.valueChart.isMember(this.valueChart.getCreator()))) {
			this.displayModal = true;
		}
		else {
			this.convertToIndividual();
		}
	}

	convertToIndividual() {
		// Update the local chart to contain only the current user
		let newUsers: User[] = [];
		let currentUser = this.valueChart.getUser(this.currentUserService.getUsername());

		if (!_.isNil(currentUser)) {
			newUsers.push(currentUser);
		}

		this.valueChart.setUsers(newUsers);
		this.valueChart.setType(ChartType.Individual);

		// Clear the default score functions
		for (let obj of this.valueChart.getAllPrimitiveObjectives()) {
			obj.setDefaultScoreFunction(undefined);
		}

		// Manually remove the old users from the database to alert the event listeners
		this.valueChartHttp.updateUsers(this.valueChart._id, newUsers).subscribe();
	}

	resetType(): void {
		this.type = ChartType.Group;
	}
}
