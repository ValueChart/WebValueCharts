/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 09:46:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-24 10:11:28
*/

import { provideRouter, RouterConfig } 		from '@angular/router';

// Application Classes
import { RegisterComponent }				from './resources/components/register-component/Register.component';
import { CreateComponent }					from './resources/components/create-component/Create.component';
import { CreateValueChartComponent }		from './resources/components/createValueChart-component/CreateValueChart.component';
import { ValueChartViewerComponent }		from './resources/components/valueChartViewer-component/ValueChartViewer.component';


export const routes: RouterConfig = [
	{ path: '', redirectTo: '/register', terminal: true },	// Redirect from the base URL to /register.
	{ path: 'register', component: RegisterComponent },
	{ path: 'create', component: CreateComponent },
	{ path: 'createValueChart/:purpose', component: CreateValueChartComponent },
	{ path: 'view/ValueChart', component: ValueChartViewerComponent }
];

export const APP_ROUTER_PROVIDERS = [
	provideRouter(routes)
];