/*
* @Author: aaronpmishkin
* @Date:   2016-08-19 21:37:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-19 12:39:20
*/

// Import Angular Classes:
import { Injectable }    												from '@angular/core';
import { CanDeactivate, CanActivate, NavigationStart, NavigationEnd  }	from '@angular/router';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot} 			from '@angular/router';
import { Observable }    												from 'rxjs/Observable';
import '../utilities/rxjs-operators';


// Import Application Classes:
import { CreateValueChartComponent } 							from '../components';
import { CreationStepsService }									from '../services';

// Import Types
import { CreatePurpose }										from '../../types';

/*
	CreationGuard is an Angular service that is used to control navigation away from and to the '/create/:purpose/:stage' route
	in the case where the purpose is creating a ValueChart. This is distinct from the user guard. This class is used to
	determine if a user wants to discard to save a new ValueChart when leaving the create workflow. In comparison, the user guard
	is used to warn users that unsaved preferences changes will be lost due to navigation when leaving the create workflow or the viewer.
*/

@Injectable()
export class CreationGuard implements CanDeactivate<CreateValueChartComponent>, CanActivate {
	
	private source: string;
	private destination: string;
	private browserActivated: boolean;

	constructor(
		private router: Router,
		private creationStepsService: CreationStepsService) {

		// Record the navigation source from the NavigationState event.
		this.router
		    .events
		    .filter(e => e instanceof NavigationEnd)
		    .subscribe((e: NavigationEnd) => this.source = e.url)

		// Record the navigation destination from the NavigationState event.
		this.router
		    .events
		    .filter(e => e instanceof NavigationStart)
		    .subscribe((e: NavigationStart) => this.destination = e.url)
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
		if ( this.destination.indexOf('ValueCharts/') !== -1 // We are going to the ValueChart Viewer
			|| purpose !== CreatePurpose.NewValueChart) {	// We were not creating a new ValueChart
			return Observable.from([true]);
		} else {
			// Otherwise, open the navigation model and ask the user for instructions.
			return component.openNavigationModal();
		}	
	}

	/*
		@returns {boolean} - Whether navigation to activated route (always '/create/:purpose/:step') will be permitted or not.
		@description 	Used by the Angular router to determine whether the current user will be permitted to navigate within the creation workflow.
						This method should NEVER be called manually. Leave routing, and calling of the canActivate, canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
		// Allow navigation if we are coming into the component from outside of the creation workflow.
		if (window.location.pathname.indexOf('/create/') === -1 || (this.source !== undefined && this.source.indexOf('/create/') === -1)) {
			return true;
		}
		else {
			let previousStep = this.creationStepsService.getPreviousStep(this.creationStepsService.step);
			let nextStep = this.creationStepsService.getNextStep(this.creationStepsService.step);

			// Navigating to previous step
			if (this.destination !== undefined && this.destination.indexOf(previousStep) !== -1) {
				return this.creationStepsService.previous();
			}
			// Navigating to next step
			else if (this.destination !== undefined && this.destination.indexOf(nextStep) !== -1) {
				return this.creationStepsService.next();
			}
			// Invalid route, cancel. The create workflow is not designed to allow users to skip over steps.
			// (This might happen if the user selects a link from browsing history.
			//  Return to this later - we should show page not found or something to that effect.)
			else {
				history.forward();
				return false;
			}
		}
	}
}
