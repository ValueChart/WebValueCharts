/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-01 17:29:03
*/

/*
	This is where the **development** application is bootstrapped. It uses the angular just-in-time compiler. Bootstrapping is when the initial components of the application are connected
	together by Angular. This should only ever be done once for an application, and it should be the first thing is that is done
	when the application is delivered to the client. The AppModule is bootstrapped here because it is the base module of our application.
	Note that there is an array in the AppModule definition called bootstrap where RootComponent is declared to be the base component of the
	application.
*/


import { platformBrowserDynamic } 				from '@angular/platform-browser-dynamic';
import { AppModule }				 			from './src/app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule);

