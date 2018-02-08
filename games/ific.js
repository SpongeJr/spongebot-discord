// this var is local to the module
var ut = require('../lib/utils.js');

// as is this "v" object, where I'm putting the other variables
// that I want the function to use.
// why inside another object? I can then save or move around
// all the variables easily
var v = {
	story: 'Once upon a time...',
	undoIndex: 0,
	quotes: [
		{
			"who": "167711491078750208",
			"quote": "I never said this, it's actually hardcoded."
		},
		{	"who": "167711491078750208",
			quote: "I never said this, either."
		},
		{	"who": "Abraham Lincoln",
			quote: "What cherry tree?!"
		}
	]
}
//-----------------------------------------------------------------------------
// this whole .z object, .zlcear object, and .zstoryup object are all going to
// be accessible in the global context.
//
// You get to it via require, e.g.:
// var ific = require('ific.js'); 
// ific.js is this file
// ific is a variable that now holds the whole module.exports object below

// The actual organiation in one of these modules is up to you,
// but there's are useful patterns we're working on coming up with.
//
// In this example, I'm keeping a story in an object v that is local
// to this whole module, not accessible to the outside, but fully
// visible to everything within. I do this so it can be accessed by
// mutliple commands in this module.
//
// If I need a value back in the global scope, I should return it


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
				ut.chSend(message, ':pencil2: start a new story with !z :pen_fountain:');
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
				ut.chSend(message, ':pencil2: start a new story with !z :pen_fountain:');
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
			ut.chSend(message, '```' + v.story + '```');
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
				ut.chSend(message, '`There is no story to speak of.\n' +
				  'You can start one with `!z`.');
			} else {
				ut.chSend(message, '`Current story: ' + ch + ' characters.`');
			}
		}
	},
	quote: {
		do: function(message, parms) {
			
		}
	}
};