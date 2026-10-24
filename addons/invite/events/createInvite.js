module.exports = {
  name: 'inviteCreate',
  async execute(invite) {
    const { guild, code, uses, inviter, client } = invite;

    try {
        // Asegúrate de que `client.invites` esté inicializado para el guild
        if (!client.invites.has(guild.id)) {
            client.invites.set(guild.id, new Map());
        }

        // Obtén el mapa de invitaciones para este guild
        const guildInvites = client.invites.get(guild.id);

        // Guarda la nueva invitación en el mapa
        guildInvites.set(code, { uses: uses || 0, inviterId: inviter.id });

        
    } catch (err) {
        console.error('Error saving new invite:', err);
    }
  }
};