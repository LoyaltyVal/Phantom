const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    role: { type: String, required: true },
    channelId: { type: String, required: true },
    isClaimed: { type: Boolean, default: false },
    claimedBy: { type: String, default: null }, 
    closedBy: { type: String, default: null }, 
    isClosed: { type: Boolean, default: false }
});

module.exports = model('userTicket', userSchema);