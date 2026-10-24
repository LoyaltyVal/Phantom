const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const economyModel = require('../models/economyModel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('money')
        .setDescription('Manage your economy')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(option => option
            .setName('add')
            .setDescription('Give money to a specific user')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to give money to')
               .setRequired(true)
            )
            .addNumberOption(option => option
                .setName('amount')
                .setDescription('The amount of money to give')
                .setRequired(true)
            )
        )
        .addSubcommand(option => option
            .setName('remove')
            .setDescription('Take money from a specific user')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to take money from')
                .setRequired(true)
            )
            .addNumberOption(option => option
                .setName('amount')
                .setDescription('The amount of money to take')
                .setRequired(true)
            )
        ),
    async execute(interaction) {
        const { options, guild } = interaction;
        const subcommand = options.getSubcommand();
        if (!subcommand) return;
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        if (subcommand.name === 'add') {
            const economyData = await economyModel.findOne({ userId: user.id, guildId: guild.id });
            if (!economyData) {
                await economyModel.create({ discordId: user.id, balance: amount });
            } else {
                economyData.balance += amount;
                await economyData.save();
            }

            const embedAdd = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Money Added')
                .setDescription(`You have received ${amount} coins from ${interaction.user.username}`)
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });
            interaction.reply({ embeds: [embedAdd] });
        } else if (subcommand.name ==='remove') {
            const economyData = await economyModel.findOne({ userId: user.id, guildId: guild.id });
            if (!economyData || economyData.balance < amount) {
                return interaction.reply({ content: 'You do not have enough coins to remove that amount.', ephemeral: true });
            }
            economyData.balance -= amount;
            await economyData.save();

            const embedRemove = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Money Removed')
                .setDescription(`You have lost ${amount} coins from ${interaction.user.username}`)
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });
            interaction.reply({ embeds: [embedRemove] });
        }
    }
}