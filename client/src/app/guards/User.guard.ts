/*
* @Author: aaronpmishkin
* @Date:   2017-07-17 21:38:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-18 10:50:38
*/

// Import Angular Classes:
import { Injectable }    										from '@angular/core';
import { CanDeactivate, CanActivate, NavigationStart }			from '@angular/router';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } 	from '@angular/router';
import { Observable }    										from 'rxjs/Observable';
import '../utilities/rxjs-operators';

// Import Libraries:
import * as _													from 'lodash';

// Import Application Classes:
import { ValueChartViewerComponent } 							from '../components';
import { ValueChartService } 									from '../services';
import { CurrentUserService } 									from '../services';

// Import Model Classes:
import { User }													from '../../model';

// Import Types
import { UserRole }												from '../../types';
import { CreatePurpose }										from '../../types';

/*
	UserGuard is an Angular service that is used to control navigation away from and to the '/ValueCharts/:ValueChart/:ChartType' route
	and the /create/:purpose/ScoreFunctions + /create/:purpose/Weights routes when the purpose of editing preferences.
	Essentially, the main function of this guard is to prevent users from navigating away from the create workflow
	or the ValueChartViewer when they have unsaved preferences.
*/

@Injectable()
export class UserGuard implements CanDeactivate<any> {

	private userRecord: User;
	private destination: string;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService) {

		// Record the navigation destination from the NavigationState event.
		this.router
		    .events
		    .filter(e => e instanceof NavigationStart)
		    .subscribe((e: NavigationStart) => this.destination = e.url)	
	}



	// ========================================================================================
	// 									Methods
	// ========================================================================================

	getUserRecord(): User {
		return this.userRecord;
	}

	setUserRecord(user: User): void {
		this.userRecord = user;
	} 

	/*
		@returns {boolean} - Whether navigation away from the deactivated route (always '/ValueCharts/:ValueChart/:ChartType') will be permitted or not.
		@description 	Used by the Angular router to determine whether the current user will be permitted to navigate away from the ValueChart Viewer
						based on a user's interaction with a modal window.
						This method should NEVER be called manually. Leave routing, and calling of the canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canDeactivate(component: any, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		let currentUser = this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername());
		let role: UserRole = parseInt(route.queryParams['role']);
		let createPurpose: CreatePurpose = parseInt(route.params['purpose']);

		// The user is always allowed to navigate away when they are not a member of the ValueChart, if they are only viewing the ValueChart, or if they are returning to the viewer or the create workflow.
		if (!currentUser || 
			role === UserRole.Viewer || 
			role === UserRole.Owner || 
			!this.destination || 
			this.destination.indexOf('ValueCharts/') !== -1 || 
			this.destination.indexOf('create/') !== -1 ||
			createPurpose === CreatePurpose.EditValueChart || createPurpose === CreatePurpose.NewValueChart || createPurpose === CreatePurpose.NewUser) {
			return true;
		} else if (!_.isEqual(currentUser, this.userRecord)) {	
			let navigate = window.confirm('You have unsaved changes to your preferences. Are you sure that you want to leave?');
			
			if (navigate) {
				this.userRecord = null;
			}

			return navigate;
		} else {
			this.userRecord = null;
			return true;
		}
	}

}
