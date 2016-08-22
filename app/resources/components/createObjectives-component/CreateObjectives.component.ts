import { Component, OnInit }										from '@angular/core';
import { NgClass } 														from '@angular/common';

// Import Application Classes:
import { ValueChartService }												from '../../services/ValueChart.service';
import { UpdateObjectiveReferencesService }								from '../../services/UpdateObjectiveReferences.service';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';
import { Objective }													from '../../model/Objective';
import { AbstractObjective }											from '../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { Domain }														from '../../model/Domain';
import { CategoricalDomain }											from '../../model/CategoricalDomain';
import { ContinuousDomain }												from '../../model/ContinuousDomain';
import { IntervalDomain }												from '../../model/IntervalDomain';
import { Alternative }													from '../../model/Alternative';

@Component({
	selector: 'CreateObjectives',
	templateUrl: 'app/resources/components/createObjectives-component/CreateObjectives.template.html',
	directives: [NgClass]
})
export class CreateObjectivesComponent implements OnInit {

	initialPrimObjRows: { [objID: string]: ObjectiveRow };
	objectiveRows: { [objID: string]: ObjectiveRow; };
	rootObjRowID: string;
    selectedObjRow: string;
    objectivesCount: number;
    categoryToAdd: string;
    categoriesToAdd: string[];
    editing: boolean;

	constructor(
		private valueChartService: ValueChartService,
		private updateObjRefService: UpdateObjectiveReferencesService) { }

	ngOnInit() {
		this.initialPrimObjRows = {};
		this.objectiveRows = {};
		this.rootObjRowID = "0";
		this.selectedObjRow = "0";
		this.objectivesCount = 0;
		this.categoryToAdd = "";
		this.categoriesToAdd = [];
		this.editing = false;

		if (this.valueChartService.getValueChart().getAllObjectives().length === 0) {
			this.objectiveRows[this.rootObjRowID] = new ObjectiveRow(this.rootObjRowID, this.valueChartService.getValueChart().getName(), "", "", 0);
			this.objectivesCount++;
		}
		else {
			this.editing = true;
			let rootObjective: Objective = this.valueChartService.getValueChart().getRootObjectives()[0];
			rootObjective.setName(this.valueChartService.getValueChart().getName());
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

	ngOnDestroy() {
		this.valueChartService.getValueChart().setRootObjectives([this.objRowToObjective(this.objectiveRows[this.rootObjRowID])]);
		this.valueChartService.resetPrimitiveObjectives();
		if (this.editing) {
			this.updateReferences();
		}
	}

	// Update PrimitiveObjective references throughout ValueChart
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

	handleDomainChanges(objIDs: string[]) {
		for (let objID of objIDs) {
			let oldDom = this.initialPrimObjRows[objID].dom;
			let newDom = this.objectiveRows[objID].dom;
			let objName = this.objectiveRows[objID].name;
			
			// Reset all ScoreFunctions and Weights if any of the following have changed: Domain type, min, max, or interval
			// It may be possible to do something more clever in the future that preserves parts of the Users' previous ScoreFunctions
			if (oldDom.type !== newDom.type || oldDom.min !== newDom.min || oldDom.max !== newDom.max || oldDom.interval !== newDom.interval) {
				let obj: PrimitiveObjective = <PrimitiveObjective>this.valueChartService.getObjectiveByName(objName);
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
				if (removedCats.length > 0) {
					this.updateObjRefService.rescaleScoreFunctions(objName);
				}
				for (let cat of addedCats) {
					this.updateObjRefService.addElementToScoreFunctions(objName, cat);
				}
			}
		}
	}

	objKeys(): Array<string> {
		return Object.keys(this.objectiveRows);
	}

	initialObjKeys(): Array<string> {
		return Object.keys(this.initialPrimObjRows);
	}

	addNewChildObjRow(parentID: string) {
		this.addObjRow(parentID, new ObjectiveRow(String(this.objectivesCount), "", "", parentID, this.objectiveRows[parentID].depth + 1));
	}

	addObjRow(parentID: string, objrow: ObjectiveRow) {
		this.objectiveRows[objrow.id] = objrow;
		this.objectivesCount++;
		if (this.objectiveRows[parentID]) {
			this.objectiveRows[parentID].addChild(objrow.id);
		}
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

	flattenObjectiveRows(ObjectiveRowIDs: string[], flattened: string[]) {
		for (let objID of ObjectiveRowIDs) {
			flattened.push(objID);
			this.flattenObjectiveRows(this.objectiveRows[objID].children, flattened);
		}
	}

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

	addCategory() {
		this.categoriesToAdd.push(this.categoryToAdd);
		this.categoryToAdd = "";
	}

	addCategories() {
		for (let cat of this.categoriesToAdd) {
			this.objectiveRows[this.selectedObjRow].dom.categories.push(cat);
		}
		this.categoriesToAdd = [];
	}

	removeSelectedCategoriesMain(objID: string) {
		let selected = this.getSelectedValues(<HTMLSelectElement>document.getElementsByName("catlist" + objID)[0]);
		for (let cat of selected) {
			this.objectiveRows[objID].dom.removeCategory(cat);
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

	// Recursively convert Objectives into ObjectiveRows
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

	toNumber(str: string): number {
		return Number(str);
	}
}

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