const { ActivityType } = require('discord.js')

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    setInterval(async () => {
      const guildsCount = client.guilds.cache.size
      const channelsCount = client.channels.cache.size
      const membersCount = client.guilds.cache.reduce((a, b) => a + b.memberCount, 0);
      
			const activity = [{
        status: 'online',
        text: `${guildsCount} Servers`,
        type: ActivityType.Playing,
      },{
        status: 'online',
        text: `${channelsCount} Channels`,
        type: ActivityType.Playing
      },{
        status: 'online',
        text: `${membersCount} Members`,
        type: ActivityType.Playing
      }]
	    const random = Math.floor(Math.random() * activity.length);
	    client.user.setStatus(activity[random].status);
	    client.user.setActivity(activity[random].text, { type: activity[random].type });
		}, 20000);
  }
}