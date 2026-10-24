const economyModel = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'deposit',
    description: 'Deposits money into your bank account',
    aliases: ['dep'],
    async execute(message, args) {
        const { author: user, guild } = message;
        if (args.length <= 0) {
            return message.reply('Please provide an amount to deposit.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }
        const amount = parseInt(args[0]);
        if (isNaN(amount)) {
            return message.reply('Please provide a valid number for the amount.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }
        const userData = await economyModel.findOne({ userId: user.id, guildId: guild.id });
        if (!userData) {
            return message.reply('You do not have money.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }

        if (amount > userData.balance) {
            return message.reply('You do not have enough money to deposit.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }
        userData.balance -= amount;
        userData.bank += amount;
        await userData.save();
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: 'Deposit', iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`You deposited ${amount} 🪙 into your bank account.`)
            .setFooter({ text: guild.name, iconURL: guild.iconURL() })
            
        message.reply({ embeds: [embed] });
    }
}