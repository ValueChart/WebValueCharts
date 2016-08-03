/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 09:46:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-03 16:43:12
*/

import { provideRouter, RouterConfig } 		from '@angular/router';

// Application Classes
import { RegisterComponent }				from './resources/components/register-component/Register.component';
import { CreateComponent }					from './resources/components/create-component/Create.component';
import { CreateValueChartComponent }		from './resources/components/createValueChart-component/CreateValueChart.component';
import { ValueChartViewerComponent }		from './resources/components/valueChartViewer-component/ValueChartViewer.component';

import { ScoreFunctionViewerComponent }		from './resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.component';


export const routes: RouterConfig = [
	{ path: 'register', component: RegisterComponent },
	{ path: 'create', component: CreateComponent },
	{ path: 'createValueChart/:purpose', component: CreateValueChartComponent },
	{ path: 'view/:ValueChart', component: ValueChartViewerComponent },
	{ path: 'scoreFunction/:viewType', component: ScoreFunctionViewerComponent },
	// Setup default URL as /register:
	{ path: '', redirectTo: '/register', pathMatch: 'prefix'}
];

export const APP_ROUTER_PROVIDERS = [
	provideRouter(routes)
];