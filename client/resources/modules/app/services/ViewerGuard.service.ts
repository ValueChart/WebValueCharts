/*
* @Author: aaronpmishkin
* @Date:   2017-07-17 21:38:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-17 21:52:26
*/

// Import Angular Classes:
import { Injectable }    										from '@angular/core';
import { CanDeactivate, CanActivate, NavigationStart }			from '@angular/router';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } 	from '@angular/router';
import { Observable }    										from 'rxjs/Observable';
import '../../utilities/rxjs-operators';

// Import Libraries:
import * as _													from 'lodash';

// Import Application Classes:
import { ValueChartViewerComponent } 							from '../components/ValueChartViewer/ValueChartViewer.component';
import { ValueChartService } 									from './ValueChart.service';
import { CurrentUserService } 									from './CurrentUser.service';

// Import Types
import { UserRole }												from '../../../types/UserRole';

/*
	CreationGuardService is an Angular service that is used to control navigation away from and to the '/create/:purpose' route.
*/

@Injectable()
export class ViewerGuardService implements CanDeactivate<ValueChartViewerComponent> {


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor(
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService) {}


	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@returns {boolean} - Whether navigation away from the deactivated route (always '/ValueCharts/:ValueChart/:ChartType') will be permitted or not.
		@description 	Used by the Angular router to determine whether the current user will be permitted to navigate away from the ValueChart Viewer
						based on a user's interaction with a modal window.
						This method should NEVER be called manually. Leave routing, and calling of the canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canDeactivate(component: ValueChartViewerComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		let currentUser = this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername());
		let role: UserRole = parseInt(route.queryParams['role']);

		// The user is always allowed to navigate away when they are not a member of the ValueChart or if they are only viewing the ValueChart.
		if (!currentUser || role === UserRole.Viewer || role === UserRole.Owner) {
			return true;
		} else if (!_.isEqual(currentUser, component.userRecord)) {	
			return window.confirm('You have unsaved changes to your preferences. Are you sure that you want to leave?');
		} else {
			return true;
		}
	}

}
