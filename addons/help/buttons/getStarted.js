const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'get-started',
  async execute(interaction) {
    const { client, guild } = interaction;
    
    // Crear el embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Getting Started', iconURL: client.user.displayAvatarURL() })
      .setDescription('Here are some tips to get you started using the bot.')
      .setColor('Blue')
      .addFields(
        { name: 'Explore Commands', value: 'Use the help menu to explore all available commands.' },
        { name: 'Customize Settings', value: 'Configure the bot settings to fit your server\'s needs.' },
        { name: 'Join Support', value: 'Need help? Join our support server for assistance.' }
      )
      .setFooter({ text: guild.name, iconURL: guild.iconURL() });
    
    // Crear los botones
    const inviteButton = new ButtonBuilder()
      .setLabel('Invite Bot')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🤖')
      .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`);

    const supportButton = new ButtonBuilder()
      .setLabel('Join Support Server')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🗳️')
      .setURL('https://discord.gg/jHh7CD76Nz');

    // Crear la fila de acciones con los botones
    const actionRow = new ActionRowBuilder()
      .addComponents(inviteButton, supportButton);

    // Actualizar la interacción con el embed y la fila de botones
    await interaction.update({
      embeds: [embed],
      components: [actionRow],
    });
  }
};