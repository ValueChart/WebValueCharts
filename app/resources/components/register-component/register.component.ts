import { Component }	from '@angular/core';

@Component({
	selector: 'register',
	templateUrl: 'app/resources/components/register-component/register.template.html'
})
export class RegisterComponent {

	constructor() {}

	username: string;

	private continue(): void {
		console.log(this.username);
	}

}