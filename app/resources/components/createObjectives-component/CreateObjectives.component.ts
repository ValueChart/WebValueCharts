import { Component, Input, OnInit }										from '@angular/core';
import { NgClass } 														from '@angular/common';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';
import { Objective }													from '../../model/Objective';
import { AbstractObjective }											from '../../model/AbstractObjective';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';
import { Domain }														from '../../model/Domain';
import { CategoricalDomain }											from '../../model/CategoricalDomain';
import { ContinuousDomain }												from '../../model/ContinuousDomain';
import { IntervalDomain }												from '../../model/IntervalDomain';

@Component({
	selector: 'CreateObjectives',
	templateUrl: 'app/resources/components/createObjectives-component/CreateObjectives.template.html',
	inputs: ['vc'],
	directives: [NgClass]
})
export class CreateObjectivesComponent implements OnInit {

	// Input properties
	valueChart: ValueChart;

	objectiveRows: { [objID: string]: ObjectiveRow; };
	rootObjRowID : string;
    selectedObjRow: string; // awful - need to refactor asap
    objectivesCount : number;
    categoriesToAdd: string[];

	constructor() { }

	ngOnInit() {
		this.objectiveRows = {};
		this.rootObjRowID = "0";
		this.selectedObjRow = "0";
		this.objectivesCount = 0;
		this.categoriesToAdd = [];

		if (this.valueChart.getAllObjectives().length === 0) {
			this.objectiveRows[this.rootObjRowID] = new ObjectiveRow(this.rootObjRowID,this.valueChart.getName(),"","",0);
			this.objectivesCount++;
		}
		else {
			this.objectiveToObjRow(this.valueChart.getRootObjectives()[0],"",0);
		}	
  	}

  	ngOnDestroy() {
		this.valueChart.setRootObjectives([this.objRowToObjective(this.objectiveRows[this.rootObjRowID])]);
  	}

  	addNewChildObjRow(parentID: string) {
  		this.addObjRow(parentID, new ObjectiveRow(String(this.objectivesCount),"","",parentID,this.objectiveRows[parentID].depth + 1));
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

	getFlattenedObjectiveRows() : string[] {
		let flattened: string[] = [];
		this.flattenObjectiveRows([this.rootObjRowID],flattened);
		return flattened;
	}

	flattenObjectiveRows(ObjectiveRowIDs: string[], flattened: string[]) {
  		for (let objID of ObjectiveRowIDs) {
  			flattened.push(objID);
  			this.flattenObjectiveRows(this.objectiveRows[objID].children,flattened);
  		}
  	}

  	getSelectedValues(select: HTMLSelectElement) : string[] {
		let result : string[] = [];
		let options : HTMLCollection = select && select.options;
		let opt : HTMLOptionElement;

		for (let i=0, iLen=options.length; i<iLen; i++) {
			opt = <HTMLOptionElement>options[i];
			if (opt.selected) {
				result.push(opt.value || opt.text);
			}
		}
		return result;
	}

	addCategory(cat: string) {
		this.categoriesToAdd.push(cat);
		document.getElementsByName('newcat')[0].setAttribute("value","");
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
			this.categoriesToAdd.splice(this.categoriesToAdd.indexOf(cat),1);
		}
	}

	getCategories(objrow: ObjectiveRow) : string[] {
		if (objrow === undefined) {
			return [];
		}
		return objrow.dom.categories;
	}

  	// Convert ObjectiveRows to Objectives
  	// Using dummy domains for now...
  	objRowToObjective(objrow: ObjectiveRow) : Objective {
  		let obj: Objective;
  		if (objrow.type === 'primitive') {
  			obj = new PrimitiveObjective(objrow.name, objrow.desc);
  			let dom : Domain;
  			if (objrow.dom.type === 'categorical') {
  				dom = new CategoricalDomain(true);
  				for (let cat of objrow.dom.categories) {
  					(<CategoricalDomain>dom).addElement(cat);
  				}
  			}
  			else if (objrow.dom.type === 'interval') {
  				dom = new IntervalDomain(objrow.dom.min,objrow.dom.max,objrow.dom.interval);
  			}
  			else {
  				dom = new ContinuousDomain(objrow.dom.min,objrow.dom.max,objrow.dom.unit);
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
  		let objrow : ObjectiveRow;
  		if (obj.objectiveType === 'abstract') {
  			objrow = new ObjectiveRow(String(this.objectivesCount),obj.getName(),obj.getDescription(),parentID,depth,'abstract');
  			this.addObjRow(parentID,objrow);
  			for (let child of (<AbstractObjective>obj).getDirectSubObjectives()) {
  				this.objectiveToObjRow(child,objrow.id,objrow.depth + 1);
  			}
  		}
  		else {
  			objrow = new ObjectiveRow(String(this.objectivesCount),obj.getName(),obj.getDescription(),parentID,depth,'primitive',(<PrimitiveObjective>obj).getColor(),
  				this.domainToDomainDetails((<PrimitiveObjective>obj).getDomain()));
  			this.addObjRow(parentID,objrow);
  		}
  	}

  	domainToDomainDetails(dom: Domain) : DomainDetails {
  		let domDets : DomainDetails = new DomainDetails(dom.type);
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

  	// There must be a better way...
	toNumber(str: string) : number {
		return Number(str);
	}

	@Input() set vc(value: any) {
		this.valueChart = <ValueChart> value;
	}
}

class ObjectiveRow {
	id: string;
	name: string;
	desc: string;
	parent : string;
	depth : number;
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