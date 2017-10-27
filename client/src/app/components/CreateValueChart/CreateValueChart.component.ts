// Import Angular Classes:
import { Component, OnInit, OnDestroy }									from '@angular/core';
import { Router, ActivatedRoute }										from '@angular/router';
import { Observable }     												from 'rxjs/Observable';
import { Subscriber }     												from 'rxjs/Subscriber';
import { Subject }														from 'rxjs/Subject';
import '../../utilities/rxjs-operators';

import * as _ 															from 'lodash';

// Import Application Classes:
import { CreationStepsService }											from '../../services';
import { UpdateValueChartService }										from '../../services';
import { ValueChartService }											from '../../services';
import { CurrentUserService }											from '../../services';
import { ValidationService }											from '../../services';
import { UserNotificationService }										from '../../services';
import { HostService }													from '../../services';
import { ValueChartHttp }												from '../../http';

// Import Model Classes:
import { ValueChart, ChartType } 										from '../../../model';
import { User }															from '../../../model';

// Import Types
import { UserRole }														from '../../../types';
import { CreatePurpose }												from '../../../types';
import { ValueChartStatus }												from '../../../types';

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
	private lockedByCreator = false; // Records whether or not the chart is locked by its creator

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
		private hostService: HostService,
		private valueChartHttp: ValueChartHttp,
		private validationService: ValidationService,
		private userNotificationService: UserNotificationService) { }

	// ========================================================================================
	// 									definMethods
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
		this.creationStepsService.visitedScoreFunctions = [];

		this.sub = this.route.params.subscribe(params => { 
			this.creationStepsService.setCreationPurpose(parseInt(params['purpose']));

			if (this.creationStepsService.getCreationPurpose() === CreatePurpose.NewValueChart) {
				this.creationStepsService.setAutoSaveEnabled(true);
			} else if (this.creationStepsService.getCreationPurpose() === CreatePurpose.EditValueChart) {	
				this.creationStepsService.setAutoSaveEnabled(true);
				this.valueChartHttp.getValueChartStatus(this.valueChartService.getValueChart()._id).subscribe((status) => {
					this.lockedByCreator = status.lockedByCreator; 
					status.lockedBySystem = true; // prevent changes to users while chart is being edited
					this.valueChartHttp.setValueChartStatus(status).subscribe( (newStatus) => { this.valueChartService.setStatus(newStatus); });
				});
			} else {
				this.hostService.hostGroupValueChart(this.valueChartService.getValueChart()._id)
			}
			
			this.creationStepsService.valueChartCopy = _.cloneDeep(this.valueChartService.getValueChart());

			this.loading = false;
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
		this.hostService.endCurrentHosting();
		
		if (this.creationStepsService.getAutoSaveEnabled()) {
			// Check validity of chart structure and current user's preferences. Prevent changes to users if not valid.
			let lockedBySystem = (this.validationService.validateStructure(this.valueChartService.getValueChart()).length > 0
				|| (this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername()) && this.validationService.validateUser(this.valueChartService.getValueChart(), this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername())).length > 0 ));
			
			let status: ValueChartStatus = <any> {};
			status.lockedByCreator = this.lockedByCreator;
			status.lockedBySystem = lockedBySystem;
			status.chartId = this.valueChartService.getValueChart()._id;
			this.valueChartService.setStatus(status);
			this.valueChartHttp.setValueChartStatus(status).subscribe( (newStatus) => { status = newStatus; });

			this.creationStepsService.autoSaveValueChart(false);
		}
	}

	/* 	
		@returns {boolean}
		@description 	Do not show previous button if:
						(1) on the first step OR
						(2) the user is joining the chart or editing preferences AND
							(a) on the Preferences step OR
							(b) there are no mutable objectives (in this case, there is only one step - Priorities)
	*/
	hidePreviousButton(): boolean {
		return (this.creationStepsService.step === this.creationStepsService.BASICS
   			|| ((this.creationStepsService.getCreationPurpose() === CreatePurpose.NewUser || this.creationStepsService.getCreationPurpose() === CreatePurpose.EditUser)
            && (this.creationStepsService.step === this.creationStepsService.PREFERENCES || this.valueChartService.getValueChart().getMutableObjectives().length === 0)));
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
		@description 	 Return text for 'Next' button.
	*/
	nextButtonText(): string {
		if (this.creationStepsService.step === this.creationStepsService.BASICS) {
			return "Define Objectives >>";
		}
		else if (this.creationStepsService.step === this.creationStepsService.OBJECTIVES) {
			return "Define Alteratives >>";
		}
		else if (this.creationStepsService.step === this.creationStepsService.ALTERNATIVES) {
			if (this.valueChartService.getValueChart().isIndividual() || this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername())) {
				return "Define Score Functions >>";
			} 
			else {
				return 'Join Chart >>';
			}
		}
		else {
			return "Define Weights >>";
		}
	}

	/* 	
		@returns {string}
		@description 	 Return text for 'Previous' button.
	*/
	previousButtonText(): string {
		if (this.creationStepsService.step === this.creationStepsService.OBJECTIVES) {
			return "<< Define Chart Basics";
		}
		else if (this.creationStepsService.step === this.creationStepsService.ALTERNATIVES) {
			return "<< Define Objectives";
		}
		else if (this.creationStepsService.step === this.creationStepsService.PREFERENCES) {
			return "<< Define Alternatives";
		}
		else {
			return "<< Define Score Functions";
		}
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
		this.valueChartHttp.isNameAvailable(this.valueChartService.getValueChart().getName()).subscribe(available => {
			if (available) {
				this.navigationResponse.next(true);
			}
			else {
				this.userNotificationService.displayErrors([this.creationStepsService.NAME_TAKEN]);
				this.navigationResponse.next(false);
			}
			$('#navigation-warning-modal').modal('hide');
		});
	}
}
