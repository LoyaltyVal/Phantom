const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const economyModel = require('../models/economyModel');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('balance')
        .setType(ApplicationCommandType.User),
    async execute(interaction) {
        const { guild, user } = interaction;
        const userData = await economyModel.findOne({ guildId: guild.id, userId: user.id });
        
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

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
}