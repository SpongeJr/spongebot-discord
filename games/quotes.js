//var quotes = require('../data/quotes.json');
var quotes = {
	"guild": {
		"sponge": [
			{
				"quote": "I squish, therefore, I am",
				"addedBy": "himself",
				"timestamp": 1345788910110
			},{
				"quote": "I never actually said this. It's hardcoded.",
				"addedBy": "sponge",
				"timestamp": 1414174810110
			},{
				"quote": "This quote thing would probably look great in an embed.",
				"addedBy": "SpongeBot",
				"timestamp": 1518234042000
			}
		],
		"spongebot": [
			{
				"quote": "The answer is undefined NaNNaN",
				"addedBy": "Sponge",
				"timestamp": 1507788910110
			},
			{
				"quote": "Help, I'm broken!",
				"addedBy": "itself",
				"timestamp": 1515151515100
			}
		]
	}
};
var cons = require('../lib/constants.js');
var utils = require('../lib/utils.js');
var v = {};

var Quote = function(theQ) {
	this.quote = theQ.quote || "",
	this.addedBy = theQ.addedBy || "unknown",
	this.timestamp = theQ.timestamp || new Date()
}


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
				do: function(message, parms) {
					var who = parms;
					if (quotes.guild.hasOwnProperty(who)) {
						var theStr = '';
						var userQs = JSON.stringify(quotes.guild[who]);
						userQs = JSON.parse(userQs); 
						var oneQ = utils.listPick(userQs)[0];
						theStr += '"' + oneQ.quote + '" _-' + who +'_ ';
						when = new Date(oneQ.timestamp);
						theStr += ' on: ' + when + ' (added by ' + oneQ.addedBy + ')';
						utils.chSend(message, theStr);
					}
				}
			},
			add: {
				do: function(message, parms) {
					parms = parms.split(' ');
					who = parms[0];
					parms.shift();
					var said = parms.join(' ');
					var theQ = new Quote({
						"quote": said,
						"addedBy": message.author.id,
					});
					if (!quotes.guild[who]) {
						quotes.guild[who] = [];
					}
					quotes.guild[who].push(theQ);
					utils.chSend(message, '**Added:** "' + theQ.quote + '" _-' + who +
					  '_ on ' + theQ.timestamp + ' (added by ' + message.author.id + ')');
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
			},
			save: {
				do: function(message, parms) {
					var server = cons.SERVER_ID;
					var filename = cons.QUOTES_FILE;
					utils.setStat(server, 'quotes', 'guild', quotes.guild, filename);
					console.log(quotes.guild);
					utils.chSend('Probably saved quotes file. Thank you drive through.');
				}
			}
		},
		do: function(message, parms, gameStats, bankroll) {
		
			parms = parms.split(' ');
			if (parms[0] === '') {
				utils.chSend(message, 'Quote someone .');
				return;
			}
			
			var sub = parms[0].toLowerCase(); // sub is the possible subcommand
			parms.shift(); // lop off the command that got us here
			
			if (this.subCmd.hasOwnProperty(sub)) {
				parms = parms.join(' ');
				//utils.debugPrint('>> calling subcommand .' + sub + '.do(' + parms + ')');
				this.subCmd[sub].do(message, parms);
				return;
			} else {
				utils.chSend(message, 'What are you trying to do to that quote?!');
				return;
			}
		}
	}
};