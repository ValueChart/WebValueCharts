/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-17 11:09:59
*/

import { enableProdMode } 						from '@angular/core';
// Enable production mode unless running locally
if (!/localhost/.test(document.location.host)) {
  enableProdMode();
}

/*
	This is where the **deployed** application is bootstrapped. It uses the angular head-of-time compiler. Bootstrapping is when the initial components of the application are connected
	together by Angular. This should only ever be done once for an application, and it should be the first thing is that is done
	when the application is delivered to the client. The AppModule is bootstrapped here because it is the base module of our application.
	Note that there is an array in the AppModule definition called bootstrap where RootComponent is declared to be the base component of the
	application.
*/


import { platformBrowser }    from '@angular/platform-browser';
import { AppModuleNgFactory } from '../aot/client/src/app/app.module.ngfactory';

platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);
