/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 09:46:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-17 15:36:42
*/

import { provideRouter, RouterConfig } 								from '@angular/router';

// Application Classes
import { RegisterComponent }										from './resources/components/register-component/Register.component';
import { HomeComponent }											from './resources/components/home-component/Home.component';
import { MyValueChartsComponent }									from './resources/components/myValueCharts-component/MyValueCharts.component';
import { AccountComponent }											from './resources/components/account-component/Account.component';
import { CreateValueChartComponent }								from './resources/components/createValueChart-component/CreateValueChart.component';
import { ValueChartViewerComponent }								from './resources/components/valueChartViewer-component/ValueChartViewer.component';
import { ScoreFunctionViewerComponent }								from './resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.component';

import { ValueChartHttpService }									from './resources/services/ValueChartHttp.service';
import { CurrentUserService }										from './resources/services/CurrentUser.service';
import { AuthGuardService }											from './resources/services/AuthGuard.service';
import { JoinGuardService }											from './resources/services/JoinGuard.service';


export const routes: RouterConfig = [
	{ path: 'register', component: RegisterComponent },
	{ path: 'join/ValueCharts/:ValueChart', component: RegisterComponent, canActivate: [JoinGuardService] },
	{ path: 'home', component: HomeComponent, canActivate: [AuthGuardService] },
	{ path: 'myValueCharts', component: MyValueChartsComponent, canActivate: [AuthGuardService] },
	{ path: 'myAccount', component: AccountComponent, canActivate: [AuthGuardService] },
	{ path: 'createValueChart/:purpose', component: CreateValueChartComponent, canActivate: [AuthGuardService] },
	{ path: 'view/:ValueChart', component: ValueChartViewerComponent, canActivate: [AuthGuardService] },
	{ path: 'scoreFunction/:viewType', component: ScoreFunctionViewerComponent },
	// Setup default URL as /register:
	{ path: '', redirectTo: '/register', pathMatch: 'prefix'}
];

export const APP_ROUTER_PROVIDERS = [
	provideRouter(routes),
	[AuthGuardService, JoinGuardService, CurrentUserService, ValueChartHttpService]
];