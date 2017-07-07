/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 18:35:47
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-07 15:32:56
*/

/* 
	In this file we configure import statements for the RxJS statics and operators that we require for our application.
	This way we can avoid importing the entirety of the VERY large set of RxjS statics and operators.
	This list of important statements should be added to whenever a new RxJS static or operator is required.

	To use import configuration, simply import this file wherever RxJS is required. This will pull in all of the
	import statements below.
*/

// Statics
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/zip';
import 'rxjs/add/observable/from';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/multicast';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/filter';
