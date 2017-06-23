/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 09:46:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-22 17:02:23
*/

import { Routes, RouterModule } 									from '@angular/router';

// Import Application Classes:
	// Components:
import { RegisterComponent }										from './components/Register/Register.component';
import { HomeComponent }											from './components/Home/Home.component';
import { MyValueChartsComponent }									from './components/MyValueCharts/MyValueCharts.component';
import { AccountComponent }											from './components/Account/Account.component';
import { ValueChartViewerComponent }								from './components/ValueChartViewer/ValueChartViewer.component';
import { ScoreFunctionViewerComponent }								from './components/ScoreFunctionViewer/ScoreFunctionViewer.component';
	// Services:
import { ValueChartHttpService }									from './services/ValueChartHttp.service';
import { UserHttpService }											from './services/UserHttp.service';
import { CurrentUserService }										from './services/CurrentUser.service';
import { ValueChartService }										from './services/ValueChart.service';
import { AuthGuardService }											from './services/AuthGuard.service';
import { JoinGuardService }											from './services/JoinGuard.service';
import { CreationStepsService }										from '../create/services/CreationSteps.service';
import { UpdateObjectiveReferencesService }							from '../create/services/UpdateObjectiveReferences.service';
import { ValidationService }										from './services/Validation.service';
import { HostService }												from './services/Host.service';
import { DisplayedUsersService }									from './services/DisplayedUsers.service';


/*
	This is the route configuration for the main application router. This is where components are assigned to url paths. 
	Angular will use these assignments to determine what component to display when the application is loaded, 
	or when it detects a change the client's url. The canActivate field on each path allows us to register a 
	class that will be responsible for determining if the application is allowed to navigate to the path.
	The AuthGuardService class is used to prevent users from navigating away from the 'register' path without
	signing in (i.e authenticating themselves). The JoinGuardService is used to load a ValueChart for a user that
	is joining an existing ValueChart via a url. It will only block navigation if the invitation url used is not valid.
	Note that the path '/register' is the default path that the client will redirect users to if no path match is found. This is
	accomplished via the '**' (wildcard) path.

	Note that all Creation related routes are declared and handled in Create.routes.ts, which is the router for the CreateModule.

	It is important to realize that Angular's routing is font-end only, and is begins after a client has been sent
	the application's index.html file. This is why the back-end is set up to redirect all requests resulting in a 404 status
	to send the index.html instead of an error. A user's request may not be a 404 at all; it may be intended for the front-end router.
*/

const routes: Routes = [
	{ path: 'register', component: RegisterComponent },
	{ path: 'join/ValueCharts/:ValueChart', component: RegisterComponent, canActivate: [JoinGuardService] },
	{ path: 'home', component: HomeComponent, canActivate: [AuthGuardService] },
	{ path: 'myValueCharts', component: MyValueChartsComponent, canActivate: [AuthGuardService] },
	{ path: 'myAccount', component: AccountComponent, canActivate: [AuthGuardService] },
	{ path: 'view/:viewType/:ValueChart', component: ValueChartViewerComponent, canActivate: [AuthGuardService, JoinGuardService] },
	{ path: 'scoreFunction/:viewType', component: ScoreFunctionViewerComponent },
	// Setup default URL as /register.
	{ path: '**', redirectTo: '/register'}
];

// Export the providers necessary for the router to be used in the AppModule. Any class that must be provided for the routes to work should 
// be included here. Note that this does not include components, which do not require providers.
export const APP_ROUTER_PROVIDERS = [
	[AuthGuardService, JoinGuardService, CurrentUserService, UserHttpService, ValueChartHttpService, ValueChartService, DisplayedUsersService, CreationStepsService, UpdateObjectiveReferencesService, ValidationService, HostService]
];

// Export the router itself. This is registered as the applications router in the AppModule.
export const ROUTER = RouterModule.forRoot(routes);