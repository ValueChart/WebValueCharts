import { Component, OnInit, OnDestroy }									from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';

// Import Application Classes:
import { CreateBasicInfoComponent }										from '../createBasicInfo-component/CreateBasicInfo.component';
import { CreateObjectivesComponent }									from '../createObjectives-component/CreateObjectives.component';
import { CreateAlternativesComponent }									from '../createAlternatives-component/CreateAlternatives.component';
import { CreateScoreFunctionsComponent }								from '../createScoreFunctions-component/CreateScoreFunctions.component';
import { CreateWeightsComponent }										from '../createWeights-component/CreateWeights.component';
import { CurrentUserService }											from '../../services/CurrentUser.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { ValueChartService }											from '../../services/ValueChart.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';
import { ValueChartHttpService }										from '../../services/ValueChartHttp.service';

// Import Model Classes:
import { ValueChart } 													from '../../model/ValueChart';
import { User }															from '../../model/User';

@Component({
	selector: 'createValueChart',
	templateUrl: 'app/resources/components/createValueChart-component/CreateValueChart.template.html',
	directives: [ROUTER_DIRECTIVES, CreateBasicInfoComponent, CreateObjectivesComponent, CreateAlternativesComponent, CreateScoreFunctionsComponent, CreateWeightsComponent],
	providers: [CreationStepsService, ValueChartService, ChartUndoRedoService]
})
export class CreateValueChartComponent implements OnInit {
	valueChart: ValueChart;
	user: User;
	purpose: string; // "newChart" or "newUser" or "editChart"
	step: string;
	sub: any;
	private services: any = {};
	private location: string;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private currentUserService: CurrentUserService,
		private valueChartHttpService: ValueChartHttpService,
		private creationStepsService: CreationStepsService,
		private valueChartService: ValueChartService,
		private chartUndoRedoService: ChartUndoRedoService) { }

	ngOnInit() {
		this.location = window.location.pathname;
		this.services.valueChartService = this.valueChartService;
		this.services.chartUndoRedoService = this.chartUndoRedoService;
		this.services.scoreFunctionViewerService = new ScoreFunctionViewerService(this.valueChartService);

		// Bind purpose to corresponding URL parameter
		this.sub = this.route.params.subscribe(params => this.purpose = params['purpose']);

		// Initialize according to purpose
		if (this.purpose == "newChart") {
			this.step = this.creationStepsService.BASICS; 3
			this.user = new User(this.currentUserService.getUsername());
			this.valueChart = new ValueChart("", "", this.user.getUsername()); // Create new ValueChart with a temporary name and description
			this.valueChart.addUser(this.user);
			this.valueChartService.setValueChart(this.valueChart);
			this.currentUserService.setValueChart(this.valueChart);
		}
		else if (this.purpose == "newUser") {
			this.step = this.creationStepsService.PREFERENCES;
			this.user = new User(this.currentUserService.getUsername());
			this.valueChart = this.currentUserService.getValueChart();
			this.valueChart.addUser(this.user);
			this.valueChartService.setValueChart(this.valueChart);
			this.currentUserService.setValueChart(this.valueChart);
		}
		else if (this.purpose === "editChart") {
			this.step = this.creationStepsService.BASICS;
			this.user = this.valueChartService.getCurrentUser();
			this.valueChart = this.valueChartService.getValueChart();
		}
		else {
			throw "Invalid route to CreateValueChart"; // TODO: handle this properly
		}
		this.addNavigationWarning();
	}

	ngOnDestroy() {
		this.sub.unsubscribe();		// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
	}

	addNavigationWarning(): void {
		history.pushState(null, document.title, window.location.pathname);

		window.onpopstate = (eventObject: Event) => {
			var navigate = window.confirm('Do you really want to navigate away from this page? All of your creation progress will be lost.');

			if (navigate) {
				window.onpopstate = () => { };
				history.back();
			} else {
				history.pushState("", document.title, window.location.pathname);
			}
		}
	}

	back() {
		this.step = this.creationStepsService.previous(this.step);
	}

	next() {
		if (this.step === this.creationStepsService.PRIORITIES) {
			this.saveValueChartToDatabase();
			window.onpopstate = () => { };
			this.router.navigate(['/view/ValueChart']);
		}
		this.step = this.creationStepsService.next(this.step);
	}

	saveValueChartToDatabase() {
		if (!this.valueChart._id) {
			this.valueChartHttpService.createValueChart(this.valueChart)
				.subscribe(
				(valueChart: ValueChart) => {
					// Set the id of the ValueChart.
					this.valueChart._id = valueChart._id;
				},
				// Handle Server Errors
				(error) => {

				});
		}
	}

	disableBackButton(): boolean {
		return (this.step === this.creationStepsService.BASICS ||
			(this.step === this.creationStepsService.PREFERENCES && this.purpose === "newUser"));
	}

	disableNextButton(): boolean {
		// Add validation
		return false;
	}

	nextButtonText(): string {
		let text = "Next >>";
		if (this.step === this.creationStepsService.PRIORITIES) {
			text = "View Chart >>";
		}
		return text;
	}
}
