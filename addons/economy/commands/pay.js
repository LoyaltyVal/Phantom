const economyModel = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');
const getMentionedUser = require('../utils/getUser');

module.exports = {
    name: 'pay',
    description: 'Pay an user with a specified amount',
    async execute(message, args) {
        const { guild, mentions, author: authorUser, } = message;
        if (args.length < 2) {
            return message.reply('Please provide a user mention and an amount to pay.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }
        const mentionedUser = await getMentionedUser(guild, args[0]);
        if (!mentionedUser) {
            return message.reply('Please provide a valid user mention.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }

        const amount = parseInt(args[1]);
        
        if (isNaN(amount) || amount <= 0) {
            return message.reply('Please provide a valid amount to pay.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }
        
        let authorData = await economyModel.findOne({ guildId: guild.id, userId: authorUser.id });
        if (!authorData) {
            economyModel.create({ userId: authorUser.id, username: authorUser.globalName || authorUser.username, guildId: guild.id });
            authorData = await economyModel.findOne({ userId: authorUser.id, guildId: guild.id });
        }
        
        let mentionedUserData = await economyModel.findOne({ userId: mentionedUser.id, guildId: guild.id });
        if (!mentionedUserData) {
            economyModel.create({ userId: mentionedUser.id, username: mentionedUser.globalName || mentionedUser.username, guildId: guild.id });
            mentionedUserData = await economyModel.findOne({ userId: mentionedUser.id, guildId: guild.id });
        }
        
        if (authorData && authorData.balance < amount) {
            return message.reply('You don\'t have enough money to pay.')
                .then(m => setTimeout(() => {
                    m.delete();
                }, 5000));
        }
        
        authorData.balance -= amount;
        mentionedUserData.balance += amount;
        
        await authorData.save();
        await mentionedUserData.save();
        
        message.reply({ embeds: [
            new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ name: 'Payment', iconURL: authorUser.displayAvatarURL({ dynamic: true }) })
                .setDescription(`Successfully paid ${mentionedUser} ${amount} 🪙`)
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() })
        ] });
    }
}