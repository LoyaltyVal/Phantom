const { Schema, model } = require('mongoose');

const logSchema = Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  isEnable: { type: Boolean, required: true },
	
});

module.exports = model('auditLog', logSchema);