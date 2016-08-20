/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:51:11
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-20 12:45:11
*/



// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { CommonModule }   						from '@angular/common';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';
import { HTTP_PROVIDERS } 						from '@angular/http';

// Import Application Classes:
import { CREATION_ROUTER }						from './createValueChart-component/Creation.routes';

import { CreateValueChartComponent }			from './createValueChart-component/CreateValueChart.component';
import { CreateAlternativesComponent }			from './createAlternatives-component/CreateAlternatives.component';
import { CreateBasicInfoComponent }				from './createBasicInfo-component/CreateBasicInfo.component';
import { CreateObjectivesComponent }			from './createObjectives-component/CreateObjectives.component';
import { CreateScoreFunctionsComponent }		from './createScoreFunctions-component/CreateScoreFunctions.component';
import { CreateWeightsComponent }				from './createWeights-component/CreateWeights.component';

import { UtilitiesModule }						from './utilities.module';

import { CreationGuardService }					from '../services/CreationGuard.service';


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
		CreateWeightsComponent,
	],
	providers: [
		CreationGuardService
	],
})
export class CreateModule { }
