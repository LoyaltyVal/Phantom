const { Schema, model } = require('mongoose');

const economySchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    balance: { type: Number, default: 250 },
    bank: { type: Number, default: 0 },
    lastWork: { type: Number, default: null },
    lastCollection: { type: Map, of: Date, default: {} },
    lastRob: { type: Number, default: null },
    lastCrime: { type: Number, default: null },
});

module.exports = model('Economy', economySchema);