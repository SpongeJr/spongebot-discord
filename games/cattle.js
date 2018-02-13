// .js Cattle Game module for SpongeBot
// By Archcannon

//A.K.A. Bulls and Cows

// this var is local to the module
var utils = require('../lib/utils.js');
var cons = require('../lib/constants.js');
var cattleManager = require('../' + cons.DATA_DIR + cons.CATTLE_FILE);

/*	//Old definition for reference
var cattleManager = {
 	passwords: {
         playerID: 'password',
     },
     matches: {
         playerID: 'opponentID',
     },
     turns: {
         playerID: true,
     },
 }
*/
var clearCattle = function(player, opponent) {
	delete cattleManager.passwords[player];
	delete cattleManager.passwords[opponent];
	delete cattleManager.matches[player];
	delete cattleManager.matches[opponent];
	delete cattleManager.turns[player];
	delete cattleManager.turns[opponent];
}
module.exports = {
	cmdGroup: 'Fun and Games',
    do: function(message, args, gameStats, bankroll) {
		args = args.split(' ');
		if (args[0] === '') {
			utils.chSend(message, 'Try `!help cattle`');
			return;
		}
		
		var action = args[0].toLowerCase(); // sub is the possible subcommand
		args.shift(); // lop off the command that got us here
    
    
		if (this.actions.hasOwnProperty(action)) {
			//we've found a found sub-command, so do it...
			// our default behavior: again, lop off the subcommand,
			// then put the array back together and send up a String
			// that has lopped off the command and subcommand,
			// and otherwise left the user's input unharmed
			args = args.join(' ');
			utils.debugPrint('>> calling subcommand .' + action + '.do(' + args + ')');
			this.actions[action].do(message, args, gameStats, bankroll);
			return;
		} else {
			utils.chSend(message, utils.makeAuthorTag(message) + ', don\'t you dare use that language with me!');
			return;
		}
    },
	help: 'TODO',
	longHelp:	'Cattle (a.k.a. "Bulls and Cows") is a simple logic game of code-breaking between two players. '
			+	'Before the game starts, each player sets a secret four-character alphanumeric (case-insensitive) password. '
			+	'During the game, each player takes turns attempting to guess the opponent\'s password and gets a number of "Bulls" and "Cows" based the accuracy of the guess. '
			+	'Bulls indicate how many characters in the guess match characters in the password at their corresponding positions. '
			+	'Cows indicate how many characters in the guess are present in the password, but at different positions (repeating characters are each counted separately). '
			+	'First player to completely break the other\'s password wins. ' + '\n'
			+	'`!cattle info [<player>]` Shows information about the specified player' + '\n'
			+	'`!cattle password <password>` Sets your password for your next game of `!cattle`. Send this command through DM.' + '\n'
			+	'`!cattle vs <opponent>` Starts a game of `!cattle` between you and the specified player. '
			+	'Both players must not be in the middle of a game and must have a password set. '
			+	'Passwords reset after every game.' + '\n'
			+	'`!cattle guess <password>` Guess the opponent\'s password if it is your turn.' + '\n'
			+	'`!cattle quit` Quits your current game.' + '\n',
	actions: {
		info: {
			do: function(message, args, gameStats, bankroll) {
				args = args.split(' ');
				var subject = message.author.id;
				if(args[0]) {
					subject = utils.makeId(args[0]);
					if(!bankroll[subject]) {
						utils.chSend(message, utils.makeTag(message.author.id) + ', is that one of your imaginary friends?');
						return;
					}
				}
				utils.chSend(message, 'Cattle info for ' + utils.makeTag(subject));
				var password = cattleManager.passwords[subject];
				if(password) {
					utils.chSend(message, '\nPassword length: ' + password.length);
				} else {
					utils.chSend(message, '\nNo password set.');
				}
				var match = cattleManager.matches[subject];
				if(match) {
					utils.chSend(message, '\nPlaying against ' + utils.makeTag(match) + '.');
					
					if(cattleManager.turns[subject]) {
						utils.chSend(message, '\nIt is currently ' + utils.makeTag(subject) + '\'s turn.');
					} else {
						utils.chSend(message, '\nIt is currently ' + utils.makeTag(match) + '\'s turn.');
					}
				} else {
					utils.chSend(message, '\nNot currently playing.');
				}
			}
		},
		quit: {
			do: function(message, args, gameStats, bankroll) {
				var player = message.author.id;
				var opponent = cattleManager.matches[player];
				if(opponent) {
					if(cattleManager.turns[player]) {
						//Flavor text here
					}
					else if(cattleManager.turns[opponent]) {
						//Flavor text here
					}
					utils.chSend(message, utils.makeTag(player) + ', has forfeited to ' + utils.makeTag(opponent) + '!');
					clearCattle(player, opponent);
				} else {
					utils.chSend(message, utils.makeTag(player) + ', who are you quitting against?');
				}
			}
		},
        password: {
			do: function(message, args, gameStats, bankroll) {
				var player = message.author.id;
				if(cattleManager.matches[player]) {
					utils.chSend(message, utils.makeTag(player) + ', you can\'t change your password in the middle of a game!');
					return;
				}
				args = args.split(' ');
				var password = args[0] || '';
				password = password.toLowerCase();
				if(password.length !== 4) {
					utils.chSend(message, utils.makeTag(player) + ', your password must be exactly four characters long.');
					return;
				}
				if(!(/^[a-z0-9\s]+$/i.test(password))) {
					utils.chSend(message, utils.makeTag(player) + ', your password must be alphanumeric only (case insensitive)');
					return;
				}
				cattleManager.passwords[player] = password;
				utils.saveObj(cattleManager, cons.CATTLE_FILE);
				utils.chSend(message, utils.makeTag(player) + ', your password is set.');
			},
		},
        vs: {
			do: function(message, args, gameStats, bankroll) {
				var player = message.author.id;
				if(cattleManager.matches[player]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', you are in the middle of a game!');
					return;
				}
				if(!cattleManager.passwords[player]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', please set a password before starting the game.');
					return;
				}
				args = args.split(' ');
				var opponent = args[0];
				if(!opponent) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', who are you talking to?');
					return;
				}
				opponent = utils.makeId(opponent);
				//Check bankroll to see if opponent exists.
				if(!bankroll[opponent]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', is that one of your imaginary friends?');
					return;
				}
				if(cattleManager.matches[opponent]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', ' + utils.makeTag(opponent) + ' is in the middle of a game.');
				}
				if(!cattleManager.passwords[opponent]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', ' + utils.makeTag(opponent) + ' needs to set a password before starting the game.');
					return;
				}
				cattleManager.matches[player] = opponent;
				cattleManager.matches[opponent] = player;

				utils.chSend(message, 'The elite hackers known as ' + utils.makeTag(message.author.id) + ' and ' + utils.makeTag(opponent) + ' are facing off in a password cracking duel!');

				//Opponent plays first
				cattleManager.turns[opponent] = true;
				utils.saveObj(cattleManager, cons.CATTLE_FILE);
				utils.chSend(message, 'It is now ' + utils.makeTag(opponent) + '\'s turn.');
			}
		},
		guess: {
			do: function(message, args, gameStats, bankroll) {
				var player = message.author.id;
				var opponent = cattleManager.matches[player];
				if(!opponent) {
					utils.chSend(message, utils.makeTag(player) + ', you are not in a game right now.');
					return;
				}
				if(!cattleManager.turns[player]) {
					utils.chSend(message, utils.makeTag(player) + ', it is not your turn right now.');
					return;
				}
				args = args.split(' ');
				var guess = args[0] || '';
				if(guess.length !== 4) {
					utils.chSend(message, utils.makeTag(player) + ', guesses must be exactly four characters long.');
					return;
				}
				var password = cattleManager.passwords[opponent];
				var bulls = 0;
				//We assemble these during the Bull pass. They consist of letters that were not counted as Bulls.
				var cows_guess = '';
				var cows_password = '';
				//Bull pass: Count the number of Bulls in the guess
				for(var i = 0; i < 4; i++) {
					var c = guess.charAt(i);
					var c2 = password.charAt(i);
					if(c2 === c) {
						bulls++;
					} else {
						//Not a bull, so we hold onto this for when we count cows
						cows_guess += c;
						cows_password += c2;
					}
				}
				var cows = 0;
				for(var i = 0; i < cows_guess.length; i++) {
					var c = cows_guess.charAt(i);
					if(cows_password.indexOf(c) !== -1) {
						cows++;
						//Replace an occurrence of the character so we don't count it again
						cows_password = cows_password.replace(c, '');
					}
				}
				if(bulls === 4) {
					utils.chSend(message, utils.makeTag(player) + ' has cracked the password of ' + utils.makeTag(opponent) + ' and won the game!\n');
					utils.chSend(message, utils.makeTag(player) + '\'s password: ' + cattleManager.passwords[player]);
					utils.chSend(message, utils.makeTag(opponent) + '\'s password: ' + cattleManager.passwords[opponent]);
					clearCattle(player, opponent);
					return;
				}
				utils.chSend(message, utils.makeTag(player) + ',\n' + 'Bulls: ' + bulls + '\n' + 'Cows: ' + cows);
				utils.chSend(message, 'It is now ' + utils.makeTag(opponent) + '\'s turn.');

				//Switch turns
				delete cattleManager.turns[player];
				cattleManager.turns[opponent] = true;
				utils.saveObj(cattleManager, cons.CATTLE_FILE);
			}
		}
	},
	
};
