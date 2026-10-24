const economyModel = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'withdraw',
    description: 'Withdraw money from your balance',
    aliases: ['with'],
    async execute(message, args) {
        if (args.length <= 0 || args[0] <= 0) {
            return message.reply('Please provide a valid amount to withdraw.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }
        const amount = parseInt(args[0]);
        const user = message.author;
        const userData = await economyModel.findOne({ userId: user.id, guildId: message.guild.id });
        if (!userData || userData.bank < amount) {
            return message.reply('You do not have enough money to withdraw that amount.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }

        userData.balance += amount;
        userData.bank -= amount;
        await userData.save();

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: 'Withdraw', iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`You withdrew ${amount} 🪙 from your bank. Your new balance is ${userData.balance + userData.bank}.`)
            .setFooter({
                text: message.guild.name,
                iconURL: message.guild.iconURL()
            })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }
}