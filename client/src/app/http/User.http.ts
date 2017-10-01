/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 23:17:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-13 11:35:21
*/

import '../utilities/rxjs-operators';

import { Injectable } 												from '@angular/core';
import { Http, Response } 											from '@angular/http';
import { Headers, RequestOptions } 									from '@angular/http';
import { Observable }     											from 'rxjs/Observable';

/*
	This class contains methods used to manage application-level users on the server. This class is NOT for users within a ValueChart. 
	Note that the observables return by the methods of this class MUST be subscribed to for those methods' http requests to be made. 
	Read more about observables here: https://github.com/Reactive-Extensions/RxJS.

	The methods in this class are used to access the endpoints defined in Users.routes.ts.
*/

@Injectable()
export class UserHttp {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private usersUrl: string = 'Users/';			// The base url of user resources on the server.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private http: Http) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param username - The username of the new user that is to be created.
		@param password - The password of the new user that is to be created.
		@param email - The email of the new user that is to be created.
		@returns {Observable<any>} - An observable of the new user that was created.
		@description 	Sends a request to the server to create a new user. the username and password parameters to this 
						method will be the login name and password of new user. This method is used for creating new user 
						accounts.
	*/
	createNewUser(username: string, password: string, email: string): Observable<any> {
		let body = JSON.stringify({ username: username, password: password, email: email });
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post(this.usersUrl, body, options)
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@param username - The username of the user whose details are to be retrieved.
		@returns {Observable<any>} - An observable of the user resource retrieved from the server.
		@description 	Sends a request to the server to retrieve an existing user's details.
						The information includes email, username, and password.
	*/
	getCurrentUser(): Observable<any> {
		return this.http.get(this.usersUrl + 'currentUser')
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@param username - The username of the user whose details are to be retrieved.
		@returns {Observable<any>} - An observable of the user resource retrieved from the server.
		@description 	Sends a request to the server to retrieve an existing user's details.
						The information includes email, username, and password.
	*/
	getUser(username: string): Observable<any> {
		return this.http.get(this.usersUrl + username)
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@param username - The username of the user whose details are to be modified.
		@param password - The new password for the user.
		@param email -  The new email for the user.
		@returns {Observable<any>} - An observable of the user resource that was modified.
		@description 	Sends a request to the server to alter an existing user's details, replacing that user's
						password and email with the method parameters.
	*/
	updateUser(username: string, password: string, email: string): Observable<any> {
		let body = JSON.stringify({ username: username, password: password, email: email });
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.put(this.usersUrl + username, body, options)
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@param username - The username for account to log into.
		@param password - The password for the account to log into.
		@returns {Observable<any>} - An observable of a login status object. The status object has the account username, password, and the field loginResult
									indicating whether login was successful or not.
		@description 	Sends a request to the server to log into the account with the given username and password. This 
						method should be used whenever a new user session should be created on the server.
	*/
	login(username: string, password: string): Observable<any> {
		let body = JSON.stringify({ username: username, password: password });
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post(this.usersUrl + 'login', body, options)
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@returns {Observable<any>} - An observable of a login status object. The status object has the account username, password, and the field logoutResult
									indicating whether logout was successful or not.
		@description 	Sends a request to the server to log the current user out. This method will destroy the current user session on the server.
						Note that this method should NOT be called if a user is not logged in.
	*/
	logout(): Observable<any> {
		return this.http.get(this.usersUrl + 'logout')
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@param username - The username of the user whose ValueCharts should be retrieved. 
		@returns {Observable<any[]>} - An observable of an array of summaries of the ValueCharts created by the given username.
		@description 	Sends a request to the server to retrieve summaries of the given user's ValueCharts. Note that this method does NOT
						return the entire ValueCharts, just summaries of them.
	*/
	getOwnedValueCharts(username: string): Observable<any[]> {
		return this.http.get(this.usersUrl + username + '/OwnedValueCharts')
			.map(this.extractData)
			.catch(this.handleError);
	}

		/*
		@param username - The username of the user whose ValueChart memberships should be retrieved. 
		@returns {Observable<any[]>} - An observable of an array of summaries of the ValueCharts that the specified user is a member of.
		@description 	Sends a request to the server to retrieve summaries of the given user's ValueChart memberships. Note that this method does NOT
						return the entire ValueCharts, just summaries of them.
	*/
	getJoinedValueCharts(username: string): Observable<any[]> {
		return this.http.get(this.usersUrl + username + '/JoinedValueCharts')
			.map(this.extractData)
			.catch(this.handleError);
	}

	// This method extracts the data from the response object and returns it as an observable.l
	extractData = (res: Response): { username: string, password: string, loginResult: boolean } => {
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