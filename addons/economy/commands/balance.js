const economySchema = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');
const getMentionedUser  = require('../utils/getUser');

module.exports = {
    name: 'balance',
    description: 'Check your balance',
    aliases: ['bal'],
    async execute(message, args) {
        if (args.length > 1) {
            return message.reply({ content: 'Please provide a user mention or no arguments to check your own balance.'})
                .then(m => m.delete({ timeout: 5000 }));
        }
        const mentionedUser = await getMentionedUser(message.guild, args[0]);
        const user = mentionedUser || message.author;
        const userData = await economySchema.findOne({ userId: user.id, guildId: message.guild.id });
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Balance')
            .addFields({ name: 'Balance', value: `🪙 ${userData ? userData.balance : 0}`, inline: true },
                { name: 'Bank', value: `🪙 ${userData ? userData.bank : 0}`, inline: true  },
                { name: 'Total', value:  `🪙 ${userData ? userData.balance + userData.bank : 0}`, inline: true  })
            .setFooter({
                text: user.globalName || user.username,
                iconURL: user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}

