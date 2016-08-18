/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 11:10:25
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-18 11:17:37
*/


// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { CommonModule }   						from '@angular/common';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';
import { HTTP_PROVIDERS } 						from '@angular/http';

// Import Application Classes:
import { ScoreFunctionDirective }				from '../directives/ScoreFunction.directive';


@NgModule({
	imports: [ 
		FormsModule,
		HttpModule,
		CommonModule,
	],
	declarations: [
		ScoreFunctionDirective
	],
	exports: [
		ScoreFunctionDirective
	],
	providers: [
	],
})
export class UtilitiesModule { }
