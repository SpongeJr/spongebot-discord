var chSend = function(message, str, emb) {
	
	// temporary stuff
	if (typeof message === 'undefined') {
		//debugPrint('chSend: message is undefined!');
		return
	}
	
	if (!message.hasOwnProperty('author')) {
		//debugPrint('chSend: No .author property on message!');
		return;
	}
	
	if (!message.author.hasOwnProperty('bot')) {
		//debugPrint('chSend: no .bot property on message.author!');
		return;
	}
	
	if (message.author.bot) {
		//debugPrint(' -- Blocked a bot-to-bot m.channel.send');
		return;
	}
	message.channel.send(str).catch(reason => {
		//debugPrint('Error sending a channel message: ' + reason);
	});
};
//-----------------------------------------------------------------------------
module.exports = {
	z: {
		do: function(message, parms, v) {
			v.story += parms + ' ';
			chSend(message, '```' + v.story + '```');
			return v;
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