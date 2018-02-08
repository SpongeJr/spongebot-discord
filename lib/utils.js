/*  UTILS.JS 
		- Functions for working with stats and banks
			(saveStats, loadStats, alterStat, checkStat, & helper functions
			loadBanks, saveBanks, & helper functions
		- chSend and auSend for sending messages to message.channel or message.author
		- general purpose utility functions like makeTag, makeId, listPick() and bigLet()
*/

const cons = require('./constants.js');
const FS = require('fs');

module.exports = {
	debugMode: true,
	enableDebugChan: true,
	autoEmbed: false,
	parseBankfile: function(inp) {
		// was originally for CSV banks, deprecated!
		/*
		inp = inp.split(',');
	
		var outp = {};
		for (var i = 0; i < inp.length; i = i + 2) {
			outp[inp[i]] = parseInt(inp[i + 1]);
			console.log (' ID: ' + inp[i] + '    BANK: ' + inp[i + 1]);
		}
		return outp;
		*/
	},
	makeBankFile: function(bankdata) {
		var theFile = '';
		for (who in bankdata) {
			theFile += who + ',' + bankdata[who] + ','
		}
		theFile = theFile.slice(0, -1); // remove trailing comma
		return theFile;
	},
	loadBanks: function(botStorage, bankroll) {
		
		// needs researched!
		/*
		var readStream = FS.createReadStream(cons.BANK_FILENAME);
		utils = this;
		readStream.on('readable', function() {
			var chunk;
			while (null !== (chunk = readStream.read())) {	
				botStorage.bankloaddata = '';
				for (var i = 0; i < chunk.length; i++) {
					botStorage.bankloaddata += String.fromCharCode(chunk[i]);
				};
				utils.debugPrint('  !loadBanks: Data chunk loaded.');
			}
		}).on('end', function() {
			utils.bankroll = utils.parseBankfile(botStorage.bankloaddata);
			console.log(' utils.bankroll --------> ');
			console.log(utils.bankroll);
			//BOT.channels.get(SPAMCHAN_ID).send('Bankrolls loaded!');
		});
		*/
	},
	saveBanks: function(filename, bankroll) {	
	
	
		
		if (!filename) {
			filename = cons.BANK_FILENAME;
		}
		
		/* OLD CSV VERSION
		var writeStream = FS.createWriteStream(filename, {autoClose: true});
		writeStream.write(this.makeBankFile(bankroll));
		var utils = this;
		writeStream.end(function() {
			utils.debugPrint(' Banks saved to: ' + filename);
		});
		*/
		
		var writeStream = FS.createWriteStream(filename, {autoClose: true});
		var theBankString = (JSON.stringify(bankroll));
		writeStream.write(theBankString);
		var utils = this;
		writeStream.end(function() {
			utils.debugPrint(' Banks saved to: ' + filename);
		});		
	},
	addBank: function(who, amt, bankroll) {
		
		// WARNING: addBank now more dangeous, without this check
		// put back somewhere someday, or check before sending data up!
		/*
		if (!BOT.users.get(who)) {
			utils.debugPrint('addBank: nonexistent user: ' + who);
			return false;
		}
		*/
		
		if (!bankroll.hasOwnProperty(who)) {
			bankroll[who].credits = cons.START_BANK;
			utils.debugPrint('addBank: New bankroll made for ' + who);
		}
		
		bankroll[who].credits += parseInt(amt);
		this.saveBanks(cons.BANK_FILENAME, bankroll);
		return bankroll[who].credits;
	},
	makeStatFile: function(inp) {
		var theFile = JSON.stringify(inp);
		return theFile;
	},
	parseStatFile: function(botStorage) {
		var outp = JSON.parse(botStorage.statloaddata);
		this.debugPrint(outp);
		return outp;
	},
	loadStats: function(gameStats, botStorage) {
		var readStream = FS.createReadStream(cons.STATS_FILENAME);
		readStream.on('readable', function() {
			var chunk;
			while (null !== (chunk = readStream.read())) {
				botStorage.statloaddata = '';
				for (var i = 0; i < chunk.length; i++) {
					botStorage.statloaddata += String.fromCharCode(chunk[i]);
				};
				this.debugPrint('  !loadStats: Data chunk loaded.');
			}
		}).on('end', function(gameStats) {
			gameStats = parseStatFile(botStorage);
			//BOT.channels.get(SPAMCHAN_ID).send('Bankrolls loaded!');
		});
	},
	saveStats: function(filename, gameStats) {
		if (!filename) {
			filename = cons.STATS_FILENAME;
		}
		
		var writeStream = FS.createWriteStream(filename, {autoClose: true});
		writeStream.write(this.makeStatFile(gameStats));
		var utils = this;
		writeStream.end(function() {
			utils.debugPrint(' Game stats saved to: ' + filename);
		});
	},
	getStat: function(who, game, stat, gameStats) {
		// returns if something does not exist, otherwise...
		// if stat is unspecified, returns all of gameStats[who][stat] object
		// if game unspecified returns all of gameStats[who] object
		// otherwise, returns the stat as stored on gameStats
		
		who = this.makeId(who);
		this.debugPrint(who);
		
		if (!gameStats.hasOwnProperty(who)) {
			return; // user doesn't exist
		} else {
			
			// no game sent up, return whole player object
			if (typeof game === 'undefined') {
				return gameStats[who];
			}
			
			// no stat sent up, return game object
			if (typeof stat === 'undefined') { 
				if (!gameStats[who].hasOwnProperty(game)) {
					return; // game doesn't exist
				} else {
					return gameStats[who][game];
				}
			}	
			
			// return stat if possible
			if (!gameStats[who].hasOwnProperty(game)) {
				return; // game doesn't exist
			} else {
				if (!gameStats[who][game].hasOwnProperty(stat)) {
					return; // game exists, stat doesn't
				} else {
					return gameStats[who][game][stat];
				}
			}	
		}
	},
	setStat: function(who, game, stat, val, gameStats) {
		// Sets an game stat. Returns: the stat's new value
		// Does not check validity of who, game, or stat, and will make a new
		// Object key (who), game, or stat as needed if it doesn't exist.
		// If stat didn't exist, sets this new stat to 0;
		// Also does no validation on amount parameter, call with care.
		// You can pass anything in really, and it should be fine.
		// Use objects to keep groups of stats together, etc.
		
		if (!gameStats[who]) {
			gameStats[who] = {};
		}
		
		if (!gameStats[who][game]) {
			gameStats[who][game] = {};
		}
		
		if (!gameStats[who][game].hasOwnProperty(stat)) {
			gameStats[who][game][stat] = 0;
			this.debugPrint('!setStat: Made a new ' + game + ' stat for ' + who);
		}
		
		gameStats[who][game][stat] = val;
		this.saveStats(cons.STATS_FILENAME, gameStats);
		return gameStats[who][game][stat];
	},
	alterStat: function(who, game, stat, amt, gameStats) {
		// Alters an integer stat. Returns: the stat's new value
		// Does not check validity of who, game, or stat, and will make a new
		// Object key (who), game, or stat as needed if it doesn't exist.
		// If stat didn't exist, sets this new stat to 0;
		// Also does no validation on amount parameter, call with care.
		// Calls parseInt() on amount parameter.
		
		if (!gameStats[who]) {
			gameStats[who] = {};
		}
		
		if (!gameStats[who][game]) {
			gameStats[who][game] = {};
		}
		
		if (!gameStats[who][game].hasOwnProperty(stat)) {
			gameStats[who][game][stat] = 0;
			this.debugPrint('!alterStat: Made a new ' + game + ' stat for ' + who);
		}
		
		gameStats[who][game][stat] = parseInt(gameStats[who][game][stat]) + parseInt(amt);
		this.saveStats(cons.STATS_FILENAME, gameStats);
		return gameStats[who][game][stat];
	},
	chSend: function(message, str, emb) {

		// temporary stuff
		
		if (typeof message === 'undefined') {
			this.debugPrint('chSend: message is undefined!');
			return
		}
		
		if (!message.hasOwnProperty('author')) {
			this.debugPrint('chSend: No .author property on message!');
			return;
		}
		
		if (!message.author.hasOwnProperty('bot')) {
			this.debugPrint('chSend: no .bot property on message.author!');
			return;
		}
		
		if (message.author.bot) {
			this.debugPrint(' -- Blocked a bot-to-bot m.channel.send');
			return;
		}
		if (this.autoEmbed) {
		// turn all chSend() messages into emebed, if autoEmbed is on
			if (typeof emb === 'undefined') {
				emb = {"description": str}
			}
		}
	
		if (typeof emb !== 'undefined') {
			// we have an embed, so use it
			message.channel.send({embed: emb}).catch(reason => {
				this.debugPrint('Error sending a channel message: ' + reason);
			});
		} else {	
			// no embed, send standard message
			message.channel.send(str).catch(reason => {
				this.debugPrint('Error sending a channel message: ' + reason);
			});
		}
	},
	auSend: function(message, str) {
		if (message.author.bot) {
			debugPrint(' -- Blocked a bot-to-bot m.author.send');
			return;
		}
		
		message.author.send(str).catch(reason => {
			debugPrint('Error sending a DM: ' + reason);
		});
	},
	makeBackups: function(backroll, gameStats) {
		// call me to write out backup copies of the banks.csv and stats.JSON
		// currently has never been invoked from anywhere, careful!
		this.saveBanks(cons.BANK_BACKUP_FILENAME, bankroll);
		this.saveStats(cons.STATS_BACKUP_FILENAME, gameStats);
	},
	debugPrint: function(inpString){
	// throw away that old console.log and try our brand new debugPrint!
	// can add all sorts of goodies here, like sending output to a Discord chan or DN
	// for now, just checks if the global debugMode is true. If it isn't,
	// doesn't output, just returns
		if (this.debugMode) {
			console.log(inpString);
			if (this.enableDebugChan) {
				if ((inpString !== '') && (typeof inpString === 'string')) {
					// todo: rate limiter?
					if (inpString.length < 1024) { 
						//BOT.channels.get(DEBUGCHAN_ID).send(inpString);
					}
				}
			}
		}
	},
	makeAuthorTag(message) {
		return utils.makeTag(message.author.id);
	},
	makeId: function(inp) {
		// strips out the first <@! and > in a string
		// if you send it a string that is alread legit id, it won't be harmed
		// if not passed a String, sends the input back
		// should always return a String
		if (typeof(inp) !== 'string') {return inp};
		var outp = inp.replace('<', '').replace('>', '').replace('!', '').replace('@', '');
		return outp;
	},
	makeTag: function(inp) {
		// wraps a string in <@>
		var outp = '<@' + inp + '>';
		return outp;
	},
	bigLet: function(inp) {
		var outp = '';
		var ch = '';
		for (var i = 0; i < inp.length; i++) {
			ch = inp.charAt(i);
			
			if (ch === ' ') {
				//TODO: figure out how to do the blank tile emoji
				//outp += '<:blank:410757195836293120>';
				outp += '____ ' ;
			} else {
				ch = ch.toLowerCase();
				outp += ':regional_indicator_' + ch + ': ';
			}
		}	
		return outp;
	},
	listPick: function(theList) {
		// expects Array, returns a random element destructively pulled from it
		var choice = Math.random() * theList.length;
		return theList.splice(choice, 1);
	},
};
