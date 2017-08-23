/*
* @Author: aaronpmishkin
* @Date:   2016-08-10 14:54:26
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-07 10:48:16
*/

// Import Angular Classes:
import { Injectable }     														from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }    	from '@angular/router';

// Import Application Classes:
import { CurrentUserService }													from '../services';
import { ValueChartService }													from '../services';
import { ValueChartHttp }														from '../http';

import { UserRole }																from '../../types';


/*
	JoinGuard is an Angular service that is used to allow users to join existing ValueCharts. Unlike AuthGuard,
	JoinGuard is only registered on one route, 'join/ValueCharts/:ValueChart', which is only ever activated when a user joins an existing
	ValueCharts via a referral link. When this happens, this class obtains the name and password of the ValueChart that the user is joining from 
	the URL parameters and makes a call to the server to retrieve the structure of said ValueChart. This allows the application to navigate
	directly to the ValueChart creation workflow after the user is authenticated and avoids placing any logic for joining a ValueChart
	in RegisterComponent.
*/

@Injectable()
export class JoinGuard implements CanActivate {
	
	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private router: Router,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private valueChartHttp: ValueChartHttp) { }


	/*
		@returns {boolean} - Whether navigation to the activated route will be permitted or not. This is ALWAYS true for this method.
		@description 	Used by the Angular router to fetch a ValueChart's structure to facilitate a user joining that ValueChart.
						This method should NEVER be called manually. Leave routing, and calling of the canActivate, canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

		return new Promise((resolve) => {
			if (state.url.indexOf('join') !== -1) {
				// Retrieve the ValueChart ID from the URL router parameters.
				var name: string = route.params['ValueChart'];
				// Retrieve the ValueChart password from the URL query parameters.
				var password: string = (<any> route.queryParams).password;

				// Retrieve the structure of that ValueChart that the user is joining.
				this.valueChartHttp.getValueChartByName(name, password)
					.subscribe(
					valueChart => {
						this.valueChartService.setValueChart(valueChart);
						resolve(true);	
					},
					error => {
						this.router.navigate(['/register'], { queryParamsHandling: "merge"}); // The ValueChart does not exist. Redirect the user to the '/register' page.
						resolve(false);	
					});

			} else {
				resolve(true);
			}
		});
	}
}