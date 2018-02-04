/* Copyright 2018 Josh Kline ("SpongeJr"), 
Loot box and Duel code Copyright 2018 by 0xABCDEF/Archcannon

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
const CONFIG = require('../config.json');
const MYPALS = require('../mypals.json');
const SCRAMWORDS = require('../data/scramwords.json');
const BOT = new Discord.Client();

const FS = require('fs');
const BANK_FILENAME = '../data/banks.csv';
const STATS_FILENAME = '../data/gamestats.json';

// note: make sure SCRAM_DELAY - SCRAM_DELAY_VARIATION > SCRAM_GUESSTIME
const SCRAM_DELAY = 195000;
const SCRAM_DELAY_VARIATION = 15000;
const SCRAM_AWARD = 900;
const SCRAM_AWARD_LETTER_BONUS = 150; // per letter
const SCRAM_GUESSTIME = 29000;
const SCRAM_EXTRA_TIME = 2000; // per letter

const SPONGE_ID = "167711491078750208";
const ARCH_ID = "306645821426761729";
const MAINCHAN_ID = "402126095056633863";
const SPAMCHAN_ID = "402591405920223244";
const SERVER_ID = "402126095056633859";
const START_BANK = 10000;
const VERSION_STRING = '0.983';
const SPONGEBOT_INFO = 'SpongeBot (c) 2018 by Josh Kline and 0xABCDEF/Archcannon ' +
  '\nreleased under MIT license. Bot source code can be found at: ' +
  '\n https://github.com/SpongeJr/spongebot-discord' +
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

var scram = {};

var botStorage = {};
var bankroll = {};
var gameStats = {};

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
		},
		type: 'other'
	},
	'Amazon3': {
		info: {
			description: '$3.00 USD Amazon gift code',
			infoUrl: 'https://www.amazon.com/gc/redeem/'
		},
		type: 'gift card'
	},
	'Amazon5': {
		info: {
			description: '$5.00 USD Amazon gift code',
			infoUrl: 'https://www.amazon.com/gc/redeem/'
		},
		type: 'gift card'
	},
	'nitro': {
		info: {
			description: 'One month of Discord Nitro',
			infoUrl: 'https://discordapp.com/nitro'
		},
		type: 'other'
	},
	'GTAIII': {
		info: {
			description: 'Grand Theft Auto III (18+ or w/parents permssion)',
			infoUrl: 'http://store.steampowered.com/app/12100/Grand_Theft_Auto_III/'
		},
		type: 'game'
	},
	'GTA: VC': {
		info: {
			description: 'Grand Theft Auto: Vice City (18+ or w/parents permssion)',
			infoUrl: 'http://store.steampowered.com/app/12110/Grand_Theft_Auto_Vice_City/'
		},
		type: 'game'
	},
	'iOS10forBeginners': {
		info: {
			description: 'iOS 10 Programming for Beginners (ebook) (PDF, EPUB or MOBI format)',
			infoUrl: 'https://www.packtpub.com/application-development/ios-10-programming-beginners'
		},
		type: 'ebook'
	}
};

var loot = {
        boxes: {
			sports: {
				count: 7,
				price: 70,
				items: [
					{	emoji: ':soccer:',			rarity:	10,	value: 10,	},
					{	emoji: ':basketball:',		rarity:	10,	value: 10,	},
					{	emoji: ':football:',		rarity:	10,	value: 10,	},
					{	emoji: ':baseball:',		rarity:	10,	value: 10,	},
					{	emoji: ':tennis:',			rarity:	10,	value: 10,	},
					{	emoji: ':volleyball:',		rarity:	10,	value: 10,	},
					{	emoji: ':rugby_football:',	rarity:	10,	value: 10,	},
				],
				description: 'Play ball!'
			},
			math: {
				count: 20,
				price: 400,
				items: [
					{	emoji: ':one:',		rarity: 1, value: 1	},
					{	emoji: ':two:',		rarity: 2, value: 2	},
					{	emoji: ':three:',	rarity: 3, value: 3	},
					{	emoji: ':four:',	rarity: 4, value: 4	},
					{	emoji: ':five:',	rarity: 5, value: 5	},
					{	emoji: ':six:',		rarity: 6, value: 6	},
					{	emoji: ':seven:',	rarity: 7, value: 7	},
					{	emoji: ':eight:',	rarity: 8, value: 8	},
					{	emoji: ':nine:',	rarity: 9, value: 9	},
					{	emoji: ':zero:',	rarity: 0, value: 0	},
				],
				description: 'Did you finish your math homework?'
			},
			coolnew: {
				count: 2,
				price: 10000,
				items: [
					{	emoji: ':cool:',	rarity: 1, value: 0	},
					{	emoji: ':new:',		rarity: 1, value: 0	},
				],
				description: 'Feel :cool: and/or :new: with this seriously overpriced box!'
			},
            programmer: {
                count: 256,
                price: 2048,
                items: [
                    //127
                    {   emoji: ':desktop:',             rarity: 1, value: 256       },
                    {   emoji: ':computer:',            rarity: 2, value: 128       },
                    {   emoji: ':keyboard:',            rarity: 4, value: 64       },
                    {   emoji: ':mouse_three_button:',  rarity: 8,  value: 8       }, 
                    {   emoji: ':floppy_disk:',         rarity: 16,  value: 4       },
                    {   emoji: ':one:',                 rarity: 32,  value: 2       },
                    {   emoji: ':zero:',                rarity: 64, value: 1        },
                ],
                description: 'A programmer\'s standard toolbox.'
            },
            emojispam: {
                count:  36,
                price:  1500,
                items: [
                    {   emoji: ':thinking:',    rarity: 40, value: 200      },
                    {   emoji: ':clap:',        rarity: 60, value: 160      },
                    {   emoji: ':ok_hand:',     rarity: 80, value: 125      },
                    {   emoji: ':100:',         rarity: 100, value: 100     },
                    {   emoji: ':b:',           rarity: 120, value: 25      },
                    {   emoji: ':poop:',        rarity: 140, value: 1       },
                ],
                description: 'You\'re guaranteed to find at least one :poop: emoji in here.'
            },
            alphabet: {
                count:  26,
                price:  260,
                items: [
                    {   emoji: ':regional_indicator_a:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_b:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_c:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_d:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_e:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_f:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_g:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_h:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_i:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_j:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_k:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_l:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_m:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_n:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_o:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_p:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_q:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_r:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_s:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_t:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_u:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_v:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_w:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_x:',    rarity: 5, value: 1000  },
                    {   emoji: ':regional_indicator_z:',    rarity: 50, value: 100  },
                ],
                description: '***D o   y o u   k n o w   y o u r   A B C s ?***'
            }
        }
    };
//-----------------------------------------------------------------------------
var makeStatFile = function() {
	var theFile = JSON.stringify(gameStats);
	return theFile;
};
var parseStatFile = function() {
	var outp = JSON.parse(botStorage.statloaddata);
	console.log(outp);
	return outp;
};
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
	// Alters an integer stat. Returns: the stat's new value
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
var saveBanks = function() {
	var writeStream = FS.createWriteStream(BANK_FILENAME, {autoClose: true});
	writeStream.write(makeBankFile(bankroll));
	writeStream.end(function() {
		console.log(' Banks saved.');
	});
};
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
var makeBankFile = function(bankdata) {
	var theFile = '';
	for (who in bankdata) {
		theFile += who + ',' + bankdata[who] + ','
	}
	theFile = theFile.slice(0, -1); // remove trailing comma
	return theFile;
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
			btcn: {emo: ':rhino:', rarity: 1},
			peng: {emo: ':penguin:', rarity: 3},
			dolr: {emo: ':dollar:', rarity: 4},
			sevn: {emo: ':seven:', rarity: 6},
			mush: {emo: ':mushroom:', rarity: 9},
			cher: {emo: ':cherries:', rarity: 12},
			tato: {emo: ':potato:', rarity: 11},
		},
		payTable: [
			{payout: 3200, pattern: ['btcn', 'btcn', 'btcn']},
			{payout: 160, pattern: ['btcn', 'btcn', 'any']},
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
	
	// temporary stuff
	if (typeof message === 'undefined') {
		console.log('chSend: message is undefined!');
		return
	}
	
	if (!message.hasOwnProperty('author')) {
		console.log('chSend: No .author property on message!');
		return;
	}
	
	if (!message.author.hasOwnProperty('bot')) {
		console.log('chSend: no .bot property on message.author!');
		return;
	}
	
	if (message.author.bot) {
		console.log(' -- Blocked a bot-to-bot m.channel.send');
		return;
	}
	
	message.channel.send(str).catch(reason => {
		console.log('Error sending a channel message: ' + reason);
	});
};
//-----------------------------------------------------------------------------
var auSend = function(message, str) {
	if (message.author.bot) {
		console.log(' -- Blocked a bot-to-bot m.author.send');
		return;
	}
	
	message.author.send(str).catch(reason => {
		console.log('Error sending a DM: ' + reason);
	});
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
var hasAccess = function(who, accessArr) {
	return (who === SPONGE_ID || who === ARCH_ID);
};
//-----------------------------------------------------------------------------
spongeBot.loot = {
        cmdGroup: 'Fun and Games',
        do: function(message, args) {
			
			if ((message.author.id !== SPONGE_ID) && (message.author.id !== ARCH_ID)) {
				chSend(' You must develop your shtyle further before using loot boxes!');
				return;
			} else if (args === '') {
                chSend(message, 'Try `!loot unbox <name>` or `!loot boxes`.');
                return;
            }
           
            args = args.toLowerCase();
            args = args.split(' ');
           	
			if (args[0] === 'boxes' && args[1] === 'suck') {
				chSend(message, 'But you gotta admit that they are *really* lucrative');
				return;
			}
			
            var action = args[0] || '';
            if (action === 'unbox') {
                var who = message.author.id;
 
                if (!bankroll[who]) {
                    chSend(message, message.author + ', please open a `!bank` account before unboxing loot.');
                    return;
                }
                var boxName = args[1] || '';
 
                if (boxName === '') {
					chSend(message, message.author + ', what do you want to unbox?');
					return;
				} else if (boxName === 'nothing') {
                    chSend(message, message.author + ', you can\'t unbox nothing.');
                    return;
                } else if (boxName === 'it') {
			   		chSend(message, message.author + ', do it yourself!');
					return;
			   	} else if (boxName === 'yourself') {
					chSend(message, message.author + ', okay then. ');
					chSend(message, message.author + '*pelts ' + message.author + ' with a barrage of wrenches, screwdrivers, cogs, nails, washers, and other machine parts.*');
					return;
				} else if (boxName === 'me') {
					chSend(message, message.author + ', that would be extremely painful for you.');
					return;
				} else if (boxName === 'everything') {
					chSend(message, message.author + ', that\'s impossible.');
					return;
				} else if (args[1] === 'the' && args[2] === 'pod' && args[3] === 'bay' && args[4] === 'doors') {
					chSend(message, 'I\'m sorry, ' + message.author + '. I\'m afraid I can\'t do that');
					return;
				}
               
                var found = false;
                for (var box in loot.boxes) {
                    if (boxName === box) {
                        found = true;
                        var price = loot.boxes[box].price;
						/*
						chSend(message, 'unboxing a ' + box);
						chSend(message, 'bankroll[who] is ' + bankroll[who] + '   and price is ' + price);
						*/
						
                        if (bankroll[who] >= price) {
                            chSend(message, message.author + ' just purchased the ' + box + ' box for ' + price + ' credits.');
                            addBank(who, -price);
                           
                            //Accumulate total rarity value
                            var totalRarity = 0;                //The total combined rarity of all items, used for choosing items
                            var boxEntry = loot.boxes[box];     //The entry of the box, including the count, price, and item array
                            var itemTable = boxEntry.items; //The item array in the box entry
                            for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
                                totalRarity += itemTable[itemIndex].rarity;
                            }
                           
                            var dropCount = boxEntry.count;         //The total number of items that the box will drop
                            var drops = [];                         //Indexes correspond to itemTable. The number of drops for each item
                            //Initialize to 0
                            for (var i = 0; i < itemTable.length; i++) {
                                drops[i] = 0;
                            }
                           
                            //Accumulate drops
                            for (var i = 0; i < dropCount; i++) {
                               
                                var rarityRoll = Math.random() * totalRarity;
                                //Iterate through each item entry and decrement the rarityRoll until we hit zero. Then we stop at our current item and add it to the drops.
                                for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
                                    var item = itemTable[itemIndex];    //The item entry at the index
                                    rarityRoll = rarityRoll - item.rarity;
                                    //Stop here
                                    if (rarityRoll <= 0) {
                                        drops[itemIndex]++;
										break;
                                    }
                                }
                            }
                            var resultMessage = message.author + " found...";
                            //Accumulate value and print out results
                            var valueTotal = 0;
                            for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
                                var count = drops[itemIndex];
                                var item = itemTable[itemIndex];
                                valueTotal += item.value * count;
                                if (count > 0) {
                                    resultMessage += '\nx' + count + ' ' + item.emoji;
                                }
                            }
                            resultMessage += '\nTotal Value: ' + valueTotal;
                            addBank(who, valueTotal);
                            chSend(message, resultMessage);
                        } else {
                            chSend(message, message.author + ' you can\'t afford the ' + box + ' box.');
                        }
                        return;
                    }
                }
               
                if (!found) {
                    chSend(message, message.author + ', you can\'t unbox something that doesn\'t exist.');
                }
            } else if (action === 'box' || action === 'boxes') {
				chSend(message, message.author + ', here are the loot boxes that I have in stock.');
				for (var box in loot.boxes) {
					var desc = '\nThe `' + box + '` box';
					var boxEntry = loot.boxes[box];
					desc += '\nDescription: ' + boxEntry.description;
					desc += '\nPrice: ' + boxEntry.price + ' credits';
					desc += '\nContains ' + boxEntry.count + ' items from the following selection.';
					
					//List out the items
					var itemTable = boxEntry.items;
					for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
						var itemEntry = itemTable[itemIndex];
						desc += '\n' + itemEntry.emoji + ' (chance: ' + itemEntry.rarity + '; value: ' + itemEntry.value + ')';
					}
					chSend(message, desc);
				}
			}
           
        },
        help: '`!loot`: Buy a loot box and see what\'s inside!'
    }
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
spongeBot.server = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		var server = message.guild;
		
		if (!server) {
			auSend(message, ' Doesn\'t look like you sent me that message on _any_ server!');
			return;
		}
		
		var str = ' You are on ' + server.name + ', which has the id: ' + 
		  server.id + '. It was created on: ' + server.createdAt + '.';
		
		chSend(message, str);
	},
	help: 'Gives info about the server on which you send me the command.'
}
//-----------------------------------------------------------------------------
spongeBot.s = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		var server = message.guild;
		
		if (!server) {
			auSend(message, 'The word scramble game is meant to be played in public, and '+
			'not direct messages. Sorry! It\'s more fun with others, anyway!');
			return;
		}

		parms = parms.toLowerCase();
		
		if (scram[server.id].runState !== 'guessing') {
			chSend(message, 'You can\'t guess the scrambled word now! ' +
			  'You need to wait for a new word to unscramble!');
			return;
		}
		
		if (parms === scram[server.id].word) {
			scram[server.id].runState = 'gameover';
			addBank(message.author.id, parseInt(SCRAM_AWARD + SCRAM_AWARD_LETTER_BONUS * scram[server.id].word.length));
			chSend(message, message.author + ' just unscrambled ' +
			  ' the word and wins ' + parseInt(SCRAM_AWARD + SCRAM_AWARD_LETTER_BONUS * scram[server.id].word.length ) + ' credits!');
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
spongeBot.scram = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		
		var server = message.guild;
		
		if (!server) {
			auSend(message, 'The word scramble game is meant to be played in public, and '+
			'not direct messages. Sorry! It\'s more fun with others, anyway!');
			return;
		}
		
		if (!scram.hasOwnProperty(server.id)) {
			// key doesn't exist for this server, so init
			console.log('!scram: Adding instance for ' + server.id + ' ('
			  + server.name + ')');
			scram[server.id] = {};
			scram[server.id].announce = true;
			scram[server.id].runState = 'ready';
		}
		
		if (scram[server.id].runState === 'ready') {
			
			var keys = Object.keys(SCRAMWORDS);
			
			var theCat = keys[parseInt(Math.random() * keys.length)];
			var theWord = listPick(SCRAMWORDS[theCat].split(','))[0];
			scram[server.id].word = theWord;		
			var scramWord = scrambler(theWord);
			chSend(message, 'Unscramble this: ' + bigLetter(scramWord) + 
			  '   *Category*: ' + theCat);
			  
			var theDelay = parseInt(SCRAM_DELAY - (SCRAM_DELAY_VARIATION / 2) +
			  Math.random() * SCRAM_DELAY_VARIATION);
			var guessTime = SCRAM_GUESSTIME + SCRAM_EXTRA_TIME * theWord.length;
			  
			chSend(message, 'You have ' + parseInt(guessTime / 1000) + 
			  ' seconds to guess by typing `!s <guess>`. Next word available in ' + 
			  parseInt(theDelay / 1000) + ' seconds.');
			scram[server.id].runState = 'guessing';
			
			scram[server.id].timer = setTimeout(function() {
				if (scram[server.id].runState !== 'ready') {
					scram[server.id].runState = 'ready';
					if (scram[server.id].announce) {
						chSend(message, 'There\'s a new `!scram` word ready!');
					}
				}
			}, theDelay);
			
			scram[server.id].guessTimer = setTimeout(function() {
				if (scram[server.id].runState === 'guessing') {
					chSend(message, 'The `!scram` word was not guessed' +
					' in time! The word was: ' + scram[server.id].word);
					scram[server.id].runState = 'gameover';
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
			chSend(message, ':fireworks: GIVEAWAYS! :fireworks:\n ' +
			' FLASH GIVEAWAY NOTICE: Sponge has 2 raffle tickets. Sponge can\'t win raffles. Sponge will be giving away ' +
			' both tickets in the #giveaways chan tonight, Feb. 2 between the hours of 1900 and 2300 EST. That\'s all I know.');
			chSend(message, 'Type `!giveaways list` to see what is available for winning a raffle. ' + 
			' Items listed there will be options  you can pick if you win a weekly raffle. ' +
			' The details around raffle tickets and drawings are still being finalized, but are almost complete.\n' +
			' We hope to have raffles up and running _before_ mid-February. You\'ll want to grab as many entry tickets' +
			' :tickets: as you can get your hands on, to have the best chances! Type !stats to see how many you have.' +
			'\n\n Also see `!help giveaways` for new options like `!giveaways addrole` and `!giveaways categories`.');
			return;
		}
		
		parms = parms.split(' ');
		
		if (parms[0] === 'list') {
			
			parms.shift();
			parms = parms.join(' ');
			
			var str = 'Use `!giveaways info <item>` for more info.\n';
			
			for (var item in giveaways) {
				if ((giveaways[item].hasOwnProperty('type') && giveaways[item].type === parms) || parms === '') {
					str += '`' + item + '`   ';
				}
			}

			str += '\n List subject to change.';
			chSend(message, str);
		}
		
		if (parms[0] === 'info') {
			parms.shift();
			parms = parms.join(' ');
			if (giveaways.hasOwnProperty(parms)) {
				var str = '`' + parms + '`: ';
				str += giveaways[parms].info.description + '\n';
				str += ' **Category**: ' + (giveaways[parms].type || '(none)');
				str += '   **More info**: ' + giveaways[parms].info.infoUrl;
				chSend(message, str);
			} else {
				chSend(message, 'Couldn\'t find any info for that giveaway, ' + message.author +
				  '. Make sure you type (or copy/paste) the _exact_ title. Use `!giveaways list` for a list.');
			}
		} else if (parms[0] === 'addrole') {
			/*
			if (!message.hasOwnProperty('guild')) {
				chSend(message, 'Sorry, ' + message.author + ', you need to do this on the server not in DM, ' +
				'because I don\'t know where to give you the giveaways role otherwise!');
				return;
			}
			*/
			
			var role = message.guild.roles.find('name', 'giveaways');
			
			if (message.member.roles.has('408789879590354944')) {
				console.log('!giveaways addrole: Did not add role or award ticket because they had it already.');
				chSend(message, message.author + ' I think you already had that role.');
			} else {
				message.member.addRole(role);
				chSend(message, message.author + ', I\'ve given you the `giveaways` role. ' + 
				' You might be pinged at any time of day for giveaways, raffles, and related announcements and info.' +
				'\n If something went wrong, you don\'t have the role, or you didn\'t really want it, please ping ' +
				' <@167711491078750208> to sort it out. And... good luck in the giveaways!');
				chSend(message, message.author + ', I\'m also giving you a free :tickets: with your new role! You now have ' +
				  alterStat(message.author.id, 'raffle', 'ticketCount', 1) + ' raffle tickets!');
			}
		} else if (parms[0] === 'whohasrole') {
			chSend(message, 'Don\'t even.');
			/*
			var whoHas = message.guild.roles.get('408789879590354944').members;
			chSend(message, 'These are the ' + whoHas.size + ' members with the giveaways role: ');
			
			var whoStr = ''
			for (var who of whoHas.keys()) {
				whoStr += makeTag(who) + '   ';
				console.log(who);
			}
			chSend(message, whoStr);
			*/

		} else if (parms[0] === 'categories') {

			var cats = {};
			var theStr = ' Raffle item categories: ';
			for (var item in giveaways) {
				if (giveaways[item].hasOwnProperty('type')) {
					cats[giveaways[item].type] = true;
				}
			}
			
			for (var cat in cats) {
				theStr += '`' + cat + '` ';
			}
			chSend(message, theStr);
		}
	},
	help: '`!giveaways` lists any currently running contests, giveaways, freebies, and other fun stuff.' +
	  '\n`!giveaways list` shows all the current choices for raffle prizes.' +
	  '\n`!giveaways list <category>` lets you see all items on `!giveaways list` of a certain category.' +
	  '\n`!giveaways categories` lets you see the categories on `!giveaways list.`' +
  	  '\n`!giveaways addrole` gives you the "giveaways" role which means you will get pinged (at any time of day) ' +
	  'when there\'s something interesting going on related to giveaways.'
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
	do: function(message, parms) {
		
		parms = parms.split(' ');
		alterStat(makeId(parms[0]), parms[1], parms[2], parseInt(parms[3]));
	},
	help: 'sets a game stat. limited access.',
	longHelp: 'Listen, be careful and look at ' + 
	  ' the source for `alterStat (who, game, stat, amt) as well as ' +
	  ' `spongeBot.setStat`!',
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

			if (!bankroll.hasOwnProperty(who)) {
				chSend(message, message.author + ', please open a `!bank` account before playing slots.');
				return;
			}
			
			var betAmt = parseInt(parms[1]) || 0;

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
				auSend(message, '\n**' + cat +'**\n');
				auSend(message, '---\n' + botStorage.fullHelp[cat]);
			}
			auSend(message, '---\n( * - Denotes restricted access command. )' +
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
			if ((parms >= 1) && (parms <= 255)) {
				setTimeout(function() {
					chSend(message, 'Ding ding! Time is up!');
				}, (parms * 1000));
			} else {
				chSend(message, 'Timer has to be set for between 1-255 secs.');
			}
		}
	},
	help: '`!timer <sec>` sets a timer to go off in _<sec>_ seconds.'
};
//-----------------------------------------------------------------------------
spongeBot.time = {
	
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		var now = new Date();
		
		chSend(message, now.toString());
	},
	help: 'Shows current time.'
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
			auSend(message, 'I don\'t speak for just anyone.');
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
var duelManager = {
	challengerID: {
		opponentID: 'opponentID',	//the ID of the @opponent whom the @challenger wants to duel
		status:	'idle|challenging|ready|dueling',
		/* status
		 * idle:		@challenger is not dueling and not challenging anyone to a duel
		 * challenging:	@challenger has challenged @opponent to a duel and is waiting for reciprocation
		 * ready:		@challenger and @opponent are ready and waiting for the duel to start
		 * dueling: 	@challenger and 
		 */
		duelTimer: {},				//shared by both @challenger and @opponent
		targetNumber: 0,			//Random number between 0 and 1000. @challenger's hit chance depends on the difference between their input and this number
	}
};
spongeBot.duel = {
		cmdGroup: 'Fun and Games',
		do: function(message, args) {
			/*
			 * args
			 * 0	Opponent
			 */
			var challenger = message.author.id;
			if (!args) {
				chSend(message, 'Who are you trying to duel, ' + makeTag(challenger) + '? (`!help duel` for help)');
				return;
			}
			
			args = args.split(' ');
			
			//Make sure the player specified an opponent
			if (!args[0]) {
				chSend(message, makeTag(challenger) + ', you can\'t duel nobody. (`!help duel` for help)' );
				return;
			}
			var opponent = makeId(args[0]);
			
			//If the opponent isn't in the bank record, we assume they don't exist
			if(!bankroll[opponent]) {
				chSend(message, makeTag(challenger) + ', is that one of your imaginary friends?' );
				return;
			}
			
			//If the challenger isn't in the duelManager record, we initialize them
			if(!duelManager[challenger]) {
				duelManager[challenger] = {
					status: 'idle'
				}
			}
			//If opponent isn't in the duelManager record, we initialize them
			if(!duelManager[opponent]) {
				duelManager[opponent] = {
					status: 'idle'
				}
			}
			
			var challengerEntry = duelManager[challenger];
			//If the challenger is already dueling someone, then they can't challenge anyone else until they are done dueling.
			if(challengerEntry.status === 'ready' || challengerEntry.status === 'dueling') {
				chSend(message, makeTag(challenger) + ' you are already dueling somebody! There\'s no backing out now!');
				return;
			} else if(challengerEntry.status === 'challenging' && challengerEntry.opponentID === opponent) {
				//If @challenger already challenged the opponent, then this means they are canceling the challenge
				chSend(message, makeTag(challenger) + ' has backed out of their challenge against ' + makeTag(opponent) + ' because they are too chicken!');
				challengerEntry.status = 'idle';
				delete challengerEntry.opponentID;
				return;
			}
			
			//If @challenger has already challenged someone else, then they cancel their previous challenge
			if(challengerEntry.status === 'challenging' && challengerEntry.opponentID !== opponent) {
				chSend(message, makeTag(challenger) + ' has lost interest in dueling ' + makeTag(challengerEntry.opponentID) + ' and has challenged ' + makeTag(opponent) + ' instead!');
				
			}
			//We allow the player to challenge people who are busy dueling
			
			challengerEntry.opponentID = opponent;
			challengerEntry.status = 'challenging';
			
			var opponentEntry = duelManager[opponent];
			//If @opponent previously sent @challenger a request, then the challenge is accepted
			if(opponentEntry.status === 'challenging' && opponentEntry.opponentID === challenger) {
				challengerEntry.status = 'ready';
				opponentEntry.status = 'ready';
				chSend(message, makeTag(challenger) + ' to ' + makeTag(opponent) + ': *Challenge accepted!*');
				chSend(message, makeTag(challenger) + ': Get ready!');
				chSend(message, makeTag(opponent) + ': Get ready!');
				chSend(message, 'You will be assigned a random unknown \'target\' number between 0 and 1000. When I say \"Draw!\", enter numbers with `!d <number>` to fire at your opponent! The closer your input is to the target, the more likely you will hit your opponent!');
				//Start the duel!
				var duelTimer = setTimeout(function() {
					chSend(message, makeTag(challenger) + ', ' + makeTag(opponent) + ': **Draw!**');
					
					challengerEntry.status = 'dueling';
					opponentEntry.status = 'dueling';
					
					challengerEntry.targetNumber = Math.random() * 1000;
					opponentEntry.targetNumber = Math.random() * 1000;
				}, (10 * 1000) + Math.random() * 20 * 1000);
				challengerEntry.duelTimer = duelTimer;
				opponentEntry.duelTimer = duelTimer;
				
			} else {
				//Opponent is either idle, ready, or dueling at this point
				//We wait for the opponent to reciprocate @challenger's request
				chSend(message, makeTag(challenger) + ' has challenged ' + makeTag(opponent) + ' to a duel!');
				chSend(message, makeTag(opponent) + ', if you accept this challenge, then return the favor!');
				if(opponentEntry.status === 'ready' || opponentEntry.status === 'dueling') {
					chSend(message, makeTag(challenger) + ', ' + makeTag(opponent) + ' is busy dueling ' + makeTag(opponentEntry.opponentID) + 'so they may not respond right away');
				}
			}
		},
		help: '`!duel`: Challenge another player to a duel.',
		longHelp: '`!duel`: Challenge another player to a duel. To play, the other player must challenge you back.'
	};
spongeBot.d = {
		cmdGroup: 'Fun and Games',
		do: function(message, args) {
			if (args === '') {
				chSend(message, 'Usage: `!d <number>` attempts to fire at your opponent. Chance to hit depends on difference between your input and your target number.');
			} else {
				var author = message.author.id;
				var entry = duelManager[author];
				if(!entry) {
					chSend(message, makeTag(author) + ', who are you and what are you doing here with that gun?');
				} else if(entry.status === 'dueling') {
					args = parseInt(args);
					if ((args >= 0) && (args <= 1000)) {
                        //var difference = (args - entry.targetNumber);
                        //difference = Math.min(Math.abs(difference), Math.abs(difference + 1000), Math.abs(difference - 1000));
						var difference = Math.abs(args - entry.targetNumber);
                        var chance = 100 - Math.pow(difference/50, 2) * 5;
						/* Difference	Chance
						 * 50			95
						 * 100			80
						 * 150			55
						 * 200			20
						 * 250			0
						 */
						if(Math.random()*100 < chance) {
							chSend(message, makeTag(author) + ' fires at ' + makeTag(entry.opponentID) + ' and hits!');
							chSend(message, makeTag(entry.opponentID) + ' has lost the duel with ' + makeTag(author) + '!');
							entry.status = 'idle';
							var opponentEntry = duelManager[entry.opponentID];
							opponentEntry.status = 'idle';
							delete opponentEntry.opponentID;
							delete entry.opponentID;
						} else {
							chSend(message, makeTag(author) + ' fires at ' + makeTag(entry.opponentID) + ' and misses!');
							if(difference < 50) {
                                chSend(message, makeTag(author) + ', you were so close!');
                            } else if(difference < 100) {
                                chSend(message, makeTag(author) + ', your shot just barely missed!');
                            } else if(difference < 150) {
                                chSend(message, makeTag(author) + ', your aim is getting closer!');
                            } else if(difference < 200) {
                                chSend(message, makeTag(author) + ', your aim could be better!');
                            } else if(difference < 250) {
                                chSend(message, makeTag(author) + ', try aiming at your opponent!');
                            } else {
                                chSend(message, makeTag(author) + ', you\'re aiming in the wrong direction!');
                            }
						}
					} else {
						chSend(message, '<number> must be between 0 and 1000.');
					}
				}
				else if(entry.status === 'ready') {
					chSend(message, makeTag(author) + ', *no cheating!*');
				} else if(entry.status === 'challenging') {
					chSend(message, makeTag(author) + ', sorry, but shooting at your opponent before they even accept your challenge is just plain murder.');
				} else {
					chSend(message, makeTag(author) + ', sorry, but gratuitous violence is not allowed.');
				}
			}
		},
		help: '`!d <number>`: Fire at your duel opponent.',
		longHelp: '`!d <number>`: TO DO: Help Text'
}
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
					if (!hasAccess(message.author.id, spongeBot[theCmd].access)) {
						chSend(message, 'Your shtyle is too weak ' +
						  'for that command, ' + message.author);
					} else {
						spongeBot[theCmd].do(message, parms);
					}
				} else {
					
					if (message.author.bot) {
						console.log('Blocked a bot-to-bot !command.');
					} else {	
						spongeBot[theCmd].do(message, parms);
					}
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
