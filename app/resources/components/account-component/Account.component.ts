/*
* @Author: aaronpmishkin
* @Date:   2016-08-04 16:30:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-04 16:43:06
*/

import { Component } 												from '@angular/core';
import { OnInit } 													from '@angular/core';
import { Router, ROUTER_DIRECTIVES }								from '@angular/router';

// Application classes
import { CurrentUserService }										from '../../services/CurrentUser.service';
import { UserHttpService }											from '../../services/UserHttp.service';


@Component({
	selector: 'root',
	templateUrl: 'app/resources/components/root-component/Root.template.html',
	directives: [ROUTER_DIRECTIVES],
})
export class AccountComponent implements OnInit {


	constructor(
		private currentUserService: CurrentUserService,
		private UserHttpService: UserHttpService) { }


	ngOnInit() {

	}

}