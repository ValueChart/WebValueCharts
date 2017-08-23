/*
* @Author: aaronpmishkin
* @Date:   2017-05-15 17:22:03
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-16 23:06:24
*/

// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { CommonModule }   						from '@angular/common';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';

// Import Application Classes:
import { ValueChartDirective }					from './directives';
import { ScoreFunctionDirective }				from './directives';


/*
	This is the ValueChart module declaration. It creates the ValueChart module, imports whatever modules it depends on, registers
	the components that belong to it, registers required providers, and defines the component that should be bootstrapped.
	The ValueChart module comprises the ValueChart visualization and the renderers, services, utilities, and interactions required to display,
	updated, and interact with it. It exports the ValueChartDirect, which is used by other modules to create and display ValueChart visualizations.

	Notice that the ValueChart module has no router because it does not have any associated routes. The module is a wrapper around the 
	ValueChart directive and its ecosystem; it is not an application in of itself.
*/

@NgModule({
	imports: [ 
		CommonModule,
	],
	declarations: [
		ValueChartDirective,
		ScoreFunctionDirective
	],
	exports: [
		ValueChartDirective,
		ScoreFunctionDirective
	],
	providers: [
	],
})
export class ValueChartVisModule { }