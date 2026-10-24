module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    client.invites = new Map();

    const guilds = client.guilds.cache.map(async (guild) => {
      const invites = await guild.invites.fetch().catch(err => {});
      if (invites) {
        client.invites.set(guild.id, new Map(invites.map(inv => [inv.code, { uses: inv.uses, inviterId: inv.inviter.id }])));
      }
    });

    // Asegura que todas las promesas se resuelvan antes de continuar
    await Promise.all(guilds);

    client.info('All invites have been cached successfully!');
  }
}