const inviteModel = require('../models/invite');

module.exports = {
  name: 'guildMemberRemove', 
  async execute(member) {
    const { guild, user } = member;

    try {
        const invitesData = await inviteModel.find({ guildId: guild.id });
        
        // Encontrar la invitación que fue usada por este usuario
        const inviteUsed = invitesData.find(inv => inv.invitedUsers.includes(user.id));

        if (!inviteUsed) {
            console.error(`No invite found for user ${user.id} in guild ${guild.id}`);
            return;
        }

        // Remover el usuario de la lista de invitados
        inviteUsed.invitedUsers = inviteUsed.invitedUsers.filter(userId => userId !== user.id);

        // Actualizar los contadores
        inviteUsed.inviteJoinedCount = (inviteUsed.inviteJoinedCount > 0) ? inviteUsed.inviteJoinedCount - 1 : 0;
        inviteUsed.inviteLeaveCount = (inviteUsed.inviteLeaveCount || 0) + 1;
        inviteUsed.inviteTotal = inviteUsed.inviteJoinedCount + (inviteUsed.inviteLeaveCount || 0) + (inviteUsed.inviteFakeCount || 0);

        // Guardar los cambios en la base de datos
        await inviteUsed.save();
    } catch (error) {
        console.error('Error updating invite data on member leave:', error);
    }
  }
}