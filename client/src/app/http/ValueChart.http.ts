/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 18:27:55
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:46:12
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';
import { Http, Response } 											from '@angular/http';
import { Headers, RequestOptions } 									from '@angular/http';
import { Observable }     											from 'rxjs/Observable';
import '../utilities/rxjs-operators';

// IMport Application Classes: 
import { JsonValueChartParser }										from '../utilities';

// Import Model Classes:
import { ValueChart }												from '../../model';
import { User }														from '../../model';

// Import Types: 
import { HostMessage, MessageType, ValueChartStatus }				from '../../types';



/*
	This class contains methods used to interact with ValueChart resources stored by the server.
	It should be used anytime the client needs to retrieve, alter or delete ValueCharts, users within 
	a ValueChart, the structure of a ValueChart, or the ValueChart's status object. Note that the 
	observables return by the methods of this class MUST be subscribed to for those methods' http 
	requests to be made. Read more about observables here: https://github.com/Reactive-Extensions/RxJS.

	The methods in this class are used to access the endpoints defined in ValueChart.routes.ts
	and ValueChartUsers.routes.ts.
*/

@Injectable()
export class ValueChartHttp {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private valueChartsUrl: string = 'ValueCharts/';	// The base URL of ValueChart resources on the server.

	private valueChartParser: JsonValueChartParser;		// An instance of the JsonValueChartParser class for parsing JSON responses from the server. 

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private http: Http) {
		this.valueChartParser = new JsonValueChartParser();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param valueChart - The ValueChart to be created on the server.
		@returns {Observable<ValueChart>} - An observable of the ValueChart that was created.
		@description 	Creates a new ValueChart resource on the server. The created resource is 
						is a JSON version of the supplied ValueChart, and can be accessed using 
						the getValueChart method of this class and the new resource's id. The id can be obtained 
						from the _id field of the observable ValueChart that is returned by this method.
	*/
	createValueChart(valueChart: ValueChart): Observable<ValueChart> {
		if (!valueChart._id)
			valueChart._id = undefined;

		let body = JSON.stringify(valueChart);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post(this.valueChartsUrl, body, options)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	/*
		@param valueChart - The ValueChart on the server that is to be updated.
		@returns {Observable<ValueChart>} - An observable of the ValueChart that was updated.
		@description 	Updates an existing ValueChart resource on the server. The updated resource is is a JSON version 
						of the supplied ValueChart, and can be accessed using the getValueChart method of this class 
						and the resource's id. The id can be obtained from the _id field of the observable 
						ValueChart that is returned by this method. This method should NOT be used to create a 
						ValueChart resource for the first time. Use createValueChart for this purpose.
	*/
	updateValueChart(valueChart: ValueChart): Observable<ValueChart> {

		let body = JSON.stringify(valueChart);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.put(this.valueChartsUrl + valueChart._id, body, options)
			.map(((this.extractValueChartData)))
			.catch(this.handleError);
	}

	/*
		@param fname - The ValueChart name (formatted) whose availability is to be checked.
		@returns {Observable<boolean>} - An observable of a boolean value. If the boolean is true, the name is available; 
		@description 	Determines whether or not the give ValueChart name is available by querying the server to see
						if a ValueChart resource with that name already exists. Note that duplicate names are not permitted for ValueCharts.
	*/
	isNameAvailable(fname: string): Observable<boolean> {
		return this.http.get(this.valueChartsUrl + fname + '/id')
			.map((body) => { return !body } )
			.catch((error: any, caught: Observable<any>): Observable<boolean> => {
				return Observable.of(true);
			});
	}		

	/*
		@param chartId - The id of the ValueChart resource to be retrieved. This id is provided by the server upon creating/updating a ValueChart resource.
		@param password - The password of the ValueChart to be retrieved. The client must have the correct password to be allowed to retrieve the ValueChart.
		@returns {Observable<boolean>} - An observable of the ValueChart that was requested. 
		@description 	Queries the server to retrieve a copy of the ValueChart resource with the given id and password. This will fail
						to return the desired ValueChart if the id, and password are not correct. 
	*/
	getValueChart(chartId: string, password: string): Observable<ValueChart> {
		return this.http.get(this.valueChartsUrl + chartId + '?password=' + password)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	/*
		@param fname - The name of the ValueChart (formatted) whose structure is to be retrieved. This is NOT the id provided by the server, but rather the user assigned name.
		@param password - The password for the ValueChart whose structure is to be retrieved.
		@returns {Observable<ValueChart>} - An observable of a ValueChart object with an empty array for the users list.
		@description 	Queries the server to retrieve a copy of the ValueChart resource with the given name and password. This will fail
						to return the desired ValueChart if the name and password are not correct. 
	*/
	getValueChartByName(fname: string, password: string): Observable<ValueChart> {
		return this.http.get(this.valueChartsUrl + fname + '?password=' + password)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	/*
		@param chartId - The id of the ValueChart resource to be deleted. This id is provided by the server upon creating/updating a ValueChart resource.
		@returns {Observable<any>} - An observable of either a string if the deletion was successful, or a JSON object with an error if it was not. 
		@description 	Queries the server to delete the ValueChart resource with the given id. 
	*/
	deleteValueChart(chartId: string): Observable<any> {
		return this.http.delete(this.valueChartsUrl + chartId)
			.map(this.extractBody)
			.catch(this.handleError);
	}

	/*
		@param fname - The name of the ValueChart (formatted) whose structure is to be retrieved. This is NOT the id provided by the server, but rather the user assigned name.
		@param password - The password for the ValueChart whose structure is to be retrieved.
		@returns {Observable<ValueChart>} - An observable of a ValueChart object with an empty array for the users list.
		@description 	Queries the server to retrieve the structure of the ValueChart resource with the given name and password.
						Structure means that the retrieved ValueChart only has Objectives, and Alternatives. It has NO users.
	*/
	getValueChartStructure(fname: string, password: string): Observable<ValueChart> {
		return this.http.get(this.valueChartsUrl + fname + '/structure?password=' + password)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	/*
		@param chartId - The id of the ValueChart whose structure is to be updated. This id is provided by the server upon creating/updating a ValueChart resource.
		@param valueChart - The valueChart object whose structure will replace the resource on the server. valueChart may have users. They will be ignored by the server.
		@returns {Observable<ValueChart>} - An observable of a ValueChart object with an empty array for the users list.
		@description 	Queries the server to set the structure of the ValueChart resource with the given id and password.
	*/
	updateValueChartStructure(valueChart: ValueChart): Observable<ValueChart> {
		let body = JSON.stringify(valueChart);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.put(this.valueChartsUrl + valueChart.getFName() + '/structure', body, options)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	/*
		@param status - the new status object for the ValueChart. 
		@returns {Observable<ValueChart>} - An observable of the ValueChart status that was set.
		@description 	Sets the status of an existing ValueChart. The status controls whether or
						not users are allowed to submit preferences, if the ValueChart is considered
						complete, etc. Note that the ValueChart does not have to exist to create
						a status object, but it will not be meaningful without a corresponding ValueChart.
						This method is idempotent and can be used both to create a ValueChart status
						for the first time and to update an existing ValueChart status.
	*/
	setValueChartStatus(status: ValueChartStatus): Observable<any> {
		let body = JSON.stringify(status);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });


		return this.http.put(this.valueChartsUrl + status.chartId + '/status', body, options)
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@returns {Observable<ValueChart>} - An observable of the ValueChart status for the ValueChart 
											with the given database ID.
		@description 	Retrieves the status of the ValueChart with the given database ID.
	*/
	getValueChartStatus(chartId: string): Observable<ValueChartStatus> {
		return this.http.get(this.valueChartsUrl + chartId + '/status')
			.map(this.extractData)
			.catch(this.handleError);
	}

	/*
		@returns {Observable<ValueChart>} - An observable of a message confirming the successful deletion of the status document.
		@description 	Deletes the status of the ValueChart with the given database ID.
						Note that this method is idempotent.
	*/
	deleteValueChartStatus(chartId: string): Observable<any> {
		return this.http.delete(this.valueChartsUrl + chartId + '/status')
			.map(this.extractBody)
			.catch(this.handleError);
	}

	/*
		@param chartId - The id of the ValueChart resource to add replace the user list of. This id is provided by the server upon creating/updating a ValueChart resource.
		@returns {Observable<User[]>} - An observable of the user list that was updated.
		@description 	Replaces the user list of a ValueChart resource on the server.
	*/
	updateUsers(chartId: string, users: User[]): Observable<User[]> {

		let body = JSON.stringify(users);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.put(this.valueChartsUrl + chartId + '/users', body, options)
			.map(((this.extractUsersData)))
			.catch(this.handleError);
	}

	/*
		@param chartId - The id of the ValueChart resource that has the user to be updated. This id is provided by the server upon creating/updating a ValueChart resource.
		@param user - The user object that is going to replace the ValueChart's user resource with the same username.
		@returns {Observable<User>} - An observable of a User resource that was updated on the server. Should be identical to the user parameter.
		@description 	Updates an existing ValueChart user resource on the server. This method will create a new resource if the user
						to be updated does not exist.
	*/
	updateUser(chartId: string, user: User): Observable<User> {
		let body = JSON.stringify(user);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.put(this.valueChartsUrl + chartId + '/users/' + user.getUsername(), body, options)
			.map(this.extractUserData)
			.catch(this.handleError);
	}

	/*
		@param chartId - The id of the ValueChart resource that has the user to be deleted. This id is provided by the server upon creating/updating a ValueChart resource.
		@param username - The username of the user to be deleted.
		@returns {Observable<User>} - An observable of the User resource that was deleted from the server. 
		@description 	Deletes an existing ValueChart user resource from the server. 
	*/
	deleteUser(chartId: string, username: string): Observable<User> {
		return this.http.delete(this.valueChartsUrl + chartId + '/users/' + username)
			.map(this.extractBody)
			.catch(this.handleError);
	}

	// Helper Functions: 

	// This method returns a server response object with making any changes. It should be sued when the response is only a string.
	extractBody = (res: Response): any => {
		return res;
	}

	// This method extracts JSON data from a server response and returns it. It should be used when the response is known to be JSON.
	extractData = (res: Response): ValueChart => {
		let body = res.json();
		return body.data || {}; // Return the body of the response, or an empty object if it is undefined.
	}

	// This method extracts a ValueChart object from the server response. The ValueChart does not need to be complete.
	extractValueChartData = (res: Response): ValueChart => {
		let body = res.json();
		return this.valueChartParser.parseValueChart(body.data);
	}

	// This method extracts a user object from the server response. The user object does not need to be complete.
	extractUserData = (res: Response): User => {
		let body = res.json();
		return this.valueChartParser.parseUser(body.data);
	}

	// This method extracts a list of user objects from the server response. The user objects do not need to be complete.
	extractUsersData = (res: Response): User[] => {
		let body = res.json();
		let users = []

		for (var i = 0; i < body.data.length; i++) {
			users.push(this.valueChartParser.parseUser(body.data[i]));
		}

		return users;
	}

	// This method extracts errors from the server response.
	handleError = (error: any, caught: Observable<any>): Observable<any> => {
		let errMsg = (error.message) ? error.message :
			error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		return Observable.throw(errMsg);
	}
}