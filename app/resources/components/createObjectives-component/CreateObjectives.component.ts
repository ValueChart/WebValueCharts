import { Component, OnInit }										from '@angular/core';
import { NgClass } 														from '@angular/common';

// Import Application Classes:
import { ValueChartService }												from '../../services/ValueChart.service';


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

	// Map objective row IDs to original PrimitiveObjective name and current name in input field
	// This allows us to update references in other parts of the ValueChart when component is destroyed
	namesMap: { [objID: string]: [string,string] }; 

	objectiveRows: { [objID: string]: ObjectiveRow; };
	rootObjRowID: string;
    selectedObjRow: string;
    objectivesCount: number;
    categoryToAdd: string;
    categoriesToAdd: string[];

	constructor(private valueChartService: ValueChartService) { }

	ngOnInit() {
		this.namesMap = {};
		this.objectiveRows = {};
		this.rootObjRowID = "0";
		this.selectedObjRow = "0";
		this.objectivesCount = 0;
		this.categoryToAdd = "";
		this.categoriesToAdd = [];

		if (this.valueChartService.getValueChart().getAllObjectives().length === 0) {
			this.objectiveRows[this.rootObjRowID] = new ObjectiveRow(this.rootObjRowID, this.valueChartService.getValueChart().getName(), "", "", 0);
			this.objectivesCount++;
		}
		else {
			let rootObjective : Objective = this.valueChartService.getValueChart().getRootObjectives()[0];
			rootObjective.setName(this.valueChartService.getValueChart().getName());
			this.objectiveToObjRow(rootObjective, "", 0);

			// Initialize names map
			for (let objID of Object.keys(this.objectiveRows)) {
				let objrow: ObjectiveRow = this.objectiveRows[objID];
				if (objrow.type === 'primitive') {
					this.namesMap[objID] = [objrow.name,objrow.name];
				}
			}
		}
	}

	ngOnDestroy() {
		this.valueChartService.getValueChart().setRootObjectives([this.objRowToObjective(this.objectiveRows[this.rootObjRowID])]);
		this.updateObjectiveNames();
	}

	updateObjectiveNames() {
		for (let objID of Object.keys(this.namesMap)) {
			let oldName: string = this.namesMap[objID][0];
			let newName: string = this.namesMap[objID][1];
			
			// Update references if name has changed
			if (oldName !== newName) {
				
				for (let alt of this.valueChartService.getAlternatives()) {
					let objVal = alt.getObjectiveValue(oldName);
					if (objVal) {
						alt.removeObjective(oldName);
						alt.setObjectiveValue(newName,objVal);
					}
				}

				for (let user of this.valueChartService.getUsers()) {
					let scoreFunctionMap = user.getScoreFunctionMap();
					if (scoreFunctionMap) {
						let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(oldName);
						if (scoreFunction) {
							scoreFunctionMap.removeObjectiveScoreFunction(oldName);
							scoreFunctionMap.setObjectiveScoreFunction(newName,scoreFunction);
						}
					}				
					let weightMap = user.getWeightMap();
					if (weightMap) {
						let weight = weightMap.getObjectiveWeight(oldName);
						if (weight) {
							weightMap.removeObjectiveWeight(oldName);
							weightMap.setObjectiveWeight(newName,weight);
						}
					}		
				}
			}
		}
	}

	setObjectiveName(objID: string, name: string) {	
		this.objectiveRows[objID].name = name;

		// Update name in name map if entry exists
		if (this.namesMap[objID]) {
			this.namesMap[objID] = [this.namesMap[objID][0],name];
		}
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

	removeSelectedCategoriesMain(objrow: ObjectiveRow) {
		let selected = this.getSelectedValues(<HTMLSelectElement>document.getElementsByName("catlistmain")[0]);
		for (let cat of selected) {
			objrow.dom.removeCategory(cat);
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