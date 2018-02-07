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
	zstoryup: {
		do: function(message, parms) {
			
		}
	},
	zsave: {
		do: function(message, parms, gameStats) {
			ut.chSend(message, '`Story saving is still being implemented.`');
			ut.setStat(message.author.id, 'profile', 'story', v.story, gameStats);
			ut.chSend(message, '...but I think I saved it to your profile ' +
			  'anyway, ' + message.author + '! Check with `!stats` for me?');
		}
	},
	quote: {
		do: function(message, parms) {
			
		}
	}
};