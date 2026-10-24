const { ChannelType } = require('discord.js')

module.exports = {
  name: 'announcement',
  async execute(message, args) {
    const { channelId, author, client } = message;
    if (author.username !== 'byjoako') return;
    if (args.length == 0) return;
    
    const channel = await client.channels.fetch(channelId)
   
    const targetMessage = channel.messages.cache.get(args[0]);
    if (!targetMessage) return;
    
    
    const messageToSend = { 
            content: targetMessage.content || '',
            embeds: targetMessage.embeds || [],
            components: targetMessage.components || [],
            stickers: targetMessage.stickers || []
        };
    
    let count = 0;
    const botMember = channel.guild.members.cache.get(client.user.id);
    
    client.guilds.cache.map(g => {
      let availableChannel = g.channels.cache.get(g.publicUpdatesChannelId) || g.channels.cache.get(g.rulesChannelId);

      if (!availableChannel) {
        availableChannel = g.channels.cache.find(c => c.type == ChannelType.GuildText && c.permissionsFor(botMember).has('SEND_MESSAGES'));
      }
      if (availableChannel) {
        availableChannel.send(messageToSend);
        count++;
      }
    })
    
    channel.send(`Se envio el anuncio a ${count}/${client.guilds.cache.size}`).then(m => setTimeout(function() {
      m.delete()
    }, 3000))
  }
}