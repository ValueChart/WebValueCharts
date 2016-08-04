/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 23:17:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-04 16:53:20
*/

import '../../rxjs-operators';

import { Injectable } 												from '@angular/core';
import { Http, Response } 											from '@angular/http';
import { Headers, RequestOptions } 									from '@angular/http';
import { Observable }     											from 'rxjs/Observable';

@Injectable()
export class UserHttpService {

	private usersUrl: string = 'Users/';

	constructor(private http: Http) { }

	createNewUser(username: string, password: string, email: string): Observable<any> {
		let body = JSON.stringify({ username: username, password: password, email: email });
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post(this.usersUrl, body, options)
			.map(this.extractData)
			.catch(this.handleError);
	}

	login(username: string, password: string): Observable<any> {
		let body = JSON.stringify({ username: username, password: password });
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post(this.usersUrl + 'login', body, options)
			.map(this.extractData)
			.catch(this.handleError);
	}

	logout(): Observable<any> {
		return this.http.get(this.usersUrl + 'logout')
			.map(this.extractData)
			.catch(this.handleError);
	}

	getUserValueCharts(username: string): Observable<any[]> {
		return this.http.get(this.usersUrl + username + '/ValueCharts')
			.map(this.extractData)
			.catch(this.handleError);
	}

		// This method extracts the data from the response object and returns it as an observable.l
	extractData = (res: Response): {username: string, password: string, loginResult: boolean } => {
		let body = res.json();
		return body.data || {}; // Return the body of the response, or an empty object if it is undefined.
	}

		// This method handles any errors from the request.
	handleError = (error: any, caught: Observable<any>): Observable<any> => {
		let errMsg = (error.message) ? error.message :
			error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		return Observable.throw(errMsg);
	}

}