const ticketModel = require('../models/ticketModel');
const userModel = require('../models/userModel');
const { ButtonInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel,ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts'); // Necesitarás instalar este paquete: npm install discord-html-transcripts

module.exports = {
    name: 'Close',
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

        if (authorData.isClosed) {
            return interaction.reply({ content: 'This ticket is already closed.', ephemeral: true });
        }

        // Actualiza el estado del ticket
        authorData.isClosed = true;
        authorData.closedBy = member.id;
        await authorData.save();

        // Notificar al usuario que el ticket se está cerrando
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('Red')
                .setTitle('Ticket Closing')
                .setDescription('This ticket will be closed in 5 seconds.')
            ],
            ephemeral: true
        });

        // Actualiza los permisos para el autor
        await channel.permissionOverwrites.edit(authorData.userId, {
            ViewChannel: false
        });

        // Opcional: Notificar al canal que el ticket se cerrará
        await channel.send({
            embeds: [new EmbedBuilder()
                .setAuthor({ name: "Ticket Closed", iconURL: member.user.displayAvatarURL() })
                .setDescription("This ticket has been closed!\nThe __ticket transcript__ is now being saved. You can view this ticket transcript by viewing your __Private Messages__!")
                .setColor("#2f3136")
                .setFooter({ 
                  text: guild.name, 
                  iconURL: guild.iconURL()})
                .setTimestamp()
            ]
        });

        // Crear transcripción del ticket
        const transcript = await createTranscript(channel, {
            limit: -1, // Obtiene todos los mensajes
            returnBuffer: true, // Para subir directamente a Discord
            fileName: `transcript-${channel.name}.html`
        });
        
        // Enviar la transcripción al canal de transcripciones
        const transcriptChannel = guild.channels.cache.get(ticketData.channelTranscript);
        let messageTranscript;
        if (transcriptChannel) {
            messageTranscript = await transcriptChannel.send({
                content: `Transcript of the closed ticket: \`${channel.name}\``,
                files: [transcript]
            });
        }

        // Enviar mensaje al canal de logs
        const logChannel = guild.channels.cache.get(ticketData.channelLog);
        if (logChannel) {
            await logChannel.send({
                embeds: [new EmbedBuilder()
                    .setColor('Yellow')
                    .setAuthor({ name: 'Ticket Closed', iconURL: member.user.displayAvatarURL() })
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addFields({
          				    name: "Ticket Owner",
          				    value: `<@${authorData.userId}>`,
          				    inline: true
          				  },{
          				    name: "Ticket Channel", 
          				    value: `${channel.name}`,
          				    inline: true
          				  },{
          				    name: "Closed by", 
          				    value: `${member}`, 
          				    inline: true
          				  })
                    .setTimestamp()
                ],
            });
        }
        
        const userOwner = await guild.members.fetch(authorData.userId).catch(err => {});
        if (userOwner) {
          userOwner.send({
            embeds: [new EmbedBuilder()
                .setTitle("Closed ticket")
      					.addFields({
      					  name: "Ticket Name", 
      					  value: `${channel.name}`, 
      					  inline: true
      					},{
      					  name: "Ticket Closed", 
      					  value: `${member}`, 
      					  inline: true
      					})
      					.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      					.setColor("#2f3136")
					      .setFooter({ text: guild.name, iconURL: guild.iconURL()})
					      .setTimestamp()],
  				components: [new ActionRowBuilder().addComponents(new ButtonBuilder()
  						.setStyle("Link")
  						.setLabel("Download Transcript")
  						.setURL(`${messageTranscript.attachments.first().url}`)
  						.setEmoji("🗒️"))]
          }).catch(err => {})
        }
        // Borra el canal después de 5 segundos
        setTimeout(async () => {
            await channel.delete();
        }, 5000);
    }
}