const economyModel = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');
const getMentionedUser = require('../utils/getUser');

module.exports = {
    name: 'rob',
    description: 'Attempt to rob a user',
    async execute(message, args) {
        const { author: user, guild } = message;
        if (args.length < 1) {
            return message.reply('Please provide a user mention to rob.')
                .then(m => setTimeout(() => {
                    message.delete();
                    m.delete();
                }, 5000));
        }

        const mentionedUser = await getMentionedUser(guild, args[0]);
        if (!mentionedUser) {
            return message.reply('Please provide a valid user mention to rob.')
                .then(m => setTimeout(() => {
                    message.delete();
                    m.delete();
                }, 5000));
        }

        let targetData = await economyModel.findOne({ guildId: guild.id, userId: mentionedUser.id });
        let userData = await economyModel.findOne({ guildId: guild.id, userId: user.id });
        if (!userData) {
            userData = await economyModel.create({ guildId: guild.id, userId: user.id, username: user.globalName || user.username });
        }
        if (!targetData) {
            targetData = await economyModel.create({ guildId: guild.id, userId: mentionedUser.id, username: mentionedUser.globalName || mentionedUser.username });
        }

        const cooldown = 1000 * 60 * 1;
        const now = Date.now();
        if (userData.lastRob && now - userData.lastRob < cooldown) {
            return message.reply('You must wait 10 minutes before attempting to rob again.')
                .then(m => setTimeout(() => {
                    message.delete();
                    m.delete();
                }, 5000));
        }

        const amount = targetData.balance;
        userData.balance += targetData.balance;
        userData.lastRob = now;
        
        targetData.balance = 0;
        await targetData.save();
        await userData.save();

        const robEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ name: 'Robbery', iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${user.globalName || user.username} robbed ${mentionedUser.globalName || mentionedUser.username} for ${amount} 💵.`)
            .setTimestamp()
        message.reply({ embeds: [robEmbed] });  
    }
}