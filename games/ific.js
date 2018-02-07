// this var is local to the module
var ut = require('../lib/utils.js');
//-----------------------------------------------------------------------------
// this whole .z object, .zlcear object, and .zstoryup object are all going to
// be accessible in the global context.
//
// You get to it via require, e.g.:
// var ific = require('ific.js'); 
// ific.js is this file
// ific is a variable that now holds the whole module.exports object below
//
// Once you hit spongeBot.yourCommand.do(), you should be finding your way
// to somemodule.do() or (better, so that you can store variables and do
// other fancy stuff): somemodule.somethingelse.do()
//
// THe actual organiation in one of these modules is up to you,
// but there's are useful patterns we're working on coming up with

module.exports = {
	z: {
		v: {
			story: 'Once upon a time...'
		},
		do: function(message, parms) {
			this.story += parms + ' ';
			chSend(message, '```' + this.story + '```');
		},
	},
	zclear: {
		do: function(message, parms, v) {
			v.story = '';
			chSend(message, '`Story cleared.`');
			return v;
		}
	},
	zstoryup: {
		do: function(message, parms, v) {
			
		}
	}
};