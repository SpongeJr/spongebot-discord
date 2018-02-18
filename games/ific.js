var ut = require('../lib/utils.js');
var cons = require('../lib/constants.js');
var players = require('../' + cons.DATA_DIR + cons.MUD.playerFile);
var rooms = require('../' + cons.DATA_DIR + cons.MUD.roomFile);
var dungeonBuilt = false;
var noWiz = true;
var terseTravel = false;

var v = {
	story: 'Once upon a time...',
	undoIndex: 0,
}

const postureStr = {
	'standing': 'is standing',
	'sitting': 'is sitting',
	'resting': 'is resting',
	'asleep': 'is sleeping'
}
const isPlayer = function(who) {
	return typeof players[who] !== 'undefined';
};
var defaultLook = function(item) {
	outP = '';
	outP += item.description;
	return outP;
};
var eMaster = function(eventName, where, sender, data, client) {
	
	if (eMaster.listens[eventName]) {
		// legit event type, so...
		
		if (eventName === 'roomSay') {
			if (!eMaster.listens.roomSay[where]) {
				// no listeners in this room.
				return;
			}
			
			for (var lisNum = 0; lisNum < eMaster.listens.roomSay[where].length; lisNum++) {
				console.log(' Calling back listener #' + lisNum);
				eMaster.listens.roomSay[where][lisNum].callback(sender, data, client);
			}
		}
	}
}
eMaster.listens = {
	'roomSay': {},
	'roomDrop': {},
	'roomEnter': {},
	'roomExit': {},
	'areaSay': [],
};

var defaultRoomEventHandler = function(eventName, callback) {
	// 'roomSay', function() { chSend(message, 'ohai!') }
	
	// register "this" object for roomSay events
	//eMaster("add", "roomSay", callback)
	
	// go tell eMaster that callback() is who to trigger
	// whenever a 'roomSay' event happens

	roomId = this.data.id;
	
	if (typeof eMaster.listens[eventName][roomId] === 'undefined') {
		eMaster.listens[eventName][roomId] = [];
	}
	
	eMaster.listens[eventName][roomId].push({
		"callback": callback
	});

}
var defaultDescribe = function(id) {
	// builds a standard "room description string" and returns it
	var outStr = '-=-=-=-\n';
	outStr += '**' + rooms[id].data.title + '**  ' + '"`' + id + '`"\n';
	outStr += '\n' + rooms[id].data.description;
	
	// Build exits text
	if (rooms[id].data.hasOwnProperty('exits')) {
		outStr += '\n-=-=-=-\nObvious exits: ';
		for (var exName in rooms[id].data.exits) {
			outStr += '`' + exName + '`   ';
		}
	} else {
		ut.debugPrint('SpongeMUD: WARNING! Room ' + parms + ' missing exits!');
	}
	
	// Build items text
	if (rooms[id].data.hasOwnProperty('items')) {
		
		
		var count = 0;
		var itemStr = '';
		for (var itemName in rooms[id].data.items) {
			itemStr += '`' + itemName + '`   ';
			count++;
		}
		
		if (count === 0) {
			outStr += '\n_No obvious items here_';
		} else {
			outStr += '\n_Obvious items here_: ' + itemStr;
		}
	}
	
	// See who else is here
	var numHere = 0;
	var playersHereStr = '';
	for (var player in players) {
		if (players[player].location === id) {
			//playersHereStr += '`' + players[player].charName + '` ';
			playersHereStr += '\n**' + players[player].charName +
			  '** ' + (postureStr[players[player].posture] || 'is') + ' here.';
			numHere++;
		}
	}
	if (numHere > 0) {
		// outStr += '\n\nWho is here: ' + playersHereStr;
		outStr += playersHereStr;
	}
	return outStr;
};
var defaultShortDesc = function(id) {
	// builds a standard "short room description string" and returns it
	var outStr = '-=-=-=-\n';
	outStr += '**' + rooms[id].data.title + '**  ' + '"`' + id + '`"\n';
	
	// Build exits text
	if (rooms[id].data.hasOwnProperty('exits')) {
		outStr += '-=-=-=-\nExits: ';
		for (var exName in rooms[id].data.exits) {
			outStr += '`' + exName + '`   ';
		}
	} else {
		ut.debugPrint('SpongeMUD: WARNING! Room ' + parms + ' missing exits!');
	}
	
	// Build items text
	if (rooms[id].data.hasOwnProperty('items')) {
		var count = 0;
		var itemStr = '';
		for (var itemName in rooms[id].data.items) {
			itemStr += '`' + itemName + '`   ';
			count++;
		}
		
		if (count === 0) {
			// add nothing to the output
		} else {
			outStr += '\nItems: ' + itemStr;
		}
	}
	
	// See who else is here
	var numHere = 0;
	var playersHereStr = '';
	for (var player in players) {
		if (players[player].location === id) {
			playersHereStr += '`' + players[player].charName + '` ';
			numHere++;
		}
	}
	if (numHere > 0) {
		outStr += '\nWho is here: ' + playersHereStr;
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
	this.charName = data.charName || 'Anonymous';
	this.stats = data.stats || {
		"shtyle": "mundane",
		"speed": 120,
		"status": "normal"
	}
	this.posture = data.posture || "standing";
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
Room.prototype.shortDesc = defaultShortDesc;
Room.prototype.on = defaultRoomEventHandler;

//------- hardcoded test room ---------
var talkingRoom = new Room({title: "A talking room?!", id: "talking room"});
talkingRoom.on('roomSay', function(whoSaid, whatSaid, client) {
	
	// find out who all is in the room
	var pLoc = players[who].location;
	var dmList = []; // list of ids
	
	for (var player in players) {
		if (players[player].location === pLoc) {
			console.log(player + ' was in the room with ' + who);
			if (players[player].server === players[who].server) {
				console.log(player + ' was also on same server ');
				dmList.push(player);
			} else {
				console.log('Not same server though. ' + 
				  players[who].server + ' !== ' + players[player].server);
			}
		}
	}
	console.log(' Found ' + dmList.length + ' players to DM.');
	
	// DM all those that should know
	for (var i = 0; i < dmList.length; i++) {
		//var user = message.guild.members.get(dmList[i]);
		var server = client.guilds.get(players[who].server);
		var user = server.members.get(dmList[i]);
		
		if (whatSaid === 'shazam') {
			user.send('[SpongeMUD] ' + players[whoSaid].charName + ' has uttered ' +
			  'the secret password. The ground beneath you begins to shake. . .');
		} else {
			user.send('[SpongeMUD] **A voice from nowhere** says, ' +
			  'That is very interesting, ' + players[whoSaid].charName + '!"');
		}
	}
});

var buildDungeon = function() {
	for (var room in rooms) {
		var theRoom = new Room(rooms[room].data);
		rooms[room] = theRoom;
	}
	ut.debugPrint('SpongeMUD dungeon built.');
	
	//----- temporary hardcoded exit to test room -----
	rooms["talking room"].on = talkingRoom.on;
	rooms["outside poriferan oasis"].data.exits.special = {
		goesto: "talking room",
		description: "a special exit"
	}
	ut.debugPrint('...added special room.');
	
}
module.exports = {
	
	//     ALL THE ANNOYING Z-COMMANDS GO HERE
	
	buildDungeon: buildDungeon,
	terse: {
		do: function(message) {
			var who = message.author.id;
			players[who].terseTravel = !players[who].terseTravel;
			ut.chSend(message, 'Short room descriptions when travelling is now: ' +
			  players[who].terseTravel);
		}
	},
	peek: {
		do: function(message, parms) {
			if (rooms.hasOwnProperty(parms)) {
				ut.longChSend(message, rooms[parms].describe(parms));
			} else {
				ut.chSend(message, 'You want to see ' + parms + ', eh?' +
				  ' I don\'t really know that place.');
			}
			
		}
	},
	go: {
		do: function(message, parms, client) {
			who = message.author.id;
			parms = parms.split(' ');
			where = parms[0];
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var pLoc = players[who].location;	
			if (typeof rooms[pLoc].data.exits[where] !== 'undefined') {
				if (!rooms[pLoc].data.exits[where].goesto) {
					ut.chSend(message, 'You tried to leave via ' + where + 
					  ' but you were unable to get anywhere!');
					return;
				} else {
					newLoc = rooms[pLoc].data.exits[where].goesto;
					var chanStr = '';
					
					/*var chanStr = players[who].charName + ' moved to "' +
					  newLoc + '" via exit: ' + where;
					  */
					  
					// Figure out who to DM:
					// find out who all is in the room and "logged in" to same server
					var pLoc = players[who].location;
					var dmList = []; // list of ids
					for (var player in players) {
						if (players[player].location === pLoc) {
							//console.log(player + ' was in the room with ' + who);
							if (players[player].server === players[who].server) {
								//console.log(player + ' was also on same server ');
								dmList.push(player);
							} else {
								/* console.log('Not same server though. ' + 
								players[who].server + ' !== ' + players[player].server); */
							}
						}
					}
					console.log(' Found ' + dmList.length + ' players to DM.');
					
					for (var i = 0; i < dmList.length; i++) {
						var server = client.guilds.get(players[who].server);
						var user = server.members.get(dmList[i]);
						// eventually, don't show ourselves in this list
						// it's kind of useful right now though
						user.send('[SpongeMUD] ' + players[who].charName + ' left via ' + where);
					}					
					players[who].location = newLoc; // now actually move them
					ut.saveObj(players, cons.MUD.playerFile);
					if (players[who].terseTravel) {
						chanStr += rooms[newLoc].shortDesc(newLoc);
					} else {
						chanStr += rooms[newLoc].describe(newLoc);
					}
				}
			} else {
				chanStr = players[who].charName + ' tried to leave via ' + where +
				  ' but that\'s not an exit!';
			}
			ut.chSend(message, chanStr);
		}
	},
	joinmud: {
		do: function(message, parms) {
			var who = message.author.id;
			var server = message.guild;
			
			// temporary! need to come up with something for this situation (DM joinmud)
			if (!server) {
				server = {"name": 'The Planet', "id": cons.SERVER_ID};
			}
			
			
			if (typeof players[who] === 'undefined') {
				parms = parms.split(' ');
				var charName = parms[0];
				if (charName.length < 3 || charName.length > 15) {
					ut.chSend(message, message.author + ', use `joinmud <character name>`.' +
					  ' Your character name must be a single word between 3 and 15 chars.');
					return;
				}
				players[who] = new Player({"charName": charName});
				ut.saveObj(players, cons.MUD.playerFile);
				ut.chSend(message, ' Welcome to SpongeMUD, ' + charName +
				  '! (' + message.author.id + '). Try `look` to get started.');
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, ' You\'re already a SpongeMUD player. Awesome!');
			}
			if (typeof players[who].server === 'undefined') {
				ut.chSend(message, ' You are now logged in via ' + server.name +
				  ' (' + server.id + ')');
				players[who].server = server.id;
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, ' You are now logged in via ' + server.name +
				  ' (' + server.id + ') (last: ' + players[who].server + ')');
				players[who].server = server.id;
				ut.saveObj(players, cons.MUD.playerFile);
			}
		}
	},
	exitmud: {
		do: function(message, parms) {
			var who = message.author.id;
			var server = message.guild;
			
			if (typeof players[who] === 'undefined') {
				ut.chSend(message, message.author + ', you don\'t have a SpongeMUD ' +
				  ' character that you can logout! Use `joinmud` to join the fun!');
			} else if (!players[who].server) {
				ut.chSend(message, message.author + ', ' + players[who].charName +
				  ' wasn\'t logged in. Use `joinmud` to login if you want though.');
			} else {
				ut.chSend(message, players[who].charName + ' is being logged out ' +
				  ' from server id ' + players[who].server);
				players[who].server = null;
			}
		}
	},
	say: {
		do: function(message, parms, client) {
			
			var whatSaid = parms;
			
			who = message.author.id;
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			if (!players[who].server) {
				ut.chSend(message, players[who].charName + ' can\'t speak unless they' +
				  ' first login to SpongeMUD via `joinmud`!');
				return;
			}
			
			// find out who all is in the room
			var pLoc = players[who].location;
			var dmList = []; // list of ids
			for (var player in players) {
				if (players[player].location === pLoc) {
					console.log(player + ' was in the room with ' + who);
					if (players[player].server === players[who].server) {
						console.log(player + ' was also on same server ');
						dmList.push(player);
					} else {
						console.log('Not same server though. ' + 
						  players[who].server + ' !== ' + players[player].server);
					}
				}
			}
			console.log(' Found ' + dmList.length + ' players to DM.');
			
			// DM all those that should know
			for (var i = 0; i < dmList.length; i++) {
				//var user = message.guild.members.get(dmList[i]);
				var server = client.guilds.get(players[who].server);
				var user = server.members.get(dmList[i]);
				user.send('[SpongeMUD] **' + players[who].charName + 
				  '** says, "' + whatSaid + '"');
			}
			
			// Next, fire off some events -- notify eMaster
			eMaster('roomSay', pLoc, who, whatSaid, client);
			
		}
	},
	listens: {
		do: function(message) {
			who = players[message.author.id];
			ut.chSend(message, ' Dumping global events object to console.');
			console.log(eMaster.listens);
			ut.chSend(message, ' In this area (' + who.location + ') ');
		}
	},
	look: {
		do: function(message, parms) {
			who = message.author.id;
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			} 
			var pLoc = players[who].location;
			if (parms === 'dm') {
				ut.auSend(message, rooms[pLoc].describe(pLoc));
			} else {
				ut.longChSend(message, rooms[pLoc].describe(pLoc));
			}
		}
	},
	get: {
		do: function(message, parms) {
			var who = message.author.id;
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var pl = players[who];
			parms = parms.split(' ');
			var target = parms[0];
			if (typeof rooms[pl.location].data.items[target] !== 'undefined') {
				ut.chSend(message, players[who].charName + ' picked up ' + target + '.');
				var theItem = rooms[pl.location].data.items[target];
				pl.inventory[target] = theItem;
				delete rooms[pl.location].data.items[target];
				ut.saveObj(rooms, cons.MUD.roomFile);
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, players[who].charName + ' tried to pick up ' + target +
				  ' in "' + pl.location + '" but it\'s not there, silly!');
			}
		}
	},
	drop: {
		do: function(message, parms) {
			var who = message.author.id;
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			} 
			var pl = players[who];
			parms = parms.split(' ');
			var target = parms[0];
			if (typeof pl.inventory[target] !== 'undefined') {
				ut.chSend(message, players[who].charName + ' dropped ' + target + '.');
				var theItem = pl.inventory[target];
				rooms[pl.location].data.items[target] = theItem;
				delete pl.inventory[target];
				ut.saveObj(rooms, cons.MUD.roomFile);
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, players[who].charName + ' tried to drop ' + target +
				  ' in "' + pl.location + '" but they aren\'t even carrying it!');
			}
		}
	},
	inv: {
		do: function(message, parms) {
			var who = message.author.id;
			if (!isPlayer(who)) {
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
			ut.chSend(message, pl.charName + '\'s inventory: ' + outP);
		}
	},
	edroom: {
		do: function(message, parms) {
			// title, description: String
			// items: leave it out, can wizitem them
			// exits: use wizex ?
			
			var who = message.author.id;
			
			if (!isPlayer(who)) {
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
				var target = parms[0]; // which exit they're editing
				var exProp = parms[1]; // what property of the exit they want to change
				parms.shift(); 
				parms.shift();
				val = parms.join(' '); // anything left is the value they want to change to
				
				if (!target || !exProp) {
					// command wasn't long enough, basically
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
				
				// exit exists for sure now, make sure a room exists IF they edited/created goesto
				if (exProp.toLowerCase() === 'goesto') {
					if (typeof rooms[val] === 'undefined') {
						rooms[val] = new Room({"title": val, "id": val});
						ut.chSend(message, ' Since no room "' + val + '" existed, I made one. Make sure ' +
						  'you do any necessary editing to it!');
					}
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
			if (!isPlayer(who)) {
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
			
			rooms[roomId] = new Room({"title": title, "id": roomId});
			ut.chSend(message, message.author + ', ' + roomId + ' created!');
			ut.saveObj(rooms, cons.MUD.roomFile);
		}
	},
	wizcopy: {
		do: function(message, parms) {
			var who = message.author.id;		
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			} 			
		}
	},
	wizitem: {
		do: function(message, parms) {
			var who = message.author.id;
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			} 
			
			if (who !== cons.SPONGE_ID && noWiz) {
				ut.chSend(' magicking up items is temporarily disabled, sorry. ');
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
	killitem: {
		do: function(message, parms) {
			var who = message.author.id;
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			var who = message.author.id;
			var pl = players[who];
			var loc = pl.location;
			parms = parms.split(' ');
			var target = parms[0]; // what we're deleting
			parms.shift();
			parms = parms.join(' ');
			
			var outP = '';
			var found = 0;
			if (typeof pl.inventory[target] !== 'undefined') {
				outP += '(inv.) `' + target + '`: ' + pl.inventory[target].data.description;
				if (parms === 'inv') {
					delete pl.inventory[target];
					outP += ' was deleted!';
				} else {
					outP += ' was left alone.\n';
				}
				found++;
			}
			if (typeof rooms[loc].data.items[target] !== 'undefined') {
				outP += '(here) `' + target + '`: ' + rooms[loc].data.items[target].data.description;
				if (parms === 'here') {
					delete rooms[loc].data.items[target];
					outP += ' was deleted!\n';
				} else {
					outP += ' was left alone.\n';
				}				
				found++;
			}
			
			if (!found) {
				outP += 'I see no ' + target + ' here.';
			}
			ut.chSend(message, outP);
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
				//ut.auSend(message, rooms[target].describe(target));
			} else {
				ut.chSend(message, target + ' is not a valid room to teleport to.');
			}
		}
	},
	sit: {
		do: function(message, parms) {
			var who = message.author.id;
			var pl = players[who];
			var outStr = '';
			
			if (pl.posture === 'sitting') {
				pl.posture = 'standing'
				outStr += 'You stand back up.';
			} else {
				pl.posture = 'sitting';
				outStr += 'You sit down and make yourself comfortable.';
			}
			
			ut.chSend(message, outStr);
		}
	},
	stand: {
		do: function(message, parms) {
			var who = message.author.id;
			var pl = players[who];
			var outStr = '';
			
			if (pl.posture === 'standing') {
				outStr += 'You are alraedy standing up.';
			} else {
				pl.posture = 'standing';
				outStr += 'You stand up.';
			}	
			ut.chSend(message, outStr);
		}
	}
};