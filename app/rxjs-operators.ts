/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 18:35:47
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-26 18:36:56
*/

// In this file we import the RxJS statics and operators that we require for our application.
// This way we can avoid importing the entirety of the VERY large set of RxjS statics and operators.

// Statics
import 'rxjs/add/observable/throw';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';