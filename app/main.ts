// Library Components
import { bootstrap }        from '@angular/platform-browser-dynamic';
import { ROUTER_PROVIDERS }	from '@angular/router';

// Our components
import { RootComponent }	from './resources/components/root-component/root.component';

bootstrap(RootComponent, [
  ROUTER_PROVIDERS
]);