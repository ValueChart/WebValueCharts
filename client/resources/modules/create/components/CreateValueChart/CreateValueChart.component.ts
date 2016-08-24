// Import Angular Classes:
import { Component, OnInit, OnDestroy }									from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';
import { Observable }     												from 'rxjs/Observable';
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
import { ChartUndoRedoService }											from '../../../app/services/ChartUndoRedo.service';
import { ValueChartHttpService }										from '../../../app/services/ValueChartHttp.service';
import { ValueChartService }											from '../../../app/services/ValueChart.service';

// Import Model Classes:
import { ValueChart } 													from '../../../../model/ValueChart';
import { User }															from '../../../../model/User';

@Component({
	selector: 'createValueChart',
	templateUrl: 'client/resources/modules/create/components/CreateValueChart/CreateValueChart.template.html',
	directives: [ROUTER_DIRECTIVES],
	providers: [CreationStepsService,UpdateObjectiveReferencesService]
})
export class CreateValueChartComponent implements OnInit {
	valueChart: ValueChart;
	user: User;
	purpose: string; // "newChart" or "newUser" or "editChart"
	step: string;
	sub: any;

	// Navigation Control:
	private window = window;
	private saveOnDestroy: boolean = false;
	public allowedToNavigate: boolean = false;
	public navigationResponse: Subject<boolean> = new Subject<boolean>();

	constructor(
		public router: Router,
		private route: ActivatedRoute,
		private currentUserService: CurrentUserService,
		private valueChartHttpService: ValueChartHttpService,
		private creationStepsService: CreationStepsService,
		private valueChartService: ValueChartService,
		private chartUndoRedoService: ChartUndoRedoService,
		private updateObjectiveReferencesService: UpdateObjectiveReferencesService) { }

	ngOnInit() {

		// Bind purpose to corresponding URL parameter
		this.sub = this.route.params.subscribe(params => this.purpose = params['purpose']);

		// Initialize according to purpose
		if (this.purpose == "newChart") {
			this.step = this.creationStepsService.BASICS;
			let valueChart = new ValueChart("", "", this.currentUserService.getUsername()); // Create new ValueChart with a temporary name and description
			(<any>valueChart).incomplete = true;
			this.valueChartService.setValueChart(valueChart); // Set the chart
			this.valueChartService.addUser(new User(this.currentUserService.getUsername())); // Add a new user
		}
		else if (this.purpose == "newUser") {
			this.step = this.creationStepsService.PREFERENCES;
			this.valueChartService.addUser(new User(this.currentUserService.getUsername())); // Add a new user to current chart
		}
		else if (this.purpose === "editChart") {
			this.step = this.creationStepsService.BASICS;
		}
		else if (this.purpose === "editStructure") {
			this.step = this.creationStepsService.OBJECTIVES;
		}
		else if (this.purpose === "editPreferences") {
			this.step = this.creationStepsService.PREFERENCES;
		}
		else {
			throw "Invalid route to CreateValueChart"; // TODO: handle this properly
		}
		this.valueChart = this.valueChartService.getValueChart();
		this.user = this.valueChartService.getCurrentUser();
	}

	ngOnDestroy() {
		this.sub.unsubscribe();		// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
		if (this.saveOnDestroy) {
			(this.valueChart._id) ? this.updateValueChartInDatabase(this.valueChart) : this.saveValueChartToDatabase(this.valueChart);
		}
	}

	back() {
		if (this.creationStepsService.validate(this.step)) {
			if (!this.currentUserService.isJoiningChart()) {
				this.updateValueChartInDatabase(this.valueChart);
			}
			this.step = this.creationStepsService.previous(this.step, this.purpose);
		}
		else {
			toastr.error('There were problems with your submission. Please fix them to proceed.');
		}
	}

	next() {
		if (this.creationStepsService.validate(this.step)) {
			
			// If the user is creating a new chart, auto-save it.
			if (!this.currentUserService.isJoiningChart()) {
				if (this.step === this.creationStepsService.BASICS) {
					this.saveValueChartToDatabase(this.valueChart);
				} else {
					this.updateValueChartInDatabase(this.valueChart);
				}
			}

			if (this.step === this.creationStepsService.PRIORITIES) {
				window.onpopstate = () => { };
				(<any>this.valueChart).incomplete = undefined;
				(<any> window).destination = '/view/ValueChart';
				this.router.navigate(['/view/ValueChart']);
			} 

			this.step = this.creationStepsService.next(this.step, this.purpose);			
		}
		else {
			toastr.error('There were problems with your submission. Please fix them to proceed.');
		}
	}

	updateValueChartInDatabase(valueChart: ValueChart): void {
		if (this.valueChart._id) {
			this.valueChartHttpService.updateValueChart(this.valueChart)
				.subscribe(
					(valuechart) => { toastr.success('ValueChart auto-saved'); },
					(error) => {
						// Handle any errors here.
						toastr.warning('Auto-saving failed');
					});
		}
	}

	saveValueChartToDatabase(valueChart: ValueChart): void {
		if (!valueChart._id) {
			this.valueChartHttpService.createValueChart(valueChart)
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
	}

	deleteValueChart(valueChart: ValueChart): void {
		if (valueChart._id) {
			this.valueChartHttpService.deleteValueChart(valueChart._id)
				.subscribe(status => { toastr.error('ValueChart deleted');  });
		}
	}

	disableBackButton(): boolean {
		return (this.step === this.creationStepsService.BASICS ||
			(this.step === this.creationStepsService.PREFERENCES && this.purpose === "newUser") ||
			(this.step === this.creationStepsService.PREFERENCES && this.purpose === "editPreferences"));
	}

	disableNextButton(): boolean {
		return false;
	}

	nextButtonText(): string {
		let text = "Next >>";
		if (this.step === this.creationStepsService.PRIORITIES) {
			text = "View Chart >>";
		}
		return text;
	}

	// Navigation Control:
	openNavigationModal(): Observable<boolean> {
		$('#navigation-warning-modal').modal('show');	
		
		return this.navigationResponse.asObservable();
	}

	handleNavigationReponse(keepValueChart: boolean, navigate: boolean): void {
		let cancelNavigation = false;
		if (navigate) {
			if (keepValueChart) {
				if (this.creationStepsService.validate(this.step)) {
					this.saveOnDestroy = true;
				}
				else {
					cancelNavigation = true;
					toastr.error("There were problems with your submission. Please fix them if you'd like to save the chart.");
				}
			} else if (this.valueChart._id) {
				this.deleteValueChart(this.valueChart);
			}
		}
		if (!cancelNavigation) {
			this.navigationResponse.next(navigate);
		}		

		$('#navigation-warning-modal').modal('hide');
	}
}
