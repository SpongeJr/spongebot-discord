module.exports = {
	debugMode: true,
	enableDebugChan: true,
	autoEmbed: false,
	debugPrint: function(inpString){
	// throw away that old console.log and try our brand new debugPrint!
	// can add all sorts of goodies here, like sending output to a Discord chan or DN
	// for now, just checks if the global debugMode is true. If it isn't,
	// doesn't output, just returns
		if (this.debugMode) {
			console.log(inpString);
			if (this.enableDebugChan) {
				if ((inpString !== '') && (typeof inpString === 'string')) {
					// todo: rate limiter?
					if (inpString.length < 1024) { 
						//BOT.channels.get(DEBUGCHAN_ID).send(inpString);
					}
				}
			}
		}
	},
	bigLet: function(inp) {
		var outp = '';
		var ch = '';
		for (var i = 0; i < inp.length; i++) {
			ch = inp.charAt(i);
			
			if (ch === ' ') {
				//TODO: figure out how to do the blank tile emoji
				//outp += '<:blank:410757195836293120>';
				outp += '____ ' ;
			} else {
				ch = ch.toLowerCase();
				outp += ':regional_indicator_' + ch + ': ';
			}
		}	
		return outp;
	},
	chSend: function(message, str, emb) {

		// temporary stuff
		
		if (typeof message === 'undefined') {
			debugPrint('chSend: message is undefined!');
			return
		}
		
		if (!message.hasOwnProperty('author')) {
			debugPrint('chSend: No .author property on message!');
			return;
		}
		
		if (!message.author.hasOwnProperty('bot')) {
			debugPrint('chSend: no .bot property on message.author!');
			return;
		}
		
		if (message.author.bot) {
			debugPrint(' -- Blocked a bot-to-bot m.channel.send');
			return;
		}
		if (this.autoEmbed) {
		// turn all chSend() messages into emebed, if autoEmbed is on
			if (typeof emb === 'undefined') {
				emb = {"description": str}
			}
		}
	
		if (typeof emb !== 'undefined') {
			// we have an embed, so use it
			message.channel.send({embed: emb}).catch(reason => {
				debugPrint('Error sending a channel message: ' + reason);
			});
		} else {	
			// no embed, send standard message
			message.channel.send(str).catch(reason => {
				debugPrint('Error sending a channel message: ' + reason);
			});
		}
	},
	auSend: function(message, str) {
		if (message.author.bot) {
			debugPrint(' -- Blocked a bot-to-bot m.author.send');
			return;
		}
		
		message.author.send(str).catch(reason => {
			debugPrint('Error sending a DM: ' + reason);
		});
	}
};
