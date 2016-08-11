import { Component }													from '@angular/core';
import { OnInit }														from '@angular/core';
import { NgClass } 														from '@angular/common';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';

import * as d3 from 'd3';
//import * as jstree from 'jstree';

// Application classes:
import { ScoreFunctionDirective }										from '../../directives/ScoreFunction.directive';
import { CurrentUserService }											from '../../services/CurrentUser.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { ValueChartService }											from '../../services/ValueChart.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';


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
import { ScoreFunction }												from '../../model/ScoreFunction';
import { DiscreteScoreFunction }										from '../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }										from '../../model/ContinuousScoreFunction';

@Component({
	selector: 'createValueChart',
	templateUrl: 'app/resources/components/createValueChart-component/CreateValueChart.template.html',
	directives: [ROUTER_DIRECTIVES, ScoreFunctionDirective, NgClass],
	providers: [CreationStepsService, ValueChartService, ChartUndoRedoService]
})
export class CreateValueChartComponent implements OnInit {
	valueChart: ValueChart;
	user: User;
	purpose: string; // "newChart" or "newUser"
	step: string;
	sub: any;

	// Basics step
	valueChartName: string;
	valueChartDescription: string;
	isGroupValueChart: boolean;

	// Objectives steps
	objectiveRows: { [objID: string]: ObjectiveRow; };
	rootObjRowID : string;
    selectedObjRow: string; // awful - need to refactor asap
    objectivesCount : number;

	// Alternatives step
    alternatives: { [altID: string]: Alternative; };
    isSelected: { [altID: string]: boolean; };
    alternativesCount: number;
  
    // Preferences step
    selectedObjective: string;

    // Priorities step
    rankedObjectives: string[];
    isRanked: { [objName: string]: boolean; }; // really need to split this code up...

	private services: any = {};


	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private currentUserService: CurrentUserService,
		private creationStepsService: CreationStepsService,
		private valueChartService: ValueChartService,
		private chartUndoRedoService: ChartUndoRedoService) { }

	ngOnInit() {
		this.services.valueChartService = this.valueChartService;
		this.services.chartUndoRedoService = this.chartUndoRedoService;
		this.services.scoreFunctionViewerService = new ScoreFunctionViewerService(this.valueChartService);

		// Initialize ValueChart properties
		this.user = new User(this.currentUserService.getUsername());
		this.valueChartName = "";
		this.valueChartDescription = "";
		this.isGroupValueChart = false;
		this.alternatives = {};
		this.isSelected = {};
		this.alternativesCount = 0;
		this.objectivesCount = 0;
		this.rankedObjectives = [];
		this.isRanked = {};
		this.objectiveRows = {};
		this.rootObjRowID = "0";
		this.selectedObjRow = "0";

		// Bind purpose to corresponding URL parameter
    	this.sub = this.route.params.subscribe(params => this.purpose = params['purpose']);
    	
    	// Initialize according to purpose
    	if (this.purpose == "newUser") {
    		this.step = this.creationStepsService.PREFERENCES;
    		this.valueChart = this.currentUserService.getValueChart();
    		this.initializeUser();
    		this.selectedObjective = this.valueChart.getAllPrimitiveObjectives()[0].getName();
    	}
    	else if (this.purpose == "newChart") {
    		this.step = this.creationStepsService.BASICS;

	    	// Create new ValueChart with a temporary name and description
	    	this.valueChart = new ValueChart(this.user.getUsername(),this.valueChartName,this.valueChartDescription);

	    	// Set root objective
			this.objectiveRows[this.rootObjRowID] = new ObjectiveRow("","","",0);
			this.objectivesCount++;
	  	
	    	// Temporary: create some Objectives
	    	// let rate = new PrimitiveObjective("rate","");
	    	// let location = new PrimitiveObjective("location","");
	    	// let internet = new PrimitiveObjective("internet","");
	    	// let pool = new PrimitiveObjective("pool","");
	    	// let amenities = new AbstractObjective("amenities","");
	    	// let other = new AbstractObjective("other","");

	    	// rate.setColor("green")
	    	// location.setColor("red");
	    	// internet.setColor("purple");
	    	// pool.setColor("blue");

	    	// amenities.addSubObjective(internet);
	    	// amenities.addSubObjective(pool);
	    	// other.addSubObjective(location);
	    	// other.addSubObjective(rate);

	    	// let ratedom = new ContinuousDomain(30,300,"CAD");
	    	// let locdom = new CategoricalDomain(false);
	    	// locdom.addElement("downtown");
	    	// locdom.addElement("highway");
	    	// let intdom = new CategoricalDomain(false);
	    	// intdom.addElement("none");
	    	// intdom.addElement("low");
	    	// intdom.addElement("high");
	    	// let pooldom = new CategoricalDomain(false);
	    	// pooldom.addElement("no");
	    	// pooldom.addElement("yes");

	    	// rate.setDomain(ratedom);
	    	// location.setDomain(locdom);
	    	// internet.setDomain(intdom);
	    	// pool.setDomain(pooldom);

	    	// let hotel1 = new Alternative("Hotel 1","");
	    	// hotel1.setObjectiveValue("rate",140);
	    	// hotel1.setObjectiveValue("location","downtown");
	    	// hotel1.setObjectiveValue("internet","high");
	    	// hotel1.setObjectiveValue("pool","no");
    	}
    	this.valueChart.addUser(this.user);
    	this.valueChartService.setValueChart(this.valueChart); // Needed for ScoreFunction plots
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
			this.initializeUser();
			this.selectedObjective = this.valueChart.getRootObjectives()[0].getName();
		}
		else if (this.step === this.creationStepsService.ALTERNATIVES) {
			let alternatives: Alternative[] = [];
			for (let altID of this.altKeys()) {
				alternatives.push((this.alternatives[altID]));
			}
			this.valueChart.setAlternatives(alternatives);
		}
		else if (this.step === this.creationStepsService.PREFERENCES) {
			for (let obj of this.getPrimitiveObjectivesByName()) {
				this.isRanked[obj] = false;
			}
		}
		else if (this.step === this.creationStepsService.PRIORITIES) {
			this.user.setWeightMap(this.getWeightMapFromRanks());
			this.valueChart.addUser(this.user);
			this.valueChartService.setValueChart(this.valueChart);
			this.currentUserService.setValueChart(this.valueChart);
			this.router.navigate(['/view/ValueChart']);
		}
		this.step = this.creationStepsService.next(this.step);
	}

	private initializeUser() {
		// Initialize User's WeightMap
		this.user.setWeightMap(this.getInitialWeightMap());

		// Initialize User's ScoreFunctionMap
		this.user.setScoreFunctionMap(this.getInitialScoreFunctionMap());
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

	disableNextButton() : boolean {
		return (this.step === this.creationStepsService.PRIORITIES &&
				this.rankedObjectives.length !== this.valueChart.getAllPrimitiveObjectives().length);
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
		this.alternativesCount++;
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

	getPrioritiesText() : string {
		if (this.rankedObjectives.length === 0) {
			return "Imagine the worst case scenario highlighted in red. Click on the objective you would most prefer to change from the worst to the best based on the values in the table below.";
		}
		else if (this.rankedObjectives.length < this.valueChart.getAllPrimitiveObjectives().length) {
			return "From the remaining objectives, which would you prefer to change next from the worst value to the best value?";
		}
		else {
			return "All done! Click 'View Chart' to proceed.";
		}
	}

	getUnrankedObjectives() : string[] {
		let unrankedObjectives : string[] = [];
		for (let obj of this.getPrimitiveObjectivesByName()) {
			if (!this.isRanked[obj]) {
				unrankedObjectives.push(obj);
			}
		}
		return unrankedObjectives;
	}

	rankObjective(primObj: string) {
		this.rankedObjectives.push(primObj);
		this.isRanked[primObj] = true;
	}

	resetRanks() {
		for (let obj of this.getPrimitiveObjectivesByName()) {
			this.isRanked[obj] = false;
		}
		this.rankedObjectives = [];
	}

	getWeightMapFromRanks() : WeightMap {
		let weights = new WeightMap();
		let rank = 1;
		let numObjectives = this.rankedObjectives.length;
		for (let obj of this.rankedObjectives) {
			let weight = this.computeSum(rank,numObjectives) / numObjectives;
			weights.setObjectiveWeight(obj,weight);
			rank++;
		}
		return weights;
	}

	private computeSum(k: number, K: number) {
		let sum = 0.0;
		let i = k;
		while (i <= K) {
			sum += 1/i;
			i++;
		}
		return sum;
	}

	// Objectives step


	addChildObjRow(parentID: string) {
		let child = new ObjectiveRow("","",parentID,this.objectiveRows[parentID].depth + 1);
		let childID = String(this.objectivesCount);
		this.objectiveRows[childID] = child;
		this.objectivesCount++;
		this.objectiveRows[parentID].addChild(childID);
	}

	deleteObjRow(objID: string) {
		let parentID = this.objectiveRows[objID].parent;
		if (parentID !== "") {
			this.objectiveRows[parentID].removeChild(objID);
		}
		for (let child of this.objectiveRows[objID].children) {
			this.deleteObjRow(child);
		}
		delete this.objectiveRows[objID];
	}

	getFlattenedObjectiveRows() : string[] {
		let flattened: string[] = [];
		this.flattenObjectiveRows([this.rootObjRowID],flattened);
		return flattened;
	}

	private flattenObjectiveRows(ObjectiveRowIDs: string[], flattened: string[]) {
  		for (let objID of ObjectiveRowIDs) {
  			flattened.push(objID);
  			this.flattenObjectiveRows(this.objectiveRows[objID].children,flattened);
  		}
  	}

	ngOnDestroy() {
		this.sub.unsubscribe();		// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
	}

	// ValueChart Utilities
	getObjective(name: string): Objective {
		for (let obj of this.valueChart.getAllObjectives()) {
			if (obj.getName() === name) {
				return obj;
			}
		}
		throw "Objective not found";
	}

	getPrimitiveObjectivesByName(): string[] {
		let primObj: string[] = [];
		for (let obj of this.valueChart.getAllPrimitiveObjectives()) {
			primObj.push(obj.getName());	
		}
		return primObj;
	}

	getBestOutcome(objName: string) : string | number {
		let scoreFunction : ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		for (let outcome of scoreFunction.getAllElements()) {
			if (scoreFunction.getScore(outcome) === 1) {
				return outcome;
			}
		}
	}

	getWorstOutcome(objName: string) : string | number {
		let scoreFunction : ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		for (let outcome of scoreFunction.getAllElements()) {
			if (scoreFunction.getScore(outcome) === 0) {
				return outcome;
			}
		}
	}

	// Create initial weight map for the Objective hierarchy with evenly distributed weights
	getInitialWeightMap(): WeightMap {
		let weightMap: WeightMap = new WeightMap();
    	this.initializeWeightMap(this.valueChart.getRootObjectives(),weightMap,1);
    	return weightMap;
	}

	// Recursively add entries to weight map
  	private initializeWeightMap(objectives: Objective[], weightMap: WeightMap, parentWeight: number) {
  		let weight = parentWeight * 1.0 / objectives.length;
  		for (let obj of objectives) {
  			weightMap.setObjectiveWeight(obj.getName(),weight);
  			if (obj.objectiveType === 'abstract') {
  				this.initializeWeightMap((<AbstractObjective>obj).getDirectSubObjectives(),weightMap,weight);
  			}	
  		}
  	}

  	// Set up initial ScoreFunctions
  	// Scores for categorical variables are evenly space between 0 and 1
  	getInitialScoreFunctionMap(): ScoreFunctionMap {
  		let scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();
  		for (let obj of this.valueChart.getAllPrimitiveObjectives()) {
  			let scoreFunction: ScoreFunction;
  			if (obj.getDomainType() === 'categorical') {
  				scoreFunction = new DiscreteScoreFunction();
  				let dom = (<CategoricalDomain>obj.getDomain()).getElements();
  				let increment = 1.0 / (dom.length - 1);
  				let currentScore = 0;
  				for (let item of dom) {
  					scoreFunction.setElementScore(item, currentScore);
  					currentScore += increment;
  				}			
  			}
  			else {
  				let min = (<ContinuousDomain>obj.getDomain()).getMinValue();
  				let max = (<ContinuousDomain>obj.getDomain()).getMaxValue();
  				scoreFunction = new ContinuousScoreFunction(min,max);
  				// Add three evenly-space points between min and max
  				let increment = (max - min) / 4.0;
  				let slope = 1.0 / (max - min);
  				scoreFunction.setElementScore(min, 0);
  				scoreFunction.setElementScore(min + increment, slope * increment);
  				scoreFunction.setElementScore(min + 2*increment, slope * 2*increment);
  				scoreFunction.setElementScore(min + 3*increment, slope * 3*increment);
  				scoreFunction.setElementScore(max, 1);
  			}
  			scoreFunctionMap.setObjectiveScoreFunction(obj.getName(),scoreFunction);
  		}
  		return scoreFunctionMap;
  	}

  	getType(obj: ObjectiveRow) {
		obj.type;
	}

	setType(obj: ObjectiveRow, type: string) {
		obj.type = type;
	}
}



class ObjectiveRow {
	name: string;
	desc: string;
	parent : string;
	depth : number;
	type: string;
	dom: DomainDetails;
	children: string[];

	constructor(name: string, desc: string, parent: string, depth: number) {
		this.name = name;
		this.desc = desc;
		this.parent = parent;
		this.depth = depth;
		this.type = 'abstract';
		this.dom = new DomainDetails('categorical');
		this.children = [];
	}

	addChild(child: string) {
		this.children.push(child);
	}

	removeChild(child: string) {
		let i = this.children.indexOf(child);
        return i>-1 ? this.children.splice(i, 1) : [];
	}
}

// Store details for all possible domain types
// Making this a single class so that I don't have to make a new object every time the type is changed
class DomainDetails {
	type: string;
	categories: string[];
	min: number;
	max: number;
	interval: number;
	unit: string;

	constructor(type: string) {
		this.type = type;
		this.categories = [];
	}

}