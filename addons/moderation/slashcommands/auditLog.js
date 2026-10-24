const { ChannelType, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const auditLog = require('../models/auditLogModel'); // Adjust the path according to your model's location

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auditlog')
    .setDescription('Configure the audit log channel')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel where audit logs will be sent')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('enable')
        .setDescription('Enable or disable the logging system')
        .setRequired(true)),
  async execute(interaction) {
    // Check if the user has administrator permissions
    const channel = interaction.options.getChannel('channel');
    const isEnable = interaction.options.getBoolean('enable');
    const guildId = interaction.guild.id;

    // Find the existing log entry in the database
    const logEntry = await auditLog.findOne({ guildId });

    if (logEntry) {
      // Update the existing entry
      logEntry.channelId = channel.id;
      logEntry.isEnable = isEnable;
      await logEntry.save();
    } else {
      // Create a new entry
      await auditLog.create({
        guildId,
        channelId: channel.id,
        isEnable
      });
    }

    return interaction.reply({ content: `Logging system ${isEnable ? 'enabled' : 'disabled'} in channel ${channel}.`, ephemeral: true });
  }
};