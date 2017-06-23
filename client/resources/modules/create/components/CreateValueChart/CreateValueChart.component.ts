// Import Angular Classes:
import { Component, OnInit, OnDestroy }									from '@angular/core';
import { Router, ActivatedRoute }										from '@angular/router';
import { Observable }     												from 'rxjs/Observable';
import { Subscriber }     												from 'rxjs/Subscriber';
import { Subject }														from 'rxjs/Subject';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { CreateBasicInfoComponent }										from '../CreateBasicInfo/CreateBasicInfo.component';
import { CreateObjectivesComponent }									from '../CreateObjectives/CreateObjectives.component';
import { CreateAlternativesComponent }									from '../CreateAlternatives/CreateAlternatives.component';
import { CreateScoreFunctionsComponent }								from '../CreateScoreFunctions/CreateScoreFunctions.component';
import { CreateWeightsComponent }										from '../CreateWeights/CreateWeights.component';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { UpdateObjectiveReferencesService }								from '../../services/UpdateObjectiveReferences.service';
import { CurrentUserService }											from '../../../app/services/CurrentUser.service';
import { ValueChartHttpService }										from '../../../app/services/ValueChartHttp.service';
import { ValueChartService }											from '../../../app/services/ValueChart.service';
import { ValidationService }											from '../../../app/services/Validation.service';

// Import Model Classes:
import { ValueChart } 													from '../../../../model/ValueChart';
import { User }															from '../../../../model/User';

/*
	This component handles the workflow to create new value charts, edit value charts, and add new users to charts. 
	It supplies navigation buttons that allow the user to progress through the stages.

	Each substep of the create workflow is handled by a separate child component. Clicking navigation buttons triggers 
	validation in the current substep's component.

*/

@Component({
	selector: 'createValueChart',
	templateUrl: './CreateValueChart.template.html',
	providers: [UpdateObjectiveReferencesService]
})
export class CreateValueChartComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	valueChart: ValueChart;
	purpose: string; // "newChart" or "newUser" or "editChart" or "editPreferences"

	// Navigation Control:
	sub: any;
	window: any = window;
	saveOnDestroy: boolean;
	allowedToNavigate: boolean = false;
	navigationResponse: Subject<boolean> = new Subject<boolean>();

	// Whole chart validation:
	validationMessage: string;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		public router: Router,
		private route: ActivatedRoute,
		public currentUserService: CurrentUserService,
		private valueChartHttpService: ValueChartHttpService,
		public creationStepsService: CreationStepsService,
		private valueChartService: ValueChartService,
		private validationService: ValidationService,
		private updateObjectiveReferencesService: UpdateObjectiveReferencesService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// ================================ Life-cycle Methods ====================================

	/* 	
		@returns {void}
		@description 	Initializes CreateValueChart. ngOnInit is only called ONCE by Angular.
						Calling ngOnInit should be left to Angular. Do not call it manually.
	*/
	ngOnInit() {

		this.creationStepsService.goBack = new Observable<void>((subscriber: Subscriber<void>) => {
            subscriber.next(this.back(true));
            subscriber.complete();
        });

        this.creationStepsService.goNext = new Observable<void>((subscriber: Subscriber<void>) => {
            subscriber.next(this.next(true));
            subscriber.complete();
        });

		// Bind purpose to corresponding URL parameter
		this.sub = this.route.params.subscribe(params => this.purpose = params['purpose']);
		this.creationStepsService.step = window.location.pathname.split('/').slice(-1)[0];

		// Initialize according to purpose
		if (this.purpose === 'newChart') {
			this.currentUserService.setJoiningChart(false);
			let valueChart = new ValueChart('', '', this.currentUserService.getUsername()); // Create new ValueChart with a temporary name and description
			this.valueChartService.setValueChart(valueChart); 
		}
		else if (this.purpose === 'editChart') {
			// Lock chart while editing
			this.valueChartHttpService.getValueChartStatus(this.valueChartService.getValueChart().getFName()).subscribe((status) => { 
				status.userChangesPermitted = false; 
				this.valueChartHttpService.setValueChartStatus(status).subscribe( (newStatus) => { status = newStatus; });
			});
		}
		this.valueChart = this.valueChartService.getValueChart();

		// Initialize save-on-destroy to true unless user is joining chart
		this.saveOnDestroy = !this.currentUserService.isJoiningChart();
	}

	/* 	
		@returns {void}
		@description 	Destroys CreateValueChart. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
						requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
		this.sub.unsubscribe();	

		if (this.saveOnDestroy) {
			// Check validity of chart structure and current user's preferences. Set to incomplete if not valid.
			let incomplete = (this.validationService.validateStructure(this.valueChart).length > 0
				|| (this.valueChartService.currentUserIsDefined() && this.validationService.validateUser(this.valueChart, this.valueChartService.getCurrentUser()).length > 0 ));
			
			let status: any = {};
			status.userChangesPermitted = true;
			status.incomplete = incomplete;
			status.name = this.valueChart.getName();
			status.fname = this.valueChart.getFName();
			status.chartId = this.valueChart._id;
			this.valueChartHttpService.setValueChartStatus(status).subscribe( (newStatus) => { status = newStatus; });
			this.autoSaveValueChart();
		}
	}

	// ================================ Navigation Methods ====================================

	/* 	
		@returns {void}
		@description 	Navigates to previous step
						Update ValueChart in database unless changes were made by a new user that is joining a group chart.
						(In this case, the user gets added to the chart in the database after the final submission.)
						browserTriggered indicates whether or not navigation was triggered by browser controls.
						(Parameter currently unused in this method.)			
	*/
	back(browserTriggered = false) {
		this.autoSaveValueChart();
		this.creationStepsService.allowedToNavigateInternally = true;
		this.creationStepsService.previous(this.purpose);				
	}

	/* 	
		@returns {void}
		@description 	Navigates to next step if validation of current step succeeds.

						If on the first step and creation a new chart, save to database.
						Otherwise, update ValueChart in database unless changes were made by a new user that is joining a group chart.
						(In this case, the user gets added to the chart in the database after the final submission.)

						If this is the last step, proceed to ViewValueChart.

						browserTriggered indicates whether or not navigation was triggered by browser controls.
						If it was and navigation does not go through, we need to fix the navigation history.	
	*/
	next(browserTriggered = false) {
		if (this.creationStepsService.validate()) {
			if (this.creationStepsService.step === this.creationStepsService.BASICS && this.creationStepsService.checkNameChanged()) {
				this.nextIfNameAvailable(browserTriggered);
			}
			else {
				this.autoSaveValueChart();
				this.creationStepsService.allowedToNavigateInternally = true;
				this.creationStepsService.next(this.purpose);
			}
		}
		else {
			toastr.error("There were problems with your submission. Please fix them to proceed.");
			if (browserTriggered) {
				history.forward();
			}
		}
	}

	/* 	
		@returns {void}
		@description 	Navigates to ValueChartViewer if validation succeeds.
	*/
	viewChart() {
		if (this.creationStepsService.validate()) {	
			// Catch validation errors introduced at other steps.
			// (Include structural errors and errors in current user's preferences.)
			let errorMessages = this.validationService.validateStructure(this.valueChart);
			if (this.valueChartService.currentUserIsDefined()) {
				errorMessages = errorMessages.concat(this.validationService.validateUser(this.valueChart, this.valueChartService.getCurrentUser()));
			} 
			if (errorMessages.length > 0) {
				this.validationMessage = "Cannot view chart. Please fix the following errors to proceed:\n\n" + errorMessages.join("\n\n");
					$('#validate-modal').modal('show');
			}
			else {
				window.onpopstate = () => { };
				(<any>window).destination = '/view/ValueChart';
				this.router.navigate(['view', 'individual', this.valueChart.getFName()], { queryParams: { password: this.valueChart.password } });
			}
		}
		else {
			toastr.error("There were problems with your submission. Please fix them to proceed.");
		}
	}

	/* 	
		@returns {void}
		@description 	If on step BASICS and the name has been changed, then we need to check if the name is available before proceeding.
						This can't be done along with the rest of validation because it requires an asynchronous call.
						Everything from here until navigation needs to be wrapped in this call; otherwise it may proceed before the call has finished.

						browserTriggered indicates whether or not navigation was triggered by browser controls.
						If it was and navigation does not go through, we need to fix the navigation history.	
						
	*/
	nextIfNameAvailable(browserTriggered = false) {
		this.valueChartHttpService.isNameAvailable(this.valueChart.getFName()).subscribe(isUnique => {
			if (isUnique === true) {
				this.autoSaveValueChart();
				this.creationStepsService.allowedToNavigateInternally = true;
				this.creationStepsService.next(this.purpose);
			}
			else {
				toastr.error("That name is already taken. Please choose another.")
				if (browserTriggered) {
					history.forward();
				}
			}
		});
	}

	/* 	
		@returns {boolean}
		@description 	Disable back button if:
						(1) on the first step
						(2) on Preferences step and the user navigated here using an "Edit Preferences" button
						(3) on Preferences step and a new user is joining a group chart (only the chart creator should be able to edit the structure)
	*/
	disableBackButton(): boolean {
		return (this.creationStepsService.step === this.creationStepsService.BASICS
			|| (this.creationStepsService.step === this.creationStepsService.PREFERENCES && this.purpose === 'newUser')
			|| (this.creationStepsService.step === this.creationStepsService.PREFERENCES && this.purpose === 'editPreferences'));
	}

	/* 	
		@returns {boolean}
		@description 	Disable the View Chart button if not on Alternatives or Priorities step.
	*/
	disableViewChartButton(): boolean {
		return (this.creationStepsService.step !== this.creationStepsService.ALTERNATIVES
			&& this.creationStepsService.step !== this.creationStepsService.PRIORITIES);
	}

	/* 	
		@returns {string}
		@description 	 Return text for 'Next' button. Differs only at last step.
	*/
	nextButtonText(): string {
		let text = 'Next Stage >>';
		if (this.creationStepsService.step === this.creationStepsService.ALTERNATIVES) {
			if (!this.valueChartService.currentUserIsDefined()) {
				text = 'Add Preferences >>';
			}
			else {
				text = 'Edit Preferences >>';
			}
		}
		return text;
	}

	/* 	
		@returns {string}
		@description 	 Return text for 'Next' button. Differs only at last step.
	*/
	navigationModalText(): string {
		let text = "Do you want to keep this ValueChart?";
		if (this.currentUserService.isJoiningChart()) {
			text = "Are you sure you want to leave this ValueChart?";
		}
		return text;
	}

	/* 	
		@returns {Observable<boolean>}
		@description	This method is called whenever the user attempts to navigate away from the CreateValueChart component
						via the "Home" button, "ValueCharts" main bar button, or any of the browser navigation controls.
						It asks the user if they want to save or discard the value chart, or cancel navigation.
						The response is returned as an observable boolean.
	*/
	openNavigationModal(): Observable<boolean> {
		$('#navigation-warning-modal').modal('show');

		this.navigationResponse = new Subject<boolean>();
		return this.navigationResponse.asObservable();
	}

	/* 	
		@returns {void}
		@description	This method handles the user's response to the navigation confirmation modal.
						Navigation proceeds if the user elected to discard the chart or save the chart.
						If this.saveOnDestroy is set to true, the chart will be saved when ngDestroy is called.
	*/
	handleNavigationReponse(keepValueChart: boolean, navigate: boolean): void {
		if (navigate && keepValueChart && this.creationStepsService.step === this.creationStepsService.BASICS && 
			this.creationStepsService.checkNameChanged()) {
			this.navigateAndSaveIfNameAvailable();
		}
		else {
			if (!keepValueChart) {
				this.saveOnDestroy = false;
				if (this.valueChart._id) {
					this.deleteValueChart(this.valueChart);
				}			
			}
			this.navigationResponse.next(navigate);
			$('#navigation-warning-modal').modal('hide');
		}
	}

	/* 	
		@returns {void}
		@description 	If on step BASICS and the name has been changed, then we need to check if the name is available before proceeding.
						This can't be done along with the rest of validation because it requires an asynchronous call.
						Everything from here until navigation needs to be wrapped in this call; otherwise it may proceed before the call has finished.
						
	*/
	navigateAndSaveIfNameAvailable() {
		this.valueChartHttpService.isNameAvailable(this.valueChart.getName()).subscribe(isUnique => {
			if (isUnique === true) {
				this.navigationResponse.next(true);
			}
			else {
				toastr.error("That name is already taken. Please choose another if you would like to save the chart.");
				this.navigationResponse.next(false);
			}
			$('#navigation-warning-modal').modal('hide');
		});
	}

	// ================================ Database Access Methods ====================================

	/* 	
		@returns {void}
		@description	Update valueChart in database. valueChart_.id is the id assigned by the database.
	*/
	autoSaveValueChart(): void {
		if (this.currentUserService.isJoiningChart()) {
			return;	// Don't autosave. The user is joining or editing preferences for an existing ValueChart.
		}
		if (!this.valueChart._id) {
			// Save the ValueChart for the first time.
			this.saveValueChartToDatabase();
		} else {
			// Update the ValueChart.
			this.valueChartHttpService.updateValueChart(this.valueChart)
				.subscribe(
				(valuechart) => { toastr.success('ValueChart auto-saved'); },
				(error) => {
					// Handle any errors here.
					toastr.warning('Auto-saving failed');
				});
		}
	}

	/* 	
		@returns {void}
		@description	Create a new ValueChart in the database. Set valueChart._id to the id assigned by the database.
	*/
	saveValueChartToDatabase(): void {
		this.valueChartHttpService.createValueChart(this.valueChart)
			.subscribe(
			(valueChart: ValueChart) => {
				// Set the id of the ValueChart.
				this.valueChart._id = valueChart._id;
				toastr.success('ValueChart auto-saved');
			},
			// Handle Server Errors
			(error) => {
				toastr.warning('Auto-saving failed');
			});
	}

	/* 	
		@returns {void}
		@description	Remove valueChart from database. valueChart_.id is the id assigned by the database.
	*/
	deleteValueChart(valueChart: ValueChart): void {
		if (valueChart._id) {
			this.valueChartHttpService.deleteValueChart(valueChart._id)
				.subscribe(status => { toastr.error('ValueChart deleted'); });
		}
	}
}
