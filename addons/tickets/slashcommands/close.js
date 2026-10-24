const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const buttonClose = require('../buttons/closeTicket');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Closed the ticket')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManagerMessages),
    async execute(interaction) {
      buttonClose.execute(interaction);
    }
}