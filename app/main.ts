/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 11:18:36
*/


// Library Components
import { bootstrap }        from '@angular/platform-browser-dynamic';
import { ROUTER_PROVIDERS }	from '@angular/router';

// Our components
import { RootComponent }	from './resources/components/root-component/root.component';

bootstrap(RootComponent, [
  ROUTER_PROVIDERS
]);