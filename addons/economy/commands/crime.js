const economyModel = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'crime',
    description: 'Simulates a crime scene',
    async execute(message, args) {
        const { guild, mentions, author: user } = message;
        
        let economyData = await economyModel.findOne({ guildId: guild.id, userId: user.id });
        if (!economyData) {
            economyData = await economyModel.create({ userId: user.id, username: user.globalName || user.username, guildId: guild.id });
        }

        const cooldown = 1000 * 60 * 10;
        const now = Date.now();
        if (economyData.lastCrime && now - economyData.lastCrime < cooldown) {
            const timeLeft = (cooldown - (now - economyData.lastCrime)) / 1000;
            return message.reply(`You can't commit another crime within ${timeLeft.toFixed(1)} seconds.`).then(m => {
                setTimeout(() => {
                    message.delete()
                    m.delete()
                }, 3000);
            });
        }

        const crimeList = [
            {
                item: 'Car',
                value: Math.floor(Math.random() * 1000) + 1,
                description: 'You stole a high stability car.',
            },{
                item: 'Knife',
                value: Math.floor(Math.random() * 1000) + 1,
                description: 'You stole a knife.',
            },{
                item: 'Money',
                value: Math.floor(Math.random() * 100000) + 1,
                description: 'You stole some money.',
            },{
                item: 'Victim',
                value: Math.floor(Math.random() * 100) + 1,
                description: 'You stole a victim.',
            },{
                item: 'Weapon',
                value: Math.floor(Math.random() * 100) + 1,
                description: 'You stole a weapon.',
            },{
                item: 'Food',
                value: Math.floor(Math.random() * 100) + 1,
                description: 'You stole some food.',
            },{
                item: 'Clothing',
                value: Math.floor(Math.random() * 100) + 1,
                description: 'You stole some clothing.',
            },{
                item: 'Vehicle',
                value: Math.floor(Math.random() * 100) + 1,
                description: 'You stole a vehicle.',
            },{
                item: 'Equipment',
                value: Math.floor(Math.random() * 100) + 1,
                description: 'You stole some equipment.',
            },{
                item: 'Amenaza',
                value: Math.floor(Math.random() * 100) + 1,
                description: 'You stole an amenaza.',
            }
        ];

        const crime = crimeList[Math.floor(Math.random() * crimeList.length)];
        economyData.balance += crime.value;
        economyData.lastCrime = now;
        await economyData.save();

        const embed = new EmbedBuilder()
           .setColor('#FF0000')
           .setAuthor({ name: 'Crime Scene', iconURL: user.displayAvatarURL({ dynamic: true }) })
           .setDescription(`**${user.username}'s Crime Scene**\n\n${crime.description}\n\n**Money Stolen:** ${crime.value} 🪙`)
           .setFooter({
                text: message.guild.name,
                iconURL: message.guild.iconURL()
            })
        
        message.reply({ embeds: [embed] });
    }
}