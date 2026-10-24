const { AuditLogEvent, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const auditLogModel = require('../models/auditLogModel');

module.exports = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLog, guild) {
    const { action, extra, executor, target, changes } = auditLog;
    if (!guild) return;
    
    const auditLogData = await auditLogModel.findOne({ guildId: guild.id });
    if (!auditLogData || !auditLogData.isEnable) return;
    
    const channel = guild.channels.cache.get(auditLogData.channelId);
    if (!channel) return;
    
    const embed = new EmbedBuilder().setColor("#2f3136");

    switch (action) {
      case AuditLogEvent.ChannelCreate:
        embed.setAuthor({ name: 'Channel Created', iconURL: executor.displayAvatarURL() })
          .setDescription(`A new channel has been created.`)
          .addFields(
            { name: 'Name', value: `${target.name}`, inline: true },
            { name: 'Type', value: `${ChannelType[target.type]}`, inline: true },
            { name: 'Created by', value: `${executor.globalName || executor.username}`, inline: true }
          );
        break;

      case AuditLogEvent.ChannelUpdate:
        const fields = changes.map(c => {
          return {
            name: formatString(c.key), 
            value: `~~${c.old}~~ | ${c.new}`,
            inline: true
          };
        });
        fields.push({ name: 'Updated by', value: `${executor.globalName || executor.username}`, inline: true });
        embed.setAuthor({ name: 'Channel Updated', iconURL: executor.displayAvatarURL() })
          .setDescription(`A channel has been updated.`)
          .addFields(fields);
        break;

      case AuditLogEvent.ChannelDelete:
        embed.setAuthor({ name: 'Channel Deleted', iconURL: executor.displayAvatarURL() })
          .setDescription(`A channel has been deleted.`)
          .addFields(
            { name: 'Channel', value: `${target.name}`, inline: true },
            { name: 'Deleted by', value: `${executor.globalName || executor.username}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberKick:
        embed.setAuthor({ name: 'Member Kicked', iconURL: executor.displayAvatarURL() })
          .setDescription(`A member has been kicked.`)
          .addFields(
            { name: 'Member', value: `${target.tag}`, inline: true },
            { name: 'Kicked by', value: `${executor.globalName || executor.username}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberPrune:
        embed.setAuthor({ name: 'Members Pruned', iconURL: executor.displayAvatarURL() })
          .setDescription(`Members have been pruned.`)
          .addFields(
            { name: 'Pruned by', value: `${executor.globalName || executor.username}`, inline: true },
            { name: 'Pruned Count', value: `${extra.count}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberBanAdd:
        embed.setAuthor({ name: 'Member Banned', iconURL: executor.displayAvatarURL() })
          .setDescription(`A member has been banned.`)
          .addFields(
            { name: 'Member', value: `${target.tag}`, inline: true },
            { name: 'Banned by', value: `${executor.globalName || executor.username}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberBanRemove:
        embed.setAuthor({ name: 'Member Unbanned', iconURL: executor.displayAvatarURL() })
          .setDescription(`A member has been unbanned.`)
          .addFields(
            { name: 'Member', value: `${target.tag}`, inline: true },
            { name: 'Unbanned by', value: `${executor.globalName || executor.username}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberUpdate:
        const memberFields = changes.map(c => {
          return {
            name: formatString(c.key), 
            value: `~~${c.old}~~ | ${c.new}`,
            inline: true
          };
        });
        memberFields.push({ name: 'Target', value: `${target.globalName || target.username}`, inline: true });
        memberFields.push({ name: 'Updated by', value: `${executor.globalName || executor.username}`, inline: true });
        embed.setAuthor({ name: 'Member Updated', iconURL: executor.displayAvatarURL() })
          .setDescription(`A member's details have been updated.`)
          .addFields(memberFields);
        break;

      case AuditLogEvent.MemberRoleUpdate:
        
        const roleChanges = changes.map(c => {
          const roles = c.new?.map(rol => `<@&${rol.id}>`)
          return {
            name: formatString(c.key.replace('$', '')),
            value: `${roles?.join(', ') || 'None'}`,
            inline: true
          };
        });
        roleChanges.push({ name: 'Target', value: `${target.globalName || target.username}`, inline: true });
        roleChanges.push({ name: 'Updated by', value: `${executor.globalName || executor.username}`, inline: true });
        embed.setAuthor({ name: 'Member Role Updated', iconURL: executor.displayAvatarURL() })
          .setDescription(`A member's roles have been updated.`)
          .addFields(roleChanges);
        break;
      

      default:
        console.log(`Unhandled audit log action: ${AuditLogEvent[action]}`);
        return; // Evita enviar el embed si la acción no está manejada
    }

    channel.send({ embeds: [embed] });
  }
};

function formatString(text) {
    // Reemplaza los guiones bajos por espacios
    let formattedText = text.replace(/_/g, ' ');
    
    // Convierte la primera letra a mayúscula
    formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);

    return formattedText;
}