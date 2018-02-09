var utils = require('../lib/utils.js');
var v = {};


// 	!quote
//	!quote 	random	 		displays a random quote from the whole database, all users
//	!quote	random	<user>	random quote from that user
//  !quote	add		<user>	add last thing the user said to quotes
//	!quote	undo			undoes last quote that YOU added
//	!quote	count			total of all quotes
//	!quote	count	<user>	total of all of <user>'s quotes


module.exports = {
	q: {
		subCmd: {
			random: {
				do: function() {
					console.log('Picked RANDOM!');
				}
			},
			add: {
				do: function() {
					console.log('Picked add!');
				}
			},
			undo: {
				do: function() {
					console.log('Picked undo!');
				}
			},
			count: {
				do: function() {
					console.log('Picked count ha ha haaa!');
				}
			}
		},
		do: function(message, parms) {
			
			console.log('q');
			
			parms = parms.split(' ');		
			if (parms[0] === '') {
				utils.chSend(message, 'A stich in times saves nine.');
				return;
			}
			parms[0] = parms[0].toLowerCase();
		
			if (this.subCmd.hasOwnProperty(parms[0])) {
				//we've found a found sub-command, so do it...
				this.subCmd[parms[0]].do(message);
			} else {
				utils.chSend(message, 'What are you trying to do to that quote?!');
			}
		}
	}
};