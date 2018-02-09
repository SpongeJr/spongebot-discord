// this var is local to the module
var utils = require('../lib/utils.js');
var cons = require('../lib/constants.js');
// as is this "v" object, where I'm putting the other variables
// that I want the function to use.
// why inside another object? I can then save or move around
// all the variables easily

//-----------------------------------------------------------------------------
// this whole .z object, .zlcear object, and .zstoryup object are all going to
// be accessible in the global context.
//
// You get to it via require, e.g.:
// var ific = require('ific.js'); 
// ific.js is this file
// ific is a variable that now holds the whole module.exports object below

// The actual organiation in one of these modules is up to you,
// but there's are useful patterns we're working on coming up with.7
//
// In this example, I'm keeping a story in an object v that is local
// to this whole module, not accessible to the outside, but fully
// visible to everything within. I do this so it can be accessed by
// mutliple commands in this module.
//
// If I need a value back in the global scope, I should return it

module.exports = {
	startNum: 1000,
	v: {},
	subCmd: {
		tix: {
			do: function(message) {
				utils.chSend(message, 'Too lazy to spell "tickets" out, or what?');
			}
		},
		go: {
			do: function(message) {
				utils.chSend(message, 'Super ultra raffle shtyle GO! :shtyle:');
			}
		},
		next: {
			do: function(message) {
				var when = new Date();
				when = new Date(when.valueOf() + cons.ONE_WEEK);
				utils.chSend(message, 'Next raffle is scheduled for: ' + when + ' , but' +
				  ' this is subject to bugs, unexpected circumstances, and whimsy.');
			}
		},
		test: {
			do: function(message, parms, gameStats, raf) {
				// raf is "this" from previous scope, which is global module context
				// OUR "this" refers to the "subCmd" object
				
				parms = parms.split(' ');
				if (parms[0] === '') {
					utils.chSend(message, ' Use: `!raffle drawing list` or `!raffle drawing run`');
					return;
				}
				
				else if (parms[0] === 'list') {
					
				} else if (parms[0] === 'run') {
					
				}
				
				var user;
				var nick;
				var str = '';
				var str2 = '';
				var tNum = raf.startNum;
				var tix = [];
				var numTix = {};
				var numUsers = 0;
				
				// go find all the tickets by iterating over gameStats
				for (var who in gameStats) {
					if (gameStats[who].hasOwnProperty('raffle')) {
						if (!gameStats[who].raffle.hasOwnProperty('ticketCount')) {
							debugPrint('!raffle: ' + who + ' has .raffle but no .ticketCount');
						} else {
							var tCount = parseInt(gameStats[who].raffle.ticketCount);
							if (isNaN(tCount)) {
								debugPrint('WARNING: ' + who + '.raffle.ticketCount was NaN: ' + tCount);
							} else if (tCount >= 1) {
								// only count users that have at least 1 ticket
								numUsers++;
								// push one new object onto tix[] for every ticket they have
								// user is this user, ticket is sequential from startNum
								// IOW, the tickets are "handed out in order" first
								numTix[who] = gameStats[who].raffle.ticketCount;
								for (var i = 0; i < numTix[who]; i++) {
									tix.push({"num": tNum, "user": who});
									tNum++;
								}
							}
						}
					}
				}
				
				str2 += ':tickets: :tickets: :tickets:   `RAFFLE TIME!`   :tickets: :tickets: :tickets:\n';
				str += ' I have ' + tix.length + ' tickets here in my digital bucket, numbered from `' +
				  raf.startNum + '` through `' + (raf.startNum + tix.length - 1);
				str += '`! They belong to ' + numUsers + ' users:\n```';
				
				newTix = [];
				str2 += '```\n';
				// for each user with tickets...
				for (var who in numTix) {
					
					// builds second message user sections
					str2 += '\n';
					var fixedLuser = '                    ';
					if (gameStats[who].hasOwnProperty('profile')) {
						// they have .profile...
						if (gameStats[who].profile.hasOwnProperty('nick')) {
							// they have .profile.nick, use it
							fixedLuser += gameStats[who].profile.nick;
							fixedLuser = fixedLuser.slice(-20);
							str2 += fixedLuser + ': ';
						}
					} else {
						fixedLuser += who;
						fixedLuser = fixedLuser.slice(-20);
						str2 += fixedLuser +': ';
					}
					
					// show user & number of tickets they have in parenthesis
					// use their stored nick if possible
					if (gameStats[who].hasOwnProperty('profile')) {
						// they have .profile...
						if (gameStats[who].profile.hasOwnProperty('nick')) {
							// they have .profile.nick, use it
							str += gameStats[who].profile.nick;
						} else {
							// profile but no .nick, just put an @ and their id (don't ping them)
							str += '@' + who;
						}
					} else {
						// no .profile, just put an @ and their id (don't ping them)
						str += '@' + who;
					}
					str += ' (x' + numTix[who] + ')   | '; // number of tickets in parens

					// for each ticket belonging to them...
					for (var i = 0; i < numTix[who]; i++) {
						// pick 1 random ticket from those left in original array,
						// yank it out and put in ranTick. It's an object.
						// .slice() is destructive to the original array. good.
						ranTick = tix.splice(Math.floor(Math.random() * tix.length), 1);
						ranTick = ranTick[0]; // .splice() gave us an array with 1 element
						
						// modify the "user" property to match the new owner
						ranTick.user = who;
						newTix.push(ranTick); // push it into new array
						str2 += ' [#' + ranTick.num + '] | ';
					}	
				} // end for each user w/tix
				// finally output the strings we built
				str += '```';
				utils.chSend(message, str);
				str2 += '```';
				utils.chSend(message, str2);
			}
		}
	},
	do: function(message, parms, gameStats, bankroll) {
		
		parms = parms.split(' ');
		if (parms[0] === '') {
			utils.chSend(message, 'Please see `!help raffle` for help that isn\'t there.');
			return;
		}
		
		var sub = parms[0].toLowerCase(); // sub is the possible subcommand
		parms.shift(); // lop off the command that got us here
		
		
		
		if (this.subCmd.hasOwnProperty(sub)) {
			//we've found a found sub-command, so do it...
			// our default behavior: again, lop off the subcommand,
			// then put the array back together and send up a String
			// that has lopped off the command and subcommand,
			// and otherwise left the user's input unharmed
			parms = parms.join(' ');
			utils.debugPrint('>> calling subcommand .' + sub + '.do(' + parms + ')');
			this.subCmd[sub].do(message, parms, gameStats, this);
			return;
		} else {
			utils.chSend(message, 'What are you trying to do to that raffle?!');
			return;
		}
	}
};