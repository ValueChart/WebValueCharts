/*
* @Author: aaronpmishkin
* @Date:   2016-08-10 14:54:26
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-11 10:56:57
*/

import { Injectable }     														from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }    	from '@angular/router';

// Application Classes:
import { CurrentUserService }													from './CurrentUser.service';
import { GroupVcHttpService }													from './GroupVcHttp.service';


@Injectable()
export class JoinGuardService implements CanActivate {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService,
		private groupVcHttpService: GroupVcHttpService) { }


	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) : boolean {
		
		// Retrieve the ValueChart ID from the URL router parameters.
		var name: string = route.params['ValueChart'];
		// Retrieve the ValueChart password from the URL query parameters.
		var password: string = state.queryParams['password'];

		this.groupVcHttpService.getValueChartStructure(name, password)
			.subscribe( 
				valueChart => {
					this.currentUserService.setJoiningChart(true);
					this.currentUserService.setValueChart(valueChart);
				},
				error => { 
					this.router.navigate(['/register']);
				});

		return true;
	}
}