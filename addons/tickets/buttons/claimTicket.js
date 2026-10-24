const ticketModel = require('../models/ticketModel');
const userModel = require('../models/userModel');
const { ButtonInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } = require('discord.js');

module.exports = {
    name: 'Claim',
    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @param {TextChannel} channel 
     */
    async execute(interaction) {
        const { guild, channel, member } = interaction;

        const ticketData = await ticketModel.findOne({ guildId: guild.id });
        if (!ticketData) {
            return interaction.reply({ content: 'Ticket data not found.', ephemeral: true });
        }

        const authorData = await userModel.findOne({ channelId: channel.id });
        if (!authorData) {
            return interaction.reply({ content: 'No data found for this ticket.', ephemeral: true });
        }
        
        const hasPermission = member.roles.cache.some(role => role.id === authorData.role) || member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
            return interaction.reply({
                content: 'You do not have permission to claim this ticket.',
                ephemeral: true
            });
        }

        // Si el ticket ya está reclamado por otro miembro
        if (authorData.isClaimed && authorData.claimedBy !== member.id) {
            return interaction.reply({ content: 'This ticket has already been claimed by another staff member.', ephemeral: true });
        }

        // Permitir desreclamar solo si lo hizo el mismo miembro
        if (authorData.isClaimed && authorData.claimedBy === member.id) {

            // Remover permisos del miembro que desreclamó el ticket
            await channel.permissionOverwrites.set([
              {
                id: member.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
              },{
                id: authorData.role,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
              }
              ]);

            await channel.send({
                embeds: [new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('Ticket Unclaimed')
                    .setDescription(`${member} has unclaimed this ticket.`)
                    .setTimestamp()
                ]
            });

            await interaction.reply({
                content: 'You have successfully unclaimed this ticket.',
                ephemeral: true
            });
        } else {
          
            await channel.permissionOverwrites.set([
                  {
                    id: member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                  },{
                    id: authorData.role,
                    deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                  }
                  ]);
            // Notificar en el canal del ticket
            await channel.send({
                embeds: [new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Ticket Claimed')
                    .setDescription(`${member} has claimed this ticket. They will assist you shortly.`)
                    .setTimestamp()
                ]
            });
            await interaction.reply({
            content: 'You have successfully claimed this ticket.',
            ephemeral: true
        });
        }

        // Reclamar el ticket
        authorData.isClaimed = !authorData.isClaimed;
        authorData.claimedBy = authorData.isClaimed ? member.id : null;
        await authorData.save();

        // Dar permisos al miembro que reclamó el ticket

        // Opcional: Notificar al canal de logs
        const logChannel = guild.channels.cache.get(ticketData.channelLog);
        if (logChannel) {
            await logChannel.send({
                embeds: [new EmbedBuilder()
                	  .setTitle(`${authorData.isClaimed ? 'Claim' : 'Unclaim'} Ticket`)
            				.addFields({
            				  name: "Staff", 
            				  value: `${member}`, 
            				  inline: true
            				},{
            				  name: "Ticket Channel", 
            				  value: `${channel.name}`, 
            				  inline: true 
            				})
            				.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            				.setFooter({ text: guild.name, iconURL: guild.iconURL()})
                    .setColor('Yellow')
                    .setTimestamp()
                ]
            });
        }
    }
}