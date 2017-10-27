// Import Angular Classes:
import { Injectable } 							from '@angular/core';
import { Router }								from '@angular/router';
import { Observable }     						from 'rxjs/Observable';
import '../utilities/rxjs-operators';

// Import Libraries: 
import * as _ 									from 'lodash';

// ImportApplication Classes:
import { ValueChartService }					from './ValueChart.service';
import { CurrentUserService }					from './CurrentUser.service';
import { ValidationService }					from './Validation.service';
import { UserNotificationService }				from './UserNotification.service';
import { ValueChartHttp }						from '../http';

// Import Types
import { UserRole }								from '../../types';
import { CreatePurpose }						from '../../types';
import { ValueChartStatus }						from '../../types';
import { ValueChart, ChartType } 				from '../../model';
import { User } 								from '../../model';

/*
	This class defines the names and orders of steps in the Creation workflow and the transitions between them.
*/

@Injectable()
export class CreationStepsService {

	// ========================================================================================
	//                   Fields
	// ========================================================================================

	BASICS: string = 'BasicInfo';
	OBJECTIVES: string = 'Objectives';
	ALTERNATIVES: string = 'Alternatives';
	PREFERENCES: string = 'ScoreFunctions';
	PRIORITIES: string = 'Weights';

	private nextStep: { [currentStep: string]: string; } = {}; // Map from step to next step.
	private previousStep: { [currentStep: string]: string; } = {}; // Map from step to previous step.
	observables: { [step: string]: Observable<boolean>; } = {}; // A collection of Observable objects for each step.
																// These are set by each step's component during ngInit.
																// This enables the parent component (CreateValueChart)
																// to trigger validation in its children and observe the result.
	
	nameChanged: Function; // Whether or not the chart name has been changed (set by CreateBasicInfo).
	step: string = ""; // The current step that CreateValueChart is on.
	private purpose: CreatePurpose;
	autoSaveEnabled: boolean;

	// Error messages
	validationMessage: string;
	public displayValidationModal: boolean = false;
	NAME_TAKEN: string = "That name is already taken. Please choose another.";

	// Copy of the current ValueChart. This is used to determine if there are changes which should be autosaved.
	public valueChartCopy: ValueChart;

	// List of visited score functions. Used to keep track of which score functions have been inspected between steps.
	public visitedScoreFunctions: string[] = [];

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private router: Router, 
		private valueChartService: ValueChartService, 
		private currentUserService: CurrentUserService, 
		private validationService: ValidationService,
		private userNotificationService: UserNotificationService,
		private valueChartHttp: ValueChartHttp) {

		this.nextStep[this.BASICS] = this.OBJECTIVES;
		this.nextStep[this.OBJECTIVES] = this.ALTERNATIVES;
		this.nextStep[this.ALTERNATIVES] = this.PREFERENCES;
		this.nextStep[this.PREFERENCES] = this.PRIORITIES;
		this.nextStep[this.PRIORITIES] = this.PRIORITIES;

		this.previousStep[this.BASICS] = this.BASICS;
		this.previousStep[this.OBJECTIVES] = this.BASICS;
		this.previousStep[this.ALTERNATIVES] = this.OBJECTIVES;
		this.previousStep[this.PREFERENCES] = this.ALTERNATIVES;
		this.previousStep[this.PRIORITIES] = this.PREFERENCES;
	}

	// ========================================================================================
	//                   Methods
	// ========================================================================================

	getCreationPurpose(): CreatePurpose {
		return this.purpose;
	}

	setCreationPurpose(purpose: CreatePurpose): void {
		this.purpose = purpose;
	}

	getAutoSaveEnabled(): boolean {
		return this.autoSaveEnabled;
	}

	setAutoSaveEnabled(autoSaveEnabled: boolean): void {
		this.autoSaveEnabled = autoSaveEnabled;
	}

	// ================================ Navigation Methods ====================================

	/* 	
		@returns string
		@description 	Returns the previous step.
	*/
	getPreviousStep(currentStep: string): string {
		if (currentStep === this.PRIORITIES && this.valueChartService.getValueChart().getMutableObjectives().length === 0) {
			return this.ALTERNATIVES;
		}
		return this.previousStep[currentStep];
	}

	/* 	
		@returns string
		@description 	Returns the next step.
	*/
	getNextStep(currentStep: string): string {
		if (currentStep === this.ALTERNATIVES && this.valueChartService.getValueChart().getMutableObjectives().length === 0) {
			return this.PRIORITIES;
		}
		return this.nextStep[currentStep];
	}

	/* 	
		@returns boolean
		@description 	Prepares to navigate to previous step.
						Returns whether or not navigation may proceed (for now, always true).
	*/
	previous(): boolean {
		this.autoSaveValueChart();
		this.step = this.getPreviousStep(this.step);
		return true;
	}

	/* 	
		@returns boolean
		@description 	Prepares to navigate to the next step.
						Returns whether or not navigation may proceed.
						(True if validation of the current step passes and the chart name is not already taken.)
	*/
	next(): boolean | Promise<boolean> {
		if (this.validate()) {
			if (this.step === this.BASICS && this.nameChanged()) {
				return new Promise((resolve) => {this.isNameAvailable().subscribe((available: boolean) => {
						if (available) {
							this.autoSaveValueChart();
							this.step = this.getNextStep(this.step);
						}
						else {
							this.userNotificationService.displayErrors([this.NAME_TAKEN]);
						}
						resolve(available);
					});
				});
			}
			else {
				this.autoSaveValueChart();
				this.step = this.getNextStep(this.step);
				return true;
			}		
		}
		else {
			this.userNotificationService.displayErrors(["There were problems with your submission. Please fix them to proceed."]);
			return false;
		}
	}

	/* 	
		@returns {void}
		@description 	Prepares to navigate to the ValueChartViewer.
						Proceeds if validation passes and the chart name is not already taken.
	*/
	viewChart() {
		if (this.validateForViewing()) {
			if (this.step === this.BASICS && this.nameChanged()) {
				this.isNameAvailable().subscribe((available: boolean) => {
					if (available) {
						this.navigateToViewer();
					}
					else {
						this.userNotificationService.displayErrors([this.NAME_TAKEN]);
					}
				});
			}
			else {
				this.navigateToViewer();
			}		
		}	
	}

	/* 	
		@returns {void}
		@description 	Navigates to ValueChartViewer.
	*/
	navigateToViewer() {
		window.onpopstate = () => { };
		let chartType = this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername()) ? ChartType.Individual : ChartType.Group;
		if (this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername()) && this.valueChartService.getValueChart().getCreator() === this.currentUserService.getUsername()) {
			this.router.navigate(['ValueCharts', this.valueChartService.getValueChart().getFName(), chartType], { queryParams: { password: this.valueChartService.getValueChart().password, role: UserRole.OwnerAndParticipant } });		
		} 
		else {
			this.router.navigate(['ValueCharts', this.valueChartService.getValueChart().getFName(), chartType], { queryParams: { password: this.valueChartService.getValueChart().password }, queryParamsHandling: 'merge' });
		}
	}

	// ================================ Validation Methods ====================================

	/* 	
		@returns {boolean}
		@description 	Subscribes to the Observable for step's component, which triggers validation in that component.
						Returns true iff validation passes.
	*/
	validate(): boolean {
		let valid: boolean;
		this.observables[this.step].subscribe(isValid => {
			valid = isValid;
		});
        return valid;
	}

	/* 	
		@returns {boolean}
		@description 	Validates the current step, the chart structure, and the current user's preferences.
						Returns true iff all validation passes.
	*/
	validateForViewing(): boolean {
		let errorMessages = [];
		if (this.validate()) {	
			// Catch validation errors introduced at other steps.
			// (Include structural errors and errors in current user's preferences.)
			let errorMessages = this.validationService.validateStructure(this.valueChartService.getValueChart());
			if (this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername())) {
				errorMessages = errorMessages.concat(this.validationService.validateUser(this.valueChartService.getValueChart(), this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername())));
			} 
			if (errorMessages.length > 0) {
				this.validationMessage = "Cannot view chart. Please fix the following errors to proceed:\n\n" + errorMessages.join("\n\n");
				this.displayValidationModal = true;
				return false;
			}
		}
		else {
			this.userNotificationService.displayErrors(["There were problems with your submission. Please fix them to proceed."]);
			return false;
		}
		return true;
	}

	// ================================ Database Access Methods ====================================

	/* 	
		@param createStatusDocument - whether or not to create a new status document if saving the chart for the first time. 
		@returns {void}
		@description	Update valueChart in database. valueChart_.id is the id assigned by the database.
	*/
	autoSaveValueChart = (createStatusDocument = true): void => {
		let valueChart: ValueChart = this.valueChartService.getValueChart();

		if (this.autoSaveEnabled) {
			if (!valueChart._id) {
				// Save the ValueChart for the first time.
				this.saveValueChartToDatabase(createStatusDocument);
			} else if (!_.isEqual(valueChart, this.valueChartCopy)) {
				// Update the ValueChart.
				this.valueChartHttp.updateValueChart(valueChart).subscribe(
					(result: ValueChart) => { this.userNotificationService.displaySuccesses(['ValueChart auto-saved']); },
					(error: any) => {
						// Handle any errors here.
						this.userNotificationService.displayWarnings(['Auto-saving failed']);
					});
			}
			
			this.valueChartCopy = _.cloneDeep(valueChart);
		}
	}

	/* 	
		@param createStatusDocument - whether or not to create a new status document along with the chart.
		@returns {void}
		@description	Create a new ValueChart in the database. Set valueChart._id to the id assigned by the database.
	*/
	saveValueChartToDatabase(createStatusDocument: boolean): void {
		this.valueChartHttp.createValueChart(this.valueChartService.getValueChart())
			.subscribe(
			(valueChart: ValueChart) => {
				// Set the id of the ValueChart.
				this.valueChartService.getValueChart()._id = valueChart._id;
				this.userNotificationService.displaySuccesses(['ValueChart auto-saved']);

				if (createStatusDocument) {
					let status: ValueChartStatus = <any> {};
					status.lockedByCreator = false;
					status.lockedBySystem = true; // prevent changes to users while chart is being created
					status.chartId = this.valueChartService.getValueChart()._id;
					this.valueChartHttp.setValueChartStatus(status).subscribe( (newStatus) => { status = newStatus; });
				}	
			},
			// Handle Server Errors
			(error) => {
				this.userNotificationService.displayWarnings(['Auto-saving failed']);
			});
	}

	/* 	
		@returns {void}
		@description	Remove valueChart from database. valueChart_.id is the id assigned by the database.
	*/
	deleteValueChart(valueChart: ValueChart): void {
		if (valueChart._id) {
			this.valueChartHttp.deleteValueChart(valueChart._id)
				.subscribe(status => { this.userNotificationService.displaySuccesses(['ValueChart deleted'])});
		}
	}

	isNameAvailable(): Observable<boolean> {
 		return this.valueChartHttp.isNameAvailable(this.valueChartService.getValueChart().getFName());
  	}
}