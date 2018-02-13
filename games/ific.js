// this var is local to the module
var ut = require('../lib/utils.js');
var cons = require('../lib/constants.js');
// as is this "v" object, where I'm putting the other variables
// that I want the function to use.
// why inside another object? I can then save or move around
// all the variables easily
var v = {
	story: 'Once upon a time...',
	undoIndex: 0,
}

var players = require('../' + cons.DATA_DIR + cons.MUD.playerFile);
var defaultLook = function(item) {
	outP = '';
	outP += item.description;
	return outP;
}

var Item = function(data) {
	this.data = data || {};
	this.data.decription = data.description || "Some object you spotted.",
	this.data.hidden = false
};
Item.prototype.look = defaultLook(this);
var Player = function(data) {
	this.location = data.location || "airport",
	this.inventory = data.inventory || {
		"backpack": new Item({
			description: "You can keep some stuff in here safely."
		})
	},
	this.stats = data.stats || {
		"shtyle": "mundane",
		"speed": 120,
		"status": "normal"
	}
}
var Room = function(data) {
	// data is an object. any necessary properties not given
	// will receive default values
	
	this.data = data || {};
	
	this.data.exits = data.exits || {
		"door": {
			"goesTo": null,
			"description": "A very plain, very default-looking door."
		},
	};
	this.data.description = data.description || "An absurdly empty space.";
	this.data.contents = data.contents || {};
	this.data.title = data.title || "A new Room"
};
Room.prototype.describe = function(id) {
	// builds a standard "room description string" and returns it
	var outStr = '';
	outStr += '**' + rooms[id].data.title + '**  ' + '"`' + id + '`"\n';
	outStr += '\n' + rooms[id].data.description;
	
	// Build exits text
	if (rooms[id].data.hasOwnProperty('exits')) {
		outStr += '\n\nObvious exits: ';
		for (var exName in rooms[id].data.exits) {
			outStr += '`' + exName + '`   ';
		}
	} else {
		ut.debugPrint('!explore: WARNING! Room ' + parms + ' missing exits!');
	}
	
	// Build items text
	if (rooms[id].data.hasOwnProperty('items')) {
		outStr += '\n\nItems here: ';
		for (var itemName in rooms[id].data.items) {
			outStr += '`' + itemName + '`   ';
		}
	}
	return outStr;
}

var rooms = {
	"airport": new Room({
		"title": "A weird virtual airport.",
		"description": "A weird virtual airport in the middle of a weird " +
		  "virtual world. How did you manage to wind up here, anyway?",
		"items": {
			"brochure": {
				"description": "A small brochure but fancy brochure",
			},
			"wallet": {
				"description": "Someone's wallet is on the ground here."
			}
		},
		"exits": {
			"door": {
				"goesTo": null,
				"description": "A door against a wall."
			},
			"revolving": {
				"goesTo": "outside the airport",
				"description": "A revolving door that leads outside."
			}
		}
	}),
	"outside the airport": new Room({
		"title": "Outside a weird virtual airport.",
		"description": "On the outside of a weird virtual airport in the middle of " +
		  "a weird virtual world. How did you manage to wind up here, anyway?",
		"exits": {
			"revolving": {
				"goesTo": "airport",
				"description": "A revolving door that leads into the airport."
			}
		}
	}),
	"nowhere really": new Room({
		"exits": {
			"more nowhere": {
				goesTo: null,
				description: "This doesn't even make sense but I can go that way."
			}
		}
	})
}
module.exports = {
	z: {
		do: function(message, parms) {
			v.undoIndex = v.story.length;
			v.story += parms + ' ';
			
			if (!parms) {
				ut.chSend(message, message.author + ', you added nothing.');
			}
			
			if (v.story !== '') {
				ut.chSend(message, '```' + v.story + '```');
			} else {
				ut.chSend(message, ':pencil2: start a new story with `!z` :pen_fountain:');
			}
		},
	},
	zundo: {
		do: function(message, parms) {
			v.story = v.story.slice(0, v.undoIndex);
			v.undoIndex = v.story.length;
			if (v.story !== '') {
				ut.chSend(message, ':pencil: ```' + v.story + '```');
			} else {
				ut.chSend(message, ':pencil2: start a new story with `!z` :pen_fountain:');
			}
		}
	},
	zclear: {
		do: function(message, parms) {
			v.story = '';
			ut.chSend(message, '`Story cleared.`');
		}
	},
	zshow: {
		do: function(message, parms) {
			
			if (v.story !== '') {
				ut.chSend(message, '```' + v.story + '```');
			} else {
				ut.chSend(message, ':pencil2: start a new story with !z :pen_fountain:');	
			}
		}
	},
	zsave: {
		do: function(message, parms, gameStats) {
			ut.setStat(message.author.id, 'profile', 'story', v.story, gameStats);
			ut.chSend(message, 'I saved the current story to your profile' +
			  message.author + '! You can check it out with `!stats` for now.');
		}
	},
	zload: {
		do: function(message, parms, gameStats) {
			var loadedStory = ut.getStat(message.author.id, 'profile', 'story', gameStats);
			if (!loadedStory) {
				ut.chSend(message, 'I see no story on your profile, so I\'ll keep the ' +
				'current story as it is, ' + message.author + '.');
			} else {
				v.story = loadedStory;
				ut.chSend(message, 'I\'ve loaded the story on your profile, ' + message.author);
			}
		}
	},
	zchars: {
		do: function(message, parms) {
			var ch = v.story.length;
			if (!ch) {
				ut.chSend(message, 'There is no story to speak of.\n' +
				  'You can start one with `!z`.');
			} else {
				ut.chSend(message, '`Current story: ' + ch + ' characters.`');
			}
		}
	},
	explore: {
		do: function(message, parms) {

			if (rooms.hasOwnProperty(parms)) {
				ut.chSend(message, rooms[parms].describe(parms));
			} else {
				ut.chSend(message, 'You want to explore ' + parms + ', eh?' +
				  ' I don\'t really know that place.');
			}
			
		}
	},
	go: {
		do: function(message, parms) {
			who = message.author.id;
			parms = parms.split(' ');
			where = parms[0];
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
			} else {
				var pLoc = players[who].location;	
				if (typeof rooms[pLoc].data.exits[where] !== 'undefined') {
					
					if (!rooms[pLoc].data.exits[where].goesTo) {
						chanStr = message.author + ' tried to leave via ' + where + 
						' but was unable to get anywhere!';
					} else {
						newLoc = rooms[pLoc].data.exits[where].goesTo;
						players[who].location = newLoc;
						var chanStr = message.author + ' moved to "' +
						  newLoc + '" via exit: ' + where;
						ut.auSend(message, rooms[newLoc].describe(newLoc));
					}
				} else {
					chanStr = message.author + ' tried to leave via ' + where +
					  ' but that\'s not an exit!';
				}
			}	
			ut.chSend(message, chanStr);
		}
	},
	joinmud: {
		do: function(message, parms) {
			who = message.author.id;
			if (typeof players[who] === 'undefined') {
				players[who] = new Player({});
				ut.chSend(message, ' Created new player: ' + message.author.id);
				ut.saveObj(players, cons.MUD.playerFile);
				var pLoc = players[who].location;
				ut.auSend(message, rooms[pLoc].describe(pLoc));
			} else {
				ut.chSend(message, ' You\'re already a SpongeMUD player. Awesome!');
			}
		}
	},
	look: {
		do: function(message, parms) {
			who = message.author.id;
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
			} else {
				var pLoc = players[who].location;
				ut.auSend(message, rooms[pLoc].describe(pLoc));
			}
		}
	},
	get: {
		do: function(message, parms) {
			var who = message.author.id;
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
			} else {
				var pl = players[who];
				parms = parms.split(' ');
				var target = parms[0];
				if (typeof rooms[pl.location].data.items[target] !== 'undefined') {
					ut.chSend(message, message.author + ' wants to pick up ' + target + '.');
				} else {
					ut.chSend(message, message.author + ' tried to pick up ' + target +
					  ' in "' + pl.location + '" but it\'s not there, silly!');
				}
			}
		}
	}
};