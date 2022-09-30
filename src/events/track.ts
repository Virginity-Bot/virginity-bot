//This module keeps tabs on the amount of time a user spends on discordand assigns them XP ;)
import { Virgin } from "../entities/virgin-entity";
import { MikroORM, wrap } from "@mikro-orm/core";


module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(oldState: { channelId: any; }, newState: { channelId: any; member: { id: any; }; }) {
		console.log(`Voice.`);
        let newUserChannel = newState.channelId;
	    let oldUserChannel = oldState.channelId; 
        const orm = await MikroORM.init()
        const time = Math.round(new Date().getTime()/(1000*60)); //returns minutes since 1/1/1970
        let virginity: number = 0;
        //This set of If statements checks if a user is joining, moving (between channels), or leaving a discord.
        //Listens for every update on a users channel state.
        if (oldUserChannel == undefined && newUserChannel !== undefined) {
            // User Join a voice channel
            
            try {
                const virgin = await orm.em.findOneOrFail(Virgin, { _id: newState.member.id });
                const virgin1 = new Virgin(newState.member.id, virgin.virginity, time)
                console.log("Updating");
                wrap(virgin).assign( virgin1,{ mergeObjects: true })
                await orm.em.persistAndFlush(virgin)

              } catch (e) {
                //console.error(e); // our custom error
                const virgin1 = new Virgin(newState.member.id, virginity, time)
                console.log("Creating");
                const virgin = orm.em.create(Virgin, {_id: virgin1._id, virginity: virgin1.virginity, blueballs: time})
                await orm.em.persistAndFlush(virgin)
              }
            
        }  else if (
            oldUserChannel !== null &&
            newUserChannel !== null &&
            oldUserChannel != newUserChannel
        ) {
            // User switches voice channel
            console.log(` switched.`);
            //console.log(oldState);
        } else {
            try {
                const virgin = await orm.em.findOneOrFail(Virgin, { _id: newState.member.id });
                console.log(`exited`);
                const virgin1 = new Virgin(newState.member.id, (Math.round(virgin.virginity)+Math.round(time-virgin.blueballs)), time)
                wrap(virgin).assign( virgin1,{ mergeObjects: true })
                console.log(virgin);
                await orm.em.persistAndFlush(virgin)

              } catch (e) {
                //console.error(e); // our custom error
                console.log("User not in DB left chat. (Bot probably added while user was in session)");
              }
        }
        
	},
};

const update = async() => {

}