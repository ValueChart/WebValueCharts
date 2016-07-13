/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-13 10:40:21
*/

import { Component }										from '@angular/core';
import { ROUTER_DIRECTIVES }								from '@angular/router';

// Application Classes
import { CurrentUserService }								from '../../services/CurrentUser.service';

@Component({
	selector: 'register',
	templateUrl: '/app/resources/components/register-component/Register.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class RegisterComponent {

	username: string;

	constructor(private currentUserService: CurrentUserService) {}

	setUsername(username: string): void {
		this.currentUserService.setUsername(username);
	}


}
