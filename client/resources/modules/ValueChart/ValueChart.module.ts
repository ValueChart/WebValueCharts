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
import { ValueChartDirective }					from './directives/ValueChart.directive';

@NgModule({
	imports: [ 
		CommonModule,
	],
	declarations: [
		ValueChartDirective
	],
	exports: [
		ValueChartDirective
	],
	providers: [
	],
})
export class ValueChartModule { }