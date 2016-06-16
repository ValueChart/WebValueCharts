/*
* @Author: aaronpmishkin
* @Date:   2016-06-15 18:28:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-15 18:48:40
*/

import { Injectable } 												from '@angular/core';


@Injectable()
export class CurrentUserService {

	private username: string; 				// The username of the current user.

	constructor() { }

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string): void {
		this.username = username;
	}

}
