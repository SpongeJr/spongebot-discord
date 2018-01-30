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

// note: make sure SCRAM_DELAY - SCRAM_DELAY_VARIATION > SCRAM_GUESSTIME
const SCRAM_DELAY = 300000;
const SCRAM_DELAY_VARIATION = 30000;
const SCRAM_AWARD = 500;
const SCRAM_GUESSTIME = 16000;
const SCRAM_EXTRA_TIME = 2000; // per letter

const SPONGE_ID = "167711491078750208";
const MAINCHAN_ID = "402126095056633863";
const SPAMCHAN_ID = "402591405920223244";
const SERVER_ID = "402126095056633859";
const START_BANK = 10000;
const VERSION_STRING = '0.8';
const SPONGEBOT_INFO = 'SpongeBot (c) 2018 by Josh Kline, released under MIT license' +
  '\n Bot source code (not necessarily up-to-date) ' +
  'can possibly be found at: http://www.spongejr.com/spongebot/spongebot.js' +
  '\nMade using: `discord.js` https://discord.js.org and `node.js` https://nodejs.org';
//-----------------------------------------------------------------------------
var scram = {
	ready: true,
	announce: true,
	runState: 'ready'
};
//-----------------------------------------------------------------------------
var botStorage = {};
//-----------------------------------------------------------------------------
var bankroll = {};
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
				console.log('  !loadbanks: Data chunk loaded.');
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
	
	if (!bankroll[who]) {
		bankroll[who] = 0;
		console.log('addbank: New bankroll made for ' + who);
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
		winCredits: 50,
		categories: true
	},
	categories: [
		'food and drink', 'animals', 'people', 'places', 'games and sports',
		'movies and television', 'news and current events',	'occupations',
		'technology and science', 'memes and fads', 'fantasy', 'general/any'
	]
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
spongeBot.readfile = {
	do: function() {
		
		if (spongeBot.fileData !== '') {
			BOT.channels.get(SPAMCHAN_ID).send('I have some data stored already, but I\'ll overwrite it, k?');
		}
		
		BOT.channels.get(SPAMCHAN_ID).send('Attempting to open file...');
		
		var readStream = FS.createReadStream(TESTFILENAME);
		readStream
			.on('readable', function() {
				var chunk;
				while (null !== (chunk = readStream.read())) {
					
					var theData = '';
					for (var i = 0; i < chunk.length; i++) {
						theData += String.fromCharCode(chunk[i]);
					};
					//BOT.channels.get(SPAMCHAN_ID).send(theData);
					spongeBot.fileData = theData;
					BOT.channels.get(SPAMCHAN_ID).send('I\'ve stored that. :slight_smile:');
					console.log(chunk);
				}
			})
			.on('end', function() {
				BOT.channels.get(SPAMCHAN_ID).send('All done!');
			});
	},
	help: '(( currently under development ))',
	disabled: true
};
//-----------------------------------------------------------------------------
spongeBot.showfile = {
	
	do: function() {
		if (spongeBot.fileData === '') {
			BOT.channels.get(SPAMCHAN_ID).send(':warning: I have no file loaded right now.');
			return;
		}
		
		theData = spongeBot.fileData;
		
		BOT.channels.get(SPAMCHAN_ID).send(theData);
	},
	help: '(( currently under development ))',
	disabled: true
}
//-----------------------------------------------------------------------------
spongeBot.append = {
	do: function(message, parms) {
		spongeBot.fileData += parms;
		BOT.channels.get(SPAMCHAN_ID).send('Appended ' + parms + ' to the stored data.');
	},
	help: '(( currently under development ))',
	disabled: true
};
//-----------------------------------------------------------------------------
spongeBot.savefile = {
	do: function() {
		var writeStream = FS.createWriteStream(TESTFILENAME, {autoClose: true});
		BOT.channels.get(SPAMCHAN_ID).send('Here goes! Attempting to write to disk...');
		writeStream.write(spongeBot.fileData);
		writeStream.end(function() {
			BOT.channels.get(SPAMCHAN_ID).send('...and I am done!');
		});
	},
	help: '(( under development ))',
	disabled: true
}
//-----------------------------------------------------------------------------
spongeBot.disable = {
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			message.channel.send('Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'disable') {
			message.channel.send('Don\'t disable `!disable`. Just don\'t.');
			return;
		}
		spongeBot[parms].disabled = !(spongeBot[parms].disabled);
		message.channel.send(parms + '.disabled: '
		  + spongeBot[parms].disabled);
	},
	help: 'Disables/enables a bot command. Restricted access.',
	access: true
};
//-----------------------------------------------------------------------------
spongeBot.s = {
	do: function(message, parms) {
		
		if (scram.runState !== 'guessing') {
			message.channel.send('You can\'t guess the scrambled word now! ' +
			  'You need to wait for a new word to unscramble!');
			return;
		}
		
		if (parms === scram.word) {
			scram.runState = 'gameover';
			addBank(message.author.id, SCRAM_AWARD);
			message.channel.send(message.author + ' just unscrambled ' +
			  ' the word and wins ' + SCRAM_AWARD + ' credits!');
		} else {
			//message.channel.send('Not the word.');
		}
	},
	help: 'Use `!s <word>` to submit a guess in the `!scram` '
	  + 'word scramble game.',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.scram = {
	do: function(message, parms) {
		if (scram.runState === 'ready') {
			
			var keys = Object.keys(SCRAMWORDS);
			
			var theCat = keys[parseInt(Math.random() * keys.length)];
			var theWord = listPick(SCRAMWORDS[theCat].split(','))[0];
			scram.word = theWord;		
			var scramWord = scrambler(theWord);
			message.channel.send('Unscramble this: ' + bigLetter(scramWord) + 
			  '   *Category*: ' + theCat);
			  
			var theDelay = parseInt(SCRAM_DELAY - (SCRAM_DELAY_VARIATION / 2) +
			  Math.random() * SCRAM_DELAY_VARIATION);
			var guessTime = SCRAM_GUESSTIME + SCRAM_EXTRA_TIME * theWord.length;
			  
			message.channel.send('You have ' + parseInt(guessTime / 1000) + 
			  ' seconds to guess. Next word available in ' + 
			  parseInt(theDelay / 1000) + ' seconds.');
			scram.runState = 'guessing';
			
			scram.timer = setTimeout(function() {
				if (scram.runState !== 'ready') {
					scram.runState = 'ready';
					if (scram.announce) {
						message.channel.send('There\'s a new `!scram` word ready!');
					}
				}
			}, theDelay);
			
			scram.guessTimer = setTimeout(function() {
				if (scram.runState === 'guessing') {
					message.channel.send('The `!scram` word was not guessed' +
					' in time! The word was: ' + scram.word);
					scram.runState = 'gameover';
				}
			}, guessTime);
		} else {
			message.channel.send('`!scram` is not ready just yet.');
		}
	},
    help: '`!scram` starts the scramble game or checks to see if it\'s ready',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.ttc = {
	do: function(message, parms) {
		
		if (!parms) {
			message.channel.send('To look up an item on Tamriel Trade Centre (EU/PC), just use `!ttc <item>`.' +
			  '\nUse an exact item name, or you can search for partial matches.');
			return;
		}
		var theLink = 'https://eu.tamrieltradecentre.com/pc/Trade/SearchResult?ItemNamePattern='
		parms = parms.replace(/ /g, '+');
		theLink += parms + '&SortBy=Price&Order=asc';
		message.channel.send(theLink);
	},
	help: '`!ttc <item>` sends a link to the item on eu.tamrieltradecentre.com.'
	  + ' Use an exact item name, or you can search for partial matches.'
};
//-----------------------------------------------------------------------------
spongeBot.giveaways = {
	do: function(message, parms) {
		
		if (!parms) {
			message.channel.send(':fireworks: GIVEAWAYS! :fireworks:\n There are currently no giveaways running.');
			message.channel.send('There are a few items that _may possibly_ someday go here, but no guarantees, at all! ' +
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
			message.channel.send(str);
		}
		
		if (parms[0] === 'info') {
			parms.shift();
			parms = parms.join(' ');
			if (giveaways[parms]) {
				var str = '`' + parms + '`: ';
				str += giveaways[parms].info.description + '\n';
				str += '  More info: ' + giveaways[parms].info.infoUrl;
				message.channel.send(str);
			} else {
				message.channel.send('Couldn\'t find any info for that giveaway, ' + message.author +
				  '. Make sure you type (or copy/paste) the _exact_ title. Use `!giveaways list` for a list.');
			}
		}
	},
	help: '`!giveaways` lists any currently running contests, giveaways, freebies, and other fun stuff'
};
//-----------------------------------------------------------------------------
spongeBot.sammich = {
	
	do: function(message) {
		message.channel.send('How about having a ' + sammichMaker() + ' for a snack?   :yum:');
	},
	help: '`!sammich` whips you up a tasty random sandwich (65% chance) or smoothie (35% chance)'
};
//-----------------------------------------------------------------------------
spongeBot.give = {
	do: function(message, parms) {
		
		var giver = message.author.id;
		
		if (!parms) {
			message.channel.send('You forgot the target to !gift.');
			return;
		}
			
		parms = parms.split(' ');
			
		if (!parms[1]) {
			message.channel.send('No amount specified to `!gift`');
			return;
		}
			
		var who = makeId(parms[0]);
		var amt = parseInt(parms[1]);

		if (isNaN(amt)) {
			message.channel.send(makeTag(giver) + ', that\'s not a number to me.');
			return;
		}
		
		if (amt === 0) {
			message.channel.send(makeTag(giver) + ' you want to give *nothing*? ' + 
			  'Ok, uh... consider it done I guess.');
			return;
		}
		
		if (amt < 0) {
			message.channel.send(makeTag(giver) + ' wouldn\'t that be *taking*?'); 
			return;
		}
		
		if (bankroll[giver] < amt) {
			message.channel.send('You can\'t give what you don\'t have!');
			return;
		}
		
		if (amt === 1) {
			message.channel.send('Aren\'t you the generous one, ' + makeTag(giver) + '?');
		}
		
		addBank(giver, -amt);
		
		if (!addBank(who, amt)) {
			message.channel.send('Failed to give to ' + who);
		} else {
			message.channel.send(':gift: OK, I moved ' + amt +
			  ' of your credits to ' + makeTag(who) + ', ' + makeTag(giver));
		}
	},
	help: '`!give <user> <amount>` gives someone some of your credits. Disabled, because Arch.',
	disabled: true
	
};
//-----------------------------------------------------------------------------
spongeBot.gift = {
	do: function(message, parms) {
		if (message.author.id === SPONGE_ID) {
			
			if (!parms) {
				message.channel.send('You forgot the target to !gift.');
				return;
			}
			
			parms = parms.split(' ');
			
			if (!parms[1]) {
				message.channel.send('No amount specified to `!gift`');
				return;
			}
			
			var who = makeId(parms[0]);
			var amt = parseInt(parms[1]);
			
			if (!addBank(who, amt)) {
				message.channel.send('Failed to give to ' + who);
			} else {
				message.channel.send('OK, gave ' + makeTag(who) + ' ' + amt + ' credits!');
			}
		} else {
			message.channel.send('You are not the Sponge. Your shtyle is weak!');
		}
	},
	help: 'If you are a sponge, `!gift <user> <amount>` gives someone some credits.',
	access: true
};
//-----------------------------------------------------------------------------
spongeBot.bank = {
	do: function(message, parms) {
		
		var who;
		parms = parms.split(' ');

		if (parms[0] === '') {
			who = message.author.id;
			
			if (typeof bankroll[who] === 'undefined') {
				message.channel.send(makeTag(who) + ', I don\'t see an account ' +
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
			message.channel.send(message.author + ', they don\'t have a bank account.');
		} else {
			message.channel.send(makeTag(who) + ' has ' + bankroll[who] + ' credits.');	
		}
	},
	help: '`!bank <user>` reveals how many credits <user> has. With no <user>, ' +
	  'will either show your own bank, or create a new account for you.'
};
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
spongeBot.slots = {
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
			message.channel.send('Try `!slots spin <bet>` or `!slots paytable`.');
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
			message.channel.send(ptabString);
		}

		if (parms[0] === 'spin') {
			var who = message.author.id;

			if (!bankroll[who]) {
				message.channel.send(message.author + ', please open a `!bank` account before playing slots.');
				return;
			}
			betAmt = parseInt(parms[1]) || 0;

			if (betAmt === 0) {
				message.channel.send(message.author + ', you can\'t play if you don\'t pay.');
				return;
			}
			
			if (betAmt < 0) {
				message.channel.send(message.author + ' thinks they\'re clever making a negative bet.');
				return;
			}
			
			if (betAmt > bankroll[who]) {
				message.channel.send(message.author + ', check your `!bank`. You don\'t have that much.');
				return;
			}
			
			if (betAmt === bankroll[who]) {
				message.channel.send(message.author + ' just bet the farm on `!slots`!');
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
			message.channel.send(spinString + ' (spun by ' + message.author + ')');
			
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
						message.channel.send(':slot_machine: ' +
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
spongeBot.help = { 
	do: function(message, parms) {
		if (parms) {
			if (typeof spongeBot[parms] !== 'undefined') {
				message.channel.send(spongeBot[parms].help);
			}
		} else {
			var cmds = '';
			
			for (var cmd in spongeBot) {
				
				if (spongeBot[cmd].disabled !== true) {
					cmds += '`!' + cmd + '`  ';
				}
			}
			
			message.channel.send('Try one of these: ' + cmds +
			  '\n\n Type `!help <command>` for more info on a specific command.');
			}
		},
	help: '`!help`: for when you need somebody, not just anybody. '
};
//-----------------------------------------------------------------------------
spongeBot.timer = {
	do: function(message, parms) {

		if (parms === '') {
			message.channel.send('Usage: `!timer <sec>` sets a timer to go off in _<sec>_ seconds.');
		} else {
			parms = parseInt(parms);
			if ((parms >= 1) && (parms <=20)) {
				setTimeout(function() {
					message.channel.send('Ding ding! Time is up!');
				}, (parms * 1000));
			} else {
				message.channel.send('Timer has to be set for between 1-20 secs.');
			}
		}
	},
	help: '`!timer <sec>` sets a timer to go off in _<sec>_ seconds.'
};
//-----------------------------------------------------------------------------
spongeBot.say = {
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
	help: '`!say <stuff>` Make me speak. (limited access command)'
};
//-----------------------------------------------------------------------------
spongeBot.avote = {
	do: function(message, parms) {

		if (!acro.runState) {
			message.channel.send(message.author + ', the game is not running.' +
			  ' You can start a new game with `!acro`');
			return;
		}
		
		if (acro.runState !== 'vote') {
			message.channel.send(message.author + ', wait for the voting to start!');
			return;
		}
		
		var theVote = parseInt(parms);
		
		if ((theVote > acro.entries.length - 1) || (theVote < 0) || (isNaN(theVote))) {
			message.channel.send(':warning: Not a valid vote, ' + message.author);
			return;
		}
		
		if (acro.entries[theVote].author === message.author.id && !acro.config.voteOwn) {
			message.channel.send(message.author + ', you can\'t vote for yourself!');
			return;
		}
		
		if (typeof acro.votes[message.author.id] === 'undefined') {
			message.channel.send(message.author + ' your vote was recorded.');
		} else {
			message.channel.send(message.author + ', I changed your vote for you.');
		}
		acro.votes[message.author.id] = theVote;
	},
	help: 'Use `!avote` during an `!acro` game to vote for your favorite.'
};
//-----------------------------------------------------------------------------
spongeBot.stopacro = {
	do: function(message) {
		clearTimeout(acro.timer);
		if (acro.voteTimer) {clearTimeout(acro.voteTimer);}
		acro.runState = false;
		message.channel.send(':octagonal_sign: `!acro` has been stopped if it was running.');
	},
	help: '`!stopacro` stops the currently running `!acro` game.'
}
//-----------------------------------------------------------------------------
spongeBot.acrocfg = {
	do: function(message, parms) {
		parms = parms.split(' ');
		
		if (!parms[0]) {
			for (var opt in acro.config) {
				message.channel.send(opt + ': ' + acro.config[opt]);
			}
		} else {
			if (acro.config.hasOwnProperty([parms[0]])) {
					
				// handle Booleans
				if (parms[1] === 'false') {parms[1] = false}
				else if (parms[1] === 'true') {parms[1] = true}
				
				acro.config[parms[0]] = parms[1];
				message.channel.send('`!acro`: set ' + parms[0] + ' to ' + parms[1] + '.');
			} else {
				message.channel.send('`!acro`: can\'t config ' + parms[0]);
			}
		}
	},
	help: 'Configures the acro game.',
	access: true
};
//-----------------------------------------------------------------------------
spongeBot.acro = {
	do: function(message, parms) {
		parms = parms.split(' ');
		
		if (acro.runState) {
			message.channel.send(':warning: I think the `!acro` is already running.');
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
		
		message.channel.send(' Let\'s play the `!acro` game!\n' + 
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
			message.channel.send(theText);
			acro.runState = 'vote';
			acro.voteTimer = setTimeout(function() {
				acro.runState = false;
				clearTimeout(acro.voteTimer); 
				message.channel.send(':stopwatch: `!acro` voting time is up!' + 
				  ':stopwatch: \n Here are the results:');
				
				//count the votes
				for (var who in acro.votes) {
					acro.entries[acro.votes[who]].voteCount++;;
				}
				
				//show results						
				var winner = false;
				var winArr = [];
				for (var i = 0; i < acro.entries.length; i++) {
					message.channel.send('`[#' + i +
					  '] ' + acro.entries[i].voteCount + 
					  ' votes for: ' + acro.entries[i].entry +
					  '` (by ' + makeTag(acro.entries[i].author) + ')\n');

					if (!winner) {
						if (acro.entries[i].voteCount > 0) {
							winner = i;
							winArr.push(i);
						}
					} else {
						if (acro.entries[i].voteCount > acro.entries[winner].voteCount) {
							winner = i;
							winArr = [].push(i);
						}
						else if (acro.entries[i].voteCount === acro.entries[winner].voteCount) {
							winArr.push(i);
						}
					}
				}

				if (winner === false) {
					message.channel.send('Looks like no one won `!acro`. Sad!');
				} else {
					//message.channel.send('Number of !acro winners: ' + winArr.length);
					if (winArr.length === 1) {
						message.channel.send(makeTag(acro.entries[winner].author) + ' won `!acro`!');
					} else {
						var winStr = 'Looks like we have a tie in `!acro`! Winners: ';
						for (var i = 0; i < winArr.length; i++) {
							winStr += makeTag(acro.entries[winArr[i]].author) + ' ';
						}
						message.channel.send(winStr);
					}
					if ((acro.entries.length >= acro.config.minPlayersForCredits) && winArr.length === 1) {
						message.channel.send(makeTag(acro.entries[winner].author) + ' won `!acro` with ' +
						  'at least ' + acro.config.minPlayersForCredits + ' entries, and' +
						  ' won ' + acro.config.winCredits + ' credits!');
						  
						if (!bankroll[acro.entries[winner].author]) {
							bankroll[acro.entries[winner].author] = 0;
							console.log('New bankroll made for ' + acro.entries[winner].author +
							  ' via !acro credit win.');
						}
						bankroll[acro.entries[winner].author] += parseInt(acro.config.winCredits);
						console.log(acro.entries[winner].author + ' got a crediting acro win.');
					}
				}
			}, voteTimeAllowed * 1000);
		} else {
			message.channel.send('`!acro` has ended, and no one submitted an entry.');					
			acro.runState = false;
		}
	}, timeAllowed * 1000);},
	help: '`!acro`: Starts up the acronym game'
};
//-----------------------------------------------------------------------------
spongeBot.a = {
	do: function(message, parms) {
		
		if (!acro.runState) {
			message.channel.send('Acro not running. Start it with `!acro`.');
			return;
		}
		
		if (acro.runState === 'vote') {
			message.channel.send('Too slow, ' + message.author +
			  ', voting has begun :slight_frown:');
			  return;
		}

		theirAcro = message.content.slice(3);
		theirAcro = theirAcro.split(' ');
			
		var letter;
		
		var i = 0;
		var isLegit = true;
		
		if (theirAcro.length !== acro.letters.length) {
			message.channel.send(message.author +
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
				message.channel.send(message.author + ', I am' +
				  'replacing your old submission.');
			}
			acro.entries[message.author.id] = message.content.slice(2);
			message.channel.send('Got it, ' + message.author + '!');
		} else {
			message.channel.send(':warning: ' + message.author +
			  ', your invalid acro was not accepted :.');
		}
	},
	help: 'Submits your entry in `!acro`'
};
//-----------------------------------------------------------------------------
spongeBot.version = {
	do: function(message) {
		message.channel.send(':robot:` SpongeBot v.' + VERSION_STRING + ' online.');
		message.channel.send(SPONGEBOT_INFO);
	},
	help: 'Outputs the current bot code version and other info.'
}
//-----------------------------------------------------------------------------
BOT.on('ready', () => {
  console.log('Spongebot version ' + VERSION_STRING + ' READY!');
  if (Math.random() < 0.1) {BOT.channels.get(SPAMCHAN_ID).send('I live!');}
  loadBanks();
});
//-----------------------------------------------------------------------------
BOT.on('message', message => {
	if (message.content.startsWith('!')) {
		var botCmd = message.content.slice(1);
		var theCmd = botCmd.split(' ')[0];
		var parms = botCmd.replace(theCmd, '');
		parms = parms.slice(1); // remove leading space
			
		if (typeof spongeBot[theCmd] !== 'undefined') {
			console.log('  !' + theCmd + ' (' + parms + ') : ' + message.channel);
			
			if (!spongeBot[theCmd].disabled) {
				
				if (spongeBot[theCmd].access) {
					// requires special access
					if (message.author.id !== SPONGE_ID) {
						message.channel.send('Your shtyle is too weak ' +
						  'for that command, ' + message.author);
					} else {
						spongeBot[theCmd].do(message, parms);
					}
				} else {
					spongeBot[theCmd].do(message, parms);
				}
			} else {
				message.channel.send('Sorry, that is disabled.');
			}
		} else {
			// not a valid command
		}
	}
});
//=============================================================================
BOT.login(CONFIG.token);
