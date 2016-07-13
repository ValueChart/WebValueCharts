import { Component }													from '@angular/core';
import { OnInit }														from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';

// Application classes:
import { CurrentUserService }											from '../../services/CurrentUser.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';

@Component({
	selector: 'createValueChart',
	templateUrl: './app/resources/components/createValueChart-component/CreateValueChart.template.html',
	directives: [ROUTER_DIRECTIVES],
	providers: [CreationStepsService]
})
export class CreateValueChartComponent implements OnInit {
	purpose: string; // "newChart" or "newUser"
	step: string;
	sub: any;

	// Bound ValueChart properties
	valueChartName: string;
	valueChartDescription: string;
	isGroupValueChart: boolean;
	
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private currentUserService: CurrentUserService,
		private creationStepsService: CreationStepsService) { }

	ngOnInit() {
		// Initialize ValueChart properties
		this.valueChartName = "";
		this.valueChartDescription = "";
		this.isGroupValueChart = false;

		// Bind purpose to corresponding URL parameter
    	this.sub = this.route.params.subscribe(params => this.purpose = params['purpose']);
    	
    	// Set initial step according to purpose
    	if (this.purpose == "newUser") {
    		this.step = this.creationStepsService.PREFERENCES;
    	}
    	else {
    		this.step = this.creationStepsService.BASICS;
    	}

    	// Create new ValueChart with a temporary name and description
    	// TODO: Change model so that there is just one ValueCharts class
    	this.currentUserService.setValueChart(new ValueChart(this.currentUserService.getUsername(),this.valueChartName,this.valueChartDescription));
  	}

	back() {
		this.step = this.creationStepsService.previous(this.step);
	}

	next() {
		if (this.step === this.creationStepsService.BASICS) {
			this.currentUserService.getValueChart().setName(this.valueChartName);
			this.currentUserService.getValueChart().setDescription(this.valueChartDescription);
		}
		else if (this.step === this.creationStepsService.PRIORITIES) {
			//this.router.navigate(['/view/ValueChart']);
		}
		this.step = this.creationStepsService.next(this.step);
	}

	save() {
		// TODO: save to file using XML writer service
	}

	disableBackButton() : boolean {
		return (this.step === this.creationStepsService.BASICS || 
			(this.step === this.creationStepsService.PREFERENCES && this.purpose === "newUser"));
	}

	disableSaveButton() : boolean {
		let enabled = (this.step === this.creationStepsService.PRIORITIES ||
					 this.step === this.creationStepsService.ALTERNATIVES && this.isGroupValueChart);
		return !enabled;
	}

	nextButtonText() : string {
		let text = "Next >>";
		if (this.step === this.creationStepsService.PRIORITIES) {
			text = "View Chart >>";
		}
		return text;
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

}