const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require('discord.js');
const verificationModel = require('../models/verification');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setverification')
    .setDescription('Set up verification with a captcha system.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel where the verification will take place')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('message')
            .setDescription('Verification message')
            .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('interactiontype')
        .setDescription('Choose between button or reaction')
        .setRequired(true)
        .addChoices({ name: 'Button', value: 'button' },
            { name: 'Reaction', value: 'reaction' })
    )
    .addRoleOption(option =>
        option.setName('addrole')
            .setDescription('Role to add upon successful verification')
            .setRequired(true)
    )
    .addRoleOption(option =>
        option.setName('removerole')
            .setDescription('Role to remove upon successful verification')
            .setRequired(false)
    ),
  async execute(interaction) {
    const { guild, options, channel } = interaction;
    const channelTarget = options.getChannel('channel');
    const addRole = options.getRole('addrole');
    const removeRole = options.getRole('removerole');
    const messageTargetId = options.getString('message');
    const interactionType = options.getString('interactiontype');

    try {
        const message = await channel.messages.fetch(messageTargetId).catch(e => {});
        
        if (!message) {
            return interaction.reply({ content: 'Message not found.', ephemeral: true });
        }
        
        if (addRole.managed) {
            return interaction.reply({ content: `Role ${addRole} cannot be used for verification as it contains high permissions`, ephemeral: true });
        }
        if (removeRole && removeRole.managed) {
            return interaction.reply({ content: `Role ${removeRole} cannot be used for verification as it contains high permissions`, ephemeral: true });
        }
       
        const messageToSend = { 
            content: message.content || '',
            embeds: message.embeds || [],
            components: message.components || [],
            stickers: message.stickers || []
        };

        if (interactionType === 'button') {
            messageToSend.components.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verification')
                        .setLabel('Verify')
                        .setStyle('Success')
                )
            );
        }
        
        const messageSent = await channelTarget.send(messageToSend);
        
        if (interactionType === 'reaction') {
            await messageSent.react('✅');
        }
        
        let verificationConfig = await verificationModel.findOne({ guildId: guild.id });

        if (!verificationConfig) {
            verificationConfig = new verificationModel({
                guildId: guild.id,
                addRole: addRole.id,
                removeRole: removeRole ? removeRole.id : null,
                channelId: channelTarget.id,
                messageId: messageSent.id,
            });
            await verificationConfig.save();
            await interaction.reply({ content: 'Verification system configured successfully!', ephemeral: true });
        } else {
            verificationConfig.addRole = addRole.id;
            verificationConfig.removeRole = removeRole ? removeRole.id : null;
            verificationConfig.channelId = channelTarget.id;
            verificationConfig.messageId = messageSent.id;
            await verificationConfig.save();
            
            await interaction.reply({ content: 'Verification system updated successfully!', ephemeral: true });
        }
    } catch (error) {
        console.error('Error setting up verification system:', error);
        await interaction.reply({ content: 'There was an error setting up the verification system.', ephemeral: true });
    }
  }
};