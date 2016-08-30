/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 11:10:25
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-30 16:37:12
*/


// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { CommonModule }   						from '@angular/common';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';
import { HTTP_PROVIDERS } 						from '@angular/http';

// Import Application Classes:
import { ScoreFunctionDirective }				from './directives/ScoreFunction.directive';


/*
	This is the UtilitiesModule declaration. It creates the UtilitiesModule, imports whatever modules it depends on, registers
	the components that belong to it, registers required providers, and exports components that can be used by other modules.
	The UtilitiesModule is intended to hold Components and Directives that must be shared between the AppModule and the CreateModule.
	This is necessary because two modules cannot contain declarations for the same components/directives. The UtilitiesModule allows 
	both the AppModule and CreateModule to get around this and use the same components and directives by registering those
	classes as exports that are automatically imported when another module imports the Utilities module. 
*/

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
