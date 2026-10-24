const verificationModel = require('../models/verification.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getCaptcha } = require('../utils/captchas.js');

module.exports = {
  name: 'verification',
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { message, guild, channel, user, member } = interaction;
    
    const verificationData = await verificationModel.findOne({ guildId: guild.id, channelId: channel.id, messageId: message.id });
    if (!verificationData) {
      return interaction.editReply({ content: 'Verification data not found.', ephemeral: true });
    }

    const addRole = await guild.roles.fetch(verificationData.addRole);
    const removeRole = verificationData.removeRole ? await guild.roles.fetch(verificationData.removeRole) : null;

    const captcha = await getCaptcha();

    // Generate 5 buttons, with one correct and 4 incorrect codes
    const correctButtonIndex = Math.floor(Math.random() * 5);
    const buttons = [];

    for (let i = 0; i < 5; i++) {
      buttons.push(new ButtonBuilder()
        .setCustomId(`captcha_${i}`)
        .setLabel(i === correctButtonIndex ? captcha.code : Math.random().toString(36).substring(2, 6).toUpperCase())
        .setStyle('Secondary'));
    }

    const row = new ActionRowBuilder().addComponents(buttons);

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setTitle('Verification')
        .setDescription('You have **1 minute** to verify yourself using this captcha. Click the correct code to be verified.')
        .setImage(captcha.url)
        .setColor('DarkGreen')],
      components: [row],
    });

    const filter = i => i.user.id === user.id;
    const collector = channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async i => {
      if (i.customId === `captcha_${correctButtonIndex}`) {
        await member.roles.add(addRole);
        if (removeRole) await member.roles.remove(removeRole);
        await i.update({ content: 'Verification successful! You have been granted access.', embeds: [], components: [], ephemeral: true });
      } else {
        await i.update({ content: 'Incorrect captcha code. Verification failed.', embeds: [], components: [], ephemeral: true });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({ content: 'Verification timed out. Please try again.', embeds: [], components: [], ephemeral: true });
      }
    });
  }
};