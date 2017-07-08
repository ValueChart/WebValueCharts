/*
* @Author: aaronpmishkin
* @Date:   2016-08-19 21:37:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-07 17:05:30
*/

// Import Angular Classes:
import { Injectable }    										from '@angular/core';
import { CanDeactivate, CanActivate, NavigationStart }			from '@angular/router';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } 	from '@angular/router';
import { Observable }    										from 'rxjs/Observable';
import '../../utilities/rxjs-operators';


// Import Application Classes:
import { CreateValueChartComponent } 							from '../components/CreateValueChart/CreateValueChart.component';
import { CreationStepsService }									from './CreationSteps.service';

// Import Types
import { CreatePurpose }										from '../../../types/CreatePurpose';

/*
	CreationGuardService is an Angular service that is used to control navigation away from the '/create/:purpose' route.
	
	** Case 1 **
	A significant issue during ValueChart creation is that users can accidentally navigate away from the creation page by clicking
	the browser's back button, or by clicking an on-page link ("My Account" for example). This destroys all of the user's unsaved
	creation progress. CreationGuardService pauses all navigation away from the creation component ('createValueChart/:purpose') and
	its children and requests user input via a modal window. This modal allows users to continue navigation and keep their in-progress 
	ValueChart, continue navigation and delete their in-progress ValueChart, or to cancel navigation and remain in the creation workflow.

	Unfortunately, Angular does not seem to properly support Subject (see rxjs documentation) type Observables for determining
	navigation results despite the fact that the canDeactivate method is explicitly allowed to return a boolean Observable by the
	Angular documentation. The result of this is that navigation protection is done by an ugly hack that should be cleaned up ASAP. 
	The general operation of the hack is as follows:

	1. A user does something that would trigger navigation away from creation. They may hit the back/forward buttons, navigated via the address bar, or hit a 
	link internal to the application. If the navigation is done by the browser (back/forward, address bar) then the URL and history
	of the browser will be changed to the new location BEFORE the canDeactivate method in this class is called by Angular. If the 
	navigation is done by a router link within the application then the URL will and browser history will NOT be changed by Angular before
	canDeactivate is called. Unfortunately, it is impossible to obtain the user's destination from the router. This is why ANY Angular router link
	that can be clicked from the create page must set the window.destination variable to be the correct destination at the same time as triggering
	navigation.

	2. Angular's router calls the CreationGuardService's canDeactivate method. The application will be allowed to navigate ONLY if navigation is
	to one of the allowed URLs ('/view/' - the ValueChartViewer component), or if the allowedToNavigate flag is 
	set to true. Otherwise, a modal window will be displayed asking the user to decide what to do and a subscriber is registered to listen to the 
	result of the user's selection. canDeactivate then returns false canceling navigation.

	3. The user chooses one of the modals options. The subscriber created in canDeactivate is triggered and two different things can happen.
	If the user chose NOT cancel navigation (either deleting or keeping the ValueChart) the allowedToNavigate flag is set to true, and the the subscriber
	re-attempts navigation to the desired route. The desired route will be window.destination if it is defined (Angular triggered navigation), or
	the current URL (browser triggered navigation). Otherwise, the allowedToNavigate flag is left false and a call to history.forward() is used
	to fix the the URL history (this only matters if navigation was triggered by the browser and the URL has been changed).

	4. (Optional) canDeactivate is called again if the user chose to navigate. This is because the subscriber re-attempted navigation away from the create
	pages, which triggers canDeactivate again. However, the allowedToNavigate flag is now true, allowing the application to navigate.

	** Case 2 **

	Another issue is that users can navigate between stages of the create workflow using the Back and Next buttons of the browser. 
	This is problematic because it bypasses the logic that CreateValueChart uses to move between steps.
	To solve this problem, the canActivate method of CreationGuardService is attached to each of the substep components of the create workflow
	(see Create.routes.ts). If navigation between steps is accomplished the "normal" way (using the "Next Stage" and "Previous Stage" buttons),
	then CreateValueChart sets a flag in CreationStepsService, and canActivate lets navigation go ahead. Otherwise, it cancels the navigation
	and then subscribes to a method in CreationStepsService that causes navigation to proceed normally through CreateValueChart.

*/

@Injectable()
export class CreationGuardService implements CanDeactivate<CreateValueChartComponent>, CanActivate {
	
	private destination: string;
	private browserActivated: boolean;

	constructor(
		private router: Router,
		private creationStepsService: CreationStepsService) {

		// Record the navigation destination from the NavigationState event.
		this.router
		    .events
		    .filter(e => e instanceof NavigationStart)
		    .subscribe((e: NavigationStart) => this.destination = e.url)

		window.onpopstate = (event: Event) => { this.browserActivated = true; }
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@returns {boolean} - Whether navigation away from the deactivated route (always '/create/:purpose') will be permitted or not.
		@description 	Used by the Angular router to determine whether the current user will be permitted to navigate away from the creation workflow
						based on a user's interaction with a modal window.
						This method should NEVER be called manually. Leave routing, and calling of the canActivate, canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canDeactivate(component: CreateValueChartComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

		let purpose: CreatePurpose = parseInt(route.params['purpose']);

		// Immediately allow navigation away from component if:
		//	(1) The CreatePurpose is not NewValueChart;
		//	(2) the destination is the ValueChartViewer;
		if ( this.destination.indexOf('ValueCharts') !== -1 // We are going to the ValueChart Viewer
			|| purpose !== CreatePurpose.NewValueChart) {	// We were not creating a new ValueChart
			return Observable.from([true]);
		} else {
			// Otherwise, open the navigation model and ask the user for instructions.
			return component.openNavigationModal();
		}	
	}

		/*
		@returns {boolean} - Whether navigation to activated route (always '/create/:purpose/:step') will be permitted or not.
		@description 	Used by the Angular router to determine whether the current user will be permitted to navigate to a creation workflow
						step based on how navigation was triggered (by Angular or by browser). See in-line comments for details.
						This method should NEVER be called manually. Leave routing, and calling of the canActivate, canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
		// Allow navigation if we are coming into the component from outside of the creation workflow.
		if (window.location.pathname.indexOf('/create/') === -1) {
			return true;
		}
		// Navigation was triggered through "proper channels" (using buttons in CreateValueChart).
		else if (!this.browserActivated) {
			return true;
		}
		// Navigation was triggered by browser buttons (Next, Back).
		// We need to intercept this and proceed with navigation through the proper channels. 
		// That way, the component state is updated along with the route.
		else {
			this.browserActivated = false;
			let previousStep = this.creationStepsService.previousStep[this.creationStepsService.step];
			let followingStep = this.creationStepsService.nextStep[this.creationStepsService.step];
			// Navigating to previous step
			if (this.creationStepsService.nameChanged() && this.creationStepsService.step == this.creationStepsService.BASICS) {
				return new Promise((resolve) => {
					this.creationStepsService.isNameAvailable()
						.subscribe((available: boolean) => {
							if (!available) {
								toastr.error("That name is already taken. Please choose another.");
								resolve(false);
							} else {
								resolve(this.handleBackForward(state, previousStep, followingStep));
							}
					});
				});
			} else {
				return this.handleBackForward(state, previousStep, followingStep);
			}		
		}
	}

	handleBackForward(state: RouterStateSnapshot, previousStep: string, followingStep: string): boolean {
		if (state.url.indexOf(previousStep) !== -1 ) {
			this.creationStepsService.autoSaveValueChart();
			this.creationStepsService.step = previousStep;
			return true;
		}
		// Navigating to next step
		else if (state.url.indexOf(followingStep) !== -1 ) {
			this.creationStepsService.autoSaveValueChart();
			this.creationStepsService.step = followingStep;
			return true;
		}
		// Invalid route, cancel. The create workflow is not designed to allow users to skip over steps.
		// (This might happen if the user changes the URL manually or selects a link from browsing history...
		//  this is an ugly fix, but it's temporary - routing and navigation for the create workflow needs to be reworked.)
		else {
			history.forward();
			return false;
		}
	}
}
