/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 09:46:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-17 16:21:37
*/

import { provideRouter, RouterConfig } 								from '@angular/router';

// Application Classes
	// Components:
import { RegisterComponent }										from './resources/components/register-component/Register.component';
import { HomeComponent }											from './resources/components/home-component/Home.component';
import { MyValueChartsComponent }									from './resources/components/myValueCharts-component/MyValueCharts.component';
import { AccountComponent }											from './resources/components/account-component/Account.component';
import { CreateValueChartComponent }								from './resources/components/createValueChart-component/CreateValueChart.component';
import { ValueChartViewerComponent }								from './resources/components/valueChartViewer-component/ValueChartViewer.component';
import { ScoreFunctionViewerComponent }								from './resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.component';
	// Services:
import { ValueChartHttpService }									from './resources/services/ValueChartHttp.service';
import { CurrentUserService }										from './resources/services/CurrentUser.service';
import { AuthGuardService }											from './resources/services/AuthGuard.service';
import { JoinGuardService }											from './resources/services/JoinGuard.service';


/*
	This is the route configuration for the application. This is where components are assigned to url paths. 
	Angular will use these assignments to determine what component to display when the application is loaded, 
	or when it detects a change the client's url. The canActivate field on each path allows us to register a 
	class that will be responsible for determining if the application is allowed to navigate to the path.
	The AuthGuardService class is used to prevent users from navigating away from the register path without
	signing in (i.e authenticating themselves). The JoinGuardService is used to load a ValueChart for a user that
	is joining an existing ValueChart via a url. It will only block navigation if the invitation url used is not valid.
	Note that the path '/register' is the default path that the client will redirect users to if no path match is found.

	It is important to realize that Angular's routing is font-end only, and is begins after a client has been sent
	the application's index.html file. This is why the back-end is set up to redirect all requests resulting in a 404 status
	to send the index.html instead of an error. A user's request may not be a 404 at all; it may be intended for the front-end router.
*/

export const routes: RouterConfig = [
	{ path: 'register', component: RegisterComponent },
	{ path: 'join/ValueCharts/:ValueChart', component: RegisterComponent, canActivate: [JoinGuardService] },
	{ path: 'home', component: HomeComponent, canActivate: [AuthGuardService] },
	{ path: 'myValueCharts', component: MyValueChartsComponent, canActivate: [AuthGuardService] },
	{ path: 'myAccount', component: AccountComponent, canActivate: [AuthGuardService] },
	{ path: 'createValueChart/:purpose', component: CreateValueChartComponent, canActivate: [AuthGuardService] },
	{ path: 'view/:ValueChart', component: ValueChartViewerComponent, canActivate: [AuthGuardService] },
	{ path: 'scoreFunction/:viewType', component: ScoreFunctionViewerComponent },
	// Setup default URL as /register. This works because the empty string '' is technically considered a prefix for every other string,
	// and we are using prefix matching for this url.
	{ path: '', redirectTo: '/register', pathMatch: 'prefix'}
];

// Export the providers necessary for bootstrapping in main.ts. Any class that must be provided for the routes to work should 
// be included here. Note that this does not include components, which do not require providers.
export const APP_ROUTER_PROVIDERS = [
	provideRouter(routes),
	[AuthGuardService, JoinGuardService, CurrentUserService, ValueChartHttpService]
];