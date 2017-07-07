/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:02:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-06 21:51:44
*/

// Import Angular Classes:
import { Routes, RouterModule }  from '@angular/router';

// Import Application Classes: 
import { CreateValueChartComponent }			from './components/CreateValueChart/CreateValueChart.component';
import { CreateAlternativesComponent }			from './components/CreateAlternatives/CreateAlternatives.component';
import { CreateBasicInfoComponent }				from './components/CreateBasicInfo/CreateBasicInfo.component';
import { CreateObjectivesComponent }			from './components/CreateObjectives/CreateObjectives.component';
import { CreateScoreFunctionsComponent }		from './components/CreateScoreFunctions/CreateScoreFunctions.component';
import { CreateWeightsComponent }				from './components/CreateWeights/CreateWeights.component';

import { AuthGuardService }						from '../app/services/AuthGuard.service';
import { CreationGuardService }					from './services/CreationGuard.service';

/*
	This is the route configuration for the CreateModule. It defines the base route for the creation pages, 'createValueChart/:purpose',
	and associates it with CreateValueChartComponent, which is the base component of the CreateModule. It also creates five sub-routes
	that allow the CreateValueChartComponent to display a different creation component (used to implement one state of ValeuChart creation)
	depending on the current URI. The 'createValueChart/:purpose' route uses the CreationGuardService to prevent users from accidentally navigating
	during ValueChart creation.
*/

const creationRoutes: Routes = [
	{
		path: 'create/:purpose',
		component: CreateValueChartComponent,
		canActivate: [AuthGuardService],
		canDeactivate: [CreationGuardService],
		children: [
			{ path: 'BasicInfo', component: CreateBasicInfoComponent, canActivate: [CreationGuardService] },
			{ path: 'Objectives', component: CreateObjectivesComponent, canActivate: [CreationGuardService] },
			{ path: 'Alternatives', component: CreateAlternativesComponent, canActivate: [CreationGuardService] },
			{ path: 'ScoreFunctions', component: CreateScoreFunctionsComponent, canActivate: [CreationGuardService] },
			{ path: 'Weights', component: CreateWeightsComponent, canActivate: [CreationGuardService] }
		]
	}
];

export const CREATION_ROUTER = RouterModule.forChild(creationRoutes);