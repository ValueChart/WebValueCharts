import { Component }													from '@angular/core';
import { OnInit }														from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';

import * as d3 from 'd3';
//import * as jstree from 'jstree';

// Application classes:
import { ScoreFunctionDirective }										from '../../directives/ScoreFunction.directive';
import { CurrentUserService }											from '../../services/CurrentUser.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { ValueChartService }											from '../../services/ValueChart.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';
import { User }															from '../../model/User';
import { WeightMap }													from '../../model/WeightMap';
import { ScoreFunctionMap }												from '../../model/ScoreFunctionMap';
import { Objective }													from '../../model/Objective';
import { AbstractObjective }											from '../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { CategoricalDomain }											from '../../model/CategoricalDomain';
import { ContinuousDomain }												from '../../model/ContinuousDomain';
import { Alternative }													from '../../model/Alternative';

@Component({
	selector: 'createValueChart',
	templateUrl: 'app/resources/components/createValueChart-component/CreateValueChart.template.html',
	directives: [ROUTER_DIRECTIVES, ScoreFunctionDirective],
	providers: [CreationStepsService, ValueChartService, ChartUndoRedoService]
})
export class CreateValueChartComponent implements OnInit {
	purpose: string; // "newChart" or "newUser"
	step: string;
	sub: any;
	userName: string;
	treeData: string[];
	valueChartName: string;
	valueChartDescription: string;
	isGroupValueChart: boolean;
    valueChart: ValueChart;
    alternatives: { [altID: string]: Alternative; };
    isSelected: { [altID: string]: boolean; };
    alternativesCount: number;
    selectedObjective: string;
	
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private currentUserService: CurrentUserService,
		private creationStepsService: CreationStepsService,
		private valueChartService: ValueChartService) { }

	ngOnInit() {
		// Initialize ValueChart properties
		this.userName = this.currentUserService.getUsername();
		this.valueChartName = "";
		this.valueChartDescription = "";
		this.isGroupValueChart = false;
		this.treeData = ["item1","item2","item3"];
		this.alternatives = {};
		this.isSelected = {};
		this.alternativesCount = 0;

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
    	this.valueChart = new ValueChart(this.userName,this.valueChartName,this.valueChartDescription);
    	this.valueChart.addUser(new User(this.userName));
  	
    	// Temporary: create some Objectives
    	let rate = new PrimitiveObjective("rate","");
    	let location = new PrimitiveObjective("location","");
    	let internet = new PrimitiveObjective("internet","");
    	let pool = new PrimitiveObjective("pool","");
    	let amenities = new AbstractObjective("amenities","");
    	let other = new AbstractObjective("other","");

    	rate.setColor("green")
    	location.setColor("red");
    	internet.setColor("purple");
    	pool.setColor("blue");

    	amenities.addSubObjective(internet);
    	amenities.addSubObjective(pool);
    	other.addSubObjective(location);
    	other.addSubObjective(rate);

    	let ratedom = new ContinuousDomain(30,300,"CAD");
    	let locdom = new CategoricalDomain(false);
    	locdom.addElement("downtown");
    	locdom.addElement("highway");
    	let intdom = new CategoricalDomain(false);
    	intdom.addElement("none");
    	intdom.addElement("low");
    	intdom.addElement("high");
    	let pooldom = new CategoricalDomain(false);
    	pooldom.addElement("no");
    	pooldom.addElement("yes");

    	rate.setDomain(ratedom);
    	location.setDomain(locdom);
    	internet.setDomain(intdom);
    	pool.setDomain(pooldom);

    	let hotel1 = new Alternative("Hotel 1","");
    	hotel1.setObjectiveValue("rate",140);
    	hotel1.setObjectiveValue("location","downtown");
    	hotel1.setObjectiveValue("internet","high");
    	hotel1.setObjectiveValue("pool","no");

    	this.valueChart.setRootObjectives([amenities,other]);
    	this.alternatives[this.alternativesCount] = hotel1;
    	this.isSelected[this.alternativesCount] = true;
    	this.alternativesCount = this.alternativesCount + 1;
    	this.selectedObjective = "internet";

    	this.valueChartService.setValueChart(this.valueChart);
  	}

	back() {
		this.step = this.creationStepsService.previous(this.step);
	}

	next() {
		if (this.step === this.creationStepsService.BASICS) {
			this.valueChart.setName(this.valueChartName);
			this.valueChart.setDescription(this.valueChartDescription);
		}
		else if (this.step === this.creationStepsService.OBJECTIVES) {
			// Initialize User's WeightMap
    		this.valueChartService.getCurrentUser().setWeightMap(this.valueChartService.getInitialWeightMap());

    		// Initialize User's ScoreFunctionMap
    		this.valueChartService.getCurrentUser().setScoreFunctionMap(this.valueChartService.getInitialScoreFunctionMap());

		}
		else if (this.step === this.creationStepsService.ALTERNATIVES) {
			let alternatives: Alternative[] = [];
			for (let altID of this.altKeys()) {
				alternatives.push((this.alternatives[altID]));
			}
			this.valueChart.setAlternatives(alternatives);
		}
		else if (this.step === this.creationStepsService.PRIORITIES) {
			this.currentUserService.setValueChart(this.valueChart);
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

	altKeys() : Array<string> {
    	return Object.keys(this.alternatives);
  	}

	addEmptyAlternative() {
		this.alternatives[this.alternativesCount] = new Alternative("","");
		this.isSelected[this.alternativesCount] = false;
		this.alternativesCount = this.alternativesCount + 1;
	}

	deleteAlternatives() {
		for (let key of this.altKeys()) {
			if (this.isSelected[key]) {
				delete this.alternatives[key];
				delete this.isSelected[key];
			}
		}
	}

	allSelected() : boolean {
		for (let key of this.altKeys()) {
			if (!this.isSelected[key]) {
				return false;
			}
		}
		return true;
	}

	toggleSelectAll() {
		let allSelected = this.allSelected();
		for (let key of this.altKeys()) {
			this.isSelected[key] = !allSelected;
		}
	}



	ngOnDestroy() {
		this.sub.unsubscribe();		// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
	}
}