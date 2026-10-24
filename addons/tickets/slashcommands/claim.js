
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const buttonClaim = require('../buttons/claimTicket');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim or unclaim a ticket')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManagerMessages),
    async execute(interaction) {
      buttonClaim.execute(interaction);
    }
}