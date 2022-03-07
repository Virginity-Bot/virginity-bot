const { VoiceChannel, VoiceState } = require("discord.js");
const moment= require('moment') 

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	execute(oldState, newState) {
		console.log(`Voice.`);
        //if(voiceStateUpdate.newMember) return;
        let newUserChannel = newState.channelId;
	    let oldUserChannel = oldState.channelId; 
        if (oldUserChannel == undefined && newUserChannel !== undefined) {
            // User Join a voice channel
            console.log(`joined.`);
            //console.log(newState.guild.id);
            console.log(newState.member.id);
            var time = new Date().getTime();
            console.log(time);
        } else if (oldUserChannel !== undefined && newUserChannel === undefined) {
            // User Leave a voice channel
            // Calculate with previous save time to get in voice time
            console.log(`logged off.`);
        } else if (
            oldUserChannel !== null &&
            newUserChannel !== null &&
            oldUserChannel != newUserChannel
        ) {
            // User Switch a voice channel
            console.log(` switched.`);
            //console.log(oldState);
        } else {
            // User exited
            console.log(`exited`);
        }
        
	},
};