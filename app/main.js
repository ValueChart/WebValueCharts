/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 11:18:36
*/
"use strict";
// Library Components
var platform_browser_dynamic_1 = require('@angular/platform-browser-dynamic');
var router_1 = require('@angular/router');
// Our components
var root_component_1 = require('./resources/components/root-component/root.component');
platform_browser_dynamic_1.bootstrap(root_component_1.RootComponent, [
    router_1.ROUTER_PROVIDERS
]);
//# sourceMappingURL=main.js.map