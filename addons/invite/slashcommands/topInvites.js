const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const inviteModel = require('../models/invite'); // Asegúrate de que este sea el modelo correcto de tu base de datos

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topinvites')
    .setDescription('Displays the top users with the most invites.'),
  async execute(interaction) {
    try {
      // Obtener los datos de invitaciones del servidor
      const guildId = interaction.guild.id;
      const inviteData = await inviteModel.find({ guildId });

      if (!inviteData.length) {
        return interaction.reply({ content: 'No invitation data found for this server.', ephemeral: true });
      }

      // Ordenar por la cantidad de invitaciones
      inviteData.sort((a, b) => b.inviteTotal - a.inviteTotal);

      // Limitar a los 10 mejores usuarios
      const topInvites = inviteData.slice(0, 10);

      // Construir el leaderboard
      const leaderboard = topInvites.map((data, index) => {
        return `${index + 1}. <@${data.userId}> - ${data.inviteTotal} invites [${data.inviteJoinedCount} Joined, ${data.inviteLeaveCount} Left, ${data.inviteFakeCount} Fake]`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top Inviters')
        .setDescription(leaderboard)
        .setColor('Gold')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching invite leaderboard:', error);
      await interaction.reply({ content: 'There was an error retrieving the invite leaderboard.', ephemeral: true });
    }
  }
};