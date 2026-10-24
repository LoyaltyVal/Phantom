const economyModel = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'topbalance',
    description: 'Shows the top 10 players with the highest balance',
    aliases: ['lb'],
    async execute(message, args) {
        const { guild } = message;
        const economyData = await economyModel.find({ guildId: guild.id })
        const sortedBalances = economyData.sort((a, b) => b.balance - a.balance)
        const slicedBalances = sortedBalances.slice(0, 10);
        const leaderboard = slicedBalances.map((player, index) => `**${index + 1}.** ${player.globalName || player.username} • ${player.balance} 🪙`);
        
        if (sortedBalances.length === 0) {
            return message.reply('No players found in the economy system.');
        }

        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Leaderboard')
                    .setColor('#0099ff')
                    .setDescription(`${leaderboard.join('\n')}`)
                    .setFooter({
                        text: 'Your leaderboard rank: ' + (sortedBalances.findIndex(player => player.userId === message.author.id)) + 1,
                        iconURL: guild.iconURL()
                    })
            ]
        });
    }
}