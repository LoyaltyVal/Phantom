module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    const client = guild.client;

    try {
        // Obtener todas las invitaciones del nuevo servidor
        const invites = await guild.invites.fetch().catch(err =>{});
        if (!invites) return
        // Asegurarse de que `client.invites` esté inicializado
        if (!client.invites.has(guild.id)) {
            client.invites.set(guild.id, new Map());
        }

        // Guardar las invitaciones en el `Map` asociado al guild
        const guildInvites = new Map(invites.map(inv => [inv.code, { uses: inv.uses, inviterId: inv.inviter.id }]));
        client.invites.set(guild.id, guildInvites);
       
    } catch (err) {
        console.error(`Error scanning invites for new guild ${guild.name}:`, err);
    }
  }
};