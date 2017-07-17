// Import Angular Classes:
import { Injectable } 							from '@angular/core';
import { Router }								from '@angular/router';
import { Observable }     						from 'rxjs/Observable';
import '../../utilities/rxjs-operators';

// ImportApplication Classes:
import { ValueChartService }					from '../../app/services/ValueChart.service';
import { CurrentUserService }					from '../../app/services/CurrentUser.service';
import { ValidationService }					from '../../app/services/Validation.service';
import { UserNotificationService }				from '../../app/services/UserNotification.service';
import { ValueChartHttpService }				from '../../app/services/ValueChartHttp.service';

// Import Types
import { UserRole }								from '../../../types/UserRole';
import { CreatePurpose }						from '../../../types/CreatePurpose';
import { ValueChart, ChartType } 				from '../../../model/ValueChart';

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

	nextStep: { [currentStep: string]: string; } = {}; // Map from step to next step.
	previousStep: { [currentStep: string]: string; } = {}; // Map from step to previous step.
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
	NAME_TAKEN: string = "That name is already taken. Please choose another.";

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
		private valueChartHttpService: ValueChartHttpService) {

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
		@returns boolean
		@description 	Prepares to navigate to previous step.
						Returns whether or not navigation may proceed (for now, always true).
	*/
	previous(): boolean {
		this.autoSaveValueChart();
		this.step = this.previousStep[this.step];
		return true;
	}

	/* 	
		@returns boolean
		@description 	Prepares to navigate to the next step.
						Returns whether or not navigation may proceed.
						(True if validation of the current step passes and the chart name is not already taken).
	*/
	next(): boolean | Promise<boolean> {
		if (this.validate()) {
			if (this.step === this.BASICS && this.nameChanged()) {
				return new Promise((resolve) => {this.isNameAvailable().subscribe((available: boolean) => {
						if (available) {
							this.autoSaveValueChart();
							this.step = this.nextStep[this.step];
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
				this.step = this.nextStep[this.step];
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
		this.valueChartService.setValueChart(this.valueChartService.getValueChart());
		window.onpopstate = () => { };
		(<any>window).destination = '/view/ValueChart';
		let chartType = this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername()) ? ChartType.Individual : ChartType.Group;
		if (this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername()) && this.valueChartService.getValueChart().getCreator() === this.currentUserService.getUsername()) {
			this.router.navigate(['ValueCharts', this.valueChartService.getValueChart().getFName(), chartType], { queryParams: { password: this.valueChartService.getValueChart().password, role: UserRole.OwnerAndParticipant } });		
		} else {
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
				$('#validatation-modal').modal('show');
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
		@returns {void}
		@description	Update valueChart in database. valueChart_.id is the id assigned by the database.
	*/
	autoSaveValueChart = (): void => {
		if (this.autoSaveEnabled) {
			if (!this.valueChartService.getValueChart()._id) {
				// Save the ValueChart for the first time.
				this.saveValueChartToDatabase();
			} else {
				// Update the ValueChart.
				this.valueChartHttpService.updateValueChart(this.valueChartService.getValueChart())
					.subscribe(
					(valuechart) => { this.userNotificationService.displaySuccesses(['ValueChart auto-saved']); },
					(error) => {
						// Handle any errors here.
						this.userNotificationService.displayWarnings(['Auto-saving failed']);
					});
			}
		}
	}

	/* 	
		@returns {void}
		@description	Create a new ValueChart in the database. Set valueChart._id to the id assigned by the database.
	*/
	saveValueChartToDatabase(): void {
		this.valueChartHttpService.createValueChart(this.valueChartService.getValueChart())
			.subscribe(
			(valueChart: ValueChart) => {
				// Set the id of the ValueChart.
				this.valueChartService.getValueChart()._id = valueChart._id;
				this.userNotificationService.displaySuccesses(['ValueChart auto-saved']);

				// Create status document
				let status: any = {};
				status.userChangesPermitted = false;
				status.incomplete = true;
				status.name = this.valueChartService.getValueChart().getName();
				status.fname = this.valueChartService.getValueChart().getFName();
				status.chartId = this.valueChartService.getValueChart()._id;
				this.valueChartHttpService.setValueChartStatus(status).subscribe( (newStatus) => { status = newStatus; });
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
			this.valueChartHttpService.deleteValueChart(valueChart._id)
				.subscribe(status => { this.userNotificationService.displayErrors(['ValueChart deleted'])});
		}
	}

	isNameAvailable(): Observable<boolean> {
 		return this.valueChartHttpService.isNameAvailable(this.valueChartService.getValueChart().getFName());
  	}
}