/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:51:11
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-24 15:13:01
*/

// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { CommonModule }   						from '@angular/common';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';

// Import Application Classes:
import { CREATION_ROUTER }						from './Create.routes';

import { CreateValueChartComponent }			from './components/CreateValueChart/CreateValueChart.component';
import { CreateAlternativesComponent }			from './components/CreateAlternatives/CreateAlternatives.component';
import { CreateBasicInfoComponent }				from './components/CreateBasicInfo/CreateBasicInfo.component';
import { CreateObjectivesComponent }			from './components/CreateObjectives/CreateObjectives.component';
import { CreateScoreFunctionsComponent }		from './components/CreateScoreFunctions/CreateScoreFunctions.component';
import { CreateWeightsComponent }				from './components/CreateWeights/CreateWeights.component';

import { UtilitiesModule }						from '../utilities/utilities.module';

import { CreationGuardService }					from './services/CreationGuard.service';


/*
	This is the CreateModule's declaration. It creates the CreateModule, imports whatever modules it depends on, registers
	the components that belong to it, registers required providers. The CreateModule does not defined a Bootstrap component because
	it is a submodule of the AppModule.
	The CreateModule is responsible for ValueChart creation. It uses the CREATION_ROUTER exported by Create.routes.ts to manage
	the creation workflow's routes, and the CreationGuardService to prevent users from accidentally navigating away from
	those routes during ValueChart creation.
*/

@NgModule({
	// Import all required modules.
	imports: [ 
		FormsModule,
		HttpModule,
		CommonModule,
		CREATION_ROUTER,
		UtilitiesModule 
	],
	// All Components and Directives that belong to this module MUST be declared here. Any modules that are shared between CreateModule and another module (ie. AppModule)
	// must be declared in the UtilitiesModule instead and imported via that module.
	declarations: [
		CreateValueChartComponent,
		CreateAlternativesComponent,
		CreateBasicInfoComponent,
		CreateObjectivesComponent,
		CreateScoreFunctionsComponent,
		CreateWeightsComponent
	],
	// Register any required providers. This is just the Router providers.
	providers: [
		CreationGuardService
	],
})
export class CreateModule { }
