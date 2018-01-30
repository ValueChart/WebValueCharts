/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 09:46:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-17 21:40:32
*/

import { Routes, RouterModule } 									from '@angular/router';

// Import Application Classes:
	// Components:
import { RegisterComponent }										from './components/Register/Register.component';
import { HomeComponent }											from './components/Home/Home.component';
import { AccountComponent }											from './components/Account/Account.component';
import { ValueChartViewerComponent }								from './components/ValueChartViewer/ValueChartViewer.component';
import { ScoreFunctionViewerComponent }								from './components/ScoreFunctionViewer/ScoreFunctionViewer.component';

import { CreateValueChartComponent }								from './components/CreateValueChart/CreateValueChart.component';
import { CreateAlternativesComponent }								from './components/CreateAlternatives/CreateAlternatives.component';
import { CreateBasicInfoComponent }									from './components/CreateBasicInfo/CreateBasicInfo.component';
import { CreateObjectivesComponent }								from './components/CreateObjectives/CreateObjectives.component';
import { CreateScoreFunctionsComponent }							from './components/CreateScoreFunctions/CreateScoreFunctions.component';
import { CreateWeightsComponent }									from './components/CreateWeights/CreateWeights.component';

	// Services:
import { ValueChartHttp }											from './http/ValueChart.http';
import { UserHttp }													from './http/User.http';
import { HostService }												from './services/Host.service';
import { CurrentUserService }										from './services/CurrentUser.service';
import { ValueChartService }										from './services/ValueChart.service';
import { AuthGuard }												from './guards/Auth.guard';
import { JoinGuard }												from './guards/Join.guard';
import { UserGuard }												from './guards/User.guard';
import { CreationGuard }											from './guards/Creation.guard';
import { UpdateValueChartService }									from './services/UpdateValueChart.service';
import { ValidationService }										from './services/Validation.service';
import { UserNotificationService }									from './services/UserNotification.service';
import { CreationStepsService }										from './services/CreationSteps.service';


/*
	This is the route configuration for the main application router. This is where components are assigned to url paths. 
	Angular will use these assignments to determine what component to display when the application is loaded, 
	or when it detects a change the client's url. The canActivate field on each path allows us to register a 
	class that will be responsible for determining if the application is allowed to navigate to the path.
	The AuthGuard class is used to prevent users from navigating away from the 'register' path without
	signing in (i.e authenticating themselves). The JoinGuard is used to load a ValueChart for a user that
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
	{ path: 'join/ValueCharts/:ValueChart', component: RegisterComponent, canActivate: [JoinGuard] },
	{ path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
	{ path: 'myAccount', component: AccountComponent, canActivate: [AuthGuard] },
	{ path: 'ValueCharts/:ValueChart/:ChartType', component: ValueChartViewerComponent, canActivate: [AuthGuard], canDeactivate: [UserGuard] },
	{ path: 'scoreFunction/:ViewType', component: ScoreFunctionViewerComponent },
	{
		path: 'create/:purpose',
		component: CreateValueChartComponent,
		canActivate: [AuthGuard],
		canDeactivate: [CreationGuard],
		children: [
			{ path: 'BasicInfo', component: CreateBasicInfoComponent, canActivate: [CreationGuard] },
			{ path: 'Objectives', component: CreateObjectivesComponent, canActivate: [CreationGuard] },
			{ path: 'Alternatives', component: CreateAlternativesComponent, canActivate: [CreationGuard] },
			{ path: 'ScoreFunctions', component: CreateScoreFunctionsComponent, canActivate: [CreationGuard], canDeactivate: [UserGuard] },
			{ path: 'Weights', component: CreateWeightsComponent, canActivate: [CreationGuard], canDeactivate: [UserGuard] }
		]
	},
	// Setup default URL as /register.
	{ path: '**', redirectTo: '/register'}
];

// Export the providers necessary for the router to be used in the AppModule. Any class that must be provided for the routes to work should 
// be included here. Note that this does not include components, which do not require providers.
export const APP_ROUTER_PROVIDERS = [
	[AuthGuard, JoinGuard, UserGuard, CreationGuard, HostService, UserHttp, ValueChartHttp, CurrentUserService, ValueChartService, CreationStepsService, UpdateValueChartService, ValidationService, UserNotificationService]
];

// Export the router itself. This is registered as the applications router in the AppModule.
export const ROUTER = RouterModule.forRoot(routes);