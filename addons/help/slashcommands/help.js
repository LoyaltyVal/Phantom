const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const { categories } = require('../utils/addonsData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a help menu with options to explore commands interactively.'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Help Menu')
      .setDescription('Use the menu below to select a category or explore individual commands.')
      .setColor('Blue');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help-menu')
      .setPlaceholder('Select a category')
      .addOptions(categories);

    const button =  new ButtonBuilder()
          .setCustomId('get-started')
          .setLabel('Get Started')
          .setStyle('Primary')
   

    await interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu), new ActionRowBuilder().addComponents(button)],
      ephemeral: true,
    });
  },
};

