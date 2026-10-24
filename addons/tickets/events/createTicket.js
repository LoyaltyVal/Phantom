const ticketModel = require('../models/ticketModel');
const userModel = require('../models/userModel');
const { ButtonInteraction, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    /**
     * 
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { guild, member, customId, user, locale } = interaction;

        if (!customId.startsWith('ticketCategories')) return;

        const ticketData = await ticketModel.findOne({ guildId: guild.id });
        if (!ticketData) return interaction.reply({ content: 'Ticket data not found.', ephemeral: true });

        const categoryName = customId.replace('ticketCategories-', '');
        const category = ticketData.categories.find(c => c.name === categoryName);
        if (!category) return interaction.reply({ content: 'Invalid category.', ephemeral: true });

        // Verificar si el usuario ya tiene un ticket abierto en la misma categoría
        const existingTicket = await userModel.findOne({ guildId: guild.id, userId: member.id, isClosed: false });
        if (existingTicket) {
            return interaction.reply({
                content: `You already have an open ticket: <#${existingTicket.channelId}>.`,
                ephemeral: true
            });
        }

        const channel = await guild.channels.create({
            name: `ticket-${user.globalName || user.username}`,
            type: ChannelType.GuildText,
            topic: `Ticket category: ${category.name} | ${locale}`,
            parent: category.channel,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: category.role,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                }
            ],
        });

        await userModel.create({
            guildId: guild.id,
            userId: member.id,
            channelId: channel.id,
            role: category.role
        });

        const embed = new EmbedBuilder()
            .setTitle(`${category.name} | Ticket`)
            .setColor('Aqua')
            .setDescription('**Please explain clearly and in detail your problem or question, so our staff can help you as quickly as possible.** _Please be patient and do not ping staff members._')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setFooter({ 
                text: guild.members.me.displayName,
                iconURL: guild.members.me.displayAvatarURL() 
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("Claim")
                .setLabel("Claim ticket")
                .setStyle("Primary")
                .setEmoji("🔒"),
            new ButtonBuilder()
                .setCustomId("Close")
                .setLabel("Close the ticket")
                .setStyle("Danger")
                .setEmoji("✖️")
        );

        const message = await channel.send({
            content: `<@&${category.role}>, ${member} has opened a ticket!`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setDescription(`The ticket was opened successfully.`)
                .setColor("#2f3136")],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Go to ticket")
                    .setStyle("Link")
                    .setURL(message.url)
            )],
            ephemeral: true
        });
    }
}