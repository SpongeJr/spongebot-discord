// this var is local to the module
var ut = require('../lib/utils.js');

// as is this "v" object, where I'm putting the other variables
// that I want the function to use.
// why inside another object? I can then save or move around
// all the variables easily
var v = {
	story: 'Once upon a time...',
	undoIndex: 0,
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
}
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
		}
	}),
	"outside the airport": new Room({
		"title": "Outside a weird virtual airport.",
		"description": "On the outside of a weird virtual airport in the middle of " +
		  "a weird virtual world. How did you manage to wind up here, anyway?"}),
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
			
		}
	}
};