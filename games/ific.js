var ut = require('../lib/utils.js');
var cons = require('../lib/constants.js');
var players = require('../' + cons.DATA_DIR + cons.MUD.playerFile);
var rooms = require('../' + cons.DATA_DIR + cons.MUD.roomFile);
var dungeonBuilt = false;

var v = {
	story: 'Once upon a time...',
	undoIndex: 0,
}

var defaultLook = function(item) {
	outP = '';
	outP += item.description;
	return outP;
}
var defaultDescribe = function(id) {
	// builds a standard "room description string" and returns it
	var outStr = '-=-=-=-\n';
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
var Item = function(data) {
	this.data = data || {};
	this.data.description = data.description || "Some object you spotted.",
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
			"goesto": null,
			"description": "A very plain, very default-looking door."
		},
	};
	this.data.description = data.description || "An absurdly empty space.";
	this.data.contents = data.contents || {};
	this.data.title = data.title || "A new Room";
	this.data.items = data.items || {}
};
Room.prototype.describe = defaultDescribe;
var buildDungeon = function() {
	for (var room in rooms) {
		var theRoom = new Room(rooms[room].data);
		rooms[room] = theRoom;
	}
	ut.debugPrint('SpongeMUD dungeon built.');
}
module.exports = {
	buildDungeon: buildDungeon,
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
				return;
			} 
			var pLoc = players[who].location;	
			if (typeof rooms[pLoc].data.exits[where] !== 'undefined') {
				if (!rooms[pLoc].data.exits[where].goesto) {
					chanStr = message.author + ' tried to leave via ' + where + 
					' but was unable to get anywhere!';
				} else {
					newLoc = rooms[pLoc].data.exits[where].goesto;
					players[who].location = newLoc;
					var chanStr = message.author + ' moved to "' +
					  newLoc + '" via exit: ' + where;
					ut.saveObj(players, cons.MUD.playerFile);
					ut.auSend(message, rooms[newLoc].describe(newLoc));
				}
			} else {
				chanStr = message.author + ' tried to leave via ' + where +
				  ' but that\'s not an exit!';
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
				return;
			}
			var pLoc = players[who].location;
			if (parms === 'dm') {
				ut.auSend(message, rooms[pLoc].describe(pLoc));
			} else {
				ut.chSend(message, rooms[pLoc].describe(pLoc));
			}
		}
	},
	get: {
		do: function(message, parms) {
			var who = message.author.id;
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var pl = players[who];
			parms = parms.split(' ');
			var target = parms[0];
			if (typeof rooms[pl.location].data.items[target] !== 'undefined') {
				ut.chSend(message, message.author + ' picked up ' + target + '.');
				var theItem = rooms[pl.location].data.items[target];
				pl.inventory[target] = theItem;
				delete rooms[pl.location].data.items[target];
				ut.saveObj(rooms, cons.MUD.roomFile);
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, message.author + ' tried to pick up ' + target +
				  ' in "' + pl.location + '" but it\'s not there, silly!');
			}
		}
	},
	drop: {
		do: function(message, parms) {
			var who = message.author.id;
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var pl = players[who];
			parms = parms.split(' ');
			var target = parms[0];
			if (typeof pl.inventory[target] !== 'undefined') {
				ut.chSend(message, message.author + ' dropped ' + target + '.');
				var theItem = pl.inventory[target];
				rooms[pl.location].data.items[target] = theItem;
				delete pl.inventory[target];
				ut.saveObj(rooms, cons.MUD.roomFile);
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, message.author + ' tried to drop ' + target +
				  ' in "' + pl.location + '" but they aren\'t even carrying it!');
			}
		}
	},
	inv: {
		do: function(message, parms) {
			var who = message.author.id;
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var pl = players[who];
			var outP = '';
			if (pl.inventory === {}) {
				outP = 'absolutely nothing!';
			} else {
				for (var item in pl.inventory) {
					outP += '`' + item + '`   ';
				}
			}
			ut.chSend(message, message.author + '\'s inventory: ' + outP);
		}
	},
	edroom: {
		do: function(message, parms) {
			// title, description: String
			// items: leave it out, can wizitem them
			// exits: use wizex ?
			
			var who = message.author.id;
			
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var loc = players[who].location
			parms = parms.split(' ');
			var prop = parms[0];
			parms.shift();
			parms = parms.join(' ');
			var val = parms;
			
			if (prop === 'title' || prop === 'description') {
				rooms[loc].data[prop] = val;
				ut.chSend(message, prop + ' of ' + loc + ' now:\n ' + val);
				ut.saveObj(rooms, cons.MUD.roomFile);
			} else if (prop === 'delexit') {
				parms = parms.split(' ');
				var target = parms[0];
				if (typeof rooms[loc].data.exits[target] !== 'undefined') {
					delete rooms[loc].data.exits[target];
					ut.chSend(message, 'Exit "' + target + '" deleted! :open_mouth:');
				} else {
					ut.chSend(message, target + ' is not a valid exit, can\'t delete!');
					return;
				}
			} else if (prop === 'exits') {
				parms = parms.split(' ');
				var target = parms[0];
				var exProp = parms[1];
				parms.shift();
				parms.shift();
				val = parms.join(' ');
				
				if (!target || !exProp) {
					ut.chSend(message, ' Use `edroom exits <exitId> <property> <value>`');
					return;
				}
				
				if (typeof rooms[loc].data.exits[target] !== 'undefined') {
					// exit exists. update whatever property
					rooms[loc].data.exits[target][exProp] = val;
					ut.chSend(message, 'Set exit "' + target + '".' + exProp + ' = ' + val);
					ut.saveObj(rooms, cons.MUD.roomFile);
				} else {
					// exit didn't exist. create, and create property
					rooms[loc].data.exits[target] = {};
					rooms[loc].data.exits[target][exProp] = val;
					ut.chSend(message, 'Created exit "' + target + '", then set ' + exProp + ' = ' + val);
					ut.saveObj(rooms, cons.MUD.roomFile);
				}
			} else {
				ut.chSend(message, 'Can only edit `title`, `description` or `exits` properties. ' +
				  ' or use `delexit` to delete an exit.');
			}
		}
	},
	wizroom: {
		do: function(message, parms) {
			var who = message.author.id;
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var who = message.author.id;
			parms = parms.split(' ');
			var roomId = parms[0];
			parms.shift();
			parms = parms.join(' ');
			var title = parms;
			
			if (typeof rooms[roomId] !== 'undefined') {
				ut.chSend(message, message.author + ', ' + roomId + ' is already a room!');
				return;
			}
			
			rooms[roomId] = new Room({"title": title});
			ut.chSend(message, message.author + ', ' + roomId + ' created!');
			ut.saveObj(rooms, cons.MUD.roomFile);
		}
	},
	wizitem: {
		do: function(message, parms) {
			var who = message.author.id;
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var who = message.author.id;
			var pl = players[who];
			parms = parms.split(' ');
			var itemName = parms[0];
			parms.shift();
			var itemDesc = parms.join(' ');
			
			var theItem = new Item({
				"description": itemDesc
			});
			pl.inventory[itemName] = theItem;
			ut.chSend(message, ' Gave you a ' + itemName + ' with description: ' + itemDesc +
			  ', ' + message.author);
		}
	},
	build: {
		do: function(message, parms) {
			buildDungeon();
			ut.chSend(message, 'SpongeMUD v0.foo: Dungeon may have been built.');
		}
	},
	exam: {
		do: function(message, parms) {
			var who = message.author.id;
			var pl = players[who];
			var loc = players[who].location;
			parms = parms.split(' ');
			var target = parms[0];
			
			/*
			We'd like them to be able to:
				exam <item in room>
				exam <item in inv>
				exam <exit>
				exam <sceneryItem>?
			*/
			// for now, we'll just do <item in inv>
			// and if not found, check room?
			
			var outP = '';
			var found = 0;
			if (typeof pl.inventory[target] !== 'undefined') {
				outP += '(inv.) `' + target + '`: ' + pl.inventory[target].data.description + '\n';
				found++;
			}
			if (typeof rooms[loc].data.items[target] !== 'undefined') {
				outP += '(here) `' + target + '`: ' + rooms[loc].data.items[target].data.description + '\n';
				found++;
			}
			
			if (!found) {
				outP += 'I see no ' + target + ' here.';
			}
			ut.chSend(message, outP);
		}
	},
	tele: {
		do: function(message, parms) {
			var who = message.author.id;
			var pl = players[who];
			var target = parms;
			
			if (typeof rooms[target] !== 'undefined') {
				players[who].location = target;
				ut.saveObj(players, cons.MUD.playerFile);
				ut.chSend(message, message.author + ' teleported to ' + target + '!');
				ut.auSend(message, rooms[target].describe(target));
			} else {
				ut.chSend(message, target + ' is not a valid room to teleport to.');
			}
		}
	}
};