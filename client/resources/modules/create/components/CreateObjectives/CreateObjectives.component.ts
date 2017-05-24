// Import Angular Classes:
import { Component, OnInit }											from '@angular/core';
import { NgClass } 														from '@angular/common';
import { Observable }     													from 'rxjs/Observable';
import { Subscriber }     													from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ValueChartService }											from '../../../app/services/ValueChart.service';
import { CreationStepsService }											from '../../services/CreationSteps.service';
import { UpdateObjectiveReferencesService }								from '../../services/UpdateObjectiveReferences.service';
import { ValidationService }											from '../../../app/services/Validation.service';
import *	as Formatter												from '../../../utilities/classes/Formatter';

// Import Model Classes:
import { ValueChart } 													from '../../../../model/ValueChart';
import { Objective }													from '../../../../model/Objective';
import { AbstractObjective }											from '../../../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../../../model/PrimitiveObjective';
import { Domain }														from '../../../../model/Domain';
import { CategoricalDomain }											from '../../../../model/CategoricalDomain';
import { ContinuousDomain }												from '../../../../model/ContinuousDomain';
import { IntervalDomain }												from '../../../../model/IntervalDomain';
import { Alternative }													from '../../../../model/Alternative';
import { RescaleError }													from '../../../../model/ScoreFunction';

/*
	This component defines the UI controls for creating and editing the Objective structure of a ValueChart.
	It consists of an Angular table where each row is bound to an ObjectiveRow object (described at end of this file).
	Objectives are converted to/from ObjectiveRows when the component is created/destroyed.
*/

@Component({
	selector: 'CreateObjectives',
	templateUrl: './CreateObjectives.template.html'
})
export class CreateObjectivesComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// The ValueChart:
	valueChart: ValueChart;

	// Component state fields:
    editing: boolean; // true if the user is editing a pre-existing Objective structure, 
					  // false if this is the first time they are defining Objectives for the ValueChart

	// Objective row fields:
	objectiveRows: { [objID: string]: ObjectiveRow; }; // It is necessary to track ObjectiveRows by ID since their names may not be unique
    objectivesCount: number; // Incremented every time an ObjectiveRow is added, but never decremented; used to generate unique IDs for ObjectiveRows
	selectedObjRow: string; // The ID of the row currently selected in the table
	rootObjRowID: string; // The ID of the root ObjectiveRow
	initialPrimObjRows: { [objID: string]: ObjectiveRow }; // Store the initial state at the beginning so that we can update 
														   // Objective references throughout the model with any changes that were made.

    // Add Category modal fields:
    categoryToAdd: string; // Category in input field of modal
    categoriesToAdd: string[]; // Categories in modal list

    // Validation fields:
    validationTriggered: boolean = false; // Specifies whether or not validation has been triggered (this happens when the user attempts to navigate)
										  // If true, validation messages will be shown whenever conditions fail
	alternativesInvalidated: boolean = false; // Set to true if changes to objective domains renders current values for Alternatives invalid.
	errorMessages: string[]; // Validation error messages

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private valueChartService: ValueChartService,
		private creationStepsService: CreationStepsService,
		private updateObjRefService: UpdateObjectiveReferencesService,
		private validationService: ValidationService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// ================================ Life-cycle Methods ====================================

	/* 	
		@returns {void}
		@description 	Initializes CreateObjectives. ngOnInit is only called ONCE by Angular.
						Calling ngOnInit should be left to Angular. Do not call it manually.
	*/
	ngOnInit() {
		this.creationStepsService.observables[this.creationStepsService.OBJECTIVES] = new Observable<boolean>((subscriber: Subscriber<boolean>) => {
            subscriber.next(this.validate());
            subscriber.complete();
        });

		this.initialPrimObjRows = {};
		this.objectiveRows = {};
		this.rootObjRowID = "0";
		this.selectedObjRow = "0";
		this.objectivesCount = 0;
		this.categoryToAdd = "";
		this.categoriesToAdd = [];
		this.editing = false;
		this.errorMessages = [];
		this.valueChart = this.valueChartService.getValueChart();

		if (this.valueChart.getAllObjectives().length === 0) {
			this.objectiveRows[this.rootObjRowID] = new ObjectiveRow(this.rootObjRowID, this.valueChart.getName(), "", "", 0);
			this.objectivesCount++;
		}
		else {
			this.editing = true;
			this.validationTriggered = true;
			let rootObjective: Objective = this.valueChart.getRootObjectives()[0];
			rootObjective.setName(this.valueChart.getName());
			this.objectiveToObjRow(rootObjective, "", 0);

			// Store record of each ObjectiveRow of type 'primitive'
			// This allows us to update references in other parts of the ValueChart when component is destroyed
			for (let objID of this.objKeys()) {
				let objrow: ObjectiveRow = this.objectiveRows[objID];
				if (objrow.type === 'primitive') {
					this.initialPrimObjRows[objID] = objrow.copy();
				}
			}
		}
	}

	// ================================ Model Update Methods ====================================

	/* 	
		@returns {void}
		@description 	Updates references to PrimitiveObjectives throughout the ValueChart.
						Handles any other changes to the model that need to be made when the Objectives change.
	*/
	updateReferences() {
		let initialPrimObjKeys = this.initialObjKeys();
		let finalPrimObjKeys = this.objKeys().filter(x => this.objectiveRows[x].type === 'primitive');
		let added = finalPrimObjKeys.filter(x => initialPrimObjKeys.indexOf(x) === -1);
		let removed = initialPrimObjKeys.filter(x => finalPrimObjKeys.indexOf(x) === -1);
		let kept = initialPrimObjKeys.filter(x => finalPrimObjKeys.indexOf(x) > -1);

		// If any Objectives were added or removed, we must reset all the WeightMaps
		// For now, reset to evenly-distributed weights instead of deleting WeightMap altogether so that Group ValueCharts doesn't break
		// TODO: alert all Users that their WeightMap has been reset and they must do SMARTER again
		if (removed.length > 0 || added.length > 0) {
			this.updateObjRefService.resetWeightMaps();
		}
		this.updateObjRefService.addScoreFunctions(added.map(x => this.objectiveRows[x].name));
		this.updateObjRefService.removeReferences(removed.map(x => this.initialPrimObjRows[x].name));
		this.updateObjRefService.updateObjectiveNames(kept.map(x => this.initialPrimObjRows[x].name), kept.map(x => this.objectiveRows[x].name));
		this.handleDomainChanges(kept);
	}

	/* 	
		@returns {void}
		@description 	Updates ScoreFunctions and Weights in response to changes to Objective domains.
	*/
	handleDomainChanges(objIDs: string[]) {
		for (let objID of objIDs) {
			let oldDom = this.initialPrimObjRows[objID].dom;
			let newDom = this.objectiveRows[objID].dom;
			let objName = this.objectiveRows[objID].name;
			let obj: PrimitiveObjective = <PrimitiveObjective>this.valueChartService.getObjectiveByName(objName);

			// Reset all ScoreFunctions and Weights if any of the following have changed: Domain type, min, max, or interval
			// It may be possible to do something more clever in the future that preserves parts of the Users' previous ScoreFunctions
			if (oldDom.type !== newDom.type || oldDom.min !== newDom.min || oldDom.max !== newDom.max || oldDom.interval !== newDom.interval) {
				this.updateObjRefService.resetScoreFunctions(obj);
				this.updateObjRefService.resetWeightMaps(); // must be done because best/worst outcomes may have changed
			}

			// Check for changes to categorical domain options
			// In this case, we can keep the previous ScoreFunction elements since there is no inherent scale
			// However, if the best/worst outcomes were deleted for any users, we need to make adjustments accordingly
			else if (newDom.type === 'categorical') {
				let addedCats = newDom.categories.filter(x => oldDom.categories.indexOf(x) === -1);
				let removedCats = oldDom.categories.filter(x => newDom.categories.indexOf(x) === -1);
				for (let cat of removedCats) {
					this.updateObjRefService.removeElementFromScoreFunctions(objName, cat);
				}
				for (let cat of addedCats) {
					this.updateObjRefService.addElementToScoreFunctions(objName, cat);
				}
				try {
					this.updateObjRefService.rescaleScoreFunctions(objName);
				}
				// If all scores are the same, simply reinitialize the ScoreFunctions
				catch (e) {
					if (e instanceof RescaleError) {
						this.updateObjRefService.resetScoreFunctions(obj);
					}
					else {
						throw e;
					}
				}		
			}
			this.updateObjRefService.clearAlternativeValues(obj);
		}
	}

	// ================================ Objective Row Methods ====================================

	/* 	
		@returns {Array<string>}
		@description 	Gets all ObjectiveRow IDs.
	*/
	objKeys(): Array<string> {
		return Object.keys(this.objectiveRows);
	}

	/* 	
		@returns {string[]}
		@description 	Gets all ObjectiveRow names.
	*/
	getNames(): string[] {
		let names: string[] = [];
		for (let key of this.objKeys()) {
			names.push(this.objectiveRows[key].name);
		}
		return names;
	}

	/* 	
		@returns {string[]}
		@description 	Gets all ObjectiveRow names in ID format. (Right now, it just removes whitespace.)
	*/
	getFormattedNames(): string[] {
		return this.getNames().map(x => Formatter.nameToID(x));
	}

	/* 	
		@returns {Array<string>}
		@description 	Gets all initial primitive ObjectiveRow IDs.
	*/
	initialObjKeys(): Array<string> {
		return Object.keys(this.initialPrimObjRows);
	}

	/* 	
		@returns {void}
		@description 	Creates a new, blank ObjectiveRow under an existing ObjectiveRow.
	*/
	addNewChildObjRow(parentID: string) {
		this.addObjRow(parentID, new ObjectiveRow(String(this.objectivesCount), "", "", parentID, this.objectiveRows[parentID].depth + 1));
		this.resetErrorMessages();
	}

	/* 	
		@returns {void}
		@description 	Inserts an ObjectiveRow under another ObjectiveRow.
	*/
	private addObjRow(parentID: string, objrow: ObjectiveRow) {
		this.objectiveRows[objrow.id] = objrow;
		this.objectivesCount++;
		if (this.objectiveRows[parentID]) {
			this.objectiveRows[parentID].addChild(objrow.id);
		}
	}

	/* 	
		@returns {void}
		@description 	Deletes the ObjectiveRow with the given ID along with its children.
	*/
	deleteObjRow(objID: string) {
		let parentID = this.objectiveRows[objID].parent;
		if (parentID !== "") {
			this.objectiveRows[parentID].removeChild(objID);
		}
		let children = this.objectiveRows[objID].children.slice();
		for (let child of children) {
			this.deleteObjRow(child);
		}
		delete this.objectiveRows[objID];
		this.selectedObjRow = "";
		this.resetErrorMessages();
	}

	/* 	
		@returns {boolean}
		@description 	Used by "Add Child" button. Returns true if no row is selected or a primitive objective row is selected.
	*/
	disableAddChild(): boolean {
		return (this.selectedObjRow === "" || this.objectiveRows[this.selectedObjRow].type === 'primitive');
	}

	/* 	
		@returns {boolean}
		@description 	Used by "Delete" button. Returns true if no row is selected or the root is selected.
	*/
	disableDelete(): boolean {
		return (this.selectedObjRow === "" || this.selectedObjRow === this.rootObjRowID);
	}

	/* 	
		@returns {string[]}
		@description 	Gets the ObjectiveRow IDs as a list in the order that they will be displayed.
	*/
	getFlattenedObjectiveRows(): string[] {
		let flattened: string[] = [];
		this.flattenObjectiveRows([this.rootObjRowID], flattened);
		return flattened;
	}

	/* 	
		@returns {void}
		@description 	Recursively converts the implicit tree-structure of ObjectiveRows into a list in the order that the rows will be displayed.
	*/
	flattenObjectiveRows(ObjectiveRowIDs: string[], flattened: string[]) {
		for (let objID of ObjectiveRowIDs) {
			flattened.push(objID);
			this.flattenObjectiveRows(this.objectiveRows[objID].children, flattened);
		}
	}

	/* 	
		@returns {Objective}
		@description 	Converts an ObjectiveRow into an Objective.
	*/
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

	/* 	
		@returns {void}
		@description 	Recursively converts an Objective and all its descendants into ObjectiveRows.
	*/
	objectiveToObjRow(obj: Objective, parentID: string, depth: number) {
		let objrow: ObjectiveRow;
		if (obj.objectiveType === 'abstract') {
			objrow = new ObjectiveRow(String(this.objectivesCount), obj.getName(), obj.getDescription(), parentID, depth, 'abstract');
			this.addObjRow(parentID, objrow);
			for (let child of (<AbstractObjective>obj).getDirectSubObjectives()) {
				this.objectiveToObjRow(child, objrow.id, objrow.depth + 1);
			}
		}
		else {
			objrow = new ObjectiveRow(String(this.objectivesCount), obj.getName(), obj.getDescription(), parentID, depth, 'primitive', (<PrimitiveObjective>obj).getColor(),
				this.domainToDomainDetails((<PrimitiveObjective>obj).getDomain()));
			this.addObjRow(parentID, objrow);
		}
	}

	/* 	
		@returns {DomainDetails}
		@description 	Converts an Objective's Domain into DomainDetails (internal representation).
	*/
	domainToDomainDetails(dom: Domain): DomainDetails {
		let domDets: DomainDetails = new DomainDetails(dom.type);
		if (dom.type === 'categorical') {
			for (let cat of (<CategoricalDomain>dom).getElements()) {
				domDets.categories.push(cat);
			}
		}
		else if (dom.type === 'continuous') {
			domDets.min = (<ContinuousDomain>dom).getMinValue();
			domDets.max = (<ContinuousDomain>dom).getMaxValue();
			domDets.unit = (<ContinuousDomain>dom).unit;
		}
		else {
			domDets.min = (<IntervalDomain>dom).getMinValue();
			domDets.max = (<IntervalDomain>dom).getMaxValue();
			domDets.interval = (<IntervalDomain>dom).getInterval();
		}
		return domDets;
	}

	// ================================ Categorical Domain Methods ====================================

	/* 	
		@returns {void}
		@description 	Moves category from modal input field to modal list.
	*/
	addCategory() {
		this.categoriesToAdd.push(this.categoryToAdd);
		this.categoryToAdd = "";
	}

	/* 	
		@returns {void}
		@description 	Moves categories from modal list to ObjectiveRow domain.
	*/
	addCategories() {
		for (let cat of this.categoriesToAdd) {
			this.objectiveRows[this.selectedObjRow].dom.categories.push(cat);
		}
		this.categoriesToAdd = [];
		this.resetErrorMessages();
	}

	/* 	
		@returns {void}
		@description 	Calls addCategory() when Enter is pressed.
						This makes it easier for the user to add many categories to modal list in sequence.
	*/
	handleKeyPress(key: string) {
		if (key === "Enter") {
			this.addCategory();
		}
	}

	/* 	
	@returns {void}
	@description 	Removes selected categories from modal list.
	*/
	removeSelectedCategoriesModal() {
		let selected = this.getSelectedValues(<HTMLSelectElement>document.getElementsByName("catlistmodal")[0]);
		for (let cat of selected) {
			this.categoriesToAdd.splice(this.categoriesToAdd.indexOf(cat), 1);
		}
	}

	/* 	
		@returns {void}
		@description 	Removes selected categories in main view from ObjectiveRow domain.
	*/
	removeSelectedCategoriesMain(objID: string) {
		let selected = this.getSelectedValues(<HTMLSelectElement>document.getElementsByName("catlist" + objID)[0]);
		for (let cat of selected) {
			this.objectiveRows[objID].dom.removeCategory(cat);
		}
		this.resetErrorMessages();
	}

	/* 	
		@returns {string[]}
		@description 	Gets domain categories for an ObjectiveRow.
	*/
	getCategories(objrow: ObjectiveRow): string[] {
		if (objrow === undefined) {
			return [];
		}
		return objrow.dom.categories;
	}

	/* 	
		@returns {string[]}
		@description 	Gets selected elements of a given HTMLSelectElement.
	*/
	getSelectedValues(select: HTMLSelectElement): string[] {
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

	/* 	
		@returns {number}
		@description 	Converts a string to a Number. This was needed because TypeScript failed to do so implicitly.
	*/
	toNumber(str: string): number {
		return Number(str);
	}

	// ================================ Validation Methods ====================================

	/* 	
		@returns {boolean}
		@description 	Checks validity of objectives structure in the chart.
						SIDE EFFECT: sets this.errorMessages
	*/
	validate(): boolean {
		this.validationTriggered = true;
		this.setErrorMessages();
		return this.errorMessages.length === 0;
	}

	/* 	
		@returns {boolean}
		@description 	Converts ObjectiveRow structure into ValueChart objective, then validates the objective structure of the ValueChart.
	*/
	setErrorMessages(): void {
		// Convert temporary structures to ValueChart structures
		this.valueChart.setRootObjectives([this.objRowToObjective(this.objectiveRows[this.rootObjRowID])]);
		this.valueChartService.resetPrimitiveObjectives();
		if (this.editing) {
			this.updateReferences();
		}

		// Validate
		this.errorMessages = this.validationService.validateObjectives(this.valueChart);
	}

	/* 	
		@returns {void}
		@description 	Resets error messages if validation has already been triggered.
						(This is done whenever the user makes a change to the chart. This way, they get feedback while repairing errors.)
	*/
	resetErrorMessages(): void {
		if (this.validationTriggered) {
			this.setErrorMessages();
		}
	}
}

/*
	This is an internal structure that is used to store the details of each Objective in the html table.
	Objectives are converted to/from ObjectiveRows when the component is created/destroyed.
	This is done so that ObjectiveRows can be converted between types while keeping the same object.
	It also allows us to store other useful properties (e.g. parent, depth) and makes Angular field binding simpler.
*/
class ObjectiveRow {
	id: string;
	name: string;
	desc: string;
	parent: string;
	depth: number;
	type: string;
	color: string;
	dom: DomainDetails;
	children: string[];

	constructor(id: string, name: string, desc: string, parent: string, depth: number, type?: string, color?: string, dom?: DomainDetails) {
		this.id = id;
		this.name = name;
		this.desc = desc;
		this.parent = parent;
		this.depth = depth;
		type ? this.type = type : this.type = "abstract";
		color ? this.color = color : this.color = "red";
		dom ? this.dom = dom : this.dom = new DomainDetails('categorical');
		this.children = [];
	}

	addChild(child: string) {
		this.children.push(child);
	}

	removeChild(child: string) {
		let i = this.children.indexOf(child);
        this.children.splice(i, 1);
	}

	copy(): ObjectiveRow {
		let domCopy = this.dom.copy();
		return new ObjectiveRow(this.id, this.name, this.desc, this.parent, this.depth, this.type, this.color, domCopy);
	}
}

/*
	This class stores the details of an ObjectiveRow's domain.
	A single class covers all possible types so that ObjectiveRows can be converted between types while keeping the same object.
*/
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

	copy(): DomainDetails {
		let domCopy = new DomainDetails(this.type);
		domCopy.categories = this.categories.slice();
		domCopy.min = this.min;
		domCopy.max = this.max;
		domCopy.interval = this.interval;
		domCopy.unit = this.unit;
		return domCopy;
	}
}