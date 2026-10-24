const Invite = require('../models/invite');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { user, guild, client } = member;
    if (user.bot) return;

    try {
        const newInvites = await guild.invites.fetch({ cache: true });
        const oldInvites = client.invites.get(guild.id);

        if (!oldInvites) {
            console.error(`No cached invites found for guild: ${guild.id}. Initializing cache.`);
            client.invites.set(guild.id, new Map(newInvites.map(inv => [inv.code, { uses: inv.uses, inviterId: inv.inviter.id }])));
            return;
        }

        // Encontrar la invitación usada comparando el uso antes y después
        const usedInvite = newInvites.find(inv => oldInvites.has(inv.code) && inv.uses > oldInvites.get(inv.code).uses);

        if (!usedInvite) {
            console.error('Could not determine which invite was used.');
            return;
        }

        const { inviter } = usedInvite;

        // Buscar o crear una entrada en la base de datos para el invitador
        let updatedInviter = await Invite.findOne({ guildId: guild.id, userId: inviter.id });

        if (!updatedInviter) {
            // Crear un nuevo documento si no existe
            updatedInviter = new Invite({
                guildId: guild.id,
                userId: inviter.id,
                inviteJoinedCount: 1,
                inviteTotal: 1,
                invitedUsers: [user.id] // Añadir el primer usuario a la lista
            });
            await updatedInviter.save();
        } else {
            // Verificar si el usuario ya fue invitado anteriormente
            if (!updatedInviter.invitedUsers.includes(user.id)) {
                // Incrementar el contador de invitaciones y añadir el usuario a la lista
                updatedInviter.inviteJoinedCount += 1;
                updatedInviter.inviteTotal += 1;
                updatedInviter.invitedUsers.push(user.id);
                await updatedInviter.save();
            }
        }

        // Actualiza solo la invitación utilizada en la caché local
        oldInvites.set(usedInvite.code, { uses: usedInvite.uses, inviterId: inviter.id });

    } catch (err) {
        console.error('Error tracking invites:', err);
    }
  }
};