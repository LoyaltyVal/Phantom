const verificationModel = require('../models/verification.js');
const { EmbedBuilder } = require('discord.js');
const { getCaptcha } = require('../utils/captchas.js');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot || reaction.emoji.name !== '✅') return;
    
    const { message } = reaction
    
    
    try {
      const verificationData = await verificationModel.findOne({
        guildId: message.guildId,
        channelId: message.channelId,
        messageId: message.id
      });

      if (!verificationData) return;

      await reaction.users.remove(user);

      const member = message.guild.members.cache.get(user.id);

      const addRole = await message.guild.roles.fetch(verificationData.addRole);
      const removeRole = verificationData.removeRole ? await message.guild.roles.fetch(verificationData.removeRole) : null;

      const captcha = await getCaptcha();

      const msg = await user.send({
        embeds: [new EmbedBuilder()
          .setTitle('Verification')
          .setDescription('You have **1 minute** to verify yourself using this captcha. Reply with the complete code or else you will not be verified.')
          .setImage(captcha.url)
          .setColor('DarkGreen')]
      });

      const collected = await msg.channel.awaitMessages({
        time: 60000,
        max: 1,
        errors: ['time']
      });

      const response = collected.first();
      if (response.content === captcha.code) {
        if (removeRole && member.roles.cache.has(removeRole.id)) {
          await member.roles.remove(removeRole);
        }

        if (addRole && !member.roles.cache.has(addRole.id)) {
          await member.roles.add(addRole);
        }

        await response.reply({ content: '**You have successfully verified yourself!**' });
      } else {
        await response.reply({ content: '**The code entered is incorrect. Please try the verification again.**' });
      }
    } catch (error) {
      if (error.code === 50007) { // User has DMs disabled
        await message.reply({
          content: `${user}, you do not have private messages enabled. Please enable them and try again.`,
          ephemeral: true
        });
      } else if (error.name === 'CollectionError') { // Catch the awaitMessages timeout error
        await user.send({ content: 'Verification time has expired. Please try again.' });
      } else {
        console.error('Error during verification:', error);
      }
    }
  }
};