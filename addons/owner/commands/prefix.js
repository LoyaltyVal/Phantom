const guildModel = require('../../../models/guildModel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'prefix',
    async execute(message, args) {
        const { guild, client } = message;
        const guildData = await guildModel.findOne({ guild_id: guild.id });
        const prefix = guildData && guildData.prefix ? guildData.prefix : client.prefix;
        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription(`The current prefix is \`${prefix}\`.`)
            ]
        });
    }
}
