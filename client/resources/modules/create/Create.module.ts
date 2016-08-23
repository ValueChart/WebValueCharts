/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:51:11
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 12:38:03
*/



// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { CommonModule }   						from '@angular/common';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';
import { HTTP_PROVIDERS } 						from '@angular/http';

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


@NgModule({
	imports: [ 
		FormsModule,
		HttpModule,
		CommonModule,
		CREATION_ROUTER,
		UtilitiesModule 
	],
	declarations: [
		CreateValueChartComponent,
		CreateAlternativesComponent,
		CreateBasicInfoComponent,
		CreateObjectivesComponent,
		CreateScoreFunctionsComponent,
		CreateWeightsComponent
	],
	providers: [
		CreationGuardService
	],
})
export class CreateModule { }
