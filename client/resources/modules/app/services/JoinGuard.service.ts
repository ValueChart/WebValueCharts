/*
* @Author: aaronpmishkin
* @Date:   2016-08-10 14:54:26
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-17 15:09:12
*/

import { Injectable }     														from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }    	from '@angular/router';

// Application Classes:
import { CurrentUserService }													from './CurrentUser.service';
import { ValueChartService }													from './ValueChart.service';
import { ValueChartHttpService }													from './ValueChartHttp.service';


@Injectable()
export class JoinGuardService implements CanActivate {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private valueChartHttpService: ValueChartHttpService) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

		// Retrieve the ValueChart ID from the URL router parameters.
		var name: string = route.params['ValueChart'];
		// Retrieve the ValueChart password from the URL query parameters.
		var password: string = state.queryParams['password'];

		this.valueChartHttpService.getValueChartStructure(name, password)
			.subscribe(
			valueChart => {
				this.currentUserService.setJoiningChart(true);
				this.valueChartService.setValueChart(valueChart);
			},
			error => {
				this.router.navigate(['/register']);
			});

		return true;
	}
}