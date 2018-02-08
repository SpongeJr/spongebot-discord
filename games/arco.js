// this var is local to the module
var ut = require('../lib/utils.js');

// as is this "v" object, where I'm putting the other variables
// that I want the function to use.
// why inside another object? I can then save or move around
// all the variables easily

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
	acroccfg: function() {
		
	}
};