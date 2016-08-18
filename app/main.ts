/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-17 16:27:20
*/

// Import Angular Classes:
import { bootstrap }							from '@angular/platform-browser-dynamic';
import { HTTP_PROVIDERS } 						from '@angular/http';
import { disableDeprecatedForms, provideForms } from '@angular/forms';

// Import Application Classes:
import { RootComponent }						from './resources/components/root-component/Root.component';
import { APP_ROUTER_PROVIDERS }					from './app.routes';

/*
	This is where the application is bootstrapped. Bootstrapping is when the initial components of the application are connected
	together by Angular. This should only ever be done once for an application, and it should be the first thing is that is done
	when the application is delivered to the client. 

	Only classes that are absolute needed before any component is instantiated should be registered in the bootstrap method call.
	For us, this is the RootComponent, which is the only component that is always displayed regardless of the url path, 
	APP_ROUTER_PROVIDERS, which contains the classes required for our application's routing to function properly,
	and HTTP_PROVIDERS, the providers required for HTTP methods to work properly across the application. Refrain from adding
	more classes to this list if possible. Having many classes bootstrap slows down the application's initial loading time 
	and is bad style.
*/

bootstrap(RootComponent, [
	// The next two providers are temporary. They disable the old, deprecated forms package, and activate the new one.
	// They will be removed when Angular is updated.
	disableDeprecatedForms(),
  	provideForms(),
  	// Add providers
	APP_ROUTER_PROVIDERS,
	HTTP_PROVIDERS

]);