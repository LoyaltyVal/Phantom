const { Schema, model, models } = require('mongoose');

const botStatusSchema = new Schema({
  _id: { type: String, default: 'primary' },
  lastSeenAt: { type: Date, required: true },
}, { versionKey: false });

module.exports = models.botStatus || model('botStatus', botStatusSchema);
