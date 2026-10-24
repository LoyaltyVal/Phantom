const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const inviteModel = require('../models/invite');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invitation')
        .setDescription('Manage invitation amount for users')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(option => option
            .setName('add')
            .setDescription('Add invitation amount to a user')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to add the invitation amount to')
                .setRequired(true)
            )
            .addNumberOption(option => option
                .setName('amount')
                .setDescription('The amount of invites to add')
                .setRequired(true)
            )
        )
        .addSubcommand(option => option
            .setName('remove')
            .setDescription('Remove invitation amount from a user')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to remove the invitation amount from')
                .setRequired(true)
            )
            .addNumberOption(option => option
                .setName('amount')
                .setDescription('The amount of invites to remove')
                .setRequired(true)
            )
        ),
    async execute(interaction) {
        const { options, guild } = interaction;
        const subcommand = options.getSubcommand();
        if (!subcommand) return;
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount') >= 0 ?  interaction.options.getNumber('amount') : 0;

        const inviteData = await inviteModel.findOne({ guildId: guild.id, userId: user.id });
        if (!inviteData) {
            inviteModel.create({ guildId: guild.id, userId: user.id, inviteFakeCount: subcommand == 'add' ? amount : 0, inviteTotal: subcommand == 'add' ? amount : 0 });
        } else {
            if (subcommand == 'add') {
                inviteData.inviteFakeCount += amount;
            } else {
                inviteData.inviteFakeCount -= amount;
            }
            inviteData.inviteTotal = inviteData.inviteJoinedCount + inviteData.inviteLeaveCount + inviteData.inviteFakeCount;
            await inviteData.save();
        }

        const embed = new EmbedBuilder()
           .setColor(0x3498db)
           .setTitle('Invite Management')
           .setDescription(`User: ${user.globalName || user.username}`)
           .addFields(
                { name: 'Current Invite Amount', value: `${inviteData ? inviteData.inviteTotal : amount}`, inline: true },
                { name: 'Action', value: subcommand == 'add'? 'Added' : 'Removed', inline: true },
                { name: 'Amount', value: `${amount}`, inline: true },
            );
        interaction.reply({ embeds: [embed] });
    }
}