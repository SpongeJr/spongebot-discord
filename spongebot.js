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
const BOT = new Discord.Client();
const SPONGEBOT_ID = 402122635552751616;

var debugPrint =function(inpString){
// console.log optional replacement
// does not output when debugMode global is false
	if (utils.debugMode) {
		console.log(inpString);
		if (utils.enableDebugChan) {
			if ((inpString !== '') && (typeof inpString === 'string')) {
				// todo: rate limiter?
				if (inpString.length < 1024) {
					BOT.channels.get(cons.DEBUGCHAN_ID).send(inpString);
				}
			}
		}
	}
};
//-----------------------------------------------------------------------------
var spongeBot = {};
//-----------------------------------------------------------------------------
//  MODULES
//-----------------------------------------------------------------------------
const cons = require('./lib/constants.js');
var utils = require('./lib/utils.js');
//var iFic = require('./games/ific.js');
var acro = require('./games/acro.js');
var slots = require('./games/slots.js');
var tree = require('./games/loottree.js');
var raffle = require('./games/raffle');
var quotes = require('./games/quotes.js');
var adspam = require('./lib/adspam.js');
var memory = require('./games/memory.js');
var cattle = require('./games/cattle.js');

const saved = require(cons.OBJECTS_FILENAME);
var scram = {};
var scramWordLists = {
	"278588293321326594": cons.ESO_SCRAMWORDS,
	"402126095056633859": cons.PLANET_SCRAMWORDS
};
// these should be on the scram global object, but will need a refactor. tempoary spot is here in scramConfig
// note: make sure wordDelay - wordDelayVariation > guessTime to prevent overlap!
// also, timer will eventually end up in the new timer pattern I'm working on
// it just isn't ready for multi-server scram yet
var scramConfig = {
	wordDelay: 105000,
	wordDelayVariation: 15000,
	baseAward: 600,
	letterBounus: 100, 
	guessTime: 29000,
	extraGuessTime: 2500
};
var botStorage = {};
var bankroll = {};
var gameStats = require('../data/gamestats.json');
var otherStats = {};
var bankroll = require('../data/banks.json');
if (utils.debugMode) {console.log(bankroll);}

var loot = {
		discountPercent: 40,
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

	var ingredients = "banana,honey mustard,marmalade,flax seed,roast beef,potato chip,chocolate sauce,ketchup,relish,alfalfa,M&Ms,skittles,skittles (Tropical flavor),marshmallow,potato salad,egg salad,turnip,mango,spinach,kale,crushed doritos,pulled pork,porcupine,mango,artichoke,apple slice,pineapple,cabbage,rambutan,papaya,durian,bologna,kielbasa,peanut butter,canned fruit,vanilla bean,coffee bean,harvard beet,avocado,bacon,mashed potatoes,frozen peas,anchovy,lettuce,mushroom,guava,tomato,oatmeal,eggplant";
	ingredients = ingredients.split(",");
	var toppings = "bing cherries,whipped cream,chocolate syrup,mayonnaise,oregano,paprika,butter,cooking spray,marshmallow creme,green smoothie,salt and pepper,sea salt,MSG,melted cheese,pine needles,cough syrup,gravy,salsa,sauerkraut,sprinkles,turbinado sugar,maple syrup,apple butter,guacamole,Peet's coffee,applesauce,bacon bits,olive oil,shaved ice,powdered milk,molasses,tomato sauce,barbecue sauce,horseradish";
	toppings = toppings.split(",");
	var sammich = "";
	var numIngredients = Math.random() * 3 + 1;

	for (var i = 0; i < numIngredients - 1; i++) {
		sammich = sammich + utils.listPick(ingredients) + ", ";
	}

	sammich += "and " + utils.listPick(ingredients);

	if (Math.random() < 0.65) {
		sammich += " sandwich ";
	} else {
		sammich += " smoothie ";
	}

	sammich += "topped with " + utils.listPick(toppings);

	return sammich;
};
//-----------------------------------------------------------------------------
var hasAccess = function(who, accessArr) {
	return (who === cons.SPONGE_ID || who === cons.ARCH_ID);
};
//-----------------------------------------------------------------------------
var msToTime = function(inp) {
	var sec = Math.floor(inp / 1000);
	var min = Math.floor(inp / (1000 * 60));
	var hr = Math.floor(inp / (1000 * 3600));
	var day = Math.floor(inp / (1000 * 3600 * 24));

	if (sec < 60) {
		return sec + ' sec ';
	} else if (min < 60) {
		return min + ' min ' + sec % 60 + ' sec ';
	} else if (hr < 24) {
		return hr + ' hr ' + min % 60 + ' min ' + sec % 60 + ' sec ';
    } else {
		return day + ' days ' + hr % 24 + ' hr ' + min % 60 + ' min ' + sec % 60 + ' sec ';
    }
};
//-----------------------------------------------------------------------------
spongeBot.blank = {
	do: function(message) {
		message.react('410754653249339403');
	}
};
//-----------------------------------------------------------------------------
spongeBot.debug = {
	do: function(message) {
		utils.enableDebugChan = !utils.enableDebugChan;
		utils.chSend(message, 'debugging to channel is: ' + utils.enableDebugChan);
	},
	help: 'Toggles debugging to #debug-print on Planet Insomnia.'
};
spongeBot.embeds = {
	do: function(message) {
		utils.autoEmbed = !utils.autoEmbed;
		utils.chSend(message, 'automatic embeds to channel is: ' + utils.autoEmbed);
	},
	help: 'Toggles automatic embeds'
};
spongeBot.backup = {
	cmdGroup: 'Admin',
	disabled: false,
	access: [],
	do: function(message) {
		var now = new Date();
		var t = timey.timeStr(['raw'], now);
		utils.saveBanks(cons.BANK_BACKUP_FILENAME + t + '.bak', bankroll);
		utils.saveStats(cons.STATS_BACKUP_FILENAME + t + '.bak', gameStats);
		utils.chSend(message, 'I ran the backups. Probably.');
		debugPrint('!backup:  MANUALLY BACKED UP TO: ' + cons.BANK_BACKUP_FILENAME + 
		  t + '.bak and ' + cons.STATS_BACKUP_FILENAME + t + '.bak');
	}
};
//-----------------------------------------------------------------------------
spongeBot.quote = {
	help: 'Add something a user said to the quotes database, hear a random quote, and more!',
	longHelp: 'React with ' + cons.QUOTE_SAVE_EMO + ' to a message to add it the quotes databse!' +
	  ' Or, type `!quote random <user>` to see a random quote from a user.',
	do: function(message, parms) {		
		quotes.q.do(message, parms, BOT);
	}
};
/*
spongeBot.z = {
	help: 'Use `!z <text to add>` to keep a story going.',
	disabled: true,
	do: function(message, parms) {
		iFic.z.do(message, parms);
	}
};
spongeBot.zclear = {
	disabled: true,
	do: function(message, parms) {
		iFic.zclear.do(message, parms);
	}
};
spongeBot.zundo = {
	disabled: true,
	do: function(message, parms) {
		iFic.zundo.do(message, parms);
	}
};
spongeBot.zsave = {
	disabled: true,
	do: function(message, parms) {
		iFic.zsave.do(message, parms, gameStats);
	}
};
spongeBot.zchars = {
	disabled: true,
	do: function(message, parms) {
		iFic.zchars.do(message, parms);
	}
};
spongeBot.zload = {
	disabled: true,
	do: function(message, parms) {
		iFic.zload.do(message, parms, gameStats);
	}
};
spongeBot.zshow = {
	disabled: true,
	do: function(message, parms) {
		iFic.zshow.do(message, parms);
	}
};
*/


/*
var Command = function(trigger, module, config) {
	// config is optional -- uses defaults if omitted:
	//	disabled: false
	//	do: function(message, parms, gameStats, bankroll)
	//	help: module[
	
	
	
}
*/


var StoryCommand = function(name) {
	return {
		disabled: true,
		do: function(message, parms) {
			iFic[name].do(message.parms)
		}
	}
}
var zCommands = 'z,zclear,zundo,zsave,zchars,zload,zshow'.split(',');

for (let i = 0; i < zCommands.length; i++) {
	spongeBot[zCommands[i]] = new StoryCommand(zCommands[i]);
}

//-----------------------------------------------------------------------------
spongeBot.collect = {
	help: 'Collects from your weekly loot bag! What will you find?',
	do: function(message, parms) {
		tree.collectbag.do(message, parms, gameStats, bankroll);
	}
};
spongeBot.tree = {
	help: tree.help,
	longHelp: tree.longHelp,
	disabled: false,
	access: false,
	cmdGroup: tree.cmdGroup,
	do: function(message, parms) {
		tree.do(message, parms, gameStats, bankroll);
	}
}
spongeBot.loot = {
		disabled: false,
		access: false,
		timedCmd: {
			howOften: cons.ONE_HOUR,
			gracePeriod: 60000,
			failResponse: '`!loot` boxes take about an hour to recharge. ' +
			' You still have about <<next>> to wait. :watch:'
		},
        cmdGroup: 'Fun and Games',
        do: function(message, args) {
			
			// should be handled by standard .access check
			// custom message is cool though, we should add that
			/*
			if ((message.author.id !== SPONGE_ID) && (message.author.id !== ARCH_ID)) {
				utils.chSend(' You must develop your shtyle further before using loot boxes!');
				return;
			} else */
			if (args === '') {
                utils.chSend(message, 'Try `!loot unbox <name>`, `!loot boxes`, `!loot box <name>`.');
                return;
            }

            args = args.toLowerCase();
            args = args.split(' ');
           	
			if (args[0] === 'boxes' && args[1] === 'suck') {
				utils.chSend(message, 'But you gotta admit that they are *really* lucrative');
				return;
			}
			
            var action = args[0] || '';
            if (action === 'unbox') {
                var who = message.author.id;
 
                if (!bankroll[who].credits) {
                    utils.chSend(message, message.author + ', please open a `!bank` account before unboxing loot.');
                    return;
                }
                var boxName = args[1] || '';
 
                if (boxName === '') {
					utils.chSend(message, message.author + ', what do you want to unbox?');
					return;
				} else if (boxName === 'nothing') {
                    utils.chSend(message, message.author + ', you can\'t unbox nothing.');
                    return;
                } else if (boxName === 'it') {
			   		utils.chSend(message, message.author + ', do it yourself!');
					return;
			   	} else if (boxName === 'yourself') {
					utils.chSend(message, message.author + ', okay then. ');
					utils.chSend(message, '*pelts ' + message.author + ' with a barrage of wrenches, screwdrivers, cogs, nails, washers, and other machine parts.*');
					return;
				} else if (boxName === 'me') {
					utils.chSend(message, message.author + ', that would be extremely painful for you.');
					return;
				} else if (boxName === 'everything') {
					utils.chSend(message, message.author + ', that\'s impossible.');
					return;
				} else if (args[1] === 'the' && args[2] === 'pod' && args[3] === 'bay' && args[4] === 'doors') {
					utils.chSend(message, 'I\'m sorry, ' + message.author + '. I\'m afraid I can\'t do that');
					return;
				}               
                var found = false;
                for (var box in loot.boxes) {
                    if (boxName === box) {
                        found = true;
                        var price = loot.boxes[box].price;
						var discountPercent = loot.discountPercent || 0;
						/*
						utils.chSend(message, 'unboxing a ' + box);
						utils.chSend(message, 'bankroll[who] is ' + bankroll[who] + '   and price is ' + price);
						*/
						
                        if (bankroll[who].credits >= price) {
							
							if (!utils.collectTimer(message, message.author.id, 'loot', spongeBot.loot.timedCmd, gameStats)) {
								return false; // can't unbox yet!
							}	
							
							if (discountPercent > 0) {
								utils.chSend(message, message.author + ' just purchased the ' + box + ' box for ' + price * (1 - discountPercent / 100) + ' credits,' +
								  ' and got a great deal since loot boxes are ' + discountPercent + '% off right now!');
							} else {
								utils.chSend(message, message.author + ' just purchased the ' + box + ' box for ' + price + ' credits.');
							}
							
                            utils.addBank(who, -price * ( 1 - discountPercent / 100), bankroll);
                           
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
                            utils.addBank(who, valueTotal, bankroll);
                            utils.chSend(message, resultMessage);
                        } else {
                            utils.chSend(message, message.author + ' you can\'t afford the ' + box + ' box.');
                        }
                        return;
                    }
                }
               
                if (!found) {
                    utils.chSend(message, message.author + ', you can\'t unbox something that doesn\'t exist.');
                }
            } else if (action === 'boxes') {
				var reply = message.author + ', here are the loot boxes that I have in stock: ';
				for (var box in loot.boxes) {
					reply += '`' + box + '`, ';
				}
				utils.chSend(message, reply);
			} else if(action === 'box') {
				var boxName = args[1] || '';
				if(boxName === '') {
					utils.chSend(message, message.author + ', which loot box would you like to learn more about?');
					return;
				}
				for(var box in loot.boxes) {
					if(box === boxName) {
						var boxEntry = loot.boxes[box];
						var desc = 'The ' + box + ' box.';
						desc += '\nDescription: ' + boxEntry.description;
						desc += '\nPrice: ' + boxEntry.price + ' credits';
						desc += '\nContains ' + boxEntry.count + ' items from the following selection.';

						//List out the items
						var itemTable = boxEntry.items;
						for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
							var itemEntry = itemTable[itemIndex];
							desc += '\n' + itemEntry.emoji + ' (chance: ' + itemEntry.rarity + '; value: ' + itemEntry.value + ')';
						}
						utils.chSend(message, desc);
						return;
					}
				}
				utils.chSend(message, utils.makeTag(message.author.id) + ', unknown loot box');
			}
           
        },
        help: '`!loot`: Buy a loot box and see what\'s inside!',
		longHelp: 'Try `!loot unbox <name>`, `!loot boxes`, `loot box <name>`, etc.'
    };
//-----------------------------------------------------------------------------
spongeBot.pickfrom = {
	cmdGroup: 'Fun and Games',
	help: 'Pick a random item from a list.',
	longHelp: 'Use `!pickfrom` <item1> [item2] [item3] [...] to pick a random item from your list '+
	  'using a pRNG. Items must be separated by spaces.',
	do: function(message, parms) {
		if (!parms) {
			utils.chSend(message, 'You need a list to `pickfrom`. Use `!help pickfrom` for more info.');
			return;
		}
		
		parms = parms.split(' ');
		if (parms.length < 2) {
			utils.chSend(message, 'You need at least two items on a list to `pickfrom`, separated' +
			  ' by spaces. Use `!help pickfrom` for more info.');
			return;
		}
		
		if (parms.length > 255) {
			utils.chSend(message, 'Maximum `!pickfrom` choices is 255 for arbitrary reasons. I suggest' +
			  ' using an alternate method for making your decision, or whatever you\'re trying to do.');
			return;
		}
		
		utils.chSend(message, message.author + ', my selection from your list of ' + parms.length +
		  ' choices is: ' + utils.listPick(parms));
	}
};
spongeBot.roll = {
	cmdGroup: 'Fun and Games',
	do: function (message, parms){
		
		if (!parms) {
			utils.chSend(message, 'See `!help roll` for help.');
			return;
		}
		
		parms = parms.split('d');
		var x = parms[0];
		var y = parms[1];
		
		if (x && y) {
			x = parseInt(x);
			y = parseInt(y);
			
			if (x > 20) {
				utils.chSend(message, '`!roll`: No more than 20 dice please.');
				return;
			}
			
			if (x < 1) {
				utils.chSend(message, '`!roll`: Must roll at least one die.');
				return;
			}
			
			if (y < 2) {
				utils.chSend(message, '`!roll`: Dice must have at least 2 sides.');
				return;
			}
			
			if (y > 10000) {
				utils.chSend(message, '`!roll`: Max sides allowed is 10000.');
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
			utils.chSend(message, str);
		} else {
			utils.chSend(message, 'Use `!roll `X`d`Y to roll X Y-sided dice.');
		}
	},
	help: '`!roll <x>d<y>` rolls a `y`-sided die `x` times and gives results.',
	longHelp: '`!roll <x>d<y>` rolls a `y`-sided die `x` times and gives results.' +
	'\n You can roll up to 20 dice with up to 10000 virtual "sides" each.' +
	  '\n EXAMPLE: `!roll 3d6` would roll 3 "fair" six-sided dice, display the\n' +
	  ' individual die rolls, and show the total (which would be between 3 and 18\n' +
	  ' inclusive in this example.)',
	disabled: false
};
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
			utils.chSend(message, message.author + ' nothing to ROT-13!');
			return false;
		}
		utils.chSend(message, message.author + ': `' + outp + '`');
    },
	help: '`!rot13 <message>` spits back the ROT-13 ciphertext of your message.',
	longHelp: '	You could use this in DM and then use the result in public chat if you were giving spoilers or something I guess.',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.enable = {
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			utils.chSend(message, 'Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'enable') {
			utils.chSend(message, ':yodawg:');
		}
		spongeBot[parms].disabled = false;
		utils.chSend(message, parms + '.disabled: ' +
		  spongeBot[parms].disabled);
	},
	help: 'Enables a bot command. Restricted access.',
	access: true
};
spongeBot.disable = {
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			utils.chSend(message, 'Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'disable') {
			utils.chSend(message, ':yodawg:');
		} else if (parms === 'enable') {
			utils.chSend(message, 'Don\'t disable enable. Just don\'t.');
			return;
		}
		spongeBot[parms].disabled = true;
		utils.chSend(message, parms + '.disabled: ' +
		  spongeBot[parms].disabled);
	},
	help: 'Disables a bot command. Restricted access.',
	access: true
};
spongeBot.restrict = {
	access: true,
	cmdGroup: 'Admin',
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			utils.chSend(message, 'Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'restrict') {
			utils.chSend(message, ':yodawg: you can\'t !restrict .restrict');
			return;
		}
		
		if (spongeBot[parms].hasOwnProperty('access')) {
			spongeBot[parms].access = !spongeBot[parms].access;
		} else {
			spongeBot[parms].access = false;
		}
		utils.chSend(message, '`!' + parms + '` needs special access:  ' +
		  spongeBot[parms].access);
	},
	help: ':warning: Toggles whether commands require special access.'
	
};
//-----------------------------------------------------------------------------
spongeBot.server = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		var server = message.guild;
		
		if (!server) {
			utils.auSend(message, ' Doesn\'t look like you sent me that message on _any_ server!');
			return;
		}
		
		var str = ' You are on ' + server.name + ', which has the id: ' + 
		  server.id + '. It was created on: ' + server.createdAt + '.';
		
		utils.chSend(message, str);
	},
	help: 'Gives info about the server on which you send me the command.'
};
//-----------------------------------------------------------------------------
spongeBot.showCode = {
	do: function(message, parms) {
		var theCode = spongeBot[parms];
		
		utils.chSend(message, theCode);
		debugPrint(theCode);
	},
	help: 'shows code.',
	disabled: true
};
//-----------------------------------------------------------------------------
spongeBot.sammich = {
	timedCmd: {
		howOften: 1000 * 60 * 3, 
		gracePeriod: 10000,
		failResponse: 'Hey! You can only have a <<cmd>> every <<howOften>> ! ' +
		' And that\'s not for like, <<next>> yet, which would be at <<nextDate>>. ' +
		' You last had me make you a `!sammich` at <<lastDate>>, which was <<last>> ago.'
	},
	cmdGroup: 'Fun and Games',
	do: function(message) {
		if (!utils.collectTimer(message, message.author.id, 'sammich', spongeBot.sammich.timedCmd, gameStats)) {
			return false; // can't use it yet!
		}
		utils.chSend(message, 'How about having a ' + sammichMaker() + ' for a snack?   :yum:');
	},
	help: '`!sammich` whips you up a tasty random sandwich (65% chance) or smoothie (35% chance)'
};
//-----------------------------------------------------------------------------
spongeBot.s = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		var server = message.guild;
		
		if (!server) {
			utils.auSend(message, 'The word scramble game is meant to be played in public, and '+
			'not direct messages. Sorry! It\'s more fun with others, anyway!');
			return;
		}

		parms = parms.toLowerCase();
		
		if (!scram.hasOwnProperty(server.id)) {
			debugPrint('!s: No key ' + server.id + ' in scram variable! Someone probably ran !s before !scram.');
			utils.chSend(message, 'Please start `!scram` before guessing a scrambled word.');
			return;
		}
		
		if (!scram[server.id].hasOwnProperty('runState')) {
			debugPrint('!s: No key .runState in scram.' + server.id + ' Maybe someone ran !s before !scram.');
			utils.chSend(message, 'Please start `!scram` before guessing a scrambled word.');
			return;
		}
		
		if (scram[server.id].runState !== 'guessing') {
			utils.chSend(message, 'You can\'t guess the scrambled word now! ' +
			  'You need to wait for a new word to unscramble!');
			return;
		}
		
		if (parms === scram[server.id].word) {
			var who = message.author.id;
			scram[server.id].runState = 'gameover';
			utils.addBank(message.author.id, parseInt(scramConfig.baseAward + scramConfig.letterBounus * scram[server.id].word.length), bankroll);
			var outStr = message.author + ' just unscrambled the word in ';
			var now = new Date();
			var speed = now - scram[server.id].guessStartTime;
			var fastest = utils.getStat(who, 'scram', 'fastest', gameStats) || 0;
			outStr += (speed / 1000).toFixed(1) + ' seconds and wins ';
			outStr += parseInt(scramConfig.baseAward + scramConfig.letterBounus * scram[server.id].word.length ) + ' credits!';
			if (fastest <= 0 || speed < fastest) {
				outStr += '\n :zap: That\'s a new fastest time for them! :zap:';
				utils.setStat(who, 'scram', 'fastest', speed, gameStats);
			}
			
			utils.alterStat(message.author.id, 'scram', 'wins', 1, gameStats);
			outStr += '\n' + message.author + ' has now unscrambled ' +
			  gameStats[message.author.id].scram.wins + ' words!';
			utils.chSend(message,  outStr);
		} else {
			//utils.chSend(message, 'Not the word.');
		}
	},
	help: 'Use `!s <word>` to submit a guess in the `!scram` ' +
	  'word scramble game.',
	disabled: false
};
spongeBot.scram = {
	subCmd: {},
	do: function(message, parms, gameStats, bankroll) {
		var server = message.guild;
		if (!server) {
			utils.auSend(message, 'The word scramble game is meant to be played in public, and '+
			'not direct messages. Sorry! It\'s more fun with others, anyway!');
			return;
		}
		
		parms = parms.split(' ');
		if (parms[0] !== '') {
			parms[0] = parms[0].toLowerCase();
			if (spongeBot.scram.subCmd.hasOwnProperty(parms[0])) {
				//we've found a found sub-command, so do it...
				spongeBot.scram.subCmd[parms[0]].do(message, parms);
				return; // we're done here
			}
			// ignore non-sub-command extra stuff they type
		}
		
		if (!scram.hasOwnProperty(server.id)) {
			// key doesn't exist for this server, so init
			debugPrint('!scram: Adding instance for ' + server.id + ' (' +
			  server.name + ')');
			scram[server.id] = {};
			scram[server.id].announce = true;
			scram[server.id].runState = 'ready';
		}
		
		if (scram[server.id].runState === 'ready') {
			var wordList;
			// does this server have a custom word list? use if so
			if (scramWordLists.hasOwnProperty(server.id)) {
				wordList = scramWordLists[server.id];
			} else {
				// use default list
				wordList = cons.SCRAMWORDS;
			}
			var keys = Object.keys(wordList);
			var theCat = keys[parseInt(Math.random() * keys.length)];
			var catWords = wordList[theCat].split(',');
			var theWord = utils.listPick(catWords)[0];
			scram[server.id].word = theWord;
			
			// find all the blanks and put their positions into an array
			// do the scramble
			// remove all the blanks again, and splice back into places
			var spaceArr = [];
			for (var i = 0; i < theWord.length; i++) {
				if (theWord.charAt(i) === ' ') {spaceArr.push(i);}
			}
			var scramWord = scrambler(theWord);
			scramWord = scramWord.replace(/ /g, '');
			spaceArr.forEach(function(spaceInd) {
				scramWord = scramWord.slice(0, spaceInd) + ' ' + scramWord.slice(spaceInd);
			});		  
			utils.chSend(message, 'Unscramble this: ' + utils.bigLet(scramWord) + 
			  '   *Category*: ' + theCat);
			  
			var theDelay = parseInt(scramConfig.wordDelay - (scramConfig.wordDelayVariation / 2) +
			  Math.random() * scramConfig.wordDelayVariation);
			var guessTime = scramConfig.guessTime + scramConfig.extraGuessTime * theWord.length;
			var theMess = 'You have ' + parseInt(guessTime / 1000) + 
			  ' seconds to guess by typing `!s <guess>`. Next word available in ' + 
			  parseInt(theDelay / 1000) + ' seconds.';
			utils.chSend(message, theMess);
			scram[server.id].runState = 'guessing';
			
			scram[server.id].timer = setTimeout(function() {
				if (scram[server.id].runState !== 'ready') {
					scram[server.id].runState = 'ready';
					if (scram[server.id].announce) {
						utils.chSend(message, 'There\'s a new `!scram` word ready!');
					}
				}
			}, theDelay);
			scram[server.id].guessStartTime = new Date();
			scram[server.id].guessTimer = setTimeout(function() {
				if (scram[server.id].runState === 'guessing') {
					utils.chSend(message, 'The `!scram` word was not guessed' +
					' in time! The word was: ' + scram[server.id].word);
					scram[server.id].runState = 'gameover';
				}
			}, guessTime);
		} else {
			utils.chSend(message, '`!scram` is not ready just yet.');
		}
	},
    help: '`!scram` starts the scramble game or checks to see if it\'s ready',
	cmdGroup: 'Fun and Games',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.raffle = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		raffle.do(message, parms, gameStats, bankroll);
	},
	help: 'Commands for working with raffles'
};
spongeBot.ticket = {
	do: function(message, parms) {
		raffle.subCmd.ticket.do(message, parms, gameStats);
	},
	access: true,
	disabled: false,
	help: '`!ticket <who> <#>` Gives <#> tickets to <who>. With no #, gives one.'
};
spongeBot.giveaways = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		raffle.giveaways.do(message, parms, gameStats);
	},
	help: '`!giveaways` lists any currently running contests, giveaways, freebies, and other fun stuff.' +
	  '\n`!giveaways list` shows all the current choices for raffle prizes.' +
	  '\n`!giveaways list <category>` lets you see all items on `!giveaways list` of a certain category.' +
	  '\n`!giveaways categories` lets you see the categories on `!giveaways list.`' +
  	  '\n`!giveaways addrole` gives you the "giveaways" role which means you will get pinged (at any time of day) ' +
	  'when there\'s something interesting going on related to giveaways.'
};
//-----------------------------------------------------------------------------
spongeBot.give = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		
		var giver = message.author.id;
		
		if (!parms) {
			utils.chSend(message, 'Who are you trying to `!give` credits ' +
			  ' to, ' + utils.makeTag(giver) + '? (`!help give` for help)');
			return;
		}
			
		parms = parms.split(' ');
			
		if (!parms[1]) {
			utils.chSend(message, 'No amount specified to `!give`, ' + 
			  utils.makeTag(giver) + '. (`!help give` for help)' );
			return;
		}
			
		var who = utils.makeId(parms[0]);
		var amt = parseInt(parms[1]);

		if (isNaN(amt)) {
			utils.chSend(message, utils.makeTag(giver) + ', that\'s not a number to me.');
			return;
		}
		
		if (amt === 0) {
			utils.chSend(message, utils.makeTag(giver) + ' you want to give *nothing*? ' + 
			  'Ok, uh... consider it done I guess.');
			return;
		}
		
		if (amt < 0) {
			utils.chSend(message, utils.makeTag(giver) + ' wouldn\'t that be *taking*?'); 
			return;
		}
		
		if (bankroll[giver] < amt) {
			utils.chSend(message, 'You can\'t give what you don\'t have, ' +
			  utils.makeTag(giver) + '!');
			return;
		}
		
		if (!bankroll.hasOwnProperty(giver)) {
			utils.chSend(message, 'You\'ll need a bank account first, ' +
			  utils.makeTag(giver) + '!');
			return;
		}
		
		if (amt === 1) {
			utils.chSend(message, 'Aren\'t you the generous one, ' + utils.makeTag(giver) + '?');
		}
	
		if (!utils.addBank(who, amt, bankroll)) {
			utils.chSend(message, 'Failed to give to ' + who);
		} else {
			utils.addBank(giver, -amt, bankroll);
			utils.chSend(message, ':gift: OK, I moved ' + amt +
			  ' of your credits to ' + utils.makeTag(who) + ', ' + giver);
		}
	},
	help: '`!give <user> <amount>` gives someone some of your credits.',
	disabled: false
};
spongeBot.gift = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		if (message.author.id === cons.SPONGE_ID) {
			
			if (!parms) {
				utils.chSend(message, 'You forgot the target to !gift.');
				return;
			}
			
			parms = parms.split(' ');
			
			if (!parms[1]) {
				utils.chSend(message, 'No amount specified to `!gift`');
				return;
			}
			
			var who = utils.makeId(parms[0]);
			var amt = parseInt(parms[1]);
			
			if (!utils.addBank(who, amt, bankroll)) {
				utils.chSend(message, 'Failed to give to ' + who);
			} else {
				utils.chSend(message, 'OK, gave ' + utils.makeTag(who) + ' ' + amt + ' credits!');
			}
		}
	},
	help: 'If you are a sponge, `!gift <user> <amount>` gives someone some credits.',
	access: true
};
spongeBot.bank = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		var who;
		parms = parms.split(' ');

		if (parms[0] === '') {
			who = message.author.id;
			
			if (typeof bankroll[who] === 'undefined') {
				utils.chSend(message, utils.makeTag(who) + ', I don\'t see an account ' +
				  'for you, so I\'ll open one with ' + cons.START_BANK + ' credits.');
				
				/*
				var server = bot.guilds.get(SERVER_ID);
				var role = server.roles.find('name', 'Tester');
			
				if (server.roles.has('name', 'Tester')) {
					debugPrint(' we have a tester!');
				}
				
				//message.member.roles.has(message.guild.roles.find("name", "insert role name here"))
				*/
				bankroll[who] = {};
				bankroll[who].credits = cons.START_BANK;
				utils.saveBanks(cons.BANK_FILENAME, bankroll);
				debugPrint('New bankroll made for ' + who + ' via !bank.');
			} 
		} else {
			who = utils.makeId(parms[0]);
		}
		
		if (typeof bankroll[who] === 'undefined') {
			utils.chSend(message, message.author + ', they don\'t have a bank account.');
		} else if (isNaN(bankroll[who].credits)) {
			utils.chSend(message, message.author + ' that bank account looks weird, thanks' +
			  ' for pointing it out. I\'ll reset it to ' + cons.START_BANK);
			bankroll[who].credits = cons.START_BANK;
			utils.saveBanks(cons.BANK_FILENAME, bankroll);
			debugPrint('Corrupted bankroll fixed for ' + who + ' via !bank.');
			  
		} else {
			utils.chSend(message, utils.makeTag(who) + ' has ' + bankroll[who].credits + ' credits.');
			utils.chSend(message, utils.makeTag(who) +
			' has ' + (utils.getStat(who, 'raffle', 'ticketCount', gameStats) || 'no ') + ' :tickets: s.');
		}
	},
	help: '`!bank <user>` reveals how many credits <user> has. With no <user>, ' +
	  'will either show your own bank, or create a new account for you.'
};
spongeBot.exchange = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		if (parms  === 'iamsure') {
			
			if (!bankroll.hasOwnProperty(message.author.id)) {
				utils.chSend(message, message.author + ', you have no bank ' +
				'account.  You can open one with `!bank`.');
				return;
			}
			
			if (!bankroll[message.author.id].hasOwnProperty('credits')) {
				// had no credits proprety
				utils.chSend(message, message.author + ', you have a bank ' +
				'account but no credits account. You have no credits to speak of.');
				return;
			}
			
			if (bankroll[message.author.id].credits < 100000) {
				utils.chSend(message, message.author + ', you don\'t have enough credits.');
				return;
			}
			
			utils.addBank(message.author.id, -100000, bankroll);
			var newTix = utils.alterStat(message.author.id, 'raffle', 'ticketCount', 1, gameStats);
			utils.chSend(message, message.author + ', you now have ' +
			  bankroll[message.author.id].credits + ' credits, and ' + newTix + ' tickets.');
		} else {
			utils.chSend(message, message.author + ', be sure you want to tade 100K ' +
			  'credits for one raffle ticket, then type `!exchange iamsure` to do so.');
		}
	},
	help: '`!exchange iamsure` trades 100,000 credits for a raffle ticket. Make sure you really want to do this.'
};
//-----------------------------------------------------------------------------
spongeBot.savebanks = {
	do: function() {
		utils.saveBanks(cons.BANK_FILENAME, bankroll);
	},
	help: 'Saves all bank data to disk. Should not be necessary to invoke manually.',
	disabled: true
};
spongeBot.loadstats = {
	cmdGroup: 'Admin',
	do: function(message) {
		loadStats(botStorage);
		utils.chSend(message, 'OK. Stats loaded manually.');
	},
	help: 'force a stat reload from persistent storage',
	access: [],
	disabled: true
};
spongeBot.savestats = {
	cmdGroup: 'Admin',
	do: function(message) {
		utils.saveStats(cons.STATS_FILENAME, gameStats);
		utils.chSend(message, 'OK. Stats saved manually.');
	},
	help: 'force a stat save to persistent storage',
	access: [],
	disabled: true	
};
spongeBot.delstat = {
	cmdGroup: 'Admin',
	do: function(message, parms) {
		// forreal user game [stat]
		parms = parms.split(' ');
		if (parms[0] !== 'forreal') {
			utils.chSend(message, 'Are you **for real** ' + message.author);
			return;
		} else {
			var who = utils.makeId(parms[1]);
			var game = parms[2];
			var stat = parms[3];
			
			if(!gameStats.hasOwnProperty(who)) {
				utils.chSend(message, 'Can\'t find uid ' + who);
				return;
			}
				
			if (!gameStats[who].hasOwnProperty(game)) {
				utils.chSend(message, 'Can\'t find game `' + game + '` for uid ' + who);
				return;
			}

			if (!parms[3]) {
				utils.chSend(message, 'Deleting GAME ' + game + ' from USER ' + who);
				delete gameStats[who][game];
				return;
			} else {
				if (!gameStats[who][game].hasOwnProperty(stat)) {
					utils.chSend(message, 'Can\'t find stat `' + stat + '` for game ' +
					game + ' for uid ' + who);
					return;
				}
				utils.chSend(message, 'Deleting STAT ' + stat + ' from GAME ' + game + 
				  ' from USER ' + who);
				delete gameStats[who][game][stat];
			}
		}
	},
	help: 'Deletes a game stat, or even an entire game from a user\'s stat.',
	longHelp: 'Use: !delstat forreal <user> <game> [stat]. ' +
	' Will delete a whole game if you don\'t specify stat! Be extra careful!',
	access: true,
	disabled: true
};
spongeBot.getstat = {
	access: [],
	disabled: false,
	cmdGroup: 'Admin',
	do: function(message, parms) {
		
		parms = parms.split(' ');
		if (!parms[0]) {
			console.log(parms[0]);
			utils.chSend(message, '!getstat: No user specified');
			return;
		}
		
		var who = utils.makeId(parms[0]);
		var game = parms[1];
		var stat = parms[2];
		
		if (typeof gameStats[who] === 'undefined') {
			console.log(who);
			utils.chSend(message, '!getstat: No such user in stats database');
			return;
		}
		
		var results = utils.getStat(who, game, stat, gameStats);
		
		if (typeof results === 'object') {
			utils.chSend(message, 'USER: ' + who + '   GAME: ' + game +  ' STAT: ' + stat +
			  ' is:\n' + JSON.stringify(results));
		} else {
			utils.chSend(message, 'USER: ' + who + '   GAME: ' + game +  ' STAT: ' + stat + ' is:\n' + results);
		}
	},
	help: 'Returns the literal value of a stat or all stats of one game for a user',
	longHelp: 'Use !getstat <user> <game> [stat] to return the literal value of a stat object ' +
	  ' or game stat object. Limited access.'
};
spongeBot.setstat = {
	cmdGroup: 'Admin',
	do: function(message, parms) {
		parms = parms.split(' ');
		if (!parms[0]) {
			utils.chSend(message, 'Use: !setstat <user> <game> <stat> ' +
			  ' <newValue> and be careful with it!');
			return;
		}
		utils.chSend(message, 'USER: ' + parms[0] + '  GAME: ' + parms[1] +
		  '  STAT: ' + parms[2] + ' is now ' +
		  utils.setStat(utils.makeId(parms[0]), parms[1], parms[2], parms[3], gameStats));
	},
	help: 'Sets a game stat. limited access.',
	longHelp: 'Use !setstat <user> <game> <stat> <newValue>. Be careful! ' +
	'Will create new user, game, or stat as needed!',
	access: true,
	disabled: true
};
spongeBot.alterother = {
	do: function(message, parms) {
		parms = parms.split(' ');
		if (!parms[0]) {
			utils.chSend(message, 'Use: !alterother <user> <game> <stat> ' +
			  ' <adjustAmount> and be careful with it!');
			return;
		}
		utils.chSend(message, 'In OTHER stats file, USER: ' + parms[0] + '  GAME: ' + parms[1] +
		  '  STAT: ' + parms[2] + ' is now ' +
		  utils.alterStat(utils.makeId(parms[0]), parms[1], parms[2], parseInt(parms[3]), otherStats, cons.DATA_DIR  + 'otherstats.json'));
	},
	help: 'does an alterStat on the "alternate stat file". for toasting porpoises. limited access.',
	longHelp: 'Be careful with it! Will create new stats, games, or even users!',
	disabled: true
};
spongeBot.alterstat = {
	do: function(message, parms) {
		parms = parms.split(' ');		
		if (!parms[0]) {
			utils.chSend(message, 'Use: !alterstat <user> <game> <stat> ' +
			  ' <adjustAmount> and be careful with it!');
			return;
		}
		
		utils.chSend(message, 'USER: ' + parms[0] + '  GAME: ' + parms[1] +
		  '  STAT: ' + parms[2] + ' is now ' +
		  utils.alterStat(utils.makeId(parms[0]), parms[1], parms[2], parseInt(parms[3]), gameStats));
	},
	help: 'changes a game stat. limited access.',
	longHelp: 'Be careful with this, it will create new stats, games or even users!',
	access: true,
	disabled: true
};
spongeBot.stats = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		var who;
		
		if (!parms) {
			who = message.author.id;
		} else {
			who = utils.makeId(parms);
		}
		
		if (!gameStats[who]) {
			utils.chSend(message, message.author + ', I don\'t have any stats for them.');
			return;
		}
		
		var theStr = ' :bar_chart:  STATS FOR ' + who + '  :bar_chart:\n```';
		
		for (var game in gameStats[who]) {
			theStr += '> ' + game + ':\n';
			for (var stat in gameStats[who][game]) {
				theStr += '    ' + stat + ': ' + gameStats[who][game][stat] + '\n';
			}
		}
		theStr += '```';
		utils.chSend(message, theStr);
		
		if (message.mentions.users.has(who)) {
			// there was an @ mention, and it matches the id sent up
			// so we can pass a user up to addNick for nick nicking
			var user = message.mentions.users.find('id', who);
			utils.addNick(who, user.username, gameStats);
		}
		
		if (!parms) {
			// no parms were sent, so we can nick message.author 's nick
			if (message.author.id) {
				utils.addNick(message.author, message.author.username, gameStats);
			}
		}
		
	},
	help: '`!stats <user>` shows game stats for <user>. Omit <user> for yourself.'
};
spongeBot.topstats = {
	disabled: false,
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		if (parms === '') {
			utils.chSend(message, 'Type `!topStats` followed by the game name.');
			return;
		}
		
		parms = parms.split(' ');
		
		// iterates over the whole gameStats array, probably very expensive

		var gameData = {};
		for (var who in gameStats) {
			for (var game in gameStats[who]) {
				if (game === parms[0]) {				
					for (var stat in gameStats[who][game]) {	
						if (!gameData.hasOwnProperty(stat)) {
							gameData[stat] = {};
						}
						gameData[stat][who] = gameStats[who][game][stat];
					}
				}
			}
		}
		var outStr = '  **`' + parms[0] +'`**';
		for (var stat in gameData) {
			outStr = '```\n'+ parms[0] + ' stat: "' + stat + '"```\n';
			for (var who in gameData[stat]) {
				outStr += gameData[stat][who] + ': @' + who + '\n';
			}
			utils.chSend(message, outStr + '\n');
		}
	},
	help: 'Shows the top players for a SpongeBot game, and other stats.',
	longHelp: 'Use !topStats <game name>'
};
//-----------------------------------------------------------------------------
spongeBot.slots = {
	cmdGroup: 'Fun and Games',
	disabled: false,
 	do: function(message, parms) {
		slots.do(message, parms, gameStats, bankroll);
	},
	help: '`!slots`: give the slot machine a spin!',
	longHelp: ' Use `!slots spin <bet>` to put credits into the slot machine' +
	  ' and give it a spin! You can also use `!slots paytable` to see the ' +
	  ' current payout table, as well as `!slots stats` to see your stats. ' +
	  ' You can use `!slots reset` if you want to reset your stats.'
};
//-----------------------------------------------------------------------------
var buildHelp = function() {
	
	var theHelp = {};
	for (var cmd in spongeBot) {
	
		// we now no longer show uncategorized commands
		if (spongeBot[cmd].cmdGroup) {		
			var cGroup = '';
			cGroup = spongeBot[cmd].cmdGroup;
			/*
			if (!spongeBot[cmd].cmdGroup) {
				cGroup = 'Uncategorized';
			} else {
				cGroup = spongeBot[cmd].cmdGroup;
			}
			*/
			
			if (!theHelp[cGroup]) {theHelp[cGroup] = '';}
		
			if (spongeBot[cmd].disabled !== true) {
				if (spongeBot[cmd].access) {
					//theHelp[cGroup] += '*'
				} else {
					theHelp[cGroup] += '`!' + cmd + '`: ';
				
					if (spongeBot[cmd].help) {
						theHelp[cGroup] += spongeBot[cmd].help;
					}
					theHelp[cGroup]+= '\n';
				}
			}
		}
	}
	return theHelp;
};
spongeBot.help = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		if (parms) {
			if (typeof spongeBot[parms] !== 'undefined') {	
				if (spongeBot[parms].longHelp) {
					utils.chSend(message, spongeBot[parms].longHelp);
				} else if (spongeBot[parms].help) {
					utils.chSend(message, spongeBot[parms].help);
				} else {
					utils.chSend(message, 'I have no help about that, ' + message.author);
				}
			} else {
				utils.chSend(message, 'Not a command I know, ' + message.author);
			}
		} else {
			// no parms supplied, show help on everything in a DM
			
			if (!botStorage.fullHelp) {
				// "cached" help doesn't exist, so build it...
				debugPrint('!help: building help text for first time');
				botStorage.fullHelp = buildHelp();
			} 
			
			// since help text is built, just regurgitate it
			utils.chSend(message, message.author + ', incoming DM spam!');
			for (var cat in botStorage.fullHelp) {
				if (cat !== 'Admin') {
					utils.auSend(message, '\n**' + cat +'**\n' + botStorage.fullHelp[cat]);
				}
			}
			utils.auSend(message, ' Type `!help <command>` for more info on a specific command.');
			}
		},
	help: '`!help`: for when you need somebody, not just anybody. '
};
//-----------------------------------------------------------------------------
spongeBot.timer = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {

		if (parms === '') {
			utils.chSend(message, 'Usage: `!timer <sec>` sets a timer to go off in _<sec>_ seconds.');
		} else {
			parms = parseInt(parms);
			if ((parms >= 1) && (parms <= 255)) {
				setTimeout(function() {
					utils.chSend(message, 'Ding ding! Time is up!');
				}, (parms * 1000));
			} else {
				utils.chSend(message, 'Timer has to be set for between 1-255 secs.');
			}
		}
	},
	help: '`!timer <sec>` sets a timer to go off in _<sec>_ seconds.'
};
var timey = {
	timeStr: function(parms, when) {		
		if (!parms[0]) {
			return when.toTimeString();
		}
		
		if (parms[0] === 'long') {
			return when.toString();
		}
		
		if (parms[0] === 'iso') {
			return when.toISOString();
		}
		
		if (parms[0] === 'raw') {
			return when.valueOf();
		}
		
		if (parms[0] === 'diff') {
			// <t1, t2>, returns difference between the two -- either order (abs value)
			var timeElapsed = msToTime(Math.abs(parseInt(parms[1]) - parseInt(parms[2])));
			return timeElapsed;
		}
		
		if ((parms[0] === 'nextWeek') || (parms[0] === 'nextDay')) {
			// <time> tells how long from now until <time + (1 day | 1 week)> or if it's already passed
			var howMuch;
			var when;
			if (parms[0] === 'nextWeek') {howMuch = cons.ONE_WEEK;} else {howMuch = cons.ONE_DAY;}
			when = parseInt(parms[1]) + howMuch - when.valueOf();
			if (when < 0) {
				return 'That was ' + msToTime(Math.abs(when)) + ' ago';
			} else {
				return 'Coming up in ' + msToTime(when);	
			}
		}
	}
};
spongeBot.time = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		var now = new Date();
		var outp = '';
		parms = parms.split(' ');
		outp = '`' + timey.timeStr(parms, now) + '`';
		utils.chSend(message, outp);
	},
	help: '`!time [ long | iso | raw ]`: Shows current time.',
	longHelp: '`time [long | iso | raw]`: Shows current time.' +
	  '`!time long` includes the date. ' + 
	  '`!time iso` gives an ISO standard time and date' +
	  '`!time raw` gives you milliseconds since Jan 1, 1970' +
	  '`!time diff <t1> <t2>` returns a plain-language difference of two ' +
	    ' dates or times supplied in ms since Jan 1, 1970 format',
	access: false
};
//-----------------------------------------------------------------------------
spongeBot.say = {
	access: [],
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {		
		if (parms === '') {return;}			
		var chan;
		if (parms.startsWith('#')) {
			parms = parms.slice(1).split(' ');
			chan = parms[0];
			parms.shift();
			parms = parms.join(' ');
		} else {
			chan = cons.MAINCHAN_ID;
		}
		BOT.channels.get(chan).send(parms);		
	},
	help: '`!say <stuff>` Make me speak. (limited access command)'
};
//-----------------------------------------------------------------------------
spongeBot.avote = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		acro.avote(message, parms, gameStats);
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
		utils.chSend(message, ':octagonal_sign: `!acro` has been stopped if it was running.');
	},
	help: '`!stopacro` stops the currently running `!acro` game.',
	access: true
};
spongeBot.acrocfg = {
	do: function(message, parms) {
		parms = parms.split(' ');
		
		if (!parms[0]) {
			for (var opt in acro.config) {
				utils.chSend(message, opt + ': ' + acro.config[opt]);
			}
		} else {
			if (acro.config.hasOwnProperty([parms[0]])) {
					
				// handle Booleans
				if (parms[1] === 'false') {parms[1] = false;}
				else if (parms[1] === 'true') {parms[1] = true;}
				
				acro.config[parms[0]] = parms[1];
				utils.chSend(message, '`!acro`: set ' + parms[0] + ' to ' + parms[1] + '.');
			} else {
				utils.chSend(message, '`!acro`: can\'t config ' + parms[0]);
			}
		}
	},
	help: 'Configures the acro game.',
	access: true
};
spongeBot.acro = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		acro.do(message, parms, gameStats, bankroll);
	},
	help:	'`!acro`: Starts up the acronym game. Set custom options with the format `<parameter>:<argument>`, where' +
		' parameter is one of `letters`, `table`, `length`, `playtime`, or `category` and `<argument>` is the ' +
		'value that you want to assign to that parameter.',
	longHelp:	'`!acro`: Starts up the acronym game. Set custom options with the format `<parameter>:<argument>`, where' +
			'where parameter is one of `letters`, `table`, `length`, `playtime`, or `category`, and `<argument>` is the ' +
			'value that you want to assign to that parameter.' + '\n' +
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
		acro.a(message, parms);
	},
	help: '`!a <Your Acronym Here>`: Submits your entry in `!acro`',
	longHelp: '`!a <Your Acronym Here>`: Submits your entry in the acronym game,\n' +
	  '`!acro`. For more info, see `!acro help` or watch an acro game in play.'
};
//-----------------------------------------------------------------------------
spongeBot.who = {
	cmdGroud: 'Admin',
	access: false,
	do: function(message, parms) {
		var memb;
		var outStr = '';
		if (parms) {
			memb = message.guild.members.find('id', parms);
			if (memb) {
				outStr =  'Looks like ' + memb.user.username + ' to me. ';
				if (memb.nickname) {
					outStr += ' Around these parts we call them ' + memb.nickname;
				}
				utils.chSend(message, outStr);
			} else {
				utils.chSend(message, 'Doesn\'t like like someone we know in these parts.');
			}
		}
	}
};
//-----------------------------------------------------------------------------
spongeBot.arch = {
	access: [],
	cmdGroup: 'Admin',
	do: function(message, args) {
		if(message.author.id === cons.ARCH_ID) {
			utils.chSend(message, utils.makeTag(cons.ARCH_ID) + ', your bank has been reset');
			if (!bankroll.hasOwnProperty(cons.ARCH_ID)) {
				bankroll[cons.ARCH_ID] = {}; // just in case user doesn't exist
			}
			bankroll[cons.ARCH_ID] = {"credits": 50000};
		} else {
			utils.chSend(message, utils.makeTag(cons.ARCH_ID) + ', we\'ve been spotted! Quick, hide before they get us!');
		}
	},
};
//-----------------------------------------------------------------------------
spongeBot.biglet = {
	cmdGroup: 'Miscellaneous',
	do: function(message, txt) {
		if (txt === '') {
			utils.chSend(message, message.author + ', I have nothing to supersize.');
			return;
		}
		
		if (txt.length > 80) {
			utils.chSend(message, message.author + ', message too big!');
			return;
		}
		utils.chSend(message, utils.bigLet(txt));
	},
	help: '`!biglet <message>` says your message back in big letters'
};
//-----------------------------------------------------------------------------
spongeBot.cattle = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		cattle.do(message, args, gameStats, bankroll);
	},
	help: cattle.help,
	longHelp: cattle.longHelp,
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
		kills: 0,
		deaths: 0
	}
};
spongeBot.duel = {
		cmdGroup: 'Fun and Games',
		do: function(message, args) {
			/*
			 * args
			 * 0	challenge	info
			 * 1	opponent	subject
			 */
			var challenger = message.author.id;
			//If the challenger isn't in the duelManager record, we initialize them
			if(!duelManager[challenger]) {
				duelManager[challenger] = {
					status: 'idle',
					kills: 0,
					deaths: 0
				};
			}
			if (!args) {
				utils.chSend(message, 'Who are you trying to duel, ' + utils.makeTag(challenger) + '? (`!help duel` for help)');
				return;
			}
			
			args = args.split(' ');
			
			if(!args[0]) {
				utils.chSend(message, utils.makeTag(challenger) + ', use `!help duel`');
				return;
			}
			var action = args[0];
			
			if(action === 'info') {
				var subject = challenger;
				if(args[1]) {
					subject = utils.makeId(args[1]);
				}
				//Quit if the subject isn't in the bank record
				if(!bankroll[subject]) {
					utils.chSend(message, utils.makeTag(challenger) + ', is that one of your imaginary friends?');
					return;
				}
				//If subject isn't in the duelManager record, we initialize them
				if(!duelManager[subject]) {
					duelManager[subject] = {
						status: 'idle',
						kills: 0,
						deaths: 0
					};
				}
				var subjectEntry = duelManager[subject];
				var status = subjectEntry.status;
				var reply = '`!duel` info about ' + utils.makeTag(subject);
				if(status === 'idle') {
					reply += '\nStatus: Idle';
				} else if(status === 'challenging') {
					reply += '\nStatus: Waiting to duel ' + utils.makeTag(subjectEntry.opponentID) + ' with a bet of ' + subjectEntry.bet + ' credits';
				} else {
					reply += '\nStatus: Currently dueling ' + utils.makeTag(subjectEntry.opponentID + ' with a bet of ' + subjectEntry.bet + ' credits');
				}
				
				for(var user in duelManager) {
					var userEntry = duelManager[user];
					if(userEntry.status === 'challenging' && userEntry.opponentID === subject) {
						reply += '\nPending challenge from ' + utils.makeTag(user) + 'with a bet of ' + userEntry.bet + ' credits.'; 
					}
				}
				reply += '\nKills: ' + subjectEntry.kills;
				reply += '\nDeaths: ' + subjectEntry.deaths;
				reply += '\nKill/Death Ratio: ' + (subjectEntry.kills/subjectEntry.deaths);
				utils.chSend(message, reply);
			} else if(action === 'challenge') {
				if (!args[1]) {
					utils.chSend(message, utils.makeTag(challenger) + ', you can\'t duel nobody. (`!help duel` for help)' );
					return;
				}
				var opponent = utils.makeId(args[1]);
				
				//If the opponent isn't in the bank record, we assume they don't exist
				if(!(bankroll[opponent] >= 0)) {
					utils.chSend(message, utils.makeTag(challenger) + ', is that one of your imaginary friends?' );
					return;
				}
				var challengerEntry = duelManager[challenger];
				var bet = parseInt(args[2]);
				//Check for NaN
				if(isNaN(bet)) {
					bet = 0;
				}
				if(bet < 0) {
					utils.chSend(message, utils.makeTag(challenger) + ', if you\'re looking for a loan, please look somewhere else.');
					return;
				} else if(bet > 0) {
					if(bankroll[challenger] < bet) {
						utils.chSend(message, utils.makeTag(challenger) + ', you can\'t bet what you don\'t have!');
						return;
					}
					//If everything's good, then we prepare the bets later
				}
				
				//If opponent isn't in the duelManager record, we initialize them
				if(!duelManager[opponent]) {
					duelManager[opponent] = {
						status: 'idle',
						kills: 0,
						deaths: 0
					};
				}
				//If the challenger is already dueling someone, then they can't challenge anyone else until they are done dueling.
				if(challengerEntry.status === 'ready' || challengerEntry.status === 'dueling') {
					utils.chSend(message, utils.makeTag(challenger) + ' you are already dueling somebody! There\'s no backing out now!');
					return;
				} else if(challengerEntry.status === 'challenging' && challengerEntry.opponentID === opponent) {
					//If @challenger already challenged the opponent, then this means they are canceling the challenge
					utils.chSend(message, utils.makeTag(challenger) + ' has backed out of their challenge against ' + utils.makeTag(opponent) + ' because they are too chicken!');
					challengerEntry.status = 'idle';
					//Return bet
					if(challengerEntry.bet > 0) {
						utils.chSend(message, utils.makeTag(challenger) + ', your previous bet of ' + challengerEntry.bet + ' credits was returned.');
						utils.addBank(challenger, challengerEntry.bet, bankroll);
					}
					
					delete challengerEntry.opponentID;
					delete challengerEntry.bet;
					return;
				} else if(challengerEntry.status === 'challenging' && challengerEntry.opponentID !== opponent) {
					//If @challenger has already challenged someone else, then they cancel their previous challenge
					utils.chSend(message, utils.makeTag(challenger) + ' has lost interest in dueling ' + utils.makeTag(challengerEntry.opponentID) + ' and has challenged ' + utils.makeTag(opponent) + ' instead' + ((bet > 0) ? (' with a bet of ' + bet + ' credits!') : '!'));
					challengerEntry.opponentID = opponent;
					//Return bet
					if(challengerEntry.bet > 0) {
						utils.chSend(message, utils.makeTag(challenger) + ', your previous bet of ' + challengerEntry.bet + ' credits was returned.');
						utils.addBank(challenger, challengerEntry.bet, bankroll);
					}
					
					
					//Update the bet
					utils.addBank(challenger, -bet, bankroll);
					challengerEntry.bet = bet;
				}
				//We allow the player to challenge people who are busy dueling
				
				challengerEntry.opponentID = opponent;
				challengerEntry.status = 'challenging';
				
				var opponentEntry = duelManager[opponent];
				//If @opponent previously sent @challenger a request, then the challenge is accepted
				if(opponentEntry.status === 'challenging' && opponentEntry.opponentID === challenger) {
					challengerEntry.status = 'ready';
					opponentEntry.status = 'ready';
					utils.chSend(message, utils.makeTag(challenger) + ' to ' + utils.makeTag(opponent) + ': *Challenge accepted!*');
					utils.chSend(message, utils.makeTag(challenger) + ': Get ready!');
					utils.chSend(message, utils.makeTag(opponent) + ': Get ready!');
					utils.chSend(message, 'You will be assigned a random unknown \'target\' number between 0 and 1000. When I say \"Draw!\", enter numbers with `!d <number>` to fire at your opponent! The closer your input is to the target, the more likely you will hit your opponent!');
					//Start the duel!
					var duelTimer = setTimeout(function() {
						utils.chSend(message, utils.makeTag(challenger) + ', ' + utils.makeTag(opponent) + ': **Draw!**');
						
						challengerEntry.status = 'dueling';
						opponentEntry.status = 'dueling';
						
						challengerEntry.targetNumber = Math.random() * 1000;
						opponentEntry.targetNumber = Math.random() * 1000;
					}, (10 * 1000) + Math.random() * 20 * 1000);
					challengerEntry.duelTimer = duelTimer;
					opponentEntry.duelTimer = duelTimer;
					
					var stalemateTimer = setTimeout(function() {
						//If nobody wins, we don't pay out any bets
						utils.chSend(message, 'The duel between ' + utils.makeTag(challenger) + ' and ' + utils.makeTag(opponent) + ' has ended in a stalemate! All bets have been claimed by me.');
						//addBank(challenger, challengerEntry.bet);
						//addBank(opponent, opponentEntry.bet);
						delete challengerEntry.bet;
						delete opponentEntry.bet;
						delete challengerEntry.stalemateTimer;
						delete opponentEntry.stalemateTimer;
					}, 300 * 1000);
					challengerEntry.stalemateTimer = stalemateTimer;
					opponentEntry.stalemateTimer = stalemateTimer;
				} else {
					//Update the bet
					utils.addBank(challenger, -bet, bankroll);
					challengerEntry.bet = bet;
					
					//Opponent is either idle, ready, or dueling at this point
					//We wait for the opponent to reciprocate @challenger's request
					utils.chSend(message, utils.makeTag(challenger) + ' has challenged ' + utils.makeTag(opponent) + ' to a duel' + ((bet > 0) ? (' with a bet of ' + bet + ' credits!') : '!'));
					utils.chSend(message, utils.makeTag(opponent) + ', if you accept this challenge, then return the favor!');
					if(opponentEntry.status === 'ready' || opponentEntry.status === 'dueling') {
						utils.chSend(message, utils.makeTag(challenger) + ', ' + utils.makeTag(opponent) + ' is busy dueling ' + utils.makeTag(opponentEntry.opponentID) + 'so they may not respond right away');
					}
				}
			} else {
				utils.chSend(message, utils.makeTag(challenger) + ', use `!help duel`');
			}
		},
		help: '`!duel challenge <user>`: Challenge another user to a duel.\n' +
		  '`!duel info <user>`: Shows duel info about user.',
		longHelp: '`!duel challenge <user>`: Challenge another user to a duel. To play, the other user must challenge you back.' +
		  '`!duel info <user>`: Shows duel info about user.'
	};
spongeBot.d = {
		cmdGroup: 'Fun and Games',
		do: function(message, args) {
			if (args === '') {
				utils.chSend(message, 'Usage: `!d <number>` attempts to fire at your opponent. Chance to hit depends on difference between your input and your target number.');
			} else {
				var author = message.author.id;
				var entry = duelManager[author];
				if(!entry) {
					utils.chSend(message, utils.makeTag(author) + ', who are you and what are you doing here with that gun?');
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
							utils.chSend(message, utils.makeTag(author) + ' fires at ' + utils.makeTag(entry.opponentID) + ' and hits!');
							utils.chSend(message, utils.makeTag(entry.opponentID) + ' has lost the duel with ' + utils.makeTag(author) + '!');
							
							var reward = entry.bet;
							if(reward > 0) {
								utils.chSend(message, utils.makeTag(author) + ' has won back the bet of ' + reward + ' credits.');
								utils.addBank(author, reward, bankroll);
							}
							
							var opponent = entry.opponentID;
							var opponentEntry = duelManager[opponent];
							
							//Prevent credit duplication here
							if(author !== opponent) {
								reward = opponentEntry.bet;
								if(reward > 0) {
									utils.chSend(message, utils.makeTag(author) + ' has won ' + utils.makeTag(opponent) + '\'s bet of ' + reward + ' credits.');
									utils.addBank(author, reward, bankroll);
								}
								
								//We also take up to our bet amount in credits from the opponent
								reward = Math.min(entry.bet, bankroll[opponent]);
								if(reward > 0) {
									utils.chSend(message, utils.makeTag(author) + ' has also won ' + reward + ' credits from ' + utils.makeTag(opponent) + '!');
									utils.addBank(author, reward, bankroll);
									utils.addBank(opponent, -reward, bankroll);
								}
							}
							
							
							
							entry.status = 'idle';
							opponentEntry.status = 'idle';
							
							delete entry.opponentID;
							delete opponentEntry.opponentID;
							delete entry.bet;
							delete opponentEntry.bet;
							
							//clear out stalemate timer
							clearTimeout(entry.stalemateTimer);
							clearTimeout(opponentEntry.stalemateTimer);
							
							delete entry.stalemateTimer;
							delete opponentEntry.stalemateTimer;
							
							entry.kills++;
							opponentEntry.deaths++;
						} else {
							utils.chSend(message, utils.makeTag(author) + ' fires at ' + utils.makeTag(entry.opponentID) + ' and misses!');
							if(difference < 50) {
                                utils.chSend(message, utils.makeTag(author) + ', you were so close!');
                            } else if(difference < 100) {
                                utils.chSend(message, utils.makeTag(author) + ', your shot just barely missed!');
                            } else if(difference < 150) {
                                utils.chSend(message, utils.makeTag(author) + ', your aim is getting closer!');
                            } else if(difference < 200) {
                                utils.chSend(message, utils.makeTag(author) + ', your aim could be better!');
                            } else if(difference < 250) {
                                utils.chSend(message, utils.makeTag(author) + ', try aiming at your opponent!');
                            } else {
                                utils.chSend(message, utils.makeTag(author) + ', you\'re aiming in the wrong direction!');
                            }
						}
					} else {
						utils.chSend(message, '<number> must be between 0 and 1000.');
					}
				}
				else if(entry.status === 'ready') {
					utils.chSend(message, utils.makeTag(author) + ', *no cheating!*');
				} else if(entry.status === 'challenging') {
					utils.chSend(message, utils.makeTag(author) + ', sorry, but shooting at your opponent before they even accept your challenge is just plain murder.');
				} else {
					utils.chSend(message, utils.makeTag(author) + ', sorry, but gratuitous violence is not allowed.');
				}
			}
		},
		help: '`!d <number>`: Fire at your duel opponent.',
		longHelp: '`!d <number>`: TO DO: Help Text'
};
//-----------------------------------------------------------------------------
var sponge = {};
spongeBot.sponge = {
	timedCmd: {
		howOften: 20000,
		gracePeriod: 0,
		failResponse:  '   :warning:  You cannot polymorph back yet.'
	},
	cmdGroup: 'Miscellaneous',
	do: function(message, args) {
		var author = message.author.id;
		var found = false;
		if (!utils.collectTimer(message, author, 'sponge', spongeBot.sponge.timedCmd, gameStats)) {
			return false; // can't use it yet!
		}		
		
		
		for(var key in sponge) {
			if(key === author) {
				found = true;
				delete sponge[key];
			}
		}
		if(!found) {
			sponge[author] = true;
			utils.chSend(message, utils.makeTag(author) + ', you have been polymorphed into a sponge!');
		} else {
			utils.chSend(message, utils.makeTag(author) + ', you have been polymorphed back to normal!');
		}
	},
	help: 'TODO',
	longHelp: 'TODO'
};
//-----------------------------------------------------------------------------
spongeBot.v = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		utils.chSend(message, '`' + cons.VERSION_STRING + '`');
	},
	help: 'Outputs the current bot code cons.VERSION_STRING.'
};
spongeBot.version = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		utils.chSend(message, ':robot:` SpongeBot v.' + cons.VERSION_STRING + ' online.');
		utils.chSend(message, cons.SPONGEBOT_INFO);
	},
	help: 'Outputs the current bot code version and other info.'
};
spongeBot.bind = {
	help: '`!bind <newCommand> <oldCommand>` to make an alias, but don\'t hose yourself. Limited access.',
	access: [],
	cmdGroup: 'Admin',
	do: function(message, parms) {
		parms = parms.split(' ');
		var newCom = parms[0];
		var oldCom = parms[1];
		
		spongeBot[newCom] = spongeBot[oldCom];
	}
};
//-----------------------------------------------------------------------------
var hangman = {
	answer: '',		//The answer
	display: '',	//The string that gets displayed
	hint: '',
	characters: [],	//The characters that players have given
	chances: 0,		//The number of incorrect guesses until game over
	active: false,	//Whether a game is currently running
	reward: 0,		//The reward for the winner
	displayCharacters: function() {
		var last = hangman.characters.length-1;
		if(last === -1) {
			return 'None';
		}
		var result = '';
		for(var i = 0; i < last; i++) {
			result += hangman.characters[i] + ' ';
		}
		if(last > -1) {
			result += hangman.characters[last];
		}
		return result;
	}
};
spongeBot.hangman = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		args = args.split(' ');
		var action = args[0] || '';
		action = action.toLowerCase();
		if(action === '') {
			if(!hangman.active) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', hangman is currently inactive. Start new game with `!hangman start <answer> <hint>`.');
			} else {
				var reply = 'Hangman';
				reply += '\nAnswer: ' + '`' + hangman.display + '`';
				reply += '\nHint: ' + hangman.hint;
				reply += '\nCharacters: ' + hangman.displayCharacters();
				reply += '\nChances Left: ' + hangman.chances;
				reply += '\nBounty: ' + hangman.reward;
				utils.chSend(message, reply);
			}
			return;
		} else if(action === 'start') {
			if(!hangman.active) {
				var answer = args[1] || '';
				if(answer === '') {
					utils.chSend(message, utils.makeTag(message.author.id) + ', please specify an answer');
					return;
				}
				//https://stackoverflow.com/questions/23476532/check-if-string-contains-only-letters-in-javascript
				//Check alphabetic only
				if(!(/^[a-z0-9\s]+$/i.test(answer))) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', I\'m not sure I can read that');
					return;
				}
				hangman.answer = answer;
				hangman.display = '';
				for(var i = 0; i < answer.length; i++) {
					if(answer.charAt(i) === ' ') {
						hangman.display += ' ';
					} else {
						hangman.display += '_';
					}
					
				}
				
				hangman.hint = '';
				for(var i = 2; i < args.length; i++) {
					if(args[i]) {
						hangman.hint += args[i] + ' ';
					}
				}
				hangman.characters = [];
				hangman.chances = 5;
				hangman.reward = 300;
				hangman.active = true;
				utils.chSend(message, utils.makeTag(message.author.id) + ' has taken a random person for hostage and has threatened to hang the hostage unless someone guesses the secret password! The hostage has promised a reward of ' + hangman.reward + ' credits to whoever reveals the correct answer!');
				utils.chSend(message, 'Answer: `' + hangman.display + '`');
				utils.chSend(message, 'Hint: ' + hangman.hint);
			} else {
				utils.chSend(message, utils.makeTag(message.author.id) + ', a game of hangman is already running');
			}
			return;
		}
		
		if(!hangman.active) {
			utils.chSend(message, utils.makeTag(message.author.id) + ', hangman is currently inactive. Start new game with `!hangman start <answer> <hint>`.');
			return;
		}
		
		//These actions only apply to an active game
		if(action === 'character') {
			var character = args[1] || '';
			if(character === '') {
				utils.chSend(message, utils.makeTag(message.author.id) + ', I\'m not sure that nothingness itself is a character.');
				return;
			} else if(character.length > 1) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', only one character at a time, please!');
				return;
			} else if(!(/^[a-z0-9\s]+$/i.test(character))) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', I don\'t think I\'ve seen that character before');
				return;
			}
			character = character.toLowerCase();
			for(var i = 0; i < hangman.characters.length; i++) {
				if(character === hangman.characters[i]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', someone already guessed that character.');
					return;
				}
			}
			var found = 0;
			var nextDisplay = '';
			for(var i = 0; i < hangman.answer.length; i++) {
				if(hangman.answer.charAt(i).toLowerCase() === character) {
					nextDisplay += hangman.answer.charAt(i);
					found++;
				} else {
					nextDisplay += hangman.display.charAt(i);
				}
			}
			hangman.display = nextDisplay;
			hangman.characters.push(character);
			if(found > 0) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', you have found ' + found + ' instances of ' + character.toUpperCase() + ' in the answer.');
				utils.chSend(message, 'Answer: `' + hangman.display + '`');
				//Check if we already revealed the answer
				for(var i = 0; i < hangman.answer.length; i++) {
					if(hangman.answer.charAt(i).toLowerCase() !== hangman.display.charAt(i).toLowerCase()) {
						return;
					}
				}
				
				utils.chSend(message, utils.makeTag(message.author.id) + ' has completed the answer!');
				utils.chSend(message, utils.makeTag(message.author.id) + ' wins ' + hangman.reward + ' credits!');
				utils.addBank(message.author.id, hangman.reward, bankroll);
				hangman.active = false;
				return;
			} else {
				utils.chSend(message, utils.makeTag(message.author.id) + ', you have found 0 instances of ' + character.toUpperCase() + ' in the answer.');
				utils.chSend(message, 'Answer: `' + hangman.display + '`');
				hangman.chances--;
				if(hangman.chances < 1) {
					utils.chSend(message, 'The hangman has died! Game over!');
					utils.chSend(message, utils.makeTag(message.author.id) + ', think about what you have done! The hangman is now dead because of you!');
					hangman.active = false;
				} else {
					utils.chSend(message, hangman.chances + ' chances remain!');
				}
			}
		} else if(action === 'answer') {
			var answer = args[1] || '';
			if(answer === '') {
				utils.chSend(message, utils.makeTag(message.author.id) + ', what? Cat got your tongue? If you have an answer, then speak!');
			} else if(answer.toLowerCase() === hangman.answer.toLowerCase()) {
				utils.chSend(message, utils.makeTag(message.author.id) + ' speaks the correct answer and saves the day!');
				utils.chSend(message, utils.makeTag(message.author.id) + ' wins ' + hangman.reward + ' credits!');
				utils.addBank(message.author.id, hangman.reward, bankroll);
				hangman.active = false;
			} else {
				utils.chSend(message, utils.makeTag(message.author.id) + ', that is not the correct answer!');
				hangman.chances--;
				if(hangman.chances < 1) {
					hangman.active = false;
					utils.chSend(message, 'The hangman has died! Game over!');
					utils.chSend(message, utils.makeTag(message.author.id) + ', think about what you have done! The hangman is now dead because of you!');
				} else {
					utils.chSend(hangman.chances + ' chances remain!');
				}
			}
		} else if(action === 'quit') {
			utils.chSend(message, utils.makeTag(message.author.id) + ' has decided to put the hangman out of his misery!');
			hangman.active = false;
		} else {
			utils.chSend(message, utils.makeTag(message.author.id) + ' you\'re going to do ***WHAT*** to the hangman?!');
		}
	},
	help: 'TODO',
	longHelp: 'TODO',
};
//-----------------------------------------------------------------------------
spongeBot.memory = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		memory.do(message, args, gameStats, bankroll);
	},
	help: 'TODO',
	longHelp: 'TODO'
};
//-----------------------------------------------------------------------------
var minesweeper = {
	grid: {},			//An object containing a field for each cell (boolean; true if mine, false if empty)
	display: {},		//An object containing a field for each cell (string, name of char to display)
	mineCount: 0,		//Number of mines placed
	cellsLeft: 0,		//Number of invisible cells remaining
	width: 42,		//Max: 42
	height: 42,		//Max: 42
	active: false,
	getDisplay: function() {
		var result = '';
		for(var x = 0; x < minesweeper.width; x++) {
			var cell = '' + x + '_' + (minesweeper.height - 1);
			result += minesweeper.display[cell];
		}
		for(var y = minesweeper.height - 2; y > -1; y--) {
			result += '\n';
			for(var x = 0; x < minesweeper.width; x++) {
				var cell = '' + x + '_' + y;
				result += minesweeper.display[cell];
			}
			
		}
		return result;
	},
	sendDisplay: function(message) {
		/*
		result = result.split('\n');
		var send = '';
		for(var i = 0; i < result.length; i++) {
			var line = result[i];
			if(send.length + line.length > 1999) {
				utils.chSend(message, send);
				send = line;
			} else {
				send += line;
			}
		}
		if(send.length > 0) {
			utils.chSend(message, send);
		}
		*/
		utils.chSend(message, '```\n' + minesweeper.getDisplay() + '\n```');
	},
	countSurroundingMines: function(x, y) {
		var grid = minesweeper.grid;
		return	(grid[(x-1) + '_' + (y-1)] ? 1 : 0) +
			(grid[(x-1) + '_' + (y)] ? 1 : 0) +
			(grid[(x-1) + '_' + (y+1)] ? 1 : 0) +
			(grid[(x) + '_' + (y-1)] ? 1 : 0) +
			(grid[(x) + '_' + (y+1)] ? 1 : 0) +
			(grid[(x+1) + '_' + (y-1)] ? 1 : 0) +
			(grid[(x+1) + '_' + (y)] ? 1 : 0) +
			(grid[(x+1) + '_' + (y+1)] ? 1 : 0);
	},
	getSurrounding: function(x, y) {
		var result = [];
		result.push({x:x-1, y:y-1});
		result.push({x:x-1, y:y});
		result.push({x:x-1, y:y+1});
		result.push({x:x, y:y-1});
		result.push({x:x, y:y+1});
		result.push({x:x+1, y:y-1});
		result.push({x:x+1, y:y});
		result.push({x:x+1, y:y+1});
		return result;
	},
	reveal: function(x, y) {
		//Return true if this space used to be hidden, false otherwise
		var cell = '' + x + '_' + y;
		//minesweeper.display[cell] = [':blank1:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:'][surrounding];
		if(minesweeper.display[cell] === '.') {
			minesweeper.cellsLeft--;
			var mines = minesweeper.countSurroundingMines(x, y);
			minesweeper.display[cell] = [' ', '1', '2', '3', '4', '5', '6', '7', '8', '9'][mines];
			return true;
		} else {
			return false;
		}
		
	}
};
spongeBot.minesweeper = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		args = args.split(' ');
		var action = args[0] || '';
		if(action === '') {
			if(minesweeper.active) {
				utils.chSend(message, 'Minesweeper');
				minesweeper.sendDisplay(message);
			} else {
				utils.chSend(message, utils.makeAuthorTag(message) + ', minesweeper is currently inactive. Start a new game with `!minesweeper start`.');
			}
			return;
		} else if(action === 'start') {
			minesweeper.grid = {};
			minesweeper.display = {};
			var width = minesweeper.width;
			var height = minesweeper.height;
			minesweeper.mines = 0;
			minesweeper.cellsLeft = width*height;
			//Place mines
			for(var x = 0; x < width; x++) {
				for(var y = 0; y < height; y++) {
					var cell = '' + x + '_' + y;		//Name that we will use to access this point
					var mine = (Math.random() < 0.4);	//boolean; if true, this cell contains a mine
					minesweeper.grid[cell] = mine;
					if(mine) {
						minesweeper.mines++;
					}
					//minesweeper.display[cell] = ':white_large_square:';
					minesweeper.display[cell] = '.';
				}
			}
			minesweeper.active = true;
			utils.chSend(message, utils.makeAuthorTag(message) + ' has built a deadly minefield around Sponge\'s Reef! Identify and clear all the mines before anyone gets hurt!');
			utils.chSend(message, 'Use `!minesweeper step <x> <y>` to step on a spot to see how many mines are surrounding it. If you step on a mine, then game over!');
			minesweeper.sendDisplay(message);
			return;
		}
		if(!minesweeper.active) {
			utils.chSend(message, utils.makeAuthorTag(message) + ', minesweeper is currently inactive. Start a new game with `!minesweeper start`.');
			return;
		}
		
		if(action === 'step') {
			var x = parseInt(args[1]);
			var y = parseInt(args[2]);
			debugPrint('x: ' + x + ', y: ' + y);
			if(!x || !y) {
				if(!x && !y) {
					utils.chSend(message, utils.makeAuthorTag(message) + ', invalid values for `x` and `y`.');
				} else if(!x) {
					utils.chSend(message, utils.makeAuthorTag(message) + ', invalid values for `x`.');
				} else if(!y) {
					utils.chSend(message, utils.makeAuthorTag(message) + ', invalid values for `y`.');
				}
				return;
			}
			
			//Check invalid spot
			if(x < 1 || x > minesweeper.width || y < 1 || y > minesweeper.height) {
				utils.chSend(message, utils.makeAuthorTag(message) + ' tried to slack off on the job by stepping on an invalid spot!');
				return;
			}
			
			x -= 1;
			y -= 1;
			var cell = '' + x + '_' + y;
			debugPrint('cell = ' + cell);
			
			//First step is always safe
			if(minesweeper.cellsLeft === (minesweeper.width * minesweeper.height)) {
				minesweeper.grid[cell] = false;
				minesweeper.minesLeft--;
			}
			
			if(minesweeper.grid[cell]) {
				minesweeper.active = false;
				//minesweeper.display[cell] = ':bomb:';
				minesweeper.display[cell] = 'X';
				minesweeper.sendDisplay(message);
				utils.chSend(message, utils.makeAuthorTag(message) + ' has stepped on a mine!');
				utils.chSend(message, 'Game over!');
			} else {
				var mines = minesweeper.countSurroundingMines(x, y);
				if(!minesweeper.reveal(x, y)) {
					//If this spot was already visible, then we skip
					utils.chSend(message, utils.makeAuthorTag(message) + ' has verified that an empty spot near ' + mines + ' mines is still indeed empty!');
					return;
				}
				minesweeper.sendDisplay(message);
				utils.chSend(message, utils.makeAuthorTag(message) + ' has stepped on an empty spot near ' + mines + ' mines!');
				//If this space is empty, we flood all surrounding spaces until we 
				if(mines === 0) {
					var revealed = 0;
					var surrounding = minesweeper.getSurrounding(x, y);
					for(var i = 0; i < surrounding.length; i++) {
						//If we are surrounded by empty spaces, we iterate through those spaces later
						var point_i = surrounding[i];
						var x_i = point_i.x;
						var y_i = point_i.y;
						var mines_i = minesweeper.countSurroundingMines(x_i, y_i);
						if(mines_i === 0) {
							var surrounding_i = minesweeper.getSurrounding(x_i, y_i);
							for(var j = 0; j < mines_i.length; j++) {
								surrounding.push(surrounding_i[j]);
							}
						}
						if(minesweeper.reveal(x_i, y_i)) {
							revealed++;
						}
					}
					utils.chSend(message, utils.makeAuthorTag(message) + ' has scouted the clearing and revealed ' + revealed + ' empty spaces!');
				}
				if(minesweeper.minesLeft === minesweeper.cellsLeft) {
					utils.chSend(message, 'All the mines have been located safely, and Sponge\'s Reef is safe once again!');
					minesweeper.active = false;
				}
			}
		} else if(action === 'quit') {
			utils.chSend(message, utils.makeAuthorTag(message) + ' detonated the entire minefield, turning Sponge\'s Reef into a massive crater!');
			minesweeper.active = false;
		}
	},
	help: 'TODO',
	longHelp: 'TODO'
};
//-----------------------------------------------------------------------------
BOT.on('ready', () => {
	debugPrint('Spongebot version ' + cons.VERSION_STRING + ' READY!');
	BOT.user.setGame("!help");
	if (Math.random() < 0.02) {BOT.channels.get(cons.SPAMCHAN_ID).send('I live!');}
});
//-----------------------------------------------------------------------------
BOT.on('messageReactionAdd', (react, whoAdded) => {
	if (react.emoji.name === cons.QUOTE_SAVE_EMO) {
		if (!hasAccess(whoAdded.id)) {
			utils.chSend(react.message, 'I\'m sorry, I\'m afraid I can\'t do that for you.');
		} else {
			quotes.q.addByReact(react, whoAdded, BOT);
		}
	}
});

BOT.on('message', message => {
	if (message.content.startsWith('!')) {
		var botCmd = message.content.slice(1); // retains the whole ! line, minus !
		var theCmd = botCmd.split(' ')[0];

		var parms = botCmd.replace(theCmd, ''); // remove the command itself, rest is parms
		theCmd = theCmd.toLowerCase();
		if (!spongeBot.hasOwnProperty(theCmd)) {
			// not a valid command
			return;
		}
		parms = parms.slice(1); // remove leading space
		
		if (typeof spongeBot[theCmd] !== 'undefined') {
			debugPrint('  ' + utils.makeTag(message.author.id) + ': !' + theCmd + ' (' + parms + ') : ' + message.channel);
			
			if (!spongeBot[theCmd].disabled) {
				if (spongeBot[theCmd].access) {
					// requires special access
					if (!hasAccess(message.author.id, spongeBot[theCmd].access)) {
						utils.chSend(message, 'Your shtyle is too weak ' +
						  'for that command, ' + message.author);
					} else {
						// missing spongeBot.command.do
						if (!spongeBot[theCmd].hasOwnProperty('do')) {
							debugPrint('!!! WARNING:  BOT.on(): missing .do() on ' + theCmd +
							  ', ignoring limited-access command !' + theCmd);
						} else {
							// all good, run it
							spongeBot[theCmd].do(message, parms);
						}
					}
				} else {					
					if (message.author.bot) {
						debugPrint('Blocked a bot-to-bot !command.');
					} else {
						if (!spongeBot[theCmd].hasOwnProperty('do')) {
							debugPrint('!!! WARNING:  BOT.on(): missing .do() on ' + theCmd +
							  ', ignoring user command !' + theCmd);
						} else {
							spongeBot[theCmd].do(message, parms);
						}
					}
				}
			} else {
				utils.chSend(message, 'Sorry, that is disabled.');
			}
		} else {
			// not a valid command
		}
	}
});
//=============================================================================
BOT.login(CONFIG.token);