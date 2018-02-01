/* Copyright 2018 Josh Kline ("SpongeJr")

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files
(the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

const Discord = require('discord.js');
const CONFIG = require('./config.json');
const MYPALS = require('./mypals.json');
const SCRAMWORDS = require('./data/scramwords.json');
const BOT = new Discord.Client();

const FS = require('fs');
const TESTFILENAME = 'testfile.dat';
const BANK_FILENAME = 'data/banks.csv';
const STATS_FILENAME = 'data/gamestats.json';

// note: make sure SCRAM_DELAY - SCRAM_DELAY_VARIATION > SCRAM_GUESSTIME
const SCRAM_DELAY = 300300;
const SCRAM_DELAY_VARIATION = 42000;
const SCRAM_AWARD = 300;
const SCRAM_GUESSTIME = 29000;
const SCRAM_EXTRA_TIME = 3000; // per letter

const SPONGE_ID = "167711491078750208";
const MAINCHAN_ID = "402126095056633863";
const SPAMCHAN_ID = "402591405920223244";
const SERVER_ID = "402126095056633859";
const START_BANK = 10000;
const VERSION_STRING = '0.92';
const SPONGEBOT_INFO = 'SpongeBot (c) 2018 by Josh Kline, released under MIT license' +
  '\n Bot source code (not necessarily up-to-date) ' +
  'can possibly be found at: http://www.spongejr.com/spongebot/spongebot.js' +
  '\nMade using: `discord.js` https://discord.js.org and `node.js` https://nodejs.org';
//-----------------------------------------------------------------------------
var spongeBot = {};
//-----------------------------------------------------------------------------
var acro = {
	runState: false,
	timer: {},
	letters: '',
	freq: 'aaaaabbbbbbccccccddddddeeeeeeffffffgggggghhhhhhiiiiijjkllllllmmmmmmnnnnnnoooopppppqqrrrrrrssssssttttttuuuuvvvvwwwwyyyz',
	pickLetters: function(count) {
		var letters = '';
		for (var i = 0; i < count; i++) {
			letters += acro.freq.charAt(
			  Math.floor(Math.random() * acro.freq.length));
		}
		// set and return
		acro.letters = letters;
		return letters;
	},
	entries: {},
	players: {},
	votes: {},
	config: {
		voteOwn: false,
		minPlayersForCredits: 3,
		winCredits: 3500,
		categories: true
	},
	categories: [
		'food and drink', 'animals', 'people', 'places', 'games and sports',
		'movies and television', 'news and current events',	'occupations',
		'technology and science', 'memes and fads', 'fantasy', 'general/any'
	]
};
//-----------------------------------------------------------------------------
var scram = {
	ready: true,
	announce: true,
	runState: 'ready'
};
//-----------------------------------------------------------------------------
var botStorage = {};
var bankroll = {};
var gameStats = {};
//-----------------------------------------------------------------------------
var makeStatFile = function() {
	var theFile = JSON.stringify(gameStats);
	return theFile;
};
//-----------------------------------------------------------------------------
var parseStatFile = function() {
	var outp = JSON.parse(botStorage.statloaddata);
	console.log(outp);
	return outp;
};
//-----------------------------------------------------------------------------
var loadStats = function() {
	var readStream = FS.createReadStream(STATS_FILENAME);
	readStream
		.on('readable', function() {
			var chunk;
			while (null !== (chunk = readStream.read())) {
				botStorage.statloaddata = '';
				for (var i = 0; i < chunk.length; i++) {
					botStorage.statloaddata += String.fromCharCode(chunk[i]);
				};
				console.log('  !loadStats: Data chunk loaded.');
			}
		})
		.on('end', function() {
			gameStats = parseStatFile();
			//BOT.channels.get(SPAMCHAN_ID).send('Bankrolls loaded!');
		});	
};
//-----------------------------------------------------------------------------
var saveStats = function() {
	var writeStream = FS.createWriteStream(STATS_FILENAME, {autoClose: true});
	writeStream.write(makeStatFile(gameStats));
	writeStream.end(function() {
		console.log(' Game stats saved.');
	});
};
//-----------------------------------------------------------------------------
var incStat = function(who, game, stat) {
	// Increments an integer stat. Returns: the new, incremented value
	// Does not check validity of who, game, or stat, and will make a new
	// Object key (who), game, or stat as needed if it doesn't exist.
	
	if (!gameStats[who]) {
		gameStats[who] = {};
	}
	
	if (!gameStats[who][game]) {
		gameStats[who][game] = {};
	}
	
	if (!gameStats[who][game].hasOwnProperty(stat)) {
		gameStats[who][game][stat] = 0;
		console.log('!incStat: Made a new ' + game + ' stat for ' + who);
	}
	
	gameStats[who][game][stat]++;
	saveStats();
	return gameStats[who][game][stat];
};
//-----------------------------------------------------------------------------
var alterStat = function(who, game, stat, amt) {
	// Increments an integer stat. Returns: the stat's new value
	// Does not check validity of who, game, or stat, and will make a new
	// Object key (who), game, or stat as needed if it doesn't exist.
	// Also does no validation on amount parameter, call with care.
	
	if (!gameStats[who]) {
		gameStats[who] = {};
	}
	
	if (!gameStats[who][game]) {
		gameStats[who][game] = {};
	}
	
	if (!gameStats[who][game].hasOwnProperty(stat)) {
		gameStats[who][game][stat] = 0;
		console.log('!alterStat: Made a new ' + game + ' stat for ' + who);
	}
	
	gameStats[who][game][stat] += amt;
	saveStats();
	return gameStats[who][game][stat];
};
//-----------------------------------------------------------------------------
var parseBankfile = function(inp) {
	inp = inp.split(',');
	
	var outp = {};
	for (var i = 0; i < inp.length; i = i + 2) {
		outp[inp[i]] = parseInt(inp[i + 1]);
		console.log (' ID: ' + inp[i] + '    BANK: ' + inp[i + 1]);
	}
	return outp;
};
//-----------------------------------------------------------------------------
var loadBanks = function() {
	var readStream = FS.createReadStream(BANK_FILENAME);
	readStream
		.on('readable', function() {
			var chunk;
			while (null !== (chunk = readStream.read())) {
				
				botStorage.bankloaddata = '';
				for (var i = 0; i < chunk.length; i++) {
					botStorage.bankloaddata += String.fromCharCode(chunk[i]);
				};
				console.log('  !loadBanks: Data chunk loaded.');
			}
		})
		.on('end', function() {
			bankroll = parseBankfile(botStorage.bankloaddata);
			//BOT.channels.get(SPAMCHAN_ID).send('Bankrolls loaded!');
		});
};
//-----------------------------------------------------------------------------
var saveBanks = function() {
	var writeStream = FS.createWriteStream(BANK_FILENAME, {autoClose: true});
	writeStream.write(makeBankFile(bankroll));
	writeStream.end(function() {
		console.log(' Banks saved.');
	});
};
//-----------------------------------------------------------------------------
var addBank = function(who, amt) {
	
	if (!BOT.users.get(who)) {
		console.log('addBank: nonexistent user: ' + who);
		return false;
	}
	
	if (!bankroll.hasOwnProperty(who)) {
		bankroll[who] = START_BANK;
		console.log('addBank: New bankroll made for ' + who);
	}
	
	bankroll[who] += parseInt(amt);
	saveBanks();
	return true;
};
//-----------------------------------------------------------------------------
var makeBankFile = function(bankdata) {
	var theFile = '';
	for (who in bankdata) {
		theFile += who + ',' + bankdata[who] + ','
	}
	theFile = theFile.slice(0, -1); // remove trailing comma
	return theFile;
};
//-----------------------------------------------------------------------------
var giveaways = {
	'Shelter': {
		info: {
			description: 'Shelter (game) gift on Steam.',
			infoUrl: 'http://store.steampowered.com/app/244710/Shelter/'
		},
		enabled: true,
		type: 'game'
	},
	'Shelter 2': {
		info: {
			description: 'Shelter 2 (game) gift on Steam.',
			infoUrl: 'http://store.steampowered.com/app/275100/Shelter_2/'
		},
		enabled: true,
		type: 'game'
	},
	'DiRT Showdown': {
		info: {
			description: 'DiRT Showdown (game) gift on Steam.',
			infoUrl: 'https://en.wikipedia.org/wiki/Dirt:_Showdown'
		},
		enabled: true,
		type: 'game'
	},
	'Splatter': {
		info: {
			description: 'Splatter: Blood red edition (game) gift on Steam.',
			infoUrl: 'http://store.steampowered.com/app/281920/Splatter__Zombie_Apocalypse/'
		},
		enabled: true,
		type: 'game'
	},
	'YAZD': {
		info: {
			description: 'Yet Another Zombie Defense (game) gift on Steam.',
			infoUrl: 'http://store.steampowered.com/app/270550/Yet_Another_Zombie_Defense/'
		},
		enabled: true,
		type: 'game'
	},
	'MusicMaker80s': {
		info: {
			description: 'Music Maker 80s edition + add-on(s)(?) by Magix',
			infoUrl: 'http://www.magix.com/us/music-maker/80s-edition/'
		},
		enabled: true,
		type: 'software'
	},
	'MusicMakerHipHop': {
		info: {
			description: 'Music Maker Hip Hop Beat Producer by Magix',
			infoUrl: 'http://www.magix.com/us/music-maker/hip-hop-beat-producer-edition/ (I think?)'
		},
		enabled: true,
		type: 'software'
	},
	'TwitchSub': {
		info: {
			description: 'Will subscribe to your Twitch channel if you are a Twitch partner. Will legit check your content regularly and stuff.',
			infoUrl: 'http://www.twitch.tv'
		}
	},
	'Amazon3': {
		info: {
			description: '$3.00 USD Amazon gift code.',
			infoUrl: 'https://www.amazon.com/gc/redeem/'
		}
	}
};
//-----------------------------------------------------------------------------
var listPick = function(theList) {
	var choice = Math.random() * theList.length;
	return theList.splice(choice, 1);
};
//-----------------------------------------------------------------------------
var makeId = function(inp) {
	// strips out the first <@! and > in a string
	if (typeof(inp) !== 'string') {return inp};
	var outp = inp.replace('<', '').replace('>', '').replace('!', '').replace('@', '');
	return outp;
};
//-----------------------------------------------------------------------------
var makeTag = function(inp) {
	// wraps a string in <@>
	var outp = '<@' + inp + '>';
	return outp;
};
//-----------------------------------------------------------------------------
var slots = {
	config: {
		symbols: {
			kiwi: {emo: ':kiwifruit:', rarity: 1},
			peng: {emo: ':penguin:', rarity: 3},
			dolr: {emo: ':dollar:', rarity: 4},
			sevn: {emo: ':seven:', rarity: 6},
			mush: {emo: ':mushroom:', rarity: 9},
			cher: {emo: ':cherries:', rarity: 12},
			tato: {emo: ':potato:', rarity: 11},
		},
		payTable: [
			{payout: 3200, pattern: ['kiwi', 'kiwi', 'kiwi']},
			{payout: 160, pattern: ['kiwi', 'kiwi', 'any']},
			{payout: 108, pattern: ['peng', 'peng', 'peng']},
			{payout: 32, pattern: ['peng', 'peng', 'any']},
			{payout: 21, pattern: ['dolr', 'dolr', 'dolr']},
			{payout: 16, pattern: ['dolr', 'dolr', 'any']},
			{payout: 11, pattern: ['sevn', 'sevn', 'sevn']},
			{payout: 6, pattern: ['cher', 'cher', 'cher']},
			{payout: 3.5, pattern: ['cher', 'cher', 'any']},
			{payout: 3, pattern: ['mush', 'mush', 'mush']},
			{payout: 2, pattern: ['mush', 'mush', 'any']},
			{payout: 1.5, pattern: ['tato', 'tato', 'tato']},
			{payout: 1, pattern: ['mush', 'any', 'any']},
		],
		configName: "@EFHIII\'s numbers v1 - Sponge\'s loose version"
	}
};
//-----------------------------------------------------------------------------
var scrambler = function(inputWord) {
	var wordArray = inputWord.split("");
	var newWord = '';

	var letter = 0;
	while (wordArray.length > 0 ) {
		newWord += wordArray.splice(Math.random() * wordArray.length, 1);
		letter++;
	}
	return newWord;
};
//-----------------------------------------------------------------------------
var sammichMaker = function() {

	var ingredients = "banana,honey mustard,marmalade,flax seed,roast beef,potato chip,chocolate sauce,ketchup,relish,alfalfa,M&Ms,skittles,skittles (Tropical flavor),marshmallow,potato salad,egg salad,turnip,mango,spinach,kale,crushed doritos,pulled pork,porcupine,mango,artichoke,apple slice,pineapple,cabbage,rambutan,papaya,durian,bologna,kielbasa,peanut butter,canned fruit,vanilla bean,coffee bean,harvard beet,avocado,bacon,mashed potatoes,frozen peas,anchovy,lettuce,mushroom,guava,tomato,oatmeal,eggplant"
ingredients = ingredients.split(",");
	var toppings = "bing cherries,whipped cream,chocolate syrup,mayonnaise,oregano,paprika,butter,cooking spray,marshmallow creme,green smoothie,salt and pepper,sea salt,MSG,melted cheese,pine needles,cough syrup,gravy,salsa,sauerkraut,sprinkles,turbinado sugar,maple syrup,apple butter,guacamole,Peet's coffee,applesauce,bacon bits,olive oil,shaved ice,powdered milk,molasses,tomato sauce,barbecue sauce,horseradish";
toppings = toppings.split(",");
	var sammich = "";
	var numIngredients = Math.random() * 3 + 1;

	for (var i = 0; i < numIngredients - 1; i++) {
		sammich = sammich + listPick(ingredients) + ", ";
	}

	sammich += "and " + listPick(ingredients);

	if (Math.random() < 0.65) {
		sammich += " sandwich "
	} else {
		sammich += " smoothie "
	}

	sammich += "topped with " + listPick(toppings);

	return sammich;
}
//-----------------------------------------------------------------------------
var chSend = function(message, str) {
	
	if (message.author.bot) {
		console.log(' -- Blocked a bot-to-bot m.channel.send');
		return;
	}
	
	message.channel.send(str).catch(reason => {
		console.log('Error sending a channel message: ' + reason);
	});
};
//-----------------------------------------------------------------------------
var bigLetter = function(inp) {
	var outp = '';
	var ch = '';
	for (var i = 0; i < inp.length; i++) {
		ch = inp.charAt(i);
		ch = ch.toLowerCase();
		outp += ':regional_indicator_' + ch + ': ';
	}	
	return outp;
};
//-----------------------------------------------------------------------------
spongeBot.roll = {
	cmdGroup: 'Fun and Games',
	do: function (message, parms){
		
		if (!parms) {
			chSend(message, 'See `!help roll` for help.');
			return;
		}
		
		parms = parms.split('d');
		var x = parms[0];
		var y = parms[1];
		
		if (x && y) {
			x = parseInt(x);
			y = parseInt(y);
			
			if (x > 20) {
				chSend(message, '`!roll`: No more than 20 dice please.');
				return;
			}
			
			if (x < 1) {
				chSend(message, '`!roll`: Must roll at least one die.');
				return;
			}
			
			if (y < 2) {
				chSend(message, '`!roll`: Dice must have at least 2 sides.');
				return;
			}
			
			if (y > 10000) {
				chSend(message, '`!roll`: Max sides allowed is 10000.');
				return;
			}
			
			var str = ':game_die: Rolling ' + x + 'd' + y + ' for ';
			str += message.author + ':\n`';
			
			var total = 0;
			//var dice = [];
			var roll;
			
			for (var i = 0; i < x; i++) {
				roll = Math.floor(Math.random() * y) + 1;
				//dice[i] = roll;
				str += '[ ' + roll + ' ]  ';
				total += roll;
			}
			str += '`\n' + x + 'd' + y + ' TOTAL: ' + total;
			chSend(message, str);
		} else {
			chSend(message, 'Use `!roll `X`d`Y to roll X Y-sided dice.');
		}
	},
	help: '`!roll <x>d<y>` rolls a `y`-sided die `x` times and gives results.',
	longHelp: '`!roll <x>d<y>` rolls a `y`-sided die `x` times and gives results.' +
	'\n You can roll up to 20 dice with up to 10000 virtual "sides" each.' +
	  '\n EXAMPLE: `!roll 3d6` would roll 3 "fair" six-sided dice, display the\n' +
	  ' individual die rolls, and show the total (which would be between 3 and 18\n' +
	  ' inclusive in this example.)',
	disabled: false
}
//-----------------------------------------------------------------------------
spongeBot.rot13 = {
	cmdGroup: 'Miscellaneous',
	do: function (message, inp){
		
		var outp;
		
		// ROT-13 by Ben Alpert
		// See: http://stackoverflow.com/questions/617647/where-is-my-one-line-implementation-of-rot13-in-javascript-going-wrong
		outp = inp.replace(/[a-zA-Z]/g,function(c){
			return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});
			
		if (outp === '') {
			chSend(message, message.author + ' nothing to ROT-13!');
			return false;
		};
		chSend(message, message.author + ': `' + outp + '`');
    },
	help: '`!rot13 <message>` spits back the ROT-13 ciphertext of your message.',
	longHelp: '	You could use this in DM and then use the result in public chat if you were giving spoilers or something I guess.',
	disabled: false
}
//-----------------------------------------------------------------------------
spongeBot.exchange = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		if (parms  === 'iamsure') {
			
			if (!bankroll.hasOwnProperty(message.author.id)) {
				chSend(message, message.author + ', you have no bank ' +
				'account.  You can open one with `!bank`.');
				return;
			}
			
			if (bankroll[message.author.id] < 100000) {
				chSend(message, message.author + ', you don\'t have enough credits.');
				return;
			}
			
			addBank(message.author.id, -100000);
			var newTix = incStat(message.author.id, 'raffle', 'ticketCount');
			chSend(message, message.author + ', you now have ' +
			  bankroll[message.author.id] + ' credits, and ' + newTix + ' tickets.');
		} else {
			chSend(message, message.author + ', be sure you want to tade 100K ' +
			  'credits for one raffle ticket, then type `!exchange iamsure` to do so.');
		}
	},
	help: '`!exchange iamsure` trades 100,000 credits for a raffle ticket. Make sure you really want to do this.'
};
//-----------------------------------------------------------------------------
spongeBot.stats = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		var who;
		
		if (!parms) {
			//chSend(message, message.author + ', specify a <user> for `!stats`.');
			who = message.author.id;
		} else {
			who = makeId(parms);
		}
		
		if (!gameStats[who]) {
			chSend(message, message.author + ', I don\'t have any stats for them.');
			return;
		}
		
		var theStr = ' :bar_chart:  STATS FOR ' + makeTag(who) + '  :bar_chart:\n```';
		for (var game in gameStats[who]) {
			theStr += '> ' + game + ':\n';
			for (var stat in gameStats[who][game]) {
				theStr += '    ' + stat + ': ' + gameStats[who][game][stat] + '\n';
			}
		}
		theStr += '```';
		chSend(message, theStr);
	},
	help: '`!stats <user>` shows game stats for <user>. Omit <user> for yourself.'
};
//-----------------------------------------------------------------------------
spongeBot.disable = {
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			chSend(message, 'Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'disable') {
			chSend(message, 'Don\'t disable `!disable`. Just don\'t.');
			return;
		}
		spongeBot[parms].disabled = !(spongeBot[parms].disabled);
		chSend(message, parms + '.disabled: '
		  + spongeBot[parms].disabled);
	},
	help: 'Disables/enables a bot command. Restricted access.',
	access: true
};
//-----------------------------------------------------------------------------
spongeBot.s = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		
		if (scram.runState !== 'guessing') {
			chSend(message, 'You can\'t guess the scrambled word now! ' +
			  'You need to wait for a new word to unscramble!');
			return;
		}
		
		if (parms === scram.word) {
			scram.runState = 'gameover';
			addBank(message.author.id, SCRAM_AWARD);
			chSend(message, message.author + ' just unscrambled ' +
			  ' the word and wins ' + SCRAM_AWARD + ' credits!');
			incStat(message.author.id, 'scram', 'wins');
			
			chSend(message, message.author + ' has now unscrambled ' +
			  gameStats[message.author.id].scram.wins + ' words!');
		} else {
			//chSend(message, 'Not the word.');
		}
	},
	help: 'Use `!s <word>` to submit a guess in the `!scram` '
	  + 'word scramble game.',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.scram = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		if (scram.runState === 'ready') {
			
			var keys = Object.keys(SCRAMWORDS);
			
			var theCat = keys[parseInt(Math.random() * keys.length)];
			var theWord = listPick(SCRAMWORDS[theCat].split(','))[0];
			scram.word = theWord;		
			var scramWord = scrambler(theWord);
			chSend(message, 'Unscramble this: ' + bigLetter(scramWord) + 
			  '   *Category*: ' + theCat);
			  
			var theDelay = parseInt(SCRAM_DELAY - (SCRAM_DELAY_VARIATION / 2) +
			  Math.random() * SCRAM_DELAY_VARIATION);
			var guessTime = SCRAM_GUESSTIME + SCRAM_EXTRA_TIME * theWord.length;
			  
			chSend(message, 'You have ' + parseInt(guessTime / 1000) + 
			  ' seconds to guess. Next word available in ' + 
			  parseInt(theDelay / 1000) + ' seconds.');
			scram.runState = 'guessing';
			
			scram.timer = setTimeout(function() {
				if (scram.runState !== 'ready') {
					scram.runState = 'ready';
					if (scram.announce) {
						chSend(message, 'There\'s a new `!scram` word ready!');
					}
				}
			}, theDelay);
			
			scram.guessTimer = setTimeout(function() {
				if (scram.runState === 'guessing') {
					chSend(message, 'The `!scram` word was not guessed' +
					' in time! The word was: ' + scram.word);
					scram.runState = 'gameover';
				}
			}, guessTime);
		} else {
			chSend(message, '`!scram` is not ready just yet.');
		}
	},
    help: '`!scram` starts the scramble game or checks to see if it\'s ready',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.ttc = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		
		if (!parms) {
			chSend(message, 'To look up an item on Tamriel Trade Centre (EU/PC), just use `!ttc <item>`.' +
			  '\nUse an exact item name, or you can search for partial matches.');
			return;
		}
		var theLink = 'https://eu.tamrieltradecentre.com/pc/Trade/SearchResult?ItemNamePattern='
		parms = parms.replace(/ /g, '+');
		theLink += parms + '&SortBy=Price&Order=asc';
		chSend(message, theLink);
	},
	help: '`!ttc <item>` sends a link to the item on eu.tamrieltradecentre.com.'
	  + ' Use an exact item name, or you can search for partial matches.'
};
//-----------------------------------------------------------------------------
spongeBot.giveaways = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		
		if (!parms) {
			chSend(message, ':fireworks: GIVEAWAYS! :fireworks:\n There are currently no giveaways running.');
			chSend(message, 'There are a few items that _may possibly_ someday go here, but no guarantees, at all! ' +
			'You can see this list with `!giveaways list`. If giveaways actually do someday get implemented, there would ' +
			'first need to be some system of earning them, or earning chances for them or something.');
			return;
		}
		
		parms = parms.split(' ');
		
		if (parms[0] === 'list') {
			var str = 'Use `!giveaways info <item>` for more info.';
			str += '\n :warning: This is only a sample list, subject to change, and giveaways might not ever actually be implemented anyway.\n';
			for (var item in giveaways) {
				str += '`' + item + '`   ';
			}
			chSend(message, str);
		}
		
		if (parms[0] === 'info') {
			parms.shift();
			parms = parms.join(' ');
			if (giveaways[parms]) {
				var str = '`' + parms + '`: ';
				str += giveaways[parms].info.description + '\n';
				str += '  More info: ' + giveaways[parms].info.infoUrl;
				chSend(message, str);
			} else {
				chSend(message, 'Couldn\'t find any info for that giveaway, ' + message.author +
				  '. Make sure you type (or copy/paste) the _exact_ title. Use `!giveaways list` for a list.');
			}
		}
	},
	help: '`!giveaways` lists any currently running contests, giveaways, freebies, and other fun stuff'
};
//-----------------------------------------------------------------------------
spongeBot.sammich = {
	cmdGroup: 'Fun and Games',
	do: function(message) {
		chSend(message, 'How about having a ' + sammichMaker() + ' for a snack?   :yum:');
	},
	help: '`!sammich` whips you up a tasty random sandwich (65% chance) or smoothie (35% chance)'
};
//-----------------------------------------------------------------------------
spongeBot.give = {
	cmdGroup: 'Bankroll',
	do: function(message, parms) {
		
		var giver = message.author.id;
		
		if (!parms) {
			chSend(message, 'Who are you trying to `!give` credits ' +
			  ' to, ' + makeTag(giver) + '? (`!help give` for help)');
			return;
		}
			
		parms = parms.split(' ');
			
		if (!parms[1]) {
			chSend(message, 'No amount specified to `!give`, ' + 
			  makeTag(giver) + '. (`!help give` for help)' );
			return;
		}
			
		var who = makeId(parms[0]);
		var amt = parseInt(parms[1]);

		if (isNaN(amt)) {
			chSend(message, makeTag(giver) + ', that\'s not a number to me.');
			return;
		}
		
		if (amt === 0) {
			chSend(message, makeTag(giver) + ' you want to give *nothing*? ' + 
			  'Ok, uh... consider it done I guess.');
			return;
		}
		
		if (amt < 0) {
			chSend(message, makeTag(giver) + ' wouldn\'t that be *taking*?'); 
			return;
		}
		
		if (bankroll[giver] < amt) {
			chSend(message, 'You can\'t give what you don\'t have, ' +
			  makeTag(giver) + '!');
			return;
		}
		
		if (!bankroll.hasOwnProperty(giver)) {
			chSend(message, 'You\'ll need a bank account first, ' +
			  makeTag(giver) + '!');
			return;
		}
		
		if (amt === 1) {
			chSend(message, 'Aren\'t you the generous one, ' + makeTag(giver) + '?');
		}
	
		if (!addBank(who, amt)) {
			chSend(message, 'Failed to give to ' + who);
		} else {
			addBank(giver, -amt);
			chSend(message, ':gift: OK, I moved ' + amt +
			  ' of your credits to ' + makeTag(who) + ', ' + makeTag(giver));
		}
	},
	help: '`!give <user> <amount>` gives someone some of your credits.',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.gift = {
	cmdGroup: 'Bankroll',
	do: function(message, parms) {
		if (message.author.id === SPONGE_ID) {
			
			if (!parms) {
				chSend(message, 'You forgot the target to !gift.');
				return;
			}
			
			parms = parms.split(' ');
			
			if (!parms[1]) {
				chSend(message, 'No amount specified to `!gift`');
				return;
			}
			
			var who = makeId(parms[0]);
			var amt = parseInt(parms[1]);
			
			if (!addBank(who, amt)) {
				chSend(message, 'Failed to give to ' + who);
			} else {
				chSend(message, 'OK, gave ' + makeTag(who) + ' ' + amt + ' credits!');
			}
		}
	},
	help: 'If you are a sponge, `!gift <user> <amount>` gives someone some credits.',
	access: true
};
//-----------------------------------------------------------------------------
spongeBot.bank = {
	cmdGroup: 'Bankroll',
	do: function(message, parms) {
		
		var who;
		parms = parms.split(' ');

		if (parms[0] === '') {
			who = message.author.id;
			
			if (typeof bankroll[who] === 'undefined') {
				chSend(message, makeTag(who) + ', I don\'t see an account ' +
				  'for you, so I\'ll open one with ' + START_BANK + ' credits.');
				
				/*
				var server = bot.guilds.get(SERVER_ID);
				var role = server.roles.find('name', 'Tester');
			
				if (server.roles.has('name', 'Tester')) {
					console.log(' we have a tester!');
				}
				
				//message.member.roles.has(message.guild.roles.find("name", "insert role name here"))
				*/
				
				bankroll[who] = START_BANK;
				saveBanks();
				console.log('New bankroll made for ' + who + ' via !bank.');
			} 
		} else {
			who = makeId(parms[0]);
		}
		
		if (typeof bankroll[who] === 'undefined') {
			chSend(message, message.author + ', they don\'t have a bank account.');
		} else {
			chSend(message, makeTag(who) + ' has ' + bankroll[who] + ' credits.');	
		}
	},
	help: '`!bank <user>` reveals how many credits <user> has. With no <user>, ' +
	  'will either show your own bank, or create a new account for you.'
};
//-----------------------------------------------------------------------------
spongeBot.showCode = {
	do: function(message, parms) {
		var theCode = spongeBot[parms];
		
		chSend(message, theCode);
		console.log(theCode);
	},
	help: 'shows code.',
	disabled: true
}
//-----------------------------------------------------------------------------
spongeBot.savebanks = {
	do: function() {
		saveBanks();
	},
	help: 'Saves all bank data to disk. Should not be necessary to invoke manually.',
	disabled: true
}
//-----------------------------------------------------------------------------
spongeBot.loadbanks = {
	do: function() {
		loadBanks();
	},
	help: '(( currently under development ))',
	disabled: true
};
//-----------------------------------------------------------------------------
spongeBot.setStat = {
	do: function() {
		// alterStat()
	},
	help: 'sets a game stat. limited access.',
	access: true,
	disabled: true
}
//-----------------------------------------------------------------------------
spongeBot.slots = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		
		if (!slots.config.symArr) {
			// must be first time around, we need to build the symbol array
			slots.config.symArr = [];
			for (var sym in slots.config.symbols) {
				slots.config.symArr.push({
					sym: sym,
					emo: slots.config.symbols[sym].emo,
					rarity: slots.config.symbols[sym].rarity
				});
			}
			console.log('.slots: First run, built symbol array.');
		};

		var payTab = slots.config.payTable;
		
		if (parms === '') {
			chSend(message, 'Try `!slots spin <bet>` or `!slots paytable`.');
			return;
		}	
		
		parms = parms.toLowerCase();
		parms = parms.split(' ');
		
		
		if (parms[0] === 'paytable') {
	
			var rarityTot = 0;
			for (var sym in slots.config.symbols) {
				rarityTot += slots.config.symbols[sym].rarity;
			}
			
			ptabString = '(Using config: ' + slots.config.configName + ')\n\n';
			ptabString += '!SLOTS PAYOUT TABLE\n`[PAYOUT]    | [PATTERN]   | [ODDS AGAINST]`\n';
			
			for (var i = 0; i < payTab.length; i++) {
				var lineChance = 1;	
				ptabString += '`' + payTab[i].payout + ' : 1';
				
				var tempstr = payTab[i].payout.toString() + ' : 1';
				var stlen = tempstr.length;
				for (var j = 0; j < 12 - stlen; j++) {
					ptabString += ' ';
				}
				ptabString += '|` ';
				
				for (var j = 0; j < payTab[i].pattern.length; j++) {
					if (payTab[i].pattern[j] === 'any') {
						ptabString += ':grey_question: ';
					} else {
						ptabString += slots.config.symbols[payTab[i].pattern[j]].emo;
						ptabString += ' ';
						lineChance = lineChance * (slots.config.symbols[payTab[i].pattern[j]].rarity / rarityTot);					
					}
				}
				lineChance = 1 / lineChance;
				ptabString += '      (' + lineChance.toFixed(1) + ' : 1)';
				ptabString += '\n';
			}
			chSend(message, ptabString);
		}

		if (parms[0] === 'spin') {
			var who = message.author.id;

			if (!bankroll[who]) {
				chSend(message, message.author + ', please open a `!bank` account before playing slots.');
				return;
			}
			betAmt = parseInt(parms[1]) || 0;

			if (betAmt === 0) {
				chSend(message, message.author + ', you can\'t play if you don\'t pay.');
				return;
			}
			
			if (betAmt < 0) {
				chSend(message, message.author + ' thinks they\'re clever making a negative bet.');
				return;
			}
			
			if (betAmt > bankroll[who]) {
				chSend(message, message.author + ', check your `!bank`. You don\'t have that much.');
				return;
			}
			
			if (betAmt === bankroll[who]) {
				chSend(message, message.author + ' just bet the farm on `!slots`!');
			}
			
			addBank(who, -betAmt);

			var spinArr = [];
			for (var reel = 0; reel < 3; reel++) {
				
				var bucket = [];
				var highest = 0;
				var buckNum = 0;
				
				for (var sym in slots.config.symbols) {
					bucket[buckNum] = highest + slots.config.symbols[sym].rarity;
					buckNum++;
					highest += slots.config.symbols[sym].rarity;
				};
				
				var theSpin = Math.random() * highest;
				
				var foundBuck = false;
				var bNum = 0;
				
				while ((bNum < bucket.length) && (!foundBuck)) {
					if (theSpin < bucket[bNum]) {
						foundBuck = true;
					} else {bNum++;}
				}
				spinArr.push(slots.config.symArr[bNum].sym);
			}
			
			spinString = '';
			for (var i = 0; i < 3; i++) {
				spinString += slots.config.symbols[spinArr[i]].emo;
			}
			chSend(message, spinString + ' (spun by ' + message.author + ')');
			
			for (var pNum = 0, won = false; ((pNum < payTab.length) && (!won)); pNum++) {
				
				var matched = true;
				var reel = 0;
				while (matched && reel < payTab[pNum].pattern.length) {
					if ((spinArr[reel] === payTab[pNum].pattern[reel])
					  || (payTab[pNum].pattern[reel] == 'any')) {
						
					} else {
						matched = false;
					}					
					
					if ((reel === payTab[pNum].pattern.length - 1) && (matched)) {
						// winner winner chicken dinner
						var winAmt = betAmt * payTab[pNum].payout;
						chSend(message, ':slot_machine: ' +
						  message.author + ' is a `!slots` winner!\n' + 
						  ' PAYING OUT: ' + payTab[pNum].payout + ':1' +
						  ' on a ' + betAmt + ' bet.   Payout =  ' + winAmt);
						addBank(who, winAmt)
						won = true;
					}
					reel++;
				}
			}
		}
		
	},
	help: '`!slots`: give the slot machine a spin!'
}
//-----------------------------------------------------------------------------
var buildHelp = function() {
	
	theHelp = {};
	
	for (var cmd in spongeBot) {
		
		var cGroup = '';
		if (!spongeBot[cmd].cmdGroup) {
			cGroup = 'Uncategorized';
		} else {
			cGroup = spongeBot[cmd].cmdGroup;
		}
		
		if (!theHelp[cGroup]) {theHelp[cGroup] = '';}
	
		if (spongeBot[cmd].disabled !== true) {
			if (spongeBot[cmd].access) {theHelp[cGroup] += '*'}
			theHelp[cGroup] += '`!' + cmd + '`: ';
			if (spongeBot[cmd].help) {
				theHelp[cGroup] += spongeBot[cmd].help;
			}
			theHelp[cGroup]+= '\n';
		}
	}
	return theHelp;
};
//-----------------------------------------------------------------------------
spongeBot.ticket = {
	do: function(message, parms) {
		if (message.author.id === SPONGE_ID) {
			
			if (!parms) {
				chSend(message, 'You forgot the target to for !ticket.');
				return;
			}
			
			parms = parms.split(' ');
			var amt;
			var who = makeId(parms[0]);
			var str;
			
			console.log('!ticket: parms[1] is: ' + parms[1]);
			if (parms[1] === '' || typeof parms[1] === 'undefined') {
				amt = 1;
			} else {
				var amt = parseInt(parms[1]);	
			}
			
			str = makeTag(who) + ' now has ';
			str += alterStat(who, 'raffle', 'ticketCount', amt);
			str += ' raffle tickets.';
			
			chSend(message, str);
		}
	},
	access: true,
	disabled: false,
	help: '`!ticket <who> <#>` Gives <#> tickets to <who>. With no #, gives one.'
}
//-----------------------------------------------------------------------------
spongeBot.help = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		if (parms) {
			if (typeof spongeBot[parms] !== 'undefined') {	
				if (spongeBot[parms].longHelp) {
					chSend(message, spongeBot[parms].longHelp);
				} else if (spongeBot[parms].help) {
					chSend(message, spongeBot[parms].help);
				} else {
					chSend(message, 'I have no help about that, ' + message.author);
				}
			} else {
				chSend(message, 'Not a command I know, ' + message.author);
			}
		} else {
			// no parms supplied, show help on everything in a DM
			
			if (!botStorage.fullHelp) {
				// "cached" help doesn't exist, so build it...
				console.log('!help: building help text for first time');
				botStorage.fullHelp = buildHelp();
			} 
			
			// since help text is built, just regurgitate it
			chSend(message, message.author + ', incoming DM spam!');
			for (var cat in botStorage.fullHelp) {
				message.author.send('\n**' + cat +'**\n');
				message.author.send('---\n' + botStorage.fullHelp[cat]);
			}
			message.author.send('---\n( * - Denotes restricted access command. )' +
			  ' Type `!help <command>` for more info on a specific command.');
			}
		},
	help: '`!help`: for when you need somebody, not just anybody. '
};
//-----------------------------------------------------------------------------
spongeBot.timer = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {

		if (parms === '') {
			chSend(message, 'Usage: `!timer <sec>` sets a timer to go off in _<sec>_ seconds.');
		} else {
			parms = parseInt(parms);
			if ((parms >= 1) && (parms <=20)) {
				setTimeout(function() {
					chSend(message, 'Ding ding! Time is up!');
				}, (parms * 1000));
			} else {
				chSend(message, 'Timer has to be set for between 1-20 secs.');
			}
		}
	},
	help: '`!timer <sec>` sets a timer to go off in _<sec>_ seconds.'
};
//-----------------------------------------------------------------------------
spongeBot.say = {
	// refactor to use .access check someday
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		
		if (message.author.id === SPONGE_ID) {
			if (parms === '') {return;}			
			var chan;
			if (parms.startsWith('#')) {
				parms = parms.slice(1).split(' ');
				chan = parms[0];
				parms.shift();
				parms = parms.join(' ');
			} else {
				chan = MAINCHAN_ID;
			}
			BOT.channels.get(chan).send(parms);
		} else {
			console.log(message.author.id + ' tried to put words in my mouth!');
			message.author.send('I don\'t speak for just anyone.');
		}
	},
	help: '`!say <stuff>` Make me speak. (limited access command)',
	access: true
};
//-----------------------------------------------------------------------------
spongeBot.avote = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {

		if (!acro.runState) {
			chSend(message, message.author + ', the game is not running.' +
			  ' You can start a new game with `!acro`');
			return;
		}
		
		if (acro.runState !== 'vote') {
			chSend(message, message.author + ', wait for the voting to start!');
			return;
		}
		
		var theVote = parseInt(parms);
		
		if ((theVote > acro.entries.length - 1) || (theVote < 0) || (isNaN(theVote))) {
			chSend(message, ':warning: Not a valid vote, ' + message.author);
			return;
		}
		
		if (acro.entries[theVote].author === message.author.id && !acro.config.voteOwn) {
			chSend(message, message.author + ', you can\'t vote for yourself!');
			return;
		}
		
		if (typeof acro.votes[message.author.id] === 'undefined') {
			chSend(message, message.author + ' your vote was recorded.');
		} else {
			chSend(message, message.author + ', I changed your vote for you.');
		}
		acro.votes[message.author.id] = theVote;
	},
	help: 'Use `!avote` during an `!acro` game to vote for your favorite.',
	longHelp: 'Use `!avote` during the _voting round_ of `!acro`, the acronym game\n' +
	  ' to vote for your favorite entry from those shown. For more info, \n' +
	  ' see `!acro help` or watch an acro game in play.'
};
//-----------------------------------------------------------------------------
spongeBot.stopacro = {
	do: function(message) {
		clearTimeout(acro.timer);
		if (acro.voteTimer) {clearTimeout(acro.voteTimer);}
		acro.runState = false;
		chSend(message, ':octagonal_sign: `!acro` has been stopped if it was running.');
	},
	help: '`!stopacro` stops the currently running `!acro` game.',
	access: true
}
//-----------------------------------------------------------------------------
spongeBot.acrocfg = {
	do: function(message, parms) {
		parms = parms.split(' ');
		
		if (!parms[0]) {
			for (var opt in acro.config) {
				chSend(message, opt + ': ' + acro.config[opt]);
			}
		} else {
			if (acro.config.hasOwnProperty([parms[0]])) {
					
				// handle Booleans
				if (parms[1] === 'false') {parms[1] = false}
				else if (parms[1] === 'true') {parms[1] = true}
				
				acro.config[parms[0]] = parms[1];
				chSend(message, '`!acro`: set ' + parms[0] + ' to ' + parms[1] + '.');
			} else {
				chSend(message, '`!acro`: can\'t config ' + parms[0]);
			}
		}
	},
	help: 'Configures the acro game.',
	access: true
};
//-----------------------------------------------------------------------------
spongeBot.acro = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		parms = parms.split(' ');
		
		if (acro.runState) {
			chSend(message, ':warning: I think the `!acro` is already running.');
			return;
		}
		
		// start a new game
		acro.votes = {};
		acro.players = {};
		acro.runState = 'main';
		var letters = '';
		var timeAllowed;
		var category = 'None / General';
		acro.entries = [];
		
		if (acro.config.categories) {
			var catNo = Math.floor(Math.random() * acro.categories.length);
			category = acro.categories[catNo];
		}
		
		var acroLen = 3 + Math.floor(Math.random() * 3);
		timeAllowed = acroLen * 10 + 20;
		acro.pickLetters(acroLen);
		
		for (var i = 0; i < acro.letters.length; i++) {
			letters += acro.letters.charAt(i).toUpperCase();
		}
		
		chSend(message, ' Let\'s play the `!acro` game!\n' + 
		  '\nLetters: ' + bigLetter(letters) + 
		  '   Category: ' + category +
		  '\nYou have ' + timeAllowed + 
		  ' seconds to make an acronym with them and submit it with `!a`');
		
		acro.timer = setTimeout(function() {
			
		var theText = ':stopwatch: Time to vote in `!acro`!\n' +
		'=-=-=-=-=-=-=-=-=\n'
		
		// Array-ify our object, order now matters
		var tempArr = [];
		for (var entry in acro.entries) {
			tempArr.push({
				author: entry,
				entry: acro.entries[entry]
			});
		}
		acro.entries = tempArr; // overwrite the old Object with Array
		
		if (acro.entries.length > 0) {
			var voteTimeAllowed = 15 + acro.entries.length * 5;					
			for (var i = 0; i < acro.entries.length; i++) {
				theText += '`!avote ' + i + '`: ';
				theText += acro.entries[i].entry + '\n';
				//theText += ' (by ' + makeTag(acro.entries[i].author) + ')\n';
				acro.entries[i].voteCount = 0;
			}
			theText += '=-=-=-=-=-=-=-=-=\n';
			theText += 'Vote for your favorite with `!avote`!';
			theText += '\n You have ' + voteTimeAllowed + ' seconds.';
			chSend(message, theText);
			acro.runState = 'vote';
			acro.voteTimer = setTimeout(function() {
				acro.runState = false;
				clearTimeout(acro.voteTimer); 
				chSend(message, ':stopwatch: `!acro` voting time is up!' + 
				  ':stopwatch: \n Here are the results:');
				
				//count the votes
				for (var who in acro.votes) {
					acro.entries[acro.votes[who]].voteCount++;;
				}
				
				//show results						
				var winner = false;
				var winArr = [];
				for (var i = 0; i < acro.entries.length; i++) {
					chSend(message, '`[#' + i +
					  '] ' + acro.entries[i].voteCount + 
					  ' votes for: ' + acro.entries[i].entry +
					  '` (by ' + makeTag(acro.entries[i].author) + ')\n');

					if (winner === false) {
						if (acro.entries[i].voteCount > 0) {
							winner = i;
							winArr.push(i);
						}
					} else {
						if (acro.entries[i].voteCount > acro.entries[winner].voteCount) {
							winner = i;
							winArr = [];
							winArr.push(i);
						}
						else if (acro.entries[i].voteCount === acro.entries[winner].voteCount) {
							winArr.push(i);
						}
					}
				}

				console.log('!acro: winArr = ' + winArr);
				
				if (winner === false) {
					chSend(message, 'Looks like no one won `!acro`. Sad!');
				} else {
					//chSend(message, 'Number of !acro winners: ' + winArr.length);
					if (winArr.length === 1) {
						incStat(acro.entries[winner].author, 'acro', 'wins');
						chSend(message, makeTag(acro.entries[winner].author) + ' won `!acro`!' +
						  ' That makes ' + gameStats[acro.entries[winner].author].acro.wins + ' wins!');
					} else {
						var winStr = 'Looks like we have a tie in `!acro`! Winners: ';
						for (var i = 0; i < winArr.length; i++) {
							winStr += makeTag(acro.entries[winArr[i]].author) + ' ';
						}
						chSend(message, winStr);
					}
					if ((acro.entries.length >= acro.config.minPlayersForCredits) && winArr.length === 1) {
						chSend(message, makeTag(acro.entries[winner].author) + ' won `!acro` with ' +
						  'at least ' + acro.config.minPlayersForCredits + ' entries, and' +
						  ' won ' + acro.config.winCredits + ' credits!');
						addBank(acro.entries[winner].author, acro.config.winCredits);						
						incStat(acro.entries[winner].author, 'acro', 'credwins');
						chSend(message, makeTag(acro.entries[winner].author) +
						  ' got a crediting acro win and now has ' +
						  gameStats[acro.entries[winner].author].acro.credwins +
						  ' crediting acro wins!');
					}
				}
			}, voteTimeAllowed * 1000);
		} else {
			chSend(message, '`!acro` has ended, and no one submitted an entry.');					
			acro.runState = false;
		}
	}, timeAllowed * 1000);},
	help: '`!acro`: Starts up the acronym game',
	longHelp: '`!acro`: Starts up the acronym game.\n' + 
		' The acronym game consists of an acro-making round, and a voting round.\n' +
		' In the _acro-making round_, players are given 3 to 6 letters, (eg: P A I F).\n' +
		' Players then have a set amount of time to make an acronym using those initial\n' +
		' letters (eg: Playing Acro Is Fun) and submit it using the `!a` command.\n\n' +
		' In the _voting round_ which follows after the alloted time is up, the acronyms\n' +
		' submitted are displayed, anonymized, and everyone in the channel can then\n' +
		' vote on their favorite, using the `!avote` command. Players may or may not\n' +
		' be allowed to be vote for their own acro, based on a configuration option.\n\n' +
		' After the voting round timer ends, the acronym(s) with the most votes is shown\n' +
		' along with the author(s). These are the winners. Depending on config options,\n' +
		' winner(s) may receive some amount of server "credits".'
};
//-----------------------------------------------------------------------------
spongeBot.a = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		
		if (!acro.runState) {
			chSend(message, 'Acro not running. Start it with `!acro`.');
			return;
		}
		
		if (acro.runState === 'vote') {
			chSend(message, 'Too slow, ' + message.author +
			  ', voting has begun :slight_frown:');
			  return;
		}

		theirAcro = message.content.slice(3);
		theirAcro = theirAcro.split(' ');
			
		var letter;
		
		var i = 0;
		var isLegit = true;
		
		if (theirAcro.length !== acro.letters.length) {
			chSend(message, message.author +
			  ', that acro is the wrong length!');
			  isLegit = false;
		}
		
		while ((i < theirAcro.length) && isLegit) {
			letter = acro.letters.charAt(i);
			if (!theirAcro[i].toLowerCase().startsWith(letter)) {
				isLegit = false;
			}
			i++;
		}
		
		if (isLegit) {
			if (acro.players[message.author]) {
				chSend(message, message.author + ', I am' +
				  'replacing your old submission.');
			}
			acro.entries[message.author.id] = message.content.slice(2);
			chSend(message, 'Got it, ' + message.author + '!');
		} else {
			chSend(message, ':warning: ' + message.author +
			  ', your invalid acro was not accepted :.');
		}
	},
	help: '`!a <Your Acronym Here>`: Submits your entry in `!acro`',
	longHelp: '`!a <Your Acronym Here>`: Submits your entry in the acronym game,\n' +
	  '`!acro`. For more info, see `!acro help` or watch an acro game in play.'
};
//-----------------------------------------------------------------------------
spongeBot.version = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		chSend(message, ':robot:` SpongeBot v.' + VERSION_STRING + ' online.');
		chSend(message, SPONGEBOT_INFO);
	},
	help: 'Outputs the current bot code version and other info.'
}
//-----------------------------------------------------------------------------
BOT.on('ready', () => {
  console.log('Spongebot version ' + VERSION_STRING + ' READY!');
  BOT.user.setGame("!help");
  if (Math.random() < 0.1) {BOT.channels.get(SPAMCHAN_ID).send('I live!');}
  loadBanks();
  loadStats();
});
//-----------------------------------------------------------------------------
BOT.on('message', message => {
	if (message.content.startsWith('!')) {
		var botCmd = message.content.slice(1);
		var theCmd = botCmd.split(' ')[0];

		if (!spongeBot.hasOwnProperty(theCmd)) {
			// not a valid command
			return;
		}
		
		var parms = botCmd.replace(theCmd, '');
		parms = parms.slice(1); // remove leading space

		if (typeof spongeBot[theCmd] !== 'undefined') {
			console.log('  ' + message.author + ': !' + theCmd + ' (' + parms + ') : ' + message.channel);
			
			if (!spongeBot[theCmd].disabled) {
				
				if (spongeBot[theCmd].access) {
					// requires special access
					if (message.author.id !== SPONGE_ID) {
						chSend(message, 'Your shtyle is too weak ' +
						  'for that command, ' + message.author);
					} else {
						spongeBot[theCmd].do(message, parms);
					}
				} else {
					spongeBot[theCmd].do(message, parms);
				}
			} else {
				chSend(message, 'Sorry, that is disabled.');
			}
		} else {
			// not a valid command
		}
	}
});
//=============================================================================
BOT.login(CONFIG.token);
