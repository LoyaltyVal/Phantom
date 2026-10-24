const economyModel = require('../models/economyModel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'work',
    description: 'This command is used to work',
    async execute(message, args) {
        const { guild, author: user } = message;
        let economyData = await economyModel.findOne({ guildId: guild.id, userId: user.id });
        if (!economyData) {
            economyData = await economyModel.create({ userId: user.id, username: user.globalName || user.username, guildId: guild.id });
        }

        const cooldown = 1000 * 60 * 10;
        const now = Date.now();
        if (economyData.lastWork && now - economyData.lastWork < cooldown) {
            const timeLeft = (economyData.lastWork + cooldown) - now;
            
            return message.reply({ 
                content: `You can only work once every ${formatMilliseconds(timeLeft)} seconds.`
            }).then(msg => {
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 3000);
            });
        }

        const workList = [
            {
                type: 'farm',
                maxReward: 300,
                chance: 0.7,
                messages: [
                    'You successfully harvested some crops!',
                    'Your farm produced some food!',
                    'You harvested a ton of crops!'
                ]
            },{
                type: 'craft',
                maxReward: 500,
                chance: 0.5,
                messages: [
                    'You successfully crafted something!',
                    'Your crafting workshop produced some items!',
                    'You crafted a lot of items!'
                ]
            },{
                type: 'hunt',
                maxReward: 1000,
                chance: 0.3,
                messages: [
                    'You successfully hunted for some meat!',
                    'Your hunting ground produced some meat!',
                    'You hunted for a ton of meat!'
                ]
            },{
                type: 'fish',
                maxReward: 200,
                chance: 0.4,
                messages: [
                    'You successfully caught some fish!',
                    'Your fishing hole produced some fish!',
                    'You caught a lot of fish!'
                ]
            },{
                type: 'blacksmith',
                maxReward: 800,
                chance: 0.2,
                messages: [
                    'You successfully forged some armor!',
                    'Your blacksmith\'s forge produced some armor!',
                    'You forged a lot of armor!'
                ]
            },{
                type: 'police',
                maxReward: 1500,
                chance: 0.05,
                messages: [
                    'You successfully arrested a criminal!',
                    'Your police station produced some arrests!',
                    'You arrested a lot of criminals!'
                ]
            },{
                type: 'robbery',
                maxReward: 500,
                chance: 0.01,
                messages: [
                    'You successfully robbed a bank!',
                    'Your bank robbery produced some money!',
                    'You robbed a lot of banks!'
                ]
            },{
                type: 'Mayor',
                maxReward: 2000,
                chance: 0.005,
                messages: [
                    'You successfully appointed a new mayor!',
                    'Your city government produced some news!',
                    'You appointed a lot of new mayors!',
                    'Your mayor was elected!'
                ]
            },{
                type: 'none',
                maxReward: 0,
                chance: 0.1,
                messages: [
                    'You did not earn any money from working.',
                ]
            }
        ];

        const work = workList[Math.floor(Math.random() * workList.length)];
        const reward = Math.floor(Math.random() * (work.maxReward + 1));

        economyData.balance += reward;
        economyData.lastWork = now;
        await economyData.save();

        const randomMessage = work.messages[Math.floor(Math.random() * work.messages.length)];
        const embed = new EmbedBuilder()
           .setColor('#0099ff')
           .setAuthor({ name: 'Work', iconURL: user.displayAvatarURL({ dynamic: true }) })
           .setDescription(`${randomMessage}\n\nYour new balance is ${economyData.balance}.`)
           .setFooter({
                text: message.guild.name,
                iconURL: message.guild.iconURL()
            })
            .setTimestamp();
            
        message.reply({ embeds: [embed] });

    }
}

function formatMilliseconds(milliseconds) {
    let totalSeconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    // Formatear para asegurarse de que haya dos dígitos para los segundos
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return `${minutes}:${seconds}`;
}