/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-30 16:02:05
*/

import { platformBrowserDynamic } 		from '@angular/platform-browser-dynamic';
import { AppModule }				 	from './resources/modules/app/app.module';


/*
	This is where the application is bootstrapped. Bootstrapping is when the initial components of the application are connected
	together by Angular. This should only ever be done once for an application, and it should be the first thing is that is done
	when the application is delivered to the client. The AppModule is bootstrapped here because it is the base module of our application.
	Note that there is an array in the AppModule definition called bootstrap where RootComponent is declared to be the base component of the
	application.
*/

platformBrowserDynamic().bootstrapModule(AppModule);
