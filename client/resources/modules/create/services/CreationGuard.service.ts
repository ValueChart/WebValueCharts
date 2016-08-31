/*
* @Author: aaronpmishkin
* @Date:   2016-08-19 21:37:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-30 19:36:45
*/

// Import Angular Classes:
import { Injectable }    										from '@angular/core';
import { CanDeactivate }						  				from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } 			from '@angular/router';
import { Observable }    										from 'rxjs/Observable';

// Import Application Classes:
import { CreateValueChartComponent } 							from '../components/CreateValueChart/CreateValueChart.component';


/*
	CreationGuardService is an Angular service that is used to control navigation away from the '/createValueChart/:purpose' route.
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
	to one of the allowed URLs ('/view/' - the ValueChartViewer component, or '/register' - initiated by logout), or if the allowedToNavigate flag is 
	set to true. Otherwise, a modal window will be displayed asking the user to decide what to do and a subscriber is registered to listen to the 
	result of the user's selection. canDeactivate then returns false canceling navigation.

	3. The user chooses one of the modals options. The subscriber created in canDeactivate is triggered and two different things can happen.
	If the user chose NOT cancel navigation (either deleting or keeping the ValueChart) the allowedToNavigate flag is set to true, and the the subscriber
	re-attempts navigation to the desired route. The desired route will be window.destination if it is defined (Angular triggered navigation), or
	the current URL (browser triggered navigation). Otherwise, the allowedToNavigate flag is left false and a call to history.forward() is used
	to fix the the URL history (this only matters if navigation was triggered by the browser and the URL has been changed).

	4. (Optional) canDeactivate is called again if the user chose to navigate. This is because the subscriber re-attempted navigation away from the create
	pages, which triggers canDeactivate again. However, the allowedToNavigate flag is now true, allowing the application to navigate.
*/

@Injectable()
export class CreationGuardService implements CanDeactivate<CreateValueChartComponent> {
	
	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/*
		@returns {boolean} - Whether navigation to away from the deactivated route (always '/createValueChart/:purpose') will be permitted or not.
		@description 	Used by the Angular router to determine whether a the current user will be permitted to navigate away from the creation workflow
						based on a user's interaction with a modal window.
						This method should NEVER be called manually. Leave routing, and calling of the canActivate, canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canDeactivate(component: CreateValueChartComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

		// Allow navigation if allowedToNavigate is true, or if the destination is one of the allowed routes.
		if (component.allowedToNavigate || (<any> window).destination && ((<any> window).destination.indexOf('/view/') !== -1 ||
																			(<any> window).destination === '/register')) {
			return true;	// Return true allowing navigation.
		} else {
			var observable = component.openNavigationModal();
			
			// Register a subscriber that will be called when the user makes a selection.
			observable.subscribe((navigate: boolean) => {
				if (navigate) {
					// Set the allowed to navigate flag.
					component.allowedToNavigate = true;
					// Determine the destination based on whether window.destination is defined (read more above).
					var destination = (((<any> window).destination) ? (<any> window).destination : window.location.pathname);
					component.router.navigate([destination]);
				} else {
					history.forward();	// The user does NOT want to navigate. Fix the URL and browser history by navigating forward.
				}
			
				(<any> window).destination = undefined;	// window.destination must be reset regardless of whether the user chooses to navigate or not.
			});

			return false; // Cancel navigation by default and wait for the user response.
		}
	}
}
