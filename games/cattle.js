// .js Cattle Game module for SpongeBot
// By Archcannon

//A.K.A. Bulls and Cows

// this var is local to the module
var utils = require('../lib/utils.js');

module.exports = {
    passwords: {
        playerID: 'password',
    },
    matches: {
        playerID: 'opponentID',
    },
    turns: {
        playerID: true,
    },
    actions: {
        password: {
			do: function(message, args, gameStats, bankroll) {
				var player = message.author.id;
				if(this.games[player]) {
					utils.chSend(message, utils.makeAuthorTag(player) + ', you can\'t change your password in the middle of a game!');
					return;
				}
				args = args.split(' ');
				var password = args[0] || '';
				password = password.toLowerCase();
				if(password.length !== 4) {
					utils.chSend(message, utils.makeAuthorTag(player) + ', your password must be exactly four characters long.');
					return;
				}
				if(!(/^[a-z0-9\s]+$/i.test(answer))) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', your password must be alphanumeric only (case insensitive)');
					return;
				}
				this.passwords[player] = password;
				utils.chSend(message, utils.makeTag(message.author.id) + ', your password has been reset.');
			},
		},
        vs: {
			do: function(message, args, gameStats, bankroll) {
				var player = message.author.id;
				if(this.matches[player]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', you are in the middle of a game!');
					return;
				}
				if(!this.passwords[player]) {
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
				if(this.matches[opponent]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', ' + utils.makeTag(opponent) + ' is in the middle of a game.');
				}
				if(!this.passwords[opponent]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', ' + utils.makeTag(opponent) + ' needs to set a password before starting the game.');
					return;
				}
				this.matches[player] = opponent;
				this.matches[opponent] = player;

				utils.chSend(message, 'The elite hackers known as ' + utils.makeTag(message.author.id) + ' and ' + utils.makeTag(opponent) + ' are facing off in a password cracking duel!');

				//Opponent plays first
				this.turns[opponent] = true;
				utils.chSend(message, 'It is now ' + utils.makeTag(opponent) + '\'s turn.');
			}
		},
		guess: {
			do: function(message, args, gameStats, bankroll) {
				var player = message.author.id;
				var opponent = this.matches[player];
				if(!opponent) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', you are not in a game right now.');
					return;
				}
				if(!this.turns[player]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', you are not in a game right now.');
					return;
				}
				var guess = args[0] || '';
				if(guess.length !== 4) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', guesses must be exactly four characters long.');
					return;
				}
				var password = this.passwords[opponent];
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
					utils.chSend(message, utils.makeTag(message.author.id) + ' has cracked the password of ' + utils.makeTag(opponent) + ' and won the game!');
					delete this.passwords[player];
					delete this.passwords[opponent];
					delete this.matches[player];
					delete this.matches[opponent];
					delete this.turns[player];
					return;
				}
				utils.chSend(message, utils.makeTag(message.author.id) + ',\n' + 'Bulls: ' + bulls + '\n' + 'Cows: ' + cows);
				utils.chSend(message, 'It is now ' + utils.makeTag(opponent) + '\'s turn.');

				//Switch turns
				delete this.turns[player];
				this.turns[opponent] = true;
			}
		}
	},
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
    }
};
