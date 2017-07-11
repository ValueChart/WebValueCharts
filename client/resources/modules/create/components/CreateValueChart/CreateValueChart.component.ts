// Import Angular Classes:
import { Component, OnInit, OnDestroy }									from '@angular/core';
import { Router, ActivatedRoute }										from '@angular/router';
import { Observable }     												from 'rxjs/Observable';
import { Subscriber }     												from 'rxjs/Subscriber';
import { Subject }														from 'rxjs/Subject';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { UpdateValueChartService }										from '../../../app/services/UpdateValueChart.service';
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
	navigationResponse: Subject<boolean> = new Subject<boolean>();
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

		this.creationStepsService.step = window.location.pathname.split('/').slice(-1)[0];
		this.creationStepsService.setAutoSaveEnabled(false);

		this.sub = this.route.params.subscribe(params => { 
			this.creationStepsService.setCreationPurpose(parseInt(params['purpose']));

			if (this.creationStepsService.getCreationPurpose() === CreatePurpose.NewValueChart) {
				var valueChart = new ValueChart('', '', this.currentUserService.getUsername());
				valueChart.setType(ChartType.Individual); 
				this.valueChartService.setValueChart(valueChart);
			}
			
			if (this.creationStepsService.getCreationPurpose() === CreatePurpose.NewValueChart 
				|| this.creationStepsService.getCreationPurpose() === CreatePurpose.EditValueChart) {	
				this.lockValueChart();
				this.creationStepsService.setAutoSaveEnabled(true);
			}

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

		if (this.creationStepsService.getAutoSaveEnabled()) {
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

			this.creationStepsService.autoSaveValueChart();
		}
	}

	/* 	
		@returns {boolean}
		@description 	Disable previous button if:
						(1) on the first step
						(2) on Preferences step and the user is joining the chart or editing preferences
	*/
	disablePreviousButton(): boolean {
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
			this.creationStepsService.nameChanged()) {
			this.navigateAndSaveIfNameAvailable();
		}
		else {
			if (!keepValueChart) {
				this.creationStepsService.setAutoSaveEnabled(false);
				if (this.valueChartService.getValueChart()._id) {
					this.creationStepsService.deleteValueChart(this.valueChartService.getValueChart());
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
		this.valueChartHttpService.isNameAvailable(this.valueChartService.getValueChart().getName()).subscribe(available => {
			if (available) {
				this.navigationResponse.next(true);
			}
			else {
				toastr.error(this.creationStepsService.NAME_TAKEN);
				this.navigationResponse.next(false);
			}
			$('#navigation-warning-modal').modal('hide');
		});
	}
}
