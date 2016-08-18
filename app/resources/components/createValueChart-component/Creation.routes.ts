/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:02:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-18 14:34:15
*/

// Import Angular Classes:
import { Routes, RouterModule }  from '@angular/router';

// Import Application Classes: 
import { CreateValueChartComponent }			from './CreateValueChart.component';
import { CreateAlternativesComponent }			from '../createAlternatives-component/CreateAlternatives.component';
import { CreateBasicInfoComponent }				from '../createBasicInfo-component/CreateBasicInfo.component';
import { CreateObjectivesComponent }			from '../createObjectives-component/CreateObjectives.component';
import { CreateScoreFunctionsComponent }		from '../createScoreFunctions-component/CreateScoreFunctions.component';
import { CreateWeightsComponent }				from '../createWeights-component/CreateWeights.component';

import { AuthGuardService }						from '../../services/AuthGuard.service';

const creationRoutes: Routes = [
	{
		path: 'createValueChart/:purpose',
		component: CreateValueChartComponent,
		canActivate: [AuthGuardService],
		children: [
			{ path: 'BasicInfo', component: CreateBasicInfoComponent },
			{ path: 'Objectives', component: CreateObjectivesComponent },
			{ path: 'Alternatives', component: CreateAlternativesComponent },
			{ path: 'ScoreFunctions', component: CreateScoreFunctionsComponent },
			{ path: 'Weights', component: CreateWeightsComponent }
		]
	}
];

export const CREATION_ROUTER = RouterModule.forChild(creationRoutes);