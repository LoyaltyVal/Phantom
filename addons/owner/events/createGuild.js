module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    try {
      const botMember = guild.members.cache.get(guild.client.user.id);

      // Check if the bot has Administrator permissions
      if (!botMember.permissions.has('Administrator')) {
        const availableChannel = guild.channels.cache.find(c => c.type == ChannelType.GuildText && c.permissionsFor(botMember).has('SEND_MESSAGES'));

        if (availableChannel) {
          await availableChannel.send({
            content: '🚨 **Important Notice:** I need Administrator permissions to function properly. Please update my permissions or contact the server owner. I will leave the server in 5 minutes if this is not resolved.',
          });
        } 
        

        // Leave the server after 5 minutes if no action is taken
        setTimeout(() => {
          guild.leave()
            .then(g => console.log(`Left the guild: ${g.name} (${g.id}) due to lack of Administrator permissions.`))
            .catch(err => console.error('Failed to leave guild:', err));
        }, 1000 * 60 * 3);

        return;
      }

      // Try to find a suitable channel to send the welcome message
      let channel = guild.channels.cache.get(guild.publicUpdatesChannelId) || guild.channels.cache.get(guild.rulesChannelId);

      if (!channel) {
        channel = guild.channels.cache.find(c => c.type == ChannelType.GuildText && c.permissionsFor(botMember).has('SEND_MESSAGES'));
      }

      if (!channel) {
        console.log(`No suitable channel found in ${guild.name} to send the welcome message.`);
        return;
      }

      // Send the welcome message
      await channel.send({
        content: `🎉 **Hello, ${guild.name}!**\n\nThank you for inviting me to your server! I'm here to assist you with a variety of tasks. Type \`/help\` to see what I can do. Let's make your server an even better place!`,
      });

      console.log(`Sent a welcome message to ${guild.name} (${guild.id}) in channel ${channel.name}`);
    } catch (error) {
      console.error(`Failed to send a welcome message in ${guild.name} (${guild.id}):`, error);
    }
  }
};