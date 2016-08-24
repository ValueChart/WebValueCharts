/*
* @Author: aaronpmishkin
* @Date:   2016-08-19 21:37:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-24 10:41:34
*/

// Import Angular Classes:
import { Injectable }    										from '@angular/core';
import { CanDeactivate }						  				from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } 			from '@angular/router';
import { Observable }    										from 'rxjs/Observable';

// Application Classes:
import { CreateValueChartComponent } 							from '../components/CreateValueChart/CreateValueChart.component';

@Injectable()
export class CreationGuardService implements CanDeactivate<CreateValueChartComponent> {

	canDeactivate(component: CreateValueChartComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

		if (component.allowedToNavigate || (<any> window).destination && ((<any> window).destination.indexOf('/view/') !== -1 ||
																			(<any> window).destination === '/register')) {
			return true;
		} else {
			var observable = component.openNavigationModal();
			observable.subscribe((navigate: boolean) => {
				if (navigate) {
					component.allowedToNavigate = true;
					var destination = (((<any> window).destination) ? (<any> window).destination : window.location.pathname);
					component.router.navigate([destination]);
				} else {
					history.forward();
				}
			(<any> window).destination = undefined;
			});
			return false;
		}
	}
}
