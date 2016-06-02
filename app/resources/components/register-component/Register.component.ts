/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-02 10:59:10
*/

import { Component }										from '@angular/core';
import { Routes, Router, ROUTER_DIRECTIVES }				from '@angular/router';


@Component({
	selector: 'register',
	templateUrl: 'app/resources/components/register-component/Register.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class RegisterComponent {

	constructor() {}

	username: string;

}
