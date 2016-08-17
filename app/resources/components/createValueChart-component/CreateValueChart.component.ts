
// Import Angular Classes:
import { Component }													from '@angular/core';
import { OnInit, OnDestroy }											from '@angular/core';
import { NgClass } 														from '@angular/common';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }					from '@angular/router';

// Import Libraries:
import * as d3 															from 'd3';
import * as $															from 'jquery';	

// Import Application classes:
import { ScoreFunctionDirective }										from '../../directives/ScoreFunction.directive';
import { CurrentUserService }											from '../../services/CurrentUser.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { ValueChartService }											from '../../services/ValueChart.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';
import { GroupVcHttpService }											from '../../services/GroupVcHttp.service';

// Import Model Classes:
import { ValueChart } 													from '../../model/ValueChart';
import { User }															from '../../model/User';
import { WeightMap }													from '../../model/WeightMap';
import { ScoreFunctionMap }												from '../../model/ScoreFunctionMap';
import { Objective }													from '../../model/Objective';
import { AbstractObjective }											from '../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { Domain }														from '../../model/Domain';
import { CategoricalDomain }											from '../../model/CategoricalDomain';
import { ContinuousDomain }												from '../../model/ContinuousDomain';
import { IntervalDomain }												from '../../model/IntervalDomain';
import { Alternative }													from '../../model/Alternative';
import { ScoreFunction }												from '../../model/ScoreFunction';
import { DiscreteScoreFunction }										from '../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }										from '../../model/ContinuousScoreFunction';



// TDOO: [Add Class comment here]

@Component({
	selector: 'createValueChart',
	templateUrl: 'app/resources/components/createValueChart-component/CreateValueChart.template.html',
	directives: [ROUTER_DIRECTIVES, ScoreFunctionDirective, NgClass],
	providers: [CreationStepsService, ValueChartService, ChartUndoRedoService] 
})
export class CreateValueChartComponent implements OnInit, OnDestroy {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	valueChart: ValueChart;
	user: User;
	purpose: string; // "newChart" or "newUser"
	step: string;
	sub: any;

	// Basics step
	valueChartName: string;
	valueChartDescription: string;
	valueChartPassword: string;
	isGroupValueChart: boolean;

	// Objectives steps
	objectiveRows: { [objID: string]: ObjectiveRow; };
	rootObjRowID: string;
    selectedObjRow: string; // awful - need to refactor asap
    objectivesCount: number;
    categoriesToAdd: string[];

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

	private location: string;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private currentUserService: CurrentUserService,
		private groupVcHttpService: GroupVcHttpService,
		private creationStepsService: CreationStepsService,
		private valueChartService: ValueChartService,
		private chartUndoRedoService: ChartUndoRedoService) { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================


	ngOnInit() {
		this.location = window.location.pathname;

		this.services.valueChartService = this.valueChartService;
		this.services.chartUndoRedoService = this.chartUndoRedoService;
		this.services.scoreFunctionViewerService = new ScoreFunctionViewerService(this.valueChartService);

		// Initialize ValueChart properties
		this.user = new User(this.currentUserService.getUsername());
		this.valueChartName = "";
		this.valueChartDescription = "";
		this.valueChartPassword = "";
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
		this.categoriesToAdd = [];

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
			this.valueChart = new ValueChart(this.valueChartName, this.valueChartDescription, this.user.getUsername());
		}
		this.valueChart.addUser(this.user);
		this.valueChartService.setValueChart(this.valueChart); // Needed for ScoreFunction plots


		this.addNavigationWarning();
	}

	addNavigationWarning(): void {
		history.pushState(null, document.title, window.location.pathname);
		
		window.onpopstate = (eventObject: Event) => {
			var navigate = window.confirm('Do you really want to navigate away from this page? All of your creation progress will be lost.');

			if (navigate){
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
		if (this.step === this.creationStepsService.BASICS) {
			this.valueChart.setName(this.valueChartName);
			this.valueChart.setDescription(this.valueChartDescription);
			this.valueChart.password = this.valueChartPassword;

			// Create root objective if needed
			if (!this.objectiveRows[this.rootObjRowID]) {
				this.objectiveRows[this.rootObjRowID] = new ObjectiveRow(this.valueChartName, "", "", 0);
				this.objectivesCount++;
			}
			else {
				this.objectiveRows[this.rootObjRowID].name = this.valueChartName;
			}
		}
		else if (this.step === this.creationStepsService.OBJECTIVES) {
			this.valueChart.setRootObjectives([this.objRowToObjective(this.objectiveRows[this.rootObjRowID])]);
			this.selectedObjective = this.valueChart.getAllPrimitiveObjectives()[0].getName();
			if (this.altKeys().length === 0) {
				this.addEmptyAlternative();
			}
		}
		else if (this.step === this.creationStepsService.ALTERNATIVES) {
			let alternatives: Alternative[] = [];
			for (let altID of this.altKeys()) {
				alternatives.push((this.alternatives[altID]));
			}
			this.valueChart.setAlternatives(alternatives);
			this.initializeUser();
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
			this.saveValueChartToDatabase();
			window.onpopstate = () => { }; // Remove the on the onpop state listener.
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

	saveValueChartToDatabase() {
		if (!this.valueChart._id) {
			this.groupVcHttpService.createValueChart(this.valueChart)
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
		return (this.step === this.creationStepsService.PRIORITIES &&
			this.rankedObjectives.length !== this.valueChart.getAllPrimitiveObjectives().length);
	}

	nextButtonText(): string {
		let text = "Next >>";
		if (this.step === this.creationStepsService.PRIORITIES) {
			text = "View Chart >>";
		}
		return text;
	}

	ngOnDestroy() {
		this.sub.unsubscribe();		// Un-subscribe from the url parameters before the component is destroyed to prevent a memory leak.
	}

	// There must be a better way...
	toNumber(str: string): number {
		return Number(str);
	}

	altKeys(): Array<string> {
		return Object.keys(this.alternatives);
	}

	addEmptyAlternative() {
		this.alternatives[this.alternativesCount] = new Alternative("", "");
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

	allSelected(): boolean {
		if (this.altKeys().length === 0) {
			return false;
		}
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

	getPrioritiesText(): string {
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

	getUnrankedObjectives(): string[] {
		let unrankedObjectives: string[] = [];
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

	getWeightMapFromRanks(): WeightMap {
		let weights = new WeightMap();
		let rank = 1;
		let numObjectives = this.rankedObjectives.length;
		for (let obj of this.rankedObjectives) {
			let weight = this.computeSum(rank, numObjectives) / numObjectives;
			weights.setObjectiveWeight(obj, weight);
			rank++;
		}
		return weights;
	}

	private computeSum(k: number, K: number) {
		let sum = 0.0;
		let i = k;
		while (i <= K) {
			sum += 1 / i;
			i++;
		}
		return sum;
	}

	// Objectives step


	addChildObjRow(parentID: string) {
		let child = new ObjectiveRow("", "", parentID, this.objectiveRows[parentID].depth + 1);
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
		this.selectedObjRow = "";
	}

	disableAddChild() {
		return (this.selectedObjRow === "" || this.objectiveRows[this.selectedObjRow].type === 'primitive');
	}

	disableDelete() {
		return (this.selectedObjRow === "" || this.selectedObjRow === this.rootObjRowID);
	}

	getFlattenedObjectiveRows(): string[] {
		let flattened: string[] = [];
		this.flattenObjectiveRows([this.rootObjRowID], flattened);
		return flattened;
	}

	private flattenObjectiveRows(ObjectiveRowIDs: string[], flattened: string[]) {
		for (let objID of ObjectiveRowIDs) {
			flattened.push(objID);
			this.flattenObjectiveRows(this.objectiveRows[objID].children, flattened);
		}
	}

	private getSelectedValues(select: HTMLSelectElement): string[] {
		let result: string[] = [];
		let options: HTMLCollection = select && select.options;
		let opt: HTMLOptionElement;

		for (let i = 0, iLen = options.length; i < iLen; i++) {
			opt = <HTMLOptionElement>options[i];
			if (opt.selected) {
				result.push(opt.value || opt.text);
			}
		}
		return result;
	}

	addCategory(cat: string) {
		this.categoriesToAdd.push(cat);
		document.getElementsByName('newcat')[0].setAttribute("value", "");
	}

	addCategories() {
		for (let cat of this.categoriesToAdd) {
			this.objectiveRows[this.selectedObjRow].dom.categories.push(cat);
		}
		this.categoriesToAdd = [];
	}

	removeSelectedCategoriesMain() {
		let selected = this.getSelectedValues(<HTMLSelectElement>document.getElementsByName("catlistmain")[0]);
		for (let cat of selected) {
			this.objectiveRows[this.selectedObjRow].dom.removeCategory(cat);
		}
	}

	removeSelectedCategoriesModal() {
		let selected = this.getSelectedValues(<HTMLSelectElement>document.getElementsByName("catlistmodal")[0]);
		for (let cat of selected) {
			this.categoriesToAdd.splice(this.categoriesToAdd.indexOf(cat), 1);
		}
	}

	getCategories(objrow: ObjectiveRow): string[] {
		if (objrow === undefined) {
			return [];
		}
		return objrow.dom.categories;
	}

	// Convert ObjectiveRows to Objectives
	// Using dummy domains for now...
	objRowToObjective(objrow: ObjectiveRow): Objective {
		let obj: Objective;
		if (objrow.type === 'primitive') {
			obj = new PrimitiveObjective(objrow.name, objrow.desc);
			let dom: Domain;
			if (objrow.dom.type === 'categorical') {
				dom = new CategoricalDomain(true);
				for (let cat of objrow.dom.categories) {
					(<CategoricalDomain>dom).addElement(cat);
				}
			}
			else if (objrow.dom.type === 'interval') {
				dom = new IntervalDomain(objrow.dom.min, objrow.dom.max, objrow.dom.interval);
			}
			else {
				dom = new ContinuousDomain(objrow.dom.min, objrow.dom.max, objrow.dom.unit);
			}
			(<PrimitiveObjective>obj).setDomain(dom);
			(<PrimitiveObjective>obj).setColor(objrow.color);
		}
		else {
			obj = new AbstractObjective(objrow.name, objrow.desc);
			for (let child of objrow.children) {
				(<AbstractObjective>obj).addSubObjective(this.objRowToObjective(this.objectiveRows[child]));
			}
		}
		return obj;
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

	getBestOutcome(objName: string): string | number {
		let scoreFunction: ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		for (let outcome of scoreFunction.getAllElements()) {
			if (scoreFunction.getScore(outcome) === 1) {
				return outcome;
			}
		}
	}

	getWorstOutcome(objName: string): string | number {
		let scoreFunction: ScoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
		for (let outcome of scoreFunction.getAllElements()) {
			if (scoreFunction.getScore(outcome) === 0) {
				return outcome;
			}
		}
	}

	// Create initial weight map for the Objective hierarchy with evenly distributed weights
	getInitialWeightMap(): WeightMap {
		let weightMap: WeightMap = new WeightMap();
		this.initializeWeightMap(this.valueChart.getRootObjectives(), weightMap, 1);
		return weightMap;
	}

	// Recursively add entries to weight map
	private initializeWeightMap(objectives: Objective[], weightMap: WeightMap, parentWeight: number) {
		let weight = parentWeight * 1.0 / objectives.length;
		for (let obj of objectives) {
			weightMap.setObjectiveWeight(obj.getName(), weight);
			if (obj.objectiveType === 'abstract') {
				this.initializeWeightMap((<AbstractObjective>obj).getDirectSubObjectives(), weightMap, weight);
			}
		}
	}

	// Set up initial ScoreFunctions
	// Scores for categorical variables are evenly space between 0 and 1
	getInitialScoreFunctionMap(): ScoreFunctionMap {
		let scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();
		for (let obj of this.valueChart.getAllPrimitiveObjectives()) {
			let scoreFunction: ScoreFunction;
			if (obj.getDomainType() === 'categorical' || obj.getDomainType() === 'interval') {
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
				let min: number = (<ContinuousDomain>obj.getDomain()).getMinValue();
				let max: number = (<ContinuousDomain>obj.getDomain()).getMaxValue();
				scoreFunction = new ContinuousScoreFunction(min, max);
				// Add three evenly-space points between min and max
				let increment = (max - min) / 4.0;
				let slope = 1.0 / (max - min);
				scoreFunction.setElementScore(min, 0);
				scoreFunction.setElementScore(min + increment, slope * increment);
				scoreFunction.setElementScore(min + 2 * increment, slope * 2 * increment);
				scoreFunction.setElementScore(min + 3 * increment, slope * 3 * increment);
				scoreFunction.setElementScore(max, 1);
			}
			scoreFunctionMap.setObjectiveScoreFunction(obj.getName(), scoreFunction);
		}
		return scoreFunctionMap;
	}

	rangeList(start: number, end: number) {
		let arr: number[] = [];
		while (start < end) {
			arr.push(end++);
		}
	}
}

class ObjectiveRow {
	name: string;
	desc: string;
	parent: string;
	depth: number;
	type: string;
	color: string;
	dom: DomainDetails;
	children: string[];

	constructor(name: string, desc: string, parent: string, depth: number) {
		this.name = name;
		this.desc = desc;
		this.parent = parent;
		this.depth = depth;
		this.type = 'abstract';
		this.color = 'red';
		this.dom = new DomainDetails('categorical');
		this.children = [];
	}

	addChild(child: string) {
		this.children.push(child);
	}

	removeChild(child: string) {
		let i = this.children.indexOf(child);
        this.children.splice(i, 1);
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

	removeCategory(cat: string) {
		let i = this.categories.indexOf(cat);
        this.categories.splice(i, 1);
	}
}