/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:35
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 16:59:51
*/

import { WeightMap } 			from './WeightMap';
import { ScoreFunctionMap }		from './ScoreFunctionMap';
import * as Formatter			from '../app/utilities/Formatter';

import * as _ 					from 'lodash'
/*
	This class is used to represent a single user's decision preferences for a ValueChart. It uses a instance of the WeighMap class to store 
	a user's weight assignments to objectives, and it uses an instance of the ScoreFunctionMap class to store users ScoreFunctions for objectives.
	This class does NOT represent a user of the entire application; it ONLY represents a user in the context of a ValueChart. With that said, the
	username field should always be set to the name of the user who created the preferences represented by a User instance.
*/

export class User {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private id: string;
	private username: string;						// These username of the user who created the preferences.
	public color: string = "#000000";				// The color assigned to the user's preferences in a ValueChart.

	private weightMap: WeightMap;					// The WeightMap object used to map the user's weight assignments to the proper objectives.
	private scoreFunctionMap: ScoreFunctionMap;		// The ScoreFunctionmap object usd to map the user's ScoreFunctions to the proper objectives.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@param username - The name of the user who created the preferences. This parameter is optional.
		@returns {void}	
		@description	Constructs a new User. This constructor only initializes the username field of the User.
						The WeightMap and ScoreFunctionMap fields must be set manually after creation.
	*/
	constructor(username?: string) {
		// Set the username to be an empty string if no parameter was provided.
		if (username !== undefined) {		
			this.username = username;
		} else {
			this.username = "";
		}

		this.id = _.uniqueId(Formatter.nameToID(this.username) + '_');
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	getId(): string {
		return this.id;
	}

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string): void {
		this.username = username;
	}

	getScoreFunctionMap(): ScoreFunctionMap {
		return this.scoreFunctionMap;
	}

	setScoreFunctionMap(scoreFunctionMap: ScoreFunctionMap): void {
		this.scoreFunctionMap = scoreFunctionMap;
	}

	getWeightMap(): WeightMap {
		return this.weightMap;
	}

	setWeightMap(weightMap: WeightMap): void {
		this.weightMap = weightMap;
	}
}