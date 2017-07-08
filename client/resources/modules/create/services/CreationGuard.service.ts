/*
* @Author: aaronpmishkin
* @Date:   2016-08-19 21:37:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-07 17:07:57
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

			// We must check to make sure that the ValueChart has not been changed to something that is taken by another ValueChart.
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
		// Navigating to previous step
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
