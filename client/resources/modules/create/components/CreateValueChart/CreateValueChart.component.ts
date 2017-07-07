// Import Angular Classes:
import { Component, OnInit, OnDestroy }									from '@angular/core';
import { Router, ActivatedRoute }										from '@angular/router';
import { Observable }     												from 'rxjs/Observable';
import { Subscriber }     												from 'rxjs/Subscriber';
import { Subject }														from 'rxjs/Subject';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { UpdateObjectiveReferencesService }								from '../../services/UpdateObjectiveReferences.service';
import { ValueChartService }											from '../../../app/services/ValueChart.service';
import { CurrentUserService }											from '../../../app/services/CurrentUser.service';
import { ValueChartHttpService }										from '../../../app/services/ValueChartHttp.service';
import { ValidationService }											from '../../../app/services/Validation.service';

// Import Model Classes:
import { ValueChart, ChartType } 										from '../../../../model/ValueChart';
import { User }															from '../../../../model/User';

// Import Types
import { UserRole }														from '../../../../types/UserRole'
import { CreatePurpose }												from '../../../../types/CreatePurpose'

/*
	This component handles the workflow to create new value charts, edit value charts, and add new users to charts. 
	It supplies navigation buttons that allow the user to progress through the stages.

	Each substep of the create workflow is handled by a separate child component. Clicking navigation buttons triggers 
	validation in the current substep's component.

*/

@Component({
	selector: 'createValueChart',
	templateUrl: './CreateValueChart.template.html',
	providers: [ ]
})
export class CreateValueChartComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Navigation Control:
	sub: any;
	window: any = window;
	
	public autoSaveEnabled: boolean;
	allowedToNavigate: boolean = false;
	navigationResponse: Subject<boolean> = new Subject<boolean>();

	// Whole chart validation:
	validationMessage: string;
	public loading = true;
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
		public currentUserService: CurrentUserService,
		public valueChartService: ValueChartService,
		public creationStepsService: CreationStepsService,
		private route: ActivatedRoute,
		private valueChartHttpService: ValueChartHttpService,
		private validationService: ValidationService) { }

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

		this.creationStepsService.step = window.location.pathname.split('/').slice(-1)[0];


		// Lock chart while creator is editing
		if (this.creationStepsService.getCreationPurpose() === CreatePurpose.EditValueChart || this.creationStepsService.getCreationPurpose() === CreatePurpose.NewValueChart) {	
			this.lockValueChart()
		}


		this.sub = this.route.params.subscribe(params => { 
			this.creationStepsService.setCreationPurpose(parseInt(params['purpose']));
			

			if (this.creationStepsService.getCreationPurpose() === CreatePurpose.NewValueChart) {
				var valueChart = new ValueChart('', '', this.currentUserService.getUsername()); 
				this.valueChartService.setValueChart(valueChart);
			}
			this.autoSaveEnabled = this.creationStepsService.getCreationPurpose() === CreatePurpose.NewValueChart || this.creationStepsService.getCreationPurpose() === CreatePurpose.EditValueChart
			this.loading = false;
		});

	}

	lockValueChart(): void {
		this.valueChartHttpService.getValueChartStatus(this.valueChartService.getValueChart().getFName()).subscribe((status) => { 
			status.userChangesPermitted = false; 
			this.valueChartHttpService.setValueChartStatus(status).subscribe( (newStatus) => { status = newStatus; });
		});
	}

	/* 	
		@returns {void}
		@description 	Destroys CreateValueChart. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
						requires that a different component is displayed in the router-outlet.
	*/
	ngOnDestroy() {
		// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
		this.sub.unsubscribe();

		if (this.autoSaveEnabled) {
			// Check validity of chart structure and current user's preferences. Set to incomplete if not valid.
			let incomplete = (this.validationService.validateStructure(this.valueChartService.getValueChart()).length > 0
				|| (this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername()) && this.validationService.validateUser(this.valueChartService.getValueChart(), this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername())).length > 0 ));
			
			let status: any = {};
			status.userChangesPermitted = !incomplete;
			status.incomplete = incomplete;
			status.name = this.valueChartService.getValueChart().getName();
			status.fname = this.valueChartService.getValueChart().getFName();
			status.chartId = this.valueChartService.getValueChart()._id;
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
		this.creationStepsService.previous(this.creationStepsService.getCreationPurpose());				
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
				this.creationStepsService.next(this.creationStepsService.getCreationPurpose());
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
			let errorMessages = this.validationService.validateStructure(this.valueChartService.getValueChart());

			if (this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername())) {
				errorMessages = errorMessages.concat(this.validationService.validateUser(this.valueChartService.getValueChart(), this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername())));
			} 
			if (errorMessages.length > 0) {
				this.validationMessage = "Cannot view chart. Please fix the following errors to proceed:\n\n" + errorMessages.join("\n\n");
					$('#validate-modal').modal('show');
			}
			else {
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
		this.valueChartHttpService.isNameAvailable(this.valueChartService.getValueChart().getFName()).subscribe(isUnique => {
			if (isUnique === true) {
				this.autoSaveValueChart();
				this.creationStepsService.allowedToNavigateInternally = true;
				this.creationStepsService.next(this.creationStepsService.getCreationPurpose());
			} else {
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
						(2) on Preferences step and the user is joining the chart or editing preferences
	*/
	disableBackButton(): boolean {
		return (this.creationStepsService.step === this.creationStepsService.BASICS
   			|| (this.creationStepsService.step === this.creationStepsService.PREFERENCES && this.creationStepsService.getCreationPurpose() === CreatePurpose.NewUser)
            || (this.creationStepsService.step === this.creationStepsService.PREFERENCES && this.creationStepsService.getCreationPurpose() === CreatePurpose.EditUser));
	}

	/* 	
		@returns {boolean}
		@description 	Enable the View Chart button if:
						(1) the purpose is editChart or editPreferences
						(2) on the last step (Priorities)
						(3) on the Alternatives step and this is a group chart (allowing creator to skip joining)
	*/
	enableViewChartButton(): boolean {
		return (this.creationStepsService.getCreationPurpose() === CreatePurpose.EditValueChart || this.creationStepsService.getCreationPurpose() === CreatePurpose.EditUser
			|| this.creationStepsService.step === this.creationStepsService.PRIORITIES
			|| (this.creationStepsService.step === this.creationStepsService.ALTERNATIVES && this.valueChartService.getValueChart().getType() === ChartType.Group));
	}

	/* 	
		@returns {string}
		@description 	 Return text for 'Next' button. Differs only at last step.
	*/
	nextButtonText(): string {
		let text = 'Next Stage >>';
		if (!this.valueChartService.getValueChart().isIndividual() && this.creationStepsService.step === this.creationStepsService.ALTERNATIVES) {
			if (!this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername())) {
				text = 'Add Preferences >>';
			}
			else {
				text = 'Edit Preferences >>';
			}
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
		return this.navigationResponse;
	}

	/* 	
		@returns {void}
		@description	This method handles the user's response to the navigation confirmation modal.
						Navigation proceeds if the user elected to discard the chart or save the chart.
						If this.autoSaveEnabled is set to true, the chart will be saved when ngDestroy is called.
	*/
	handleNavigationReponse(keepValueChart: boolean, navigate: boolean): void {
		if (navigate && keepValueChart && this.creationStepsService.step === this.creationStepsService.BASICS && 
			this.creationStepsService.checkNameChanged()) {
			this.navigateAndSaveIfNameAvailable();
		}
		else {
			if (!keepValueChart) {
				this.autoSaveEnabled = false;
				if (this.valueChartService.getValueChart()._id) {
					this.deleteValueChart(this.valueChartService.getValueChart());
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
		this.valueChartHttpService.isNameAvailable(this.valueChartService.getValueChart().getName()).subscribe(isUnique => {
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
		if (this.autoSaveEnabled) {
			if (!this.valueChartService.getValueChart()._id) {
				// Save the ValueChart for the first time.
				this.saveValueChartToDatabase();
			} else {
				// Update the ValueChart.
				this.valueChartHttpService.updateValueChart(this.valueChartService.getValueChart())
					.subscribe(
					(valuechart) => { toastr.success('ValueChart auto-saved'); },
					(error) => {
						// Handle any errors here.
						toastr.warning('Auto-saving failed');
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
				toastr.success('ValueChart auto-saved');

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
