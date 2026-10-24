const guildModel = require('../../../models/guildModel');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setPrefix',
    description: 'Sets the prefix for the bot',
    async execute(message, args) {
        if (!args[0]) {
            return message.reply('Please provide a new prefix.');
        }
        
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return
        const guildData = await guildModel.findOneAndUpdate({ guild_id: message.guild.id }, { prefix: args[0] });
        if (!guildData) {
            guildModel.create({ guild_id: message.guild.id, prefix: args[0] });
        }
        message.reply({ embeds: [
            new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Prefix Set')
                .setDescription(`New prefix set to: ${args[0]}`)
        ]
        });
    }
}
