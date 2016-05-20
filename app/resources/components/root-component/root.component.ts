import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';
import { Routes, Router, ROUTER_DIRECTIVES }				from '@angular/router';

import { RegisterComponent }								from '../register-component/register.component';

@Component({
	selector: 'root',
	templateUrl: 'app/resources/components/root-component/root.template.html',
	directives: [ROUTER_DIRECTIVES]
})
@Routes([
  {path: '/register', component: RegisterComponent}, // useAsDefault: true - coming soon...
  {path: '*', component: RegisterComponent} // useAsDefault: true - coming soon...

])
export class RootComponent implements OnInit {

	constructor(private _router: Router) {}
	
	ngOnInit() {
    	this._router.navigate(['/register']);
  	}

}