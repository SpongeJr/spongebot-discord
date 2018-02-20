var ut = require('../lib/utils.js');
var cons = require('../lib/constants.js');
var players = require('../' + cons.DATA_DIR + cons.MUD.playerFile);
var rooms = require('../' + cons.DATA_DIR + cons.MUD.roomFile);
var dungeonBuilt = false;
var noWiz = false;

var dreamStrings = {
	'inv': 'You dream about the things you own...\n',
	'go': 'You toss and turn in your sleep.\n',
	'get': 'You dream of acquiring new things...\n',
	'drop': 'Your hand twitches in your sleep.\n',
	'say': 'You mumble incomprehensibly in your sleep.\n',
};

const postureStr = {
	'standing': 'is standing',
	'sitting': 'is sitting',
	'resting': 'is resting',
	'asleep': 'is sleeping'
};
const isPlayer = function(who) {
	return typeof players[who] !== 'undefined';
};
const cantDo = function(who, action) {
	if (!isPlayer(who)) {
		return 'You need to `joinmud` first.';
	}
	if (players[who].posture === 'asleep') {
		return (dreamStrings[action] || 'Visions of sugarplums dance through your head.') +
		' (You are asleep. You need to `joinmud` to wake up first!)';
	}
	
	if (action === 'go') {
		if (players[who].posture === 'sitting') {
			return ('You need to `stand` up before moving.');
		}
	}
};
var defaultLook = function(item) {
	var outP = '';
	/*
	if (!item.data.hidden) {
		
	}
	*/
	outP += item.description;
	return outP;
};
var defaultGet = function() {};
var defaultDescribe = function() {
	return this.description;
};

var eMaster = function(eventName, where, sender, data, client) {
	
	if (eMaster.listens[eventName]) {
		// legit event type, so...
		// (yeah, these are identical... refactor/fix soon)
		if (eventName === 'roomSay') {
			if (!eMaster.listens.roomSay[where]) {
				// no listeners in this room.
				return;
			}
			// hit up everyone listed for this event in this room...
			for (let evId in eMaster.listens.roomSay[where]) {
				eMaster.listens.roomSay[where][evId].callback(sender, data, client);
			}

		} else if (eventName === 'roomDrop') {
			if (!eMaster.listens.roomDrop[where]) {
				// no listeners in this room.
				return;
			}
			for (let evId in eMaster.listens.roomDrop[where]) {
				eMaster.listens.roomDrop[where][evId].callback(sender, data, client);
			}
		} else if (eventName === 'roomGet') {
			if (!eMaster.listens.roomGet[where]) {
				return;
			}
			for (let evId in eMaster.listens.roomGet[where]) {
				eMaster.listens.roomGet[where][evId].callback(sender, data, client);
			}
			
		} else if (eventName === 'roomExit') {
			if (!eMaster.listens.roomExit[where]) {
				return;
			}
			for (let evId in eMaster.listens.roomExit[where]) {
				eMaster.listens.roomExit[where][evId].callback(sender, data, client);
			}
			
		} else if (eventName === 'roomEnter') {
			if (!eMaster.listens.roomEnter[where]) {
				return;
			}
			for (let evId in eMaster.listens.roomEnter[where]) {
				eMaster.listens.roomEnter[where][evId].callback(sender, data, client);
			}			
		} else if (eventName === 'roomGeneric') {
			if (!eMaster.listens.roomGeneric[where]) {
				return;
			}
			for (let evId in eMaster.listens.roomGeneric[where]) {
				eMaster.listens.roomGeneric[where][evId].callback(sender, data, client);
			}			
		}
	}
};
eMaster.listens = {
	'roomSay': {},
	'roomDrop': {},
	'roomGet': {},
	'roomEnter': {},
	'roomExit': {},
	'roomGeneric': {},
	'areaSay': [],
};

var defaultRoomEventKiller = function(eventName, id) {

	let roomId = this.data.id;
	
	if (typeof eMaster.listens[eventName][roomId] === 'undefined') {
		console.log('WARNING: Tried to kill a ' + eventName +
		  ' in ' + roomId + ' that did not have those.');
		return false;
	}
	
	if (typeof eMaster.listens[eventName][roomId][id] === 'undefined') {
		console.log('WARNING: Tried to kill nonexistent ' + eventName +
		'event with id ' + id + ' in ' + roomId);
		return false;
	}
	delete(eMaster.listens[eventName][roomId][id]);
};
var defaultRoomEventHandler = function(eventName, callback, id) {

	let roomId = this.data.id;
	
	if (typeof eMaster.listens[eventName][roomId] === 'undefined') {
		eMaster.listens[eventName][roomId] = {};
	}
	
	eMaster.listens[eventName][roomId][roomId] = {
		"callback": callback
	};
};
var defaultPlayerEventKiller = function(eventName, id) {

	let roomId = this.location;
	
	if (typeof eMaster.listens[eventName][roomId] === 'undefined') {
		console.log('WARNING: Tried to kill a ' + eventName +
		  ' in ' + roomId + ' that did not have those.');
		return false;
	}
	
	if (typeof eMaster.listens[eventName][roomId][id] === 'undefined') {
		console.log('WARNING: Tried to kill nonexistent ' + eventName +
		'event with id ' + id + ' in ' + roomId);
		return false;
	}
	delete(eMaster.listens[eventName][roomId][id]);
};
var defaultPlayerEventHandler = function(eventName, callback, id) {
	
	let pId = this.id;
	let roomId = this.location;
	
	if (typeof eMaster.listens[eventName][roomId] === 'undefined') {
		eMaster.listens[eventName][roomId] = {};
	}
	
	eMaster.listens[eventName][roomId][pId] = {
		"callback": callback
	};
};
var defaultRoomDescribe = function(id) {
	// builds a standard "room description string" and returns it
	var outStr = '-=-=-=-\n';
	outStr += '**' + rooms[id].data.title + '**  ' + '"`' + id + '`"\n';
	outStr += '\n' + rooms[id].data.description;
	
	// Build exits text
	if (rooms[id].data.hasOwnProperty('exits')) {
		outStr += '\n-=-=-=-\nObvious exits: ';
		for (var exName in rooms[id].data.exits) {
			if (!rooms[id].data.exits[exName].hidden) {
				outStr += '`' + exName + '`   ';
			}
		}
	} else {
		console.log('SpongeMUD: WARNING! Room ' + id + ' missing exits!');
	}
	
	// Build items text
	if (rooms[id].data.hasOwnProperty('items')) {
		
		var count = 0;
		var itemStr = '';
		for (var itemName in rooms[id].data.items) {
			if (!rooms[id].data.items[itemName].data.hidden) {
				itemStr += '`' + itemName + '`   ';
				count++;
			}
		}
		
		if (count === 0) {
			outStr += '\n_No obvious items here_';
		} else {
			outStr += '\n_Obvious items here_: ' + itemStr;
		}
	}
	
	// See who else is here. Later, let's store this in Rooms also.
	// This seems terribly expensive.
	var numHere = 0;
	var playersHereStr = '';
	for (var player in players) {
		if (players[player].location === id) {
			playersHereStr += '\n**' + players[player].charName;
			if (players[player].title) {
				playersHereStr += ' ' + players[player].title;
			}
			playersHereStr += '** ' + (postureStr[players[player].posture] || 'is') + ' here.';
			numHere++;
		}
	}
	if (numHere > 0) {
		// outStr += '\n\nWho is here: ' + playersHereStr;
		outStr += playersHereStr;
	}
	return outStr;
};
var defaultRoomShortDesc = function(id) {
	// builds a standard "short room description string" and returns it
	var outStr = '';
	outStr += '**' + rooms[id].data.title + '**  ' + '"`' + id + '`"\n';
	
	// Build exits text
	if (rooms[id].data.hasOwnProperty('exits')) {
		outStr += 'Exits: ';
		for (var exName in rooms[id].data.exits) {
			if (!rooms[id].data.exits.hidden) {
				outStr += '`' + exName + '`  ';
			}
		}
	} else {
		console.log('SpongeMUD: WARNING! Room ' + id + ' missing exits!');
	}
	
	// Build items text
	if (rooms[id].data.hasOwnProperty('items')) {
		var count = 0;
		var itemStr = '';
		for (var itemName in rooms[id].data.items) {
			if (!rooms[id].data.items[itemName].data.hidden) {
				itemStr += '`' + itemName + '`   ';
				count++;
			}
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
};
var Item = function(data) {
	this.data = data || {};
	this.data.hidden = data.hidden || false;
	this.data.description = data.description || "Some object you spotted.";
	this.data.hidden = false;
	// thid.id = ???
};
var SceneryItem = function(data) {
	this.data = data || {};
	this.data.description = data.description || "A part of the scenery.";
	this.id = data.id;
	this.data.hidden = true;
};
Item.prototype.look = defaultLook;
Item.prototype.get = defaultGet;
SceneryItem.prototype.look = defaultLook;

var Player = function(data) {
	this.location = data.location || "airport",
	this.inventory = data.inventory || {
		"backpack": new Item({
			description: "You can keep some stuff in here safely."
		})
	};
	this.charName = data.charName || 'Anonymous';
	this.stats = data.stats || {
		"shtyle": "mundane",
		"speed": 120,
		"status": "normal"
	};
	this.posture = data.posture || "asleep";
	this.id = data.id;
	this.title = data.title;

	// temporary: build a generic stat block thing
	let outStr = '**` -=[ ' + this.charName;
	outStr += ' ]=- `**\n```';
	outStr += '-'.repeat(outStr.length) + '\n';
	if (this.title) {
		outStr += '(' + this.charName + ' ' + this.title + ')\n';
	}
	for (var stat in this.stats) {
		let sLine = ' '.repeat(15) + stat;
		sLine = sLine.substr(-15);
		sLine += ' ... ' + this.stats[stat];
		outStr += sLine + '\n';
	}
	outStr += '```';
	this.description = outStr;
};
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
	this.data.items = data.items || {};
};
Room.prototype.on = defaultRoomEventHandler;
Room.prototype.off = defaultRoomEventKiller;
Room.prototype.describe = defaultRoomDescribe;
Room.prototype.shortDesc = defaultRoomShortDesc;

Player.prototype.describe = defaultDescribe;

Player.prototype.on = defaultPlayerEventHandler;
Player.prototype.off = defaultPlayerEventKiller;
Player.prototype.registerForRoomEvents = function() {
	var player = this;
	this.on('roomSay', function(whoSaid, whatSaid, client) {
		var server = client.guilds.get(players[whoSaid].server);
		var who = player.id;
		var user = server.members.get(who);
		var whoStr;
		if (whoSaid === who) {
			whoStr = 'You say';
		} else {
			whoStr = '**' + players[whoSaid].charName + '** says';
		}
		user.send(whoStr + ', "' + whatSaid + '"');
	}, this.id);
	this.on('roomGet', function(whoSaid, item, client) {
		var server = client.guilds.get(players[whoSaid].server);
		var who = player.id;
		var user = server.members.get(who);
		var whoStr;
		whoStr = (whoSaid === who) ? 'You' : players[whoSaid].charName;
		user.send('**' + whoStr + '**' + ' picked up ' + item + '.');
	}, this.id);
	this.on('roomDrop', function(whoSaid, item, client) {
		var server = client.guilds.get(players[whoSaid].server);
		var who = player.id;
		var user = server.members.get(who);
		var whoStr;
		whoStr = (whoSaid === who) ? 'You' : players[whoSaid].charName;
		user.send('**' + whoStr + '**' + ' dropped ' + item + '.');
	}, this.id);
	this.on('roomExit', function(whoSaid, newRoom, client) {
		var server = client.guilds.get(players[whoSaid].server);
		var who = player.id;
		var user = server.members.get(who);
		var whoStr;
		whoStr = players[whoSaid].charName;
		user.send('**' + whoStr + '**' + ' leaves towards ' + newRoom);
	}, this.id);
	this.on('roomEnter', function(whoSaid, lastRoom, client) {
		var server = client.guilds.get(players[whoSaid].server);
		var who = player.id;
		var user = server.members.get(who);
		var whoStr;
		whoStr = (whoSaid === who) ? 'You arrive' : '**' + players[whoSaid].charName + '** arrives';
		user.send(whoStr + ' from ' + lastRoom);
	}, this.id);
	this.on('roomGeneric', function(whoSaid, whatSaid, client) {
		var server = client.guilds.get(players[whoSaid].server);
		var who = player.id;
		var user = server.members.get(who);
		var whoStr;
	
		if (typeof whatSaid === 'string') {		
			whoStr = (whoSaid === who) ? 'You' : players[whoSaid].charName;
			user.send('**' + whoStr + '**' + ' ' + whatSaid);
		} else {
			whoStr = (whoSaid === who) ? whatSaid.normal[0] : '**' + players[whoSaid].charName + '** ' + whatSaid.normal[1];
			user.send(whoStr);
		}
	}, this.id);
};
Player.prototype.unregisterForRoomEvents = function() {
	this.off('roomSay', this.id);
	this.off('roomDrop', this.id);
	this.off('roomGet', this.id);
	this.off('roomEnter', this.id);
	this.off('roomExit', this.id);
	this.off('roomGeneric', this.id);
};
//------- hardcoded test room ---------
var talkingRoom = new Room({title: "A talking room?!", id: "talking room"});
talkingRoom.on('roomSay', function(whoSaid, whatSaid, client) {
	
	// find out who all is in the room
	var pLoc = players[whoSaid].location;
	var dmList = []; // list of ids
	
	for (var player in players) {
		if (players[player].location === pLoc) {
			if (players[player].server === players[whoSaid].server) {
				dmList.push(player);
			} else {
				// not same server
			}
		}
	}
	
	// DM all those that should know
	for (var i = 0; i < dmList.length; i++) {
		//var user = message.guild.members.get(dmList[i]);
		var server = client.guilds.get(players[whoSaid].server);
		var user = server.members.get(dmList[i]);
		
		if (whatSaid === 'shazam') {
			user.send('[SpongeMUD] ' + players[whoSaid].charName + ' has uttered ' +
			  'the secret password. The ground beneath you begins to shake. . .');
		} else {
			user.send('[SpongeMUD] **A voice from nowhere** says, ' +
			  'That is very interesting, ' + players[whoSaid].charName + '!"');
		}
	}
}, this.id);

var buildDungeon = function() {
	// iterates over the rooms object, reads all the .data
	// and puts it back using the Room constructor, so that
	// the rooms are all Room objects, with the appropriate
	// methods, etc.
	
	for (var room in rooms) {
		var theRoom = new Room(rooms[room].data);
		
		// now, take all the items out, add their necessary methods and such,
		// dust them off and put them back into the rooms
		for (var item in theRoom.data.items) {
			var theItem;
			if (theRoom.data.items[item].data.hidden) {
				// all the "hidden" items are the "scenery" items. for now.
				theItem = new SceneryItem(theRoom.data.items[item].data);
			} else {
				theItem = new Item(theRoom.data.items[item].data);
			}
			theRoom.data.items[item] = theItem;
		}
		rooms[room] = theRoom;
	}
	console.log('Dungeon built.');
	
	//----- temporary hardcoded exit to test room -----
	rooms["talking room"].on = talkingRoom.on;
	rooms["outside poriferan oasis"].data.exits.special = {
		goesto: "talking room",
		description: "a special exit"
	};
};
var buildPlayers = function() {
	// iterates over the players object, reads all the .data
	// and puts it back using the Player constructor, so that
	// the players are all Player objects, with the appropriate
	// methods, etc.
	for (var player in players) {
		if (typeof players[player].id === 'undefined') {
			players[player].id = player;
		}
	
		var thePlayer = new Player(players[player]);
		if (players[player].posture !== 'asleep') {
			thePlayer.registerForRoomEvents();
		}
		
		// now, take all the items out, add their necessary methods and such,
		// dust them off and put them back into the player
		for (var item in thePlayer.inventory) {
			var theItem;
			if (thePlayer.inventory[item].data.hidden) {
				// all the "hidden" items are the "scenery" items. for now.
				theItem = new SceneryItem(thePlayer.inventory[item].data);
			} else {
				theItem = new Item(thePlayer.inventory[item].data);
			}
			thePlayer.inventory[item] = theItem;
		}
		
		// if they're missing the server property use The Planet for now
		if (!thePlayer.server) {
			thePlayer.server = cons.SERVER_ID;
		}
		players[player] = thePlayer;
	}
	console.log('Players database built.');
};
module.exports = {
	buildDungeon: buildDungeon,
	buildPlayers: buildPlayers,
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
			var who = message.author.id;
			parms = parms.split(' ');
			var where = parms[0];
			var fail = cantDo(who, 'go');
			if (fail) {
				ut.chSend(message, fail);
				return;
			}
			var player = players[who];
			var pLoc = player.location;	
			var chanStr = '';
			if (typeof rooms[pLoc].data.exits[where] !== 'undefined') {
				if (!rooms[pLoc].data.exits[where].goesto) {
					ut.chSend(message, 'You tried to leave via ' + where + 
					  ' but you were unable to get anywhere!');
					return;
				} else {
					let newLoc;
					player.unregisterForRoomEvents(); // first, unregister for events in this room
					newLoc = rooms[pLoc].data.exits[where].goesto; // find our target room
					eMaster('roomExit', pLoc, who, newLoc, client); // fire off roomExit, notify everyone but us
					var oldLoc = '' + pLoc; // hang onto old location
					player.location = newLoc; // actually move us
					player.registerForRoomEvents();// now register for room events in new room
					eMaster('roomEnter', newLoc, who, oldLoc, client); // fire off roomEnter, notify everyone + us
					ut.saveObj(players, cons.MUD.playerFile); // save to disk
					if (players[who].terseTravel) {
						chanStr += rooms[newLoc].shortDesc(newLoc);
					} else {
						chanStr += rooms[newLoc].describe(newLoc);
					}
				}
			} else {
				chanStr = 'You tried to leave via ' + where + ' but that\'s not an exit!';
			}
			ut.longChSend(message, chanStr);
		}
	},
	joinmud: {
		do: function(message, parms) {
			var who = message.author.id;
			var server = message.guild;
			var player = players[who];
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
				player = new Player({charName: charName, id: who, posture: "standing"});
				players[who] = player;
				ut.saveObj(players, cons.MUD.playerFile);
				ut.chSend(message, ' Welcome to SpongeMUD, ' + charName +
				  '! (' + message.author.id + '). Try `look` to get started.');
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, ' You\'re already a SpongeMUD player. Awesome!');
			}
			if (typeof player.server === 'undefined') {
				ut.chSend(message, ' You are now logged in via ' + server.name +
				  ' (' + server.id + ')');
				player.server = server.id;
				player.posture = 'standing';
				ut.saveObj(players, cons.MUD.playerFile);
			} else {
				ut.chSend(message, ' You are now logged in via ' + server.name +
				  ' (' + server.id + ') (last: ' + player.server + ')');
				player.server = server.id;
				player.posture = 'standing';
				ut.saveObj(players, cons.MUD.playerFile);
			}
			
			player.registerForRoomEvents();
			
		}
	},
	exitmud: {
		do: function(message, parms) {
			var who = message.author.id;
			
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
				players[who].unregisterForRoomEvents();
				players[who].posture = 'asleep';
			}
		}
	},
	say: {
		do: function(message, parms, client) {
			
			var whatSaid = parms;
			
			if (!whatSaid) {
				ut.chSend(message, 'Cat got your tongue?');
				return;
			}
			
			if (whatSaid.length > 511) {
				ut.chSend(message, 'You may only say up to 511 characters.');
				return;
			} 
			
			var who = message.author.id;
			var fail = cantDo(who, 'say');
			if (fail) {
				ut.chSend(message, fail);
				return;
			}
			var pLoc = players[who].location;
			
			// Fire off some events -- notify eMaster
			eMaster('roomSay', pLoc, who, whatSaid, client);
		}
	},
	listens: {
		do: function(message) {
			var who = players[message.author.id];
			ut.chSend(message, ' Dumping global and local events object to console.');
			console.log(eMaster.listens);
			console.log(' roomSay In this area (' + who.location + '): ');
			console.log(eMaster.listens.roomSay[who.location]);
		}
	},
	look: {
		do: function(message, parms) {
			
			if (parms) {
				module.exports.exam.do(message, parms);
				return;
			}
			
			var who = message.author.id;
			var fail = cantDo(who, 'look');
			if (fail) {
				ut.chSend(message, fail);
				return;
			}

			var player = players[who];
			var pLoc = players[who].location;
			
			if (player.posture === 'asleep') {
				ut.chSend(message, 'Visions of sugarplums dance through your head. ' +
				'(You are asleep. You need to `!joinmud` to wake up and be able to see!');
				return;
			}
			ut.longChSend(message, rooms[pLoc].describe(pLoc));
		}
	},
	get: {
		do: function(message, parms, client) {
			var who = message.author.id;
			var fail = cantDo(who, 'get');
			if (fail) {
				ut.chSend(message, fail);
				return false;
			}
		
			var pl = players[who];
			parms = parms.split(' ');
			var target = parms[0];
			
			
			if (typeof rooms[pl.location].data.items[target] !== 'undefined') {
				// legit target, see if it has a .get() method, though
				
				var theItem = rooms[pl.location].data.items[target];
				if (typeof theItem.get === 'undefined') {
					ut.chSend(message, 'You can\'t pick **that** up!');
					return false;
				}
				
				// ok, we can let them pick it up
				// later, this will probably call theItem.get()
				pl.inventory[target] = theItem;
				delete rooms[pl.location].data.items[target];
				ut.saveObj(rooms, cons.MUD.roomFile);
				ut.saveObj(players, cons.MUD.playerFile);
				eMaster('roomGet', pl.location, who, target, client);
			} else {
				ut.chSend(message, 'I see no ' + target + ' here.');
			}
		}
	},
	drop: {
		do: function(message, parms, client) {
			var who = message.author.id;
			var fail = cantDo(who, 'drop');
			if (fail) {
				ut.chSend(message, fail);
				return;
			}
			var pl = players[who];
			parms = parms.split(' ');
			var target = parms[0];
			if (typeof pl.inventory[target] !== 'undefined') {
				var theItem = pl.inventory[target];
				rooms[pl.location].data.items[target] = theItem;
				delete pl.inventory[target];
				ut.saveObj(rooms, cons.MUD.roomFile);
				ut.saveObj(players, cons.MUD.playerFile);
				
				if (!theItem.data.hidden) {
					// don't fire off event if item is hidden
					eMaster('roomDrop', pl.location, who, target, client);	
				}
				
			} else {
				ut.chSend(message, 'You can\'t drop what you\'re not carrying.');
			}
		}
	},
	inv: {
		do: function(message, parms) {
			var who = message.author.id;
			var fail = cantDo(who, 'inv'); 
			if (fail) {
				ut.chSend(message, fail);
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
			var loc = players[who].location;
			parms = parms.split(' ');
			var prop = parms[0];
			parms.shift();
			parms = parms.join(' ');
			var val = parms;
			var target;
			if (prop === 'title' || prop === 'description') {
				rooms[loc].data[prop] = val;
				ut.chSend(message, prop + ' of ' + loc + ' now:\n ' + val);
				ut.saveObj(rooms, cons.MUD.roomFile);
			} else if (prop === 'delexit') {
				parms = parms.split(' ');
				target = parms[0];
				if (typeof rooms[loc].data.exits[target] !== 'undefined') {
					delete rooms[loc].data.exits[target];
					ut.chSend(message, 'Exit "' + target + '" deleted! :open_mouth:');
				} else {
					ut.chSend(message, target + ' is not a valid exit, can\'t delete!');
					return;
				}
			} else if (prop === 'exits') {
				parms = parms.split(' ');
				target = parms[0]; // which exit they're editing
				var exProp = parms[1]; // what property of the exit they want to change
				parms.shift(); 
				parms.shift();
				val = parms.join(' '); // anything left is the value they want to change to
				
				if (!target || !exProp) {
					// command wasn't long enough
					ut.chSend(message, ' Use `edroom exits <exitId> <property> <value>`');
					return;
				}
				
				if (typeof rooms[loc].data.exits[target] !== 'undefined') {
					// exit exists. update whatever property.
					
					// if they left it blank, delete the old property if possible
					if (val === '') {
						if (typeof rooms[loc].data.exits[target][exProp] === 'undefined') {
							ut.chSend(message, 'Property .' + exProp + ' does not exist on exit "' + target +
							  '". No value specified. Nothing has been added, removed, or altered.');
						} else {
							delete 
							ut.chSend(message, 'Deleting property .' + exProp + ' from "' + target + '". ' +
							  'Previously, it had value: ' + rooms[loc].data.exits[target][exProp]);
							delete rooms[loc].data.exits[target][exProp];
							ut.saveObj(rooms, cons.MUD.roomFile);
						}
					} else {
						if (val === 'TRUE') {val = true;}
						if (val === 'FALSE') {val = false;}
						rooms[loc].data.exits[target][exProp] = val;
						ut.chSend(message, 'Set exit "' + target + '".' + exProp + ' = ' + val);
						ut.saveObj(rooms, cons.MUD.roomFile);
					}
				} else {
					// exit didn't exist. create, and create property
					rooms[loc].data.exits[target] = {};
					rooms[loc].data.exits[target][exProp] = val;
					ut.chSend(message, 'Created exit "' + target + '", then set .' + exProp + ' = ' + val);
					ut.saveObj(rooms, cons.MUD.roomFile);
				}
				
				// exit exists for sure now, make sure a room exists IF they edited/created goesto
				if (exProp.toLowerCase() === 'goesto') {
					if (typeof rooms[val] === 'undefined') {
						rooms[val] = new Room({"title": val, "id": val});
						ut.chSend(message, ' Since no room "' + val + '" existed, I made one. Make sure ' +
						  'you do any necessary editing to it!');
						ut.saveObj(rooms, cons.MUD.roomFile);
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
			who = message.author.id;
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
				ut.chSend(message, ' magicking up items is temporarily disabled, sorry. ');
			}
			
			who = message.author.id;
			var pl = players[who];
			parms = parms.split(' ');
			var itemName = parms[0];
			
			if (itemName.length < 2 || itemName.length > 31) {
				ut.chSend(message, ' Invalid prop name. It needs to be between 2 and 31 chars.');
				return;
			}
			
			parms.shift();
			var itemDesc = parms.join(' ');
			var theItem = new SceneryItem({
				"description": itemDesc
			});
			pl.inventory[itemName] = theItem;
			ut.chSend(message, ' Gave you a prop "' + itemName + '".\n :warning:' +
			  ' When you drop it, you won\'t be able to pick it back up, so make sure ' +
			  'you drop it in the room where you want to make it part of the scenery!');
			ut.saveObj(rooms, cons.MUD.roomFile);
		}
	},
	killitem: {
		do: function(message, parms) {
			var who = message.author.id;
			if (!isPlayer(who)) {
				ut.chSend(message, message.author + ', you need to `!joinmud` first.');
				return;
			}
			who = message.author.id;
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
					outP += ' was deleted! :open_mouth: \n';
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
			buildPlayers();
			ut.chSend(message, 'SpongeMUD v0.foo: Dungeon may have been built.');
		}
	},
	exam: {
		do: function(message, parms) {
			var who = message.author.id;
			var fail = cantDo(who, 'exam'); 
			if (fail) {
				ut.chSend(message, fail);
				return;
			}
			var pl = players[who];
			var loc = players[who].location;
			parms = parms.split(' ');
			var target = parms[0];
			
			/*
			We'd like them to be able to:
				exam <Item in Room>
				exam <Item in Inv>
				exam <Exit>
				exam <Player>
				exam <SceneryItem>
			*/
			// for now, we'll just do <item in inv>
			// and if not found, check room?
			
			// 1. Figure out what the target is
			// 2. Check for an .exam() method on it
			// 3. If it exists, run it
			
			
			// Item selector algorithm (for `exam`, use limited versions for other
			// commands, e.g., `get` only iterates over Items, `attack` only over Mobs (and players for PvP), etc.)
			// build up a list of valid targets:
			//	iterate over all Items, SceneryItems, Exits, Mobs, and Players in current room
			//	build a table of their shortname : Array [UNID, UNID, ...]
			//		Some entities may have multiple shortnames, add to each Array as needed!
			//	check player input vs shortnames   'bag'
			//	if Array length > 1,
			//		and they don't specify: tell them it's ambiguous and show a list
			//		if they specify: (eg: 3.bag) use that one
			//	For Array length = 1,
			//		we've found the item, use it.
			//
			// Future: allow partial matches, but no ambiguity: "Does 'ba' mean 'bag' or 'basketball' or 'BaalzarTheKiller'?"
			// (continue to allow picking within a list, e.g.,  2.basketball to get the second of "basketball" and "flat basketball" objects.
			
			
			var outP = '';
			var found = 0;
			
			// check inventory
			if (typeof pl.inventory[target] !== 'undefined') {
				outP += '(inv.) `' + target + '`: ' + pl.inventory[target].data.description + '\n';
				found++;
			}
			
			// check room
			if (typeof rooms[loc].data.items[target] !== 'undefined') {
				if (!rooms[loc].data.items[target].data.hidden) {
					// not "hidden"
					outP += '(here) `' + target + '`: ' + rooms[loc].data.items[target].data.description + '\n';
				} else {
					// is "hidden", only use .description by itself
					outP += rooms[loc].data.items[target].data.description + '\n';
				}
				found++;
			}
			
			// check exits
			if (typeof rooms[loc].data.exits[target] !== 'undefined') {
				outP += '(exit) `' + target + '`: ';
				if (rooms[loc].data.exits[target].description) {
					outP += rooms[loc].data.exits[target].description;
				} else {
					outP += ' -> ' + rooms[loc].data.exits[target].goesto;
				}
				found++;
			}

			// check players (this sucks, will have to store in room data later)
			// horrifying.
			for (let plId in players) {
				if (players[plId].charName === target) {
					if (players[plId].location === loc) {
						outP += '\n' + players[plId].description;
						found++;
					}
					break;
				}
			}		
			
			if (!found) {
				outP += 'I see no ' + target + ' here.';
			}
			
			if (found > 1) {outP += '\n_(' + found + ' matches shown)_';}
			
			ut.chSend(message, outP);
		}
	},
	tele: {
		do: function(message, parms, client) {
			var who = message.author.id;
			var player = players[who];
			var target = parms;
			
			var pLoc = player.location;
			var chanStr = '';
			if (typeof rooms[target] !== 'undefined') {
				ut.saveObj(players, cons.MUD.playerFile);
				ut.chSend(message, ' You teleport!');
				
				player.unregisterForRoomEvents(); // first, unregister for events in this room
				let newLoc = target; // set our target room

				eMaster('roomExit', pLoc, who, newLoc, client); // fire off roomExit, notify everyone but us
				var oldLoc = '' + pLoc; // hang onto old location
				player.location = newLoc; // actually move us
				player.registerForRoomEvents();// now register for room events in new room
				eMaster('roomEnter', newLoc, who, oldLoc, client); // fire off roomEnter, notify everyone + us
				ut.saveObj(players, cons.MUD.playerFile); // save to disk
				if (players[who].terseTravel) {
					chanStr += rooms[newLoc].shortDesc(newLoc);
				} else {
					chanStr += rooms[newLoc].describe(newLoc);
				}
				
			} else {
				ut.chSend(message, target + ' is not a valid room to teleport to.');
			}
		}
	},
	sit: {
		do: function(message, parms, client) {
			var who = message.author.id;
			var pl = players[who];
			var pLoc = pl.location;
			
			if (pl.posture === 'sitting') {
				pl.posture = 'standing';
				eMaster('roomGeneric', pLoc, who, {
					normal: ['You stand up.','stands up.']
				}, client);
				
			} else {
				pl.posture = 'sitting';
				eMaster('roomGeneric', pLoc, who, {
					normal: ['You sit down and get comfortable.','sits down and gets comfortable.']
				}, client);
			}
		}
	},
	stand: {
		do: function(message, parms, client) {
			var who = message.author.id;
			var pl = players[who];
			var pLoc = pl.location;

			if (pl.posture === 'standing') {
				ut.chSend(message, 'You are already standing up.');
			} else {
				pl.posture = 'standing';
				eMaster('roomGeneric', pLoc, who, {
					normal: ['You stand up.','stands up.']
				}, client);
			}
		}
	},
	me: {
		do: function(message, parms, client) {
			
			var whatSaid = parms;
			
			if (!whatSaid) {
				ut.chSend(message, 'It\'s always about you, isn\'t it?');
				return;
			}
			
			if (whatSaid.length > 511) {
				ut.chSend(message, 'You may only use actions up to 511 characters.');
				return;
			} 

			var who = message.author.id;
			var fail = cantDo(who, 'me');
			if (fail) {
				ut.chSend(message, fail);
				return;
			}
			var pLoc = players[who].location;
			
			// Fire off some events -- notify eMaster
			eMaster('roomGeneric', pLoc, who, {
				normal: [
					'_' + players[who].charName + ' ' + whatSaid + '_',
					' _' + whatSaid + '_'
				]
			}, client);
		}
	},
	who: {
		do: function(message, parms) {
			// accepts either an id or a charName
			var player;
			var pFind = function() {
				for (var pl in players) {
					if (players[pl].charName === parms) {
						return players[pl];
					}
				}
			};
			// dangerous:
			if (players[parms]) {
				player = players[parms];
			} else {					
				player = function() {
					for (var pl in players) {
						if (players[pl].charName === parms) {
							return players[pl];
						}
					}
				}();
			}
			
			if (player) {
				console.log(player);
			} else {
				ut.chSend(message, 'Sorry, I couldn\'t find ' + parms);
			}
		}
	}
};