const { model, Schema } = require('mongoose');

const guildSchema = new Schema({
    guildId: { type: String, required: true },
    channelLog: { type: String, required: true },
    channelTranscript: { type: String, required: true },
    categoryPanel: { type: String, required: false },
    categories: { type: Array, default: [] },
});

module.exports = model('guildTicket', guildSchema);