const { Schema, model } = require('mongoose');

const guildSchema = new Schema({
    guild_id: String,
    prefix: String,
});

module.exports = model('guild', guildSchema);