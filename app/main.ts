/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-03 13:27:20
*/


// Library Components
import { bootstrap }							from '@angular/platform-browser-dynamic';
import { HTTP_PROVIDERS } 						from '@angular/http';
import { disableDeprecatedForms, provideForms } from '@angular/forms';

// Our components
import { RootComponent }						from './resources/components/root-component/Root.component';
import { APP_ROUTER_PROVIDERS }					from './app.routes';


bootstrap(RootComponent, [
	// The next two lines disable the old, deprecated forms package, and activate the new one.
	disableDeprecatedForms(),
  	provideForms(),
  	// Add providers
	APP_ROUTER_PROVIDERS,
	HTTP_PROVIDERS

]);