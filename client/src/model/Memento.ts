/*
* @Author: aaronpmishkin
* @Date:   2016-06-22 09:52:20
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 21:13:32
*/

/*
	This interface defines the Type Memento. Mementos are class instances that can provide copies of their internal state (often in 
	the form of an identical object with a different memory reference) via the getMemento method. Any class that needs to be able to
	provide a copy of its internal state for storage should implement this interface. 
*/

export interface Memento {

	/*
		@returns {Memento} - An identical copy of the object this method is called on.
		@description	Constructs and returns a copy of the object that this method is called on. This object MUST 
						have a new memory reference compared to the original one. This allows the original object to be 
						changed without changing the Memento. This is what makes Mementos ideal of storing state.
	*/
	getMemento(): Memento;
}