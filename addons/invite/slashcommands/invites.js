const { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } = require('discord.js');
const inviteModel = require('../models/invite');
const { getLenguage } = require('../lenguage/lenguage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Displays the number of invites a user has.')
    .setDMPermission(false)
    .setDescriptionLocalizations({
      'es-ES': getLenguage('es-ES').commands.invites.description
    })
    .addUserOption(option => 
        option.setName('user')
            .setDescriptionLocalizations({
              'es-ES': getLenguage('es-ES').commands.invites.userOption
            })
            .setDescription('The user to check invites for')
            .setRequired(false)
    ),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
  async execute(interaction) {
    const { user, guild, options, locale } = interaction;
    const targetUser = options.getUser('user') || user;
    console.log(guild)
    try {
        const inviteData = await inviteModel.findOne({ userId: targetUser.id, guildId: guild.id });

        if (!inviteData) {
            return interaction.reply({ content: lenguage[locale].commands.invites.noInvite, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${targetUser.globalName || targetUser.username}'s Invites`, iconURL: targetUser.displayAvatarURL() })
            .setColor('#00b4d8')
            .addFields(
                { name: 'Total Invites', value: `${inviteData.inviteTotal}`, inline: true },
                { name: 'Joined Invites', value: `${inviteData.inviteJoinedCount}`, inline: true },
                { name: 'Fake Invites', value: `${inviteData.inviteFakeCount || 0}`, inline: true },
                { name: 'Left Invites', value: `${inviteData.inviteLeaveCount || 0}`, inline: true }
            )
            .setFooter({ text: `Requested by ${user.tag}`, iconURL:           user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Error fetching invite data:', error);
        await interaction.reply({ content: 'There was an error trying to fetch the invite data.', ephemeral: true });
    }
  }
};