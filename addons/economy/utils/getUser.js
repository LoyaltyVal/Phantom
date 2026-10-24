
async function getMentionedUser(guild, arg) {
    if (!arg) return;
    const match = arg.match(/<@!?(\d+)>/);
    if (!match) return;
    const userId = match[1];
    if (!guild) return;
    let member = guild.members.cache.get(userId);
    if (!member) member = await guild.members.fetch(userId).catch(err => {});
    return member.user;
}

module.exports = getMentionedUser;