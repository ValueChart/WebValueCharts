/*
* @Author: aaronpmishkin
* @Date:   2016-08-05 16:07:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-05 16:25:07
*/

import { Injectable }     														from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }    	from '@angular/router';

// Application Classes:
import { CurrentUserService }													from './CurrentUser.service';

@Injectable()
export class AuthGuardService implements CanActivate {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) { }


	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		if (this.currentUserService.getUsername() !== undefined && this.currentUserService.getUsername() !== null && this.currentUserService.getUsername() !== '') {
			return true;
		} else {
			this.router.navigate(['/register']);
			return false;
		}
	}
}