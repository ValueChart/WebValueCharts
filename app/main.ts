/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-02 10:52:37
*/


// Library Components
import { bootstrap }        from '@angular/platform-browser-dynamic';
import { ROUTER_PROVIDERS }	from '@angular/router';

// Our components
import { RootComponent }	from './resources/components/root-component/Root.component';

bootstrap(RootComponent, [
  ROUTER_PROVIDERS
]);