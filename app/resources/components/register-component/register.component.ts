import { Component }	from '@angular/core';
import { Routes, Router, ROUTER_DIRECTIVES }				from '@angular/router';


@Component({
	selector: 'register',
	templateUrl: 'app/resources/components/register-component/register.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class RegisterComponent {

	constructor() {}

	username: string;

}
