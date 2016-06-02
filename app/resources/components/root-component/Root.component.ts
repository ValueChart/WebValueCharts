import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';
import { Routes, Router, ROUTER_DIRECTIVES }				from '@angular/router';

import { RegisterComponent }								from '../register-component/Register.component';
import { CreateComponent }									from '../create-component/Create.component';

@Component({
	selector: 'root',
	templateUrl: 'app/resources/components/root-component/Root.template.html',
	directives: [ROUTER_DIRECTIVES]
})
@Routes([
  {path: '/register', component: RegisterComponent}, // useAsDefault: true - coming soon...
  {path: '/create', component: CreateComponent},
])
export class RootComponent implements OnInit {

	constructor(private _router: Router) {}
	
	ngOnInit() {
    	this._router.navigate(['/register']); 
  	}

}