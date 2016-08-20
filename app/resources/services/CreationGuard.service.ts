/*
* @Author: aaronpmishkin
* @Date:   2016-08-19 21:37:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-20 12:32:33
*/

// Import Angular Classes:
import { Injectable }    										from '@angular/core';
import { CanDeactivate }						  				from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } 			from '@angular/router';
import { Observable }    										from 'rxjs/Observable';

// Application Classes:
import { CreateValueChartComponent } 							from '../components/createValueChart-component/CreateValueChart.component';

@Injectable()
export class CreationGuardService implements CanDeactivate<CreateValueChartComponent> {
	
	canDeactivate(component: CreateValueChartComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

		// In progress		
		return window.confirm('Are you sure that you want leave this page? All of your unsaved changes will be lost.');

	}



}
